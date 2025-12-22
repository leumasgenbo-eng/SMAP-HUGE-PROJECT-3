
import React, { useState, useMemo } from 'react';
import { Student, GlobalSettings } from '../types';
import { DEPARTMENTS, CLASS_MAPPING } from '../constants';

interface Props {
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  notify: any;
}

const PupilManagement: React.FC<Props> = ({ students, onStudentsUpdate, settings, onSettingsChange, notify }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'assess' | 'approval' | 'bank' | 'enrolled'>('register');
  const [activeClassTab, setActiveClassTab] = useState('Basic 1');
  const [applicantForm, setApplicantForm] = useState<Partial<Student>>({
    firstName: '', surname: '', dob: '', sex: 'Male', classApplyingFor: 'Basic 1',
    father: { name: '', contact: '', occupation: '', wivesCount: 1 } as any,
    mother: { name: '', contact: '', occupation: '' } as any,
    livesWith: 'Both Parents', hasSpecialNeeds: false
  });

  // Derived data
  const enrolledList = students.filter(s => s.status === 'Admitted');
  const applicants = students.filter(s => s.status !== 'Admitted');
  const classList = enrolledList.filter(s => s.currentClass === activeClassTab);

  const handleRegister = () => {
    const isDaycare = applicantForm.classApplyingFor?.includes('Creche') || applicantForm.classApplyingFor?.includes('N1');
    const newStudent: Student = {
      ...applicantForm,
      id: crypto.randomUUID(),
      serialId: `APP-${Date.now().toString().slice(-4)}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      currentClass: applicantForm.classApplyingFor!,
      scoreDetails: {}, attendance: {}, payments: {}
    } as Student;
    
    onStudentsUpdate([...students, newStudent]);
    notify(`Applicant registered. ${isDaycare ? 'Verify birth proof' : 'Proceed to assessment scheduling'}.`, "success");
    setActiveTab(isDaycare ? 'approval' : 'assess');
  };

  const scheduleTest = (id: string, details: any) => {
    onStudentsUpdate(students.map(s => s.id === id ? { 
      ...s, 
      status: 'Scheduled', 
      testDetails: { ...details, serial: `T-${s.currentClass}-${Math.floor(Math.random()*1000)}` } 
    } : s));
    notify("Assessment Test Scheduled. Message Ready.", "info");
  };

  const enterResults = (id: string, scores: any) => {
    onStudentsUpdate(students.map(s => {
      if (s.id === id) {
        const total = (scores.script || 0) + (scores.handwriting || 0) + (scores.spelling || 0);
        let decision: any = 'Retain';
        if (total < 30) decision = 'Repeat Lower';
        else if (total > 85) decision = 'Skip Higher';
        return { ...s, status: 'Results Ready', testDetails: { ...s.testDetails!, scores, decision } };
      }
      return s;
    }));
  };

  const admitStudent = (id: string) => {
    onStudentsUpdate(students.map(s => {
      if (s.id === id) {
        const count = enrolledList.filter(e => e.currentClass === s.currentClass).length + 1;
        return { ...s, status: 'Admitted', serialId: `UBA-${s.currentClass.replace(/\s/g,'')}-${count.toString().padStart(3,'0')}` };
      }
      return s;
    }));
    notify("Pupil Admitted Successfully. Official ID Generated.", "success");
  };

  const deleteStale = () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const filtered = students.filter(s => s.status === 'Admitted' || new Date(s.createdAt) > oneMonthAgo);
    onStudentsUpdate(filtered);
    notify("Cleanup complete. Stale records removed.", "info");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f3460] p-8 rounded-[3rem] text-white flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Pupil Management Desk</h2>
          <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Institutional Admission Cycle</p>
        </div>
        <div className="flex bg-white/10 p-1 rounded-2xl">
          {['register', 'assess', 'approval', 'bank', 'enrolled'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460]' : ''}`}>
              {t === 'enrolled' ? 'School Enrolment' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl min-h-[600px]">
        {activeTab === 'register' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <h3 className="text-xl font-black text-[#0f3460] uppercase border-b pb-4">New Pupil Registration</h3>
            <div className="grid grid-cols-2 gap-6">
              <input placeholder="First Name" className="p-4 bg-gray-50 rounded-2xl outline-none border-none font-bold" value={applicantForm.firstName} onChange={e => setApplicantForm({...applicantForm, firstName: e.target.value})} />
              <input placeholder="Surname" className="p-4 bg-gray-50 rounded-2xl outline-none border-none font-bold" value={applicantForm.surname} onChange={e => setApplicantForm({...applicantForm, surname: e.target.value})} />
              <input type="date" className="p-4 bg-gray-50 rounded-2xl outline-none border-none font-bold" value={applicantForm.dob} onChange={e => setApplicantForm({...applicantForm, dob: e.target.value})} />
              <select className="p-4 bg-gray-50 rounded-2xl outline-none border-none font-bold" value={applicantForm.classApplyingFor} onChange={e => setApplicantForm({...applicantForm, classApplyingFor: e.target.value})}>
                {Object.values(CLASS_MAPPING).flat().map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-6 border-t pt-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-[#cca43b]">Father's Details</h4>
                <input placeholder="Father Name" className="w-full p-4 bg-gray-50 rounded-2xl" value={applicantForm.father?.name} onChange={e => setApplicantForm({...applicantForm, father: {...applicantForm.father!, name: e.target.value}})} />
                <input placeholder="Contact" className="w-full p-4 bg-gray-50 rounded-2xl" value={applicantForm.father?.contact} onChange={e => setApplicantForm({...applicantForm, father: {...applicantForm.father!, contact: e.target.value}})} />
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-[#cca43b]">Mother's Details</h4>
                <input placeholder="Mother Name" className="w-full p-4 bg-gray-50 rounded-2xl" value={applicantForm.mother?.name} onChange={e => setApplicantForm({...applicantForm, mother: {...applicantForm.mother!, name: e.target.value}})} />
                <input placeholder="Contact" className="w-full p-4 bg-gray-50 rounded-2xl" value={applicantForm.mother?.contact} onChange={e => setApplicantForm({...applicantForm, mother: {...applicantForm.mother!, contact: e.target.value}})} />
              </div>
            </div>
            <button onClick={handleRegister} className="w-full bg-[#0f3460] text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition">Generate Applicant File</button>
          </div>
        )}

        {activeTab === 'assess' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-[#0f3460] uppercase">Admission Assessment Desk</h3>
              <button onClick={deleteStale} className="text-red-400 font-bold text-[10px] uppercase hover:underline">Clear Stale Apps (&gt;1 Month)</button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {applicants.filter(a => a.status === 'Pending' || a.status === 'Scheduled').map(a => (
                <div key={a.id} className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
                   <div>
                     <span className="text-[10px] font-black text-[#cca43b] uppercase">Application: {a.serialId}</span>
                     <h4 className="text-xl font-black text-[#0f3460] uppercase">{a.firstName} {a.surname}</h4>
                     <p className="text-xs font-bold text-gray-400">Target: {a.currentClass}</p>
                   </div>
                   <div className="flex flex-wrap gap-4 items-center">
                     {a.status === 'Pending' ? (
                       <div className="flex gap-2">
                         <select className="p-2 rounded-xl bg-white border border-gray-200 text-[10px] font-black" onChange={e => scheduleTest(a.id, { set: e.target.value, date: '2025-06-01', venue: 'UBA Hall 1', invigilator: 'Sir Michael' })}>
                           <option>Set A</option><option>Set B</option><option>Set C</option><option>Set D</option>
                         </select>
                         <button onClick={() => scheduleTest(a.id, { set: 'A', date: '2025-06-01', venue: 'UBA Hall 1', invigilator: 'Sir Michael' })} className="bg-[#cca43b] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Schedule Test</button>
                       </div>
                     ) : (
                       <div className="flex gap-2">
                         <div className="p-3 bg-white rounded-xl border border-gray-100 text-[9px] font-bold">
                           {`Dear Parent, ${a.firstName} is scheduled for assessment [Set ${a.testDetails?.set}] on ${a.testDetails?.date}.`}
                         </div>
                         <div className="flex gap-1">
                           <input type="number" placeholder="Script" className="w-12 p-2 rounded-lg border text-[10px]" onBlur={e => enterResults(a.id, { script: parseInt(e.target.value) })} />
                           <input type="number" placeholder="H-Writing" className="w-12 p-2 rounded-lg border text-[10px]" onBlur={e => enterResults(a.id, { handwriting: parseInt(e.target.value) })} />
                           <input type="number" placeholder="Spelling" className="w-12 p-2 rounded-lg border text-[10px]" onBlur={e => enterResults(a.id, { spelling: parseInt(e.target.value) })} />
                         </div>
                       </div>
                     )}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'approval' && (
          <div className="space-y-8">
            <h3 className="text-xl font-black text-[#0f3460] uppercase">Headteacher's Admission Portal</h3>
            <div className="grid grid-cols-1 gap-4">
              {applicants.filter(a => a.status === 'Results Ready' || a.classApplyingFor.includes('Creche')).map(a => (
                <div key={a.id} className="bg-white p-6 rounded-2xl border-2 border-[#0f3460]/10 flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-black text-[#0f3460] uppercase">{a.firstName} {a.surname}</h4>
                    <div className="flex gap-4 mt-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Class: {a.currentClass}</span>
                      <span className={`text-[9px] font-black uppercase ${a.testDetails?.decision === 'Repeat Lower' ? 'text-red-500' : 'text-green-500'}`}>
                        {a.testDetails?.decision || 'Proof of Birth Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {a.classApplyingFor.includes('Creche') && (
                      <input placeholder="Birth Cert ID" className="p-2 rounded-lg border text-[10px] font-mono" onBlur={e => onStudentsUpdate(students.map(s => s.id === a.id ? { ...s, birthCertId: e.target.value } : s))} />
                    )}
                    <button onClick={() => admitStudent(a.id)} className="bg-[#0f3460] text-white px-8 py-2 rounded-xl text-[10px] font-black uppercase">Confirm Admission</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'enrolled' && (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2 justify-center border-b pb-4">
               {Object.values(CLASS_MAPPING).flat().map(c => (
                 <button key={c} onClick={() => setActiveClassTab(c)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition ${activeClassTab === c ? 'bg-[#0f3460] text-white' : 'bg-gray-50 text-gray-400'}`}>
                   {c}
                 </button>
               ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-gray-50 text-[#0f3460] font-black uppercase">
                  <tr><th className="p-4">Serial ID</th><th className="p-4">Name</th><th className="p-4">Gender</th><th className="p-4">DOB</th><th className="p-4">Parent Contact</th></tr>
                </thead>
                <tbody>
                  {classList.map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-black">{s.serialId}</td>
                      <td className="p-4 font-black uppercase">{s.firstName} {s.surname}</td>
                      <td className="p-4 font-bold">{s.sex}</td>
                      <td className="p-4 font-mono">{s.dob}</td>
                      <td className="p-4 font-mono">{s.father.contact || s.mother.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="max-w-4xl mx-auto space-y-10">
            <h3 className="text-xl font-black text-[#0f3460] uppercase">Admission Question Bank</h3>
            <div className="grid grid-cols-2 gap-8">
              {['Set A', 'Set B', 'Set C', 'Set D'].map(set => (
                <div key={set} className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase">{set} Contents</label>
                  <textarea 
                    className="w-full h-64 p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] outline-none focus:border-[#cca43b] text-sm"
                    placeholder={`Paste content for ${set} here...`}
                  />
                  <div className="flex gap-2">
                    <button className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-black uppercase text-[10px]">Copy to Paper</button>
                    <button className="flex-1 bg-[#0f3460] text-white py-3 rounded-xl font-black uppercase text-[10px]">Share to Applicant</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PupilManagement;
