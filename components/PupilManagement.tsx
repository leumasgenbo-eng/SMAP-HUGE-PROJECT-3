
import React, { useState, useMemo, useRef } from 'react';
import { Student, GlobalSettings, AdmissionTestInfo } from '../types';
import { CLASS_MAPPING, DEPARTMENTS } from '../constants';
import EditableField from './EditableField';

interface Props {
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  notify: any;
}

const PupilManagement: React.FC<Props> = ({ students, onStudentsUpdate, settings, onSettingsChange, notify }) => {
  const [activeTab, setActiveTab] = useState<'registry' | 'application' | 'assessment' | 'approval' | 'registers'>('application');
  const [activeClass, setActiveClass] = useState('Basic 1');
  const [registerType, setRegisterType] = useState<'Attendance' | 'Lunch' | 'General'>('Attendance');
  const [activeAssessmentSet, setActiveAssessmentSet] = useState<'A' | 'B' | 'C' | 'D'>('A');

  const questionUploadRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<Student>>({
    firstName: '', surname: '', others: '', dob: '', sex: 'Male', classApplyingFor: 'Basic 1',
    admissionFeeReceipt: '', admissionFeeDate: new Date().toISOString().split('T')[0],
    hasSpecialNeeds: false, disabilityType: '', email: '',
    father: { name: '', contact: '', occupation: '' } as any,
    parent2: { name: '', contact: '' } as any,
    livesWith: 'Both Parents'
  });

  const enrolled = students.filter(s => s.status === 'Admitted');
  const applicants = students.filter(s => s.status === 'Pending' || s.status === 'Scheduled' || s.status === 'Results Ready');
  const approvalPool = students.filter(s => s.status === 'Results Ready');
  const classList = enrolled.filter(s => s.currentClass === activeClass);

  const currentDeptId = useMemo(() => {
    for (const [dept, classes] of Object.entries(CLASS_MAPPING)) {
      if (classes.includes(activeClass)) return dept;
    }
    return 'Lower';
  }, [activeClass]);

  const handleApply = () => {
    if (!form.admissionFeeReceipt || !form.firstName) {
      notify("Please fill all required fields and processing receipt number", "error");
      return;
    }
    const newPupil: Student = {
      ...form,
      id: crypto.randomUUID(),
      serialId: `APP-${Date.now().toString().slice(-4)}`,
      status: 'Pending',
      currentClass: form.classApplyingFor || 'Basic 1',
      createdAt: new Date().toISOString(),
      scoreDetails: {}, attendance: {}, lunchRegister: {}, generalRegister: {},
      ledger: [], isFeesCleared: false,
      testDetails: {
        set: activeAssessmentSet,
        serial: `TX-${Date.now().toString().slice(-4)}`,
        date: '', venue: 'Main Hall', invigilator: 'Admission Officer',
        scores: { script: 0, handwriting: 0, spelling: 0, oral: 0, logic: 0 }
      }
    } as Student;
    onStudentsUpdate([...students, newPupil]);
    notify("Application Logged! Processing fee receipt verified.", "success");
    setActiveTab('assessment');
  };

  const updateTestScore = (id: string, field: string, val: number) => {
    onStudentsUpdate(students.map(s => {
      if (s.id === id) {
        const scores = { ...(s.testDetails?.scores || { script: 0, handwriting: 0, spelling: 0, oral: 0, logic: 0 }), [field]: val };
        return { 
          ...s, 
          status: 'Results Ready',
          testDetails: { ...s.testDetails!, scores } 
        };
      }
      return s;
    }));
  };

  const approvePupil = (id: string) => {
    onStudentsUpdate(students.map(s => {
      if (s.id === id) {
        return { 
          ...s, 
          status: 'Admitted', 
          /* 
           * Fix: Using String() wrapper for replace on currentClass to avoid unknown type error
           */
          serialId: `UBA-${String(s.currentClass).replace(/\s/g, '')}-${Date.now().toString().slice(-3)}`
        };
      }
      return s;
    }));
    notify("Pupil Officially Admitted to Registry!", "success");
  };

  const updateRegisterValue = (studentId: string, type: string, value: string) => {
    const today = new Date().toISOString().split('T')[0];
    onStudentsUpdate(students.map(s => {
      if (s.id === studentId) {
        if (type === 'Attendance') return { ...s, attendance: { ...s.attendance, [settings.currentTerm]: { ...s.attendance[settings.currentTerm], [today]: value } } };
        if (type === 'Lunch') return { ...s, lunchRegister: { ...s.lunchRegister, [today]: value } };
        return { ...s, generalRegister: { ...s.generalRegister, [today]: value } };
      }
      return s;
    }));
  };

  const handleDownloadQuestions = () => {
    const questions = settings.questionBank?.[currentDeptId]?.[activeAssessmentSet] || {};
    /* 
     * Fix: Explicitly cast Object.entries to [string, string][] to ensure text is string
     */
    const rows = (Object.entries(questions) as [string, string][]).map(([id, text]) => [`"${id}"`, `"${text.replace(/"/g, '""')}"`]);
    if (rows.length === 0) {
      notify(`No questions found in Set ${activeAssessmentSet} for this department.`, "error");
      return;
    }
    
    const csvContent = ["Question ID,Content", ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `UBA_Admission_Questions_${currentDeptId}_Set_${activeAssessmentSet}.csv`;
    link.click();
    notify(`Set ${activeAssessmentSet} Question Paper Exported`, "success");
  };

  const handleUploadQuestions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error("Format error");

        const updatedBank = { ...(settings.questionBank || {}) };
        if (!updatedBank[currentDeptId]) updatedBank[currentDeptId] = {};
        if (!updatedBank[currentDeptId][activeAssessmentSet]) updatedBank[currentDeptId][activeAssessmentSet] = {};

        lines.slice(1).forEach(line => {
          const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
          if (parts.length >= 2) {
            updatedBank[currentDeptId][activeAssessmentSet][parts[0]] = parts[1];
          }
        });

        onSettingsChange({ ...settings, questionBank: updatedBank });
        notify(`Bank Refreshed: Set ${activeAssessmentSet} Questions Loaded`, "success");
      } catch (err) {
        notify("CSV Formatting Error. Required: ID,Content", "error");
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex bg-gray-100 p-2 rounded-2xl gap-2 no-print w-fit mx-auto shadow-inner">
          {['application', 'assessment', 'approval', 'registry', 'registers'].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t as any)} 
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {t === 'application' ? '1. Admission Form' : t === 'assessment' ? '2. Assess' : t === 'approval' ? '3. Approval' : t === 'registry' ? 'School Registry' : 'Daily Registers'}
            </button>
          ))}
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl min-h-[600px] border border-gray-100">
        {activeTab === 'application' && (
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="flex justify-between items-end border-b pb-6">
              <div>
                <h3 className="text-3xl font-black text-[#0f3460] uppercase tracking-tighter">New Admission Request</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Start of Cycle: Financial & Data Capture</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-2">
                <label className="text-[9px] font-black text-blue-400 uppercase">Processing Fee Details</label>
                <div className="flex gap-4">
                  <input placeholder="Receipt No." className="p-2 bg-white rounded-lg text-xs font-black w-32 border-none" value={form.admissionFeeReceipt} onChange={e => setForm({...form, admissionFeeReceipt: e.target.value})} />
                  <input type="date" className="p-2 bg-white rounded-lg text-xs font-black border-none" value={form.admissionFeeDate} onChange={e => setForm({...form, admissionFeeDate: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">A) Learner Info</h4>
                <input placeholder="First Name" className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                <input placeholder="Surname" className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none" value={form.surname} onChange={e => setForm({...form, surname: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" className="p-4 bg-gray-50 rounded-2xl font-bold text-[10px] border-none" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                  <select className="p-4 bg-gray-50 rounded-2xl font-black text-[10px] uppercase border-none" value={form.sex} onChange={e => setForm({...form, sex: e.target.value as any})}>
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <select className="w-full p-4 bg-blue-50 text-blue-900 rounded-2xl font-black text-xs uppercase border-none" value={form.classApplyingFor} onChange={e => setForm({...form, classApplyingFor: e.target.value})}>
                  {Object.values(CLASS_MAPPING).flat().map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">B) Parent/Guardian 1</h4>
                <input placeholder="Full Name" className="w-full p-4 bg-gray-50 rounded-2xl border-none" value={form.father?.name} onChange={e => setForm({...form, father: { ...form.father!, name: e.target.value }})} />
                <input placeholder="Contact Phone" className="w-full p-4 bg-gray-50 rounded-2xl border-none" value={form.father?.contact} onChange={e => setForm({...form, father: { ...form.father!, contact: e.target.value }})} />
                <input placeholder="Email Address" className="w-full p-4 bg-gray-50 rounded-2xl border-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs border-none" value={form.livesWith} onChange={e => setForm({...form, livesWith: e.target.value as any})}>
                  <option>Both Parents</option><option>Mother</option><option>Father</option><option>Guardian</option>
                </select>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">C) Additional Context</h4>
                <input placeholder="Parent 2 Name (Optional)" className="w-full p-4 bg-gray-50 rounded-2xl border-none" value={form.parent2?.name} onChange={e => setForm({...form, parent2: { ...form.parent2!, name: e.target.value }})} />
                <input placeholder="P2 Contact" className="w-full p-4 bg-gray-50 rounded-2xl border-none" value={form.parent2?.contact} onChange={e => setForm({...form, parent2: { ...form.parent2!, contact: e.target.value }})} />
                <div className="bg-red-50 p-4 rounded-2xl space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase text-red-900 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-red-600" checked={form.hasSpecialNeeds} onChange={e => setForm({...form, hasSpecialNeeds: e.target.checked})} />
                    Has Special Needs?
                  </label>
                  {form.hasSpecialNeeds && <input placeholder="Specify Needs..." className="w-full p-2 bg-white rounded-lg text-xs" value={form.disabilityType} onChange={e => setForm({...form, disabilityType: e.target.value})} />}
                </div>
              </div>
            </div>

            <button onClick={handleApply} className="w-full bg-[#0f3460] text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.01] transition-all">Submit Application & Move to Assessment</button>
          </div>
        )}

        {activeTab === 'assessment' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b pb-6">
              <div>
                <h3 className="text-2xl font-black text-[#0f3460] uppercase">Admission Assessment Lab</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Grading Entry & Question Set Management</p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center md:justify-end items-center">
                <div className="flex bg-gray-50 p-1.5 rounded-2xl shadow-inner no-print">
                  {['A', 'B', 'C', 'D'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setActiveAssessmentSet(s as any)} 
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeAssessmentSet === s ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400'}`}
                    >
                      Set {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDownloadQuestions} className="bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl font-black uppercase text-[9px] shadow-sm hover:bg-blue-600 hover:text-white transition flex items-center gap-2">
                    <span>⬇️</span> Download Set {activeAssessmentSet}
                  </button>
                  <div className="relative">
                    <input type="file" accept=".csv" className="hidden" ref={questionUploadRef} onChange={handleUploadQuestions} />
                    <button onClick={() => questionUploadRef.current?.click()} className="bg-green-50 text-green-600 px-4 py-2.5 rounded-xl font-black uppercase text-[9px] shadow-sm hover:bg-green-600 hover:text-white transition flex items-center gap-2">
                      <span>⬆️</span> Upload Bank
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm">
               <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#0f3460] text-white font-black uppercase">
                     <tr>
                        <th className="p-5">Applicant Name</th>
                        <th className="p-5">Target Class</th>
                        <th className="p-5 text-center">Active Set</th>
                        <th className="p-5 text-center">Oral (20)</th>
                        <th className="p-5 text-center">Script (40)</th>
                        <th className="p-5 text-center">Logic (20)</th>
                        <th className="p-5 text-center">Spelling (20)</th>
                        <th className="p-5 text-center bg-white/10">Total (100)</th>
                        <th className="p-5 text-center">Workflow</th>
                     </tr>
                  </thead>
                  <tbody>
                    {applicants.map(s => {
                      const scores = s.testDetails?.scores || { script: 0, oral: 0, logic: 0, spelling: 0 };
                      /* 
                       * Fix: Added explicit casting to any[] for Object.values results and reduce type to avoid unknown comparisons
                       */
                      const total = (Object.values(scores) as any[]).reduce<number>((a, b) => a + (Number(b) || 0), 0);
                      return (
                        <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                          <td className="p-5 font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</td>
                          <td className="p-5 font-bold text-gray-500">{s.classApplyingFor}</td>
                          <td className="p-5 text-center font-black text-blue-600">{s.testDetails?.set || 'A'}</td>
                          <td className="p-5 text-center"><input type="number" className="w-12 p-1 bg-gray-100 rounded text-center font-bold" value={scores.oral} onChange={e => updateTestScore(s.id, 'oral', parseInt(e.target.value))} /></td>
                          <td className="p-5 text-center"><input type="number" className="w-12 p-1 bg-gray-100 rounded text-center font-bold" value={scores.script} onChange={e => updateTestScore(s.id, 'script', parseInt(e.target.value))} /></td>
                          <td className="p-5 text-center"><input type="number" className="w-12 p-1 bg-gray-100 rounded text-center font-bold" value={scores.logic} onChange={e => updateTestScore(s.id, 'logic', parseInt(e.target.value))} /></td>
                          <td className="p-5 text-center"><input type="number" className="w-12 p-1 bg-gray-100 rounded text-center font-bold" value={scores.spelling} onChange={e => updateTestScore(s.id, 'spelling', parseInt(e.target.value))} /></td>
                          <td className="p-5 text-center font-black text-lg text-[#2e8b57] bg-green-50">{total}</td>
                          <td className="p-5 text-center">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${total > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              {total > 0 ? 'RESULTS READY' : 'PENDING TEST'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {applicants.length === 0 && (
                      <tr><td colSpan={9} className="p-20 text-center text-gray-300 font-black uppercase italic tracking-widest">No applicants in current assessment cycle.</td></tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'approval' && (
          <div className="space-y-10">
            <div>
              <h3 className="text-2xl font-black text-[#0f3460] uppercase">Final Approval Desk</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Administrative review of performance and fee verification</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {approvalPool.map(s => {
                 const scores = s.testDetails?.scores || { script: 0, oral: 0, logic: 0, spelling: 0 };
                 /* 
                  * Fix: Cast Object.values to any[] and reduce to number to resolve unknown comparison errors
                  */
                 const total = (Object.values(scores) as any[]).reduce<number>((a, b) => a + (Number(b) || 0), 0);
                 const isPass = total >= 50;

                 return (
                   <div key={s.id} className="bg-white p-8 rounded-[3rem] border-4 border-gray-50 shadow-xl space-y-6 hover:border-[#cca43b] transition relative overflow-hidden">
                      <div className="flex justify-between items-start">
                         <div>
                            <h4 className="font-black text-[#0f3460] uppercase text-lg leading-tight">{s.firstName} {s.surname}</h4>
                            <p className="text-[9px] font-black text-[#cca43b] uppercase">Class: {s.classApplyingFor}</p>
                         </div>
                         <div className="text-right">
                            <span className="text-[10px] font-black text-gray-400 block">SCORE</span>
                            <span className={`text-3xl font-black ${isPass ? 'text-green-600' : 'text-red-600'}`}>{total}/100</span>
                         </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-2xl text-[10px] font-bold space-y-1">
                         <div className="flex justify-between"><span>Processing Receipt:</span> <span className="text-blue-600">{s.admissionFeeReceipt}</span></div>
                         <div className="flex justify-between"><span>Payment Date:</span> <span>{s.admissionFeeDate}</span></div>
                         <div className="flex justify-between"><span>Parent:</span> <span>{s.father.name}</span></div>
                      </div>

                      <div className="flex gap-2">
                         <button onClick={() => approvePupil(s.id)} className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg">Approve Admission</button>
                         <button onClick={() => onStudentsUpdate(students.map(st => st.id === s.id ? {...st, status: 'Denied'} : st))} className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 font-black uppercase text-[10px]">Decline</button>
                      </div>

                      {!isPass && <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-1 text-[8px] font-black rounded-bl-xl shadow-md">LOW SCORE</div>}
                   </div>
                 );
               })}
               {approvalPool.length === 0 && (
                 <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase italic tracking-widest">No candidates awaiting final decision.</div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'registry' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
               <div className="flex items-center gap-4">
                 <h3 className="text-xl font-black text-[#0f3460] uppercase">Official Enrolment Registry</h3>
                 <select className="p-2 rounded-xl bg-gray-50 font-black text-[10px] uppercase border-none focus:ring-2 focus:ring-[#cca43b]" value={activeClass} onChange={e => setActiveClass(e.target.value)}>
                    {Object.values(CLASS_MAPPING).flat().map(c => <option key={c}>{c}</option>)}
                 </select>
               </div>
               <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">Execute Master Print</button>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm">
              <table className="w-full text-left text-[10px] border-collapse min-w-[1200px]">
                <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                  <tr>
                    <th className="p-5 border-b">Serial ID</th>
                    <th className="p-5 border-b">Full Name</th>
                    <th className="p-5 border-b">Processing Fee Receipt</th>
                    <th className="p-5 border-b">Admission Date</th>
                    <th className="p-5 border-b">Test Score</th>
                    <th className="p-5 border-b">Parent Contact</th>
                    <th className="p-5 border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classList.map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-5 font-black text-blue-600">{s.serialId}</td>
                      <td className="p-5 font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</td>
                      <td className="p-5 font-mono text-gray-400">{s.admissionFeeReceipt}</td>
                      <td className="p-5">{s.admissionFeeDate}</td>
                      <td className="p-5 font-black text-[#2e8b57]">
                        {/* 
                         * Fix: Cast Object.values to any[] and reduce to number to avoid unknown arithmetic operations
                         */}
                        {(Object.values(s.testDetails?.scores || {}) as any[]).reduce<number>((a, b) => a + (Number(b) || 0), 0)}/100
                      </td>
                      <td className="p-5 font-mono text-gray-400 font-bold">{s.father.contact}</td>
                      <td className="p-5">
                         <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[8px] font-black uppercase">OFFICIAL ENROLLED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'registers' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
              <div className="flex items-center gap-4">
                 <h3 className="text-xl font-black text-[#0f3460] uppercase">{registerType} Register</h3>
                 <select className="p-2 rounded-xl bg-gray-50 font-black text-[10px] uppercase border-none" value={activeClass} onChange={e => setActiveClass(e.target.value)}>
                    {Object.values(CLASS_MAPPING).flat().map(c => <option key={c}>{c}</option>)}
                 </select>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner">
                {['Attendance', 'Lunch', 'General'].map(t => (
                  <button key={t} onClick={() => setRegisterType(t as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${registerType === t ? 'bg-white text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>{t}</button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                  <tr>
                    <th className="p-5 border-b">Serial ID</th>
                    <th className="p-5 border-b">Learner Full Name</th>
                    <th className="p-5 border-b text-center">Assign Status ({new Date().toLocaleDateString()})</th>
                  </tr>
                </thead>
                <tbody>
                  {classList.map(s => (
                    <tr key={s.id} className="border-b hover:bg-yellow-50 transition">
                      <td className="p-5 font-mono">{s.serialId}</td>
                      <td className="p-5 font-black uppercase">{s.firstName} {s.surname}</td>
                      <td className="p-5 text-center">
                        <select 
                          className="bg-white border-2 border-gray-100 p-2 rounded-xl font-black text-[10px] uppercase min-w-[200px] outline-none focus:border-[#cca43b]"
                          onChange={(e) => updateRegisterValue(s.id, registerType, e.target.value)}
                        >
                          {registerType === 'Attendance' ? (
                            <>
                              <option value="P">Present (P)</option>
                              <option value="AWP">Absent w/ Permission</option>
                              <option value="AWOP">Absent w/o Permission</option>
                              <option value="M">Mid Term (M)</option>
                              <option value="H">Holiday (H)</option>
                            </>
                          ) : registerType === 'Lunch' ? (
                            <>
                              <option value="P">Paid (P)</option>
                              <option value="O">Post Pay (O)</option>
                              <option value="PRE">Pre-paid (P)</option>
                            </>
                          ) : (
                            <>
                              <option value="Paid">Paid</option>
                              <option value="Partly Paid">Partly Paid</option>
                              <option value="Fully Paid">Fully Paid</option>
                              <option value="Include">Include</option>
                              <option value="Exclude">Exclude</option>
                              <option value="Supplied">Supplied</option>
                              <option value="Not Supplied">Not Supplied</option>
                            </>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PupilManagement;
