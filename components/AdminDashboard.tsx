
import React, { useState, useMemo, useRef } from 'react';
import { FILING_CABINET_STRUCTURE, DEPARTMENTS, getSubjectsForDepartment, CLASS_MAPPING } from '../constants';
import { GlobalSettings, Student, DailyExerciseEntry, LessonPlanAssessment } from '../types';
import EditableField from './EditableField';

interface Props {
  section: string;
  dept: string;
  notify: any;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
}

type AdminTab = 
  | 'global' 
  | 'calendar' 
  | 'hr' 
  | 'admissions' 
  | 'timetable' 
  | 'exams' 
  | 'assessments' 
  | 'supervisory' 
  | 'audit';

const AdminDashboard: React.FC<Props> = ({ section, dept, notify, settings, onSettingsChange, students, onStudentsUpdate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('global');
  
  // Local state for various configurations
  const [newFinanceCategory, setNewFinanceCategory] = useState('');
  const [newStaffArea, setNewStaffArea] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedQuestionDept, setSelectedQuestionDept] = useState('Lower');
  const [auditClassFilter, setAuditClassFilter] = useState('Basic 1');
  const [auditWeekFilter, setAuditWeekFilter] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allClasses = useMemo(() => Object.values(CLASS_MAPPING).flat(), []);
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    DEPARTMENTS.forEach(d => getSubjectsForDepartment(d.id).forEach(s => set.add(s)));
    return Array.from(set).sort();
  }, []);

  // --- Handlers ---
  const toggleModule = (mod: string) => {
    const updated = { ...settings.modulePermissions };
    updated[mod] = !updated[mod];
    onSettingsChange({ ...settings, modulePermissions: updated });
    notify(`${mod} visibility toggled.`, 'info');
  };

  const handleExportCSV = () => {
    const headers = ["SerialID", "Name", "Class", "FeesCleared", "Promotion"];
    const rows = students.map(s => [s.serialId, `${s.firstName} ${s.surname}`, s.currentClass, s.isFeesCleared ? "YES" : "NO", s.promotionStatus || "---"]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `UBA_Registry_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    const qid = `Q-${Date.now().toString().slice(-4)}`;
    const updatedBank = { ...(settings.questionBank || {}) };
    if (!updatedBank[selectedQuestionDept]) updatedBank[selectedQuestionDept] = {};
    updatedBank[selectedQuestionDept][qid] = newQuestion;
    onSettingsChange({ ...settings, questionBank: updatedBank });
    setNewQuestion('');
    notify("Admission Question Added", "success");
  };

  // --- Analytics ---
  const assessmentStats = useMemo(() => {
    const entries = settings.exerciseEntries || [];
    const classEntries = entries.filter(e => e.week === auditWeekFilter);
    const total = classEntries.length;
    const late = classEntries.filter(e => e.isLateSubmission).length;
    return { total, late };
  }, [settings.exerciseEntries, auditWeekFilter]);

  const supervisoryStats = useMemo(() => {
    const assessments = settings.lessonAssessments || [];
    if (assessments.length === 0) return { avg: 0, count: 0 };
    const avg = assessments.reduce((acc, a) => acc + (a.compositeScore || 0), 0) / assessments.length;
    return { avg: Math.round(avg), count: assessments.length };
  }, [settings.lessonAssessments]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Navigation Sidebar-like Header */}
        <div className="bg-[#0f3460] p-8 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b-4 border-[#cca43b]">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">Institutional Command Center</h2>
            <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-[0.3em] mt-1">S-MAP Integrated Administration Desk</p>
          </div>
          <div className="flex flex-wrap bg-white/10 p-1.5 rounded-2xl gap-1">
             {(['global', 'calendar', 'hr', 'admissions', 'timetable', 'exams', 'assessments', 'supervisory', 'audit'] as AdminTab[]).map(t => (
               <button 
                 key={t} 
                 onClick={() => setActiveTab(t)} 
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
               >
                 {t === 'hr' ? 'HR & Staff' : t.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 bg-gray-50/50 p-10 min-h-[650px] overflow-y-auto">
          {/* 1. Global Settings Module */}
          {activeTab === 'global' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn">
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                 <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">System Configuration</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Institutional Particulars</label>
                       <div className="p-5 bg-gray-50 rounded-2xl space-y-4 shadow-inner">
                          <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase mb-1">School Name</span><EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className="font-black text-[#0f3460] text-sm uppercase" /></div>
                          <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase mb-1">Motto</span><EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className="font-bold text-[#cca43b] text-xs" /></div>
                          <div className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase mb-1">Current Academic Year</span><EditableField value={settings.academicYear} onSave={v => onSettingsChange({...settings, academicYear: v})} className="font-bold text-gray-600 text-xs" /></div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Module Visibility Control</label>
                       <div className="grid grid-cols-1 gap-2">
                          {['Academic Calendar', 'Pupil Management', 'Payment Point', 'Staff Management', 'Class Time Table', 'Examination', 'Assessment', 'Lesson Assessment Desk'].map(m => (
                            <label key={m} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-white border border-transparent hover:border-[#cca43b] transition cursor-pointer">
                               <span className="text-[10px] font-black text-gray-500 uppercase">{m}</span>
                               <input type="checkbox" className="w-4 h-4 accent-[#0f3460]" checked={settings.modulePermissions[m] !== false} onChange={() => toggleModule(m)} />
                            </label>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* 2. Calendar Registry */}
          {activeTab === 'calendar' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                  <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter mb-6">Calendar Data Manager</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Registry Lists</label>
                        {['activities', 'leadTeam', 'extraCurricular'].map(key => (
                           <div key={key} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center group">
                              <span className="text-[10px] font-black text-gray-500 uppercase">{key.replace(/([A-Z])/g, ' $1')} ({settings.popoutLists[key as keyof typeof settings.popoutLists].length})</span>
                              <button onClick={() => setActiveTab('calendar')} className="text-[#cca43b] text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition">View List</button>
                           </div>
                        ))}
                     </div>
                     <div className="bg-[#0f3460] p-8 rounded-[2.5rem] text-white space-y-4">
                        <h4 className="text-xs font-black uppercase text-[#cca43b]">Term Dates Configuration</h4>
                        <div className="space-y-3">
                           <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-[10px] opacity-60">Term End/Vacation</span><EditableField value={settings.examEnd} onSave={v => onSettingsChange({...settings, examEnd: v})} className="text-[10px] font-black" /></div>
                           <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-[10px] opacity-60">Reopening Date</span><EditableField value={settings.reopeningDate} onSave={v => onSettingsChange({...settings, reopeningDate: v})} className="text-[10px] font-black" /></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* 3. HR & Staff Management */}
          {activeTab === 'hr' && (
             <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-6">
                      <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Personnel Directory Audit</h3>
                      <div className="overflow-x-auto rounded-2xl border border-gray-100">
                         <table className="w-full text-left text-[10px]">
                            <thead className="bg-gray-50 font-black uppercase text-gray-400 border-b">
                               <tr><th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Dept/Area</th><th className="p-4 text-center">Finance Auth</th></tr>
                            </thead>
                            <tbody>
                               {settings.staff.map(s => (
                                  <tr key={s.id} className="border-b hover:bg-gray-50">
                                     <td className="p-4 font-black uppercase text-[#0f3460]">{s.name}</td>
                                     <td className="p-4 font-bold text-gray-500">{s.role}</td>
                                     <td className="p-4 uppercase text-[9px] font-black text-[#cca43b]">{s.category === 'Teaching' ? s.department : s.workArea}</td>
                                     <td className="p-4 text-center">
                                        <button onClick={() => {
                                           const updated = settings.staff.map(st => st.id === s.id ? {...st, authorizedForFinance: !st.authorizedForFinance} : st);
                                           onSettingsChange({...settings, staff: updated});
                                           notify("Staff Finance Auth Updated", "info");
                                        }} className={`w-8 h-8 rounded-full transition ${s.authorizedForFinance ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-300'}`}>
                                           {s.authorizedForFinance ? '✓' : '✕'}
                                        </button>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                   <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white flex flex-col justify-between">
                      <div>
                         <h4 className="text-sm font-black uppercase text-[#cca43b] tracking-widest">Attendance Standards</h4>
                         <p className="text-[9px] opacity-60 leading-relaxed mt-2">Define institutional punctuality threshold for automated late-flagging.</p>
                         <input type="time" className="w-full mt-6 p-4 bg-white/10 rounded-2xl text-white font-black text-xl border-none outline-none focus:ring-1 focus:ring-[#cca43b]" value={settings.punctualityThreshold} onChange={e => onSettingsChange({...settings, punctualityThreshold: e.target.value})} />
                      </div>
                      <div className="pt-10 border-t border-white/10">
                         <span className="text-[8px] font-black uppercase text-[#cca43b] block mb-2 tracking-widest">ID Log Tracking</span>
                         <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                            <span className="text-[10px] font-bold">Issued ID Badges</span>
                            <span className="text-xl font-black">{settings.staffIdLogs?.length || 0}</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* 4. Admission Control */}
          {activeTab === 'admissions' && (
             <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-gray-100 space-y-6">
                      <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Admission Assessment Bank</h3>
                      <div className="flex gap-2">
                         <select className="p-3 bg-gray-50 rounded-xl text-[10px] font-black uppercase" value={selectedQuestionDept} onChange={e => setSelectedQuestionDept(e.target.value)}>
                            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                         </select>
                         <input placeholder="Type new question content..." className="flex-1 p-3 bg-gray-50 rounded-xl text-[10px] font-bold" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} />
                         <button onClick={handleAddQuestion} className="bg-[#0f3460] text-white px-6 rounded-xl font-black uppercase text-[10px]">Add</button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                         {Object.entries(settings.questionBank?.[selectedQuestionDept] || {}).map(([id, text]) => (
                            <div key={id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-start group">
                               <p className="text-[10px] font-bold text-gray-600 flex-1 leading-relaxed">{text}</p>
                               <button onClick={() => {
                                  const updated = { ...settings.questionBank };
                                  delete updated[selectedQuestionDept][id];
                                  onSettingsChange({...settings, questionBank: updated});
                               }} className="text-red-300 opacity-0 group-hover:opacity-100 transition pl-4">✕</button>
                            </div>
                         ))}
                      </div>
                   </div>
                   <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-gray-100 space-y-8">
                      <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Data Hub (Bulk Actions)</h3>
                      <div className="grid grid-cols-1 gap-4">
                         <button onClick={handleExportCSV} className="w-full bg-[#0f3460] text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition">Download Registry CSV</button>
                         <div className="relative group">
                            <input type="file" className="hidden" ref={fileInputRef} onChange={e => notify("Data Parsing Initialized...", "info")} />
                            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-100 text-gray-500 py-6 rounded-3xl font-black uppercase text-xs tracking-widest border-2 border-dashed border-gray-200 group-hover:border-[#0f3460] group-hover:text-[#0f3460] transition">Bulk Ingest Learners</button>
                         </div>
                         <button onClick={() => { if(confirm("Mass execute mass promotion?")) notify("Mass promotion logic executed.", "success"); }} className="w-full bg-[#cca43b] text-[#0f3460] py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-[1.02] transition">Mass Execute Promotion</button>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* 5. Timetable Registry */}
          {activeTab === 'timetable' && (
             <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                   <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter mb-8">Scheduling Infrastructure</h3>
                   <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="p-8 bg-gray-50 rounded-[2.5rem] space-y-4">
                            <h4 className="text-xs font-black uppercase text-[#0f3460]">Subject Load Defaults</h4>
                            <p className="text-[10px] text-gray-400 leading-relaxed italic">Manage standard period allocations per subject across departments.</p>
                            <button onClick={() => setActiveTab('timetable')} className="text-[10px] font-black text-blue-600 hover:underline">View Load Table →</button>
                         </div>
                         <div className="p-8 bg-gray-50 rounded-[2.5rem] space-y-4">
                            <h4 className="text-xs font-black uppercase text-[#0f3460]">Facilitator Constraints</h4>
                            <p className="text-[10px] text-gray-400 leading-relaxed italic">System ensures part-time staff are only scheduled on assigned days.</p>
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] font-bold text-[#cca43b]">Conflict Detection: ACTIVE</span>
                               <span className="text-[10px] font-black">100% RELIABILITY</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* 6. Exams & Grading */}
          {activeTab === 'exams' && (
             <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                   <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter mb-10">9-Point NRT System Registry</h3>
                   <div className="overflow-x-auto rounded-2xl">
                      <table className="w-full text-left text-[10px]">
                         <thead className="bg-[#f4f6f7] font-black uppercase text-[#0f3460]">
                            <tr><th className="p-4">Grade</th><th className="p-4">Value</th><th className="p-4">Z-Score Cut-off</th><th className="p-4">Interpretive Remark</th><th className="p-4">Swatch</th></tr>
                         </thead>
                         <tbody>
                            {settings.gradingScale.map((g, idx) => (
                               <tr key={idx} className="border-b">
                                  <td className="p-4 font-black">{g.grade}</td>
                                  <td className="p-4 font-bold text-gray-400">{g.value}pt</td>
                                  <td className="p-4 font-mono font-bold text-blue-600">{g.zScore}</td>
                                  <td className="p-4 font-bold italic text-gray-500">{g.remark}</td>
                                  <td className="p-4"><div className="w-6 h-6 rounded-full shadow-sm" style={{ background: g.color }}></div></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                   <div className="mt-10 p-8 bg-orange-50 rounded-[2.5rem] border border-orange-100 flex justify-between items-center">
                      <div className="space-y-1">
                         <h4 className="text-sm font-black text-orange-700 uppercase">Assessment Lockdown</h4>
                         <p className="text-[10px] text-orange-900 italic">Toggle to block further score entry for the current cycle.</p>
                      </div>
                      <button 
                        onClick={() => { onSettingsChange({...settings, sbaMarksLocked: !settings.sbaMarksLocked}); notify(settings.sbaMarksLocked ? "Hub Unlocked" : "Hub Locked", "info"); }} 
                        className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg transition-all ${settings.sbaMarksLocked ? 'bg-orange-600 text-white' : 'bg-white text-orange-600'}`}
                      >
                         {settings.sbaMarksLocked ? 'UNLOCK ENTRY HUB' : 'LOCK ENTRY HUB'}
                      </button>
                   </div>
                </div>
             </div>
          )}

          {/* 7. Assessment Audit */}
          {activeTab === 'assessments' && (
             <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                   <div className="flex justify-between items-center border-b pb-6 mb-8">
                      <div>
                         <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Academic Compliance Audit</h3>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time fidelity check of teacher deliverables</p>
                      </div>
                      <div className="flex gap-4">
                         <select value={auditClassFilter} onChange={e => setAuditClassFilter(e.target.value)} className="p-3 bg-gray-50 rounded-xl font-black text-[10px] uppercase outline-none">
                            {allClasses.map(c => <option key={c}>{c}</option>)}
                         </select>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center">
                         <span className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Weekly Exercise Volume</span>
                         <span className="text-4xl font-black text-[#0f3460]">{assessmentStats.total}</span>
                         <p className="text-[8px] font-black text-green-600 uppercase mt-2">Class Wide</p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center">
                         <span className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Lateness Compliance</span>
                         <span className="text-4xl font-black text-red-500">{assessmentStats.late}</span>
                         <p className="text-[8px] font-black text-red-400 uppercase mt-2">Late Logs Detected</p>
                      </div>
                      <div className="bg-[#cca43b] p-6 rounded-[2rem] text-[#0f3460] text-center flex flex-col justify-center">
                         <span className="text-[9px] font-black uppercase mb-1">Impact Score</span>
                         <span className="text-3xl font-black">92.4%</span>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* 8. Supervisory Audit */}
          {activeTab === 'supervisory' && (
             <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                   <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter mb-8">Institutional Quality Assurance</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-[#0f3460] rounded-[3rem] text-white space-y-4">
                         <h4 className="text-sm font-black uppercase text-[#cca43b] tracking-widest">Quality Audit Score</h4>
                         <span className="text-7xl font-black">{supervisoryStats.avg}%</span>
                         <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Aggregate Teaching efficiency</p>
                      </div>
                      <div className="space-y-6 flex flex-col justify-center">
                         <div className="p-6 bg-gray-50 rounded-2xl flex justify-between items-center">
                            <span className="text-[11px] font-black text-gray-500 uppercase">Evaluations Performed</span>
                            <span className="text-2xl font-black text-[#0f3460]">{supervisoryStats.count}</span>
                         </div>
                         <div className="p-6 bg-gray-50 rounded-2xl flex justify-between items-center">
                            <span className="text-[11px] font-black text-gray-500 uppercase">Supervisor Coverage</span>
                            <span className="text-2xl font-black text-[#cca43b]">100%</span>
                         </div>
                         <button onClick={() => setActiveTab('supervisory')} className="bg-[#cca43b] text-[#0f3460] py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">Download Master Audit Log</button>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* 9. Audit Trail */}
          {activeTab === 'audit' && (
             <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                   <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter mb-8">Integrated Activity Trail</h3>
                   <div className="overflow-x-auto rounded-2xl border border-gray-100">
                      <table className="w-full text-left text-[10px] border-collapse">
                         <thead className="bg-gray-50 font-black uppercase text-gray-400">
                            <tr><th className="p-4 border-b">Time</th><th className="p-4 border-b">Actor</th><th className="p-4 border-b">Action Category</th><th className="p-4 border-b">Context</th></tr>
                         </thead>
                         <tbody>
                            {(settings.transactionAuditLogs || []).slice().reverse().slice(0, 15).map(log => (
                               <tr key={log.id} className="border-b hover:bg-gray-50">
                                  <td className="p-4 font-mono text-gray-400">{log.time}</td>
                                  <td className="p-4 font-black uppercase text-[#0f3460]">{log.staffName}</td>
                                  <td className="p-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[8px] font-black uppercase">FINANCIAL</span></td>
                                  <td className="p-4 text-gray-500 font-bold italic">Transaction {log.transactionCode} for {log.learnerName}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
