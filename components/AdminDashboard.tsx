
import React, { useState, useMemo, useRef } from 'react';
import { FILING_CABINET_STRUCTURE, DEPARTMENTS, getSubjectsForDepartment, CLASS_MAPPING } from '../constants';
import { FilingRecord, GlobalSettings, Student } from '../types';

interface Props {
  section: string;
  dept: string;
  notify: any;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
}

const AdminDashboard: React.FC<Props> = ({ section, dept, notify, settings, onSettingsChange, students, onStudentsUpdate }) => {
  const [activeTab, setActiveTab] = useState<'filing' | 'promotion' | 'identity' | 'bulk' | 'excellence' | 'system' | 'finance' | 'questions' | 'audit_trail' | 'staff_logs' | 'staff_config'>('system');
  const [newFinanceCategory, setNewFinanceCategory] = useState('');
  const [selectedFinanceClass, setSelectedFinanceClass] = useState('Basic 1');
  const [selectedQuestionDept, setSelectedQuestionDept] = useState('Lower');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [newStaffArea, setNewStaffArea] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allClasses = useMemo(() => Object.values(CLASS_MAPPING).flat(), []);

  const handleAddQuestion = () => {
    if (!newQuestionContent.trim()) return;
    const qid = `Q-${Date.now().toString().slice(-4)}`;
    const updatedBank = { ...(settings.questionBank || {}) };
    if (!updatedBank[selectedQuestionDept]) updatedBank[selectedQuestionDept] = {};
    updatedBank[selectedQuestionDept][qid] = newQuestionContent;
    
    onSettingsChange({ ...settings, questionBank: updatedBank });
    setNewQuestionContent('');
    notify("Admission Question Added to Bank", "success");
  };

  const handleRemoveQuestion = (deptId: string, qid: string) => {
    const updatedBank = { ...(settings.questionBank || {}) };
    delete updatedBank[deptId][qid];
    onSettingsChange({ ...settings, questionBank: updatedBank });
    notify("Question Removed", "info");
  };

  const handleAddCategory = () => {
    if (!newFinanceCategory.trim()) return;
    const cats = [...settings.financeConfig.categories, newFinanceCategory.trim()];
    onSettingsChange({
      ...settings,
      financeConfig: { ...settings.financeConfig, categories: cats }
    });
    setNewFinanceCategory('');
    notify("Finance Category Added", "success");
  };

  const handleRemoveCategory = (cat: string) => {
    const cats = settings.financeConfig.categories.filter(c => c !== cat);
    onSettingsChange({
      ...settings,
      financeConfig: { ...settings.financeConfig, categories: cats }
    });
    notify("Category Removed", "info");
  };

  const updateBillAmount = (cls: string, cat: string, val: string) => {
    const amount = parseFloat(val) || 0;
    const classBills = { ...settings.financeConfig.classBills };
    if (!classBills[cls]) classBills[cls] = {};
    classBills[cls][cat] = amount;
    
    onSettingsChange({
      ...settings,
      financeConfig: { ...settings.financeConfig, classBills }
    });
  };

  const updateTax = (field: keyof typeof settings.financeConfig.taxConfig, val: any) => {
    onSettingsChange({
      ...settings,
      financeConfig: {
        ...settings.financeConfig,
        taxConfig: { ...settings.financeConfig.taxConfig, [field]: val }
      }
    });
  };

  const toggleStaffFinanceAuth = (id: string) => {
    const updatedStaff = settings.staff.map(s => 
      s.id === id ? { ...s, authorizedForFinance: !s.authorizedForFinance } : s
    );
    onSettingsChange({ ...settings, staff: updatedStaff });
    notify("Staff Finance Authorization Updated", "info");
  };

  const handleAddStaffArea = () => {
    if (!newStaffArea.trim()) return;
    const areas = [...settings.popoutLists.nonTeachingAreas, newStaffArea.trim()];
    onSettingsChange({
      ...settings,
      popoutLists: { ...settings.popoutLists, nonTeachingAreas: areas }
    });
    setNewStaffArea('');
    notify("Staff Area Added", "success");
  };

  // Memoized stats
  const promotableCount = useMemo(() => 
    students.filter(s => s.status === 'Admitted' && s.isFeesCleared).length, 
  [students]);

  const withheldCount = useMemo(() => 
    students.filter(s => s.status === 'Admitted' && !s.isFeesCleared).length, 
  [students]);
  
  const handleSystemReset = () => {
    if (confirm("CRITICAL ACTION: This will wipe ALL student data and reset settings. This cannot be undone. Proceed?")) {
      onStudentsUpdate([]);
      notify("System data wiped successfully.", "error");
    }
  };

  const toggleModule = (mod: string) => {
    const updated = { ...settings.modulePermissions };
    updated[mod] = !updated[mod];
    onSettingsChange({ ...settings, modulePermissions: updated });
    notify(`${mod} visibility updated.`, 'info');
  };

  const executePromotion = () => {
    if (!confirm("Mass execute promotion logic for the current academic cycle? This will update learner statuses based on standard criteria.")) return;

    const updatedStudents = students.map(s => {
      if (s.status !== 'Admitted') return s;

      const isJHS = s.currentClass.includes('Basic 7') || s.currentClass.includes('Basic 8') || s.currentClass.includes('Basic 9');
      const subjectList = getSubjectsForDepartment(isJHS ? 'JHS' : 'Lower');
      const allPassed = subjectList.every(subj => (s.scoreDetails?.[subj]?.total || 0) >= 50);
      
      const termAttendance = s.attendance?.[settings.currentTerm] || {};
      const presentCount = Object.values(termAttendance).filter(status => status === 'P').length;
      const attendanceRate = (presentCount / (settings.totalAttendance || 1)) * 100;

      let status = "PROMOTED";
      
      if (!s.isFeesCleared) {
        status = "Promotion Pending (Clear school fees)";
      } else if (attendanceRate < 90) {
        status = "Promotion Pending (Parent invited on reopening day)";
      } else if (attendanceRate < 95) {
        status = "Promotion Conditional (Attendance below 95%)";
      } else if (!allPassed) {
        status = "On Probation (Prepare to write probational exams)";
      }

      return { ...s, promotionStatus: status };
    });

    onStudentsUpdate(updatedStudents);
    notify("Promotion logic executed across all departments.", "success");
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      notify("No student records found to export.", "error");
      return;
    }

    const headers = ["ID", "SerialID", "FirstName", "Surname", "OtherNames", "DOB", "Sex", "Class", "Status", "FeesCleared", "PromotionStatus", "FatherName", "MotherName"];
    const rows = students.map(s => [
      s.id,
      s.serialId,
      s.firstName,
      s.surname,
      s.others || "",
      s.dob,
      s.sex,
      s.currentClass,
      s.status,
      s.isFeesCleared ? "Yes" : "No",
      s.promotionStatus || "",
      s.father?.name || "",
      s.mother?.name || ""
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UBA_Students_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("Student ledger exported successfully!", "success");
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      if (lines.length < 2) {
        notify("Invalid CSV format.", "error");
        return;
      }

      // Skip header and map lines
      const importedStudents: Student[] = lines.slice(1).map(line => {
        const parts = line.split(",").map(p => p.replace(/^"|"$/g, '').trim());
        return {
          id: parts[0] || crypto.randomUUID(),
          serialId: parts[1] || `UBA-${Date.now().toString().slice(-4)}`,
          firstName: parts[2] || "Unknown",
          surname: parts[3] || "Student",
          others: parts[4] || "",
          dob: parts[5] || "",
          sex: (parts[6] as any) || "Male",
          currentClass: parts[7] || "Creche",
          status: (parts[8] as any) || "Admitted",
          isFeesCleared: parts[9] === "Yes",
          promotionStatus: parts[10] || "",
          createdAt: new Date().toISOString(),
          father: { name: parts[11] || "", contact: "", occupation: "", education: "", religion: "", isDead: false },
          mother: { name: parts[12] || "", contact: "", occupation: "", education: "", religion: "", isDead: false },
          livesWith: 'Both Parents',
          hasSpecialNeeds: false,
          scoreDetails: {},
          attendance: {},
          payments: {},
          conduct: "Satisfactory",
          interest: "High Interest",
          attitude: "Positive",
          punctuality: "Regular & Punctual"
        } as Student;
      });

      if (confirm(`Detected ${importedStudents.length} student records. Overwrite existing ledger or append? (OK to Merge, Cancel to Overwrite)`)) {
        onStudentsUpdate([...students, ...importedStudents]);
      } else {
        onStudentsUpdate(importedStudents);
      }
      notify("Data ingestion complete!", "success");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0f3460] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Administration Desk</h2>
            <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">System Audit & Authorization Center</p>
          </div>
          <div className="flex flex-wrap bg-white/10 p-1.5 rounded-2xl gap-2">
             {['system', 'identity', 'promotion', 'finance', 'questions', 'audit_trail', 'staff_logs', 'staff_config', 'bulk', 'filing'].map(t => (
               <button 
                 key={t}
                 onClick={() => setActiveTab(t as any)} 
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460]' : ''}`}
               >
                 {t.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/30 p-10 min-h-[500px]">
          {activeTab === 'staff_config' && (
            <div className="max-w-4xl mx-auto space-y-10">
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-10">
                  <div>
                     <h3 className="text-2xl font-black text-[#0f3460] uppercase">Staff Management Configuration</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Variables for HR & Personnel Desk</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <div className="border-b pb-4">
                           <h4 className="text-xs font-black text-[#cca43b] uppercase tracking-widest">Institutional Work Areas</h4>
                           <p className="text-[9px] text-gray-400 font-bold">Non-Teaching classification units</p>
                        </div>
                        <div className="flex gap-2">
                           <input 
                              placeholder="New Work Area" 
                              className="flex-1 p-3 bg-gray-50 rounded-xl font-bold text-xs" 
                              value={newStaffArea}
                              onChange={e => setNewStaffArea(e.target.value)}
                           />
                           <button onClick={handleAddStaffArea} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Add</button>
                        </div>
                        <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                           {settings.popoutLists.nonTeachingAreas.map(area => (
                              <div key={area} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group transition hover:bg-red-50">
                                 <span className="text-[11px] font-black text-gray-600 uppercase">{area}</span>
                                 <button 
                                    onClick={() => onSettingsChange({...settings, popoutLists: {...settings.popoutLists, nonTeachingAreas: settings.popoutLists.nonTeachingAreas.filter(a => a !== area)}})} 
                                    className="text-red-400 opacity-0 group-hover:opacity-100 transition"
                                 >✕</button>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="border-b pb-4">
                           <h4 className="text-xs font-black text-[#cca43b] uppercase tracking-widest">Attendance Rating Rules</h4>
                           <p className="text-[9px] text-gray-400 font-bold">Standard performance thresholds</p>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase px-2">Daily Punctuality Cut-off</label>
                              <input 
                                 type="time" 
                                 className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460]"
                                 value={settings.punctualityThreshold}
                                 onChange={e => onSettingsChange({...settings, punctualityThreshold: e.target.value})}
                              />
                              <p className="text-[8px] text-gray-300 italic px-2">Arrivals after this time are logged as "LATE" in Ratings report.</p>
                           </div>

                           <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                              <h5 className="text-[9px] font-black uppercase text-blue-900 mb-2">Rating Calculation Basis</h5>
                              <p className="text-[10px] text-blue-700 leading-relaxed italic">
                                Ratings are calculated based on (Days Present / Total Working Days) * 100. Punctuality index is (On-Time Arrivals / Total Attendances).
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'staff_logs' && (
             <div className="max-w-6xl mx-auto space-y-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                   <h3 className="text-2xl font-black text-[#0f3460] uppercase mb-8">Staff Identity Card Logs</h3>
                   <div className="overflow-x-auto rounded-3xl border border-gray-100">
                      <table className="w-full text-left text-[11px] border-collapse">
                         <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                            <tr>
                               <th className="p-4 border-b">Timestamp</th>
                               <th className="p-4 border-b">Staff Recipient</th>
                               <th className="p-4 border-b">Authorized Issued By</th>
                               <th className="p-4 border-b">Audit serial</th>
                            </tr>
                         </thead>
                         <tbody>
                            {(settings.staffIdLogs || []).slice().reverse().map(log => (
                               <tr key={log.id} className="border-b hover:bg-gray-50">
                                  <td className="p-4">
                                     <p className="font-bold">{log.issuedAt}</p>
                                  </td>
                                  <td className="p-4">
                                     <p className="font-black text-[#0f3460] uppercase">{log.staffName}</p>
                                     <p className="text-[9px] font-mono text-gray-400">{log.staffId}</p>
                                  </td>
                                  <td className="p-4 font-bold text-gray-600 uppercase">{log.issuedBy}</td>
                                  <td className="p-4 font-mono text-[9px] text-gray-400">{log.id}</td>
                               </tr>
                            ))}
                            {(!settings.staffIdLogs || settings.staffIdLogs.length === 0) && (
                               <tr><td colSpan={4} className="p-20 text-center text-gray-300 font-black uppercase italic italic tracking-widest">No staff identity cards issued in current ledger cycle.</td></tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'audit_trail' && (
             <div className="max-w-6xl mx-auto space-y-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                   <h3 className="text-2xl font-black text-[#0f3460] uppercase mb-8">Institutional Audit Trail</h3>
                   <div className="overflow-x-auto rounded-3xl border border-gray-100">
                      <table className="w-full text-left text-[11px] border-collapse">
                         <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                            <tr>
                               <th className="p-4 border-b">Timestamp</th>
                               <th className="p-4 border-b">Processed By (Authorized ID)</th>
                               <th className="p-4 border-b">Learner Recipient</th>
                               <th className="p-4 border-b">Category</th>
                               <th className="p-4 border-b text-right">Inflow (GH₵)</th>
                               <th className="p-4 border-b">TX Serial</th>
                            </tr>
                         </thead>
                         <tbody>
                            {(settings.transactionAuditLogs || []).slice().reverse().map(log => (
                               <tr key={log.id} className="border-b hover:bg-gray-50">
                                  <td className="p-4">
                                     <p className="font-bold">{log.date}</p>
                                     <p className="text-[9px] text-gray-400">{log.time}</p>
                                  </td>
                                  <td className="p-4">
                                     <p className="font-black text-[#0f3460] uppercase">{log.staffName}</p>
                                     <p className="text-[9px] font-mono text-gray-400">{log.staffId}</p>
                                  </td>
                                  <td className="p-4">
                                     <p className="font-bold uppercase text-gray-600">{log.learnerName}</p>
                                     <p className="text-[9px] font-mono text-gray-400">{log.learnerId}</p>
                                  </td>
                                  <td className="p-4 font-black uppercase text-xs text-blue-600">{log.category}</td>
                                  <td className="p-4 text-right font-black text-[#2e8b57]">GH₵ {log.amount.toFixed(2)}</td>
                                  <td className="p-4 font-mono font-bold text-gray-400">{log.transactionCode}</td>
                               </tr>
                            ))}
                            {(!settings.transactionAuditLogs || settings.transactionAuditLogs.length === 0) && (
                               <tr><td colSpan={6} className="p-20 text-center text-gray-300 font-black uppercase italic italic tracking-widest">No verified transaction logs detected in cycle.</td></tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'questions' && (
             <div className="max-w-6xl mx-auto space-y-10">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                   <h3 className="text-2xl font-black text-[#0f3460] mb-8 uppercase">Admission Question Bank</h3>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <div className="border-b pb-4">
                            <h4 className="text-sm font-black text-[#cca43b] uppercase tracking-widest">Question Registry</h4>
                            <p className="text-[10px] text-gray-400 font-bold">Standard test items per department</p>
                         </div>
                         <select className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs uppercase" value={selectedQuestionDept} onChange={e => setSelectedQuestionDept(e.target.value)}>
                            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                         </select>
                         <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {Object.entries(settings.questionBank?.[selectedQuestionDept] || {}).map(([qid, content]) => (
                               <div key={qid} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group flex justify-between gap-4">
                                  <div className="flex-1">
                                     <span className="text-[8px] font-black text-gray-300 uppercase block mb-1">UID: {qid}</span>
                                     <p className="text-xs font-bold text-[#0f3460] leading-relaxed italic">"{content}"</p>
                                  </div>
                                  <button onClick={() => handleRemoveQuestion(selectedQuestionDept, qid)} className="text-red-400 opacity-0 group-hover:opacity-100 transition">✕</button>
                               </div>
                            ))}
                            {(!settings.questionBank?.[selectedQuestionDept] || Object.keys(settings.questionBank[selectedQuestionDept]).length === 0) && (
                               <div className="p-10 text-center text-gray-300 italic font-bold">No questions registered for this department.</div>
                            )}
                         </div>
                      </div>

                      <div className="space-y-6 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 h-fit">
                         <h4 className="text-sm font-black text-[#0f3460] uppercase tracking-widest">Add Test Item</h4>
                         <textarea 
                           className="w-full h-40 p-5 bg-white rounded-2xl shadow-inner border-none outline-none focus:ring-2 focus:ring-[#cca43b] font-bold text-xs italic"
                           placeholder="Type the admission test question content here..."
                           value={newQuestionContent}
                           onChange={e => setNewQuestionContent(e.target.value)}
                         />
                         <button onClick={handleAddQuestion} className="w-full bg-[#0f3460] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-105 transition">Append to Question Bank</button>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'finance' && (
            <div className="max-w-6xl mx-auto space-y-10">
               {/* Authorized Staff Management */}
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                  <div className="flex justify-between items-center mb-8">
                     <div>
                        <h3 className="text-2xl font-black text-[#0f3460] uppercase">Authorized Finance Staff</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Only listed staff can process incoming payments</p>
                     </div>
                     <span className="bg-[#0f3460] text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase shadow-lg">Secure Verification Active</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {settings.staff.map(s => (
                        <label key={s.id} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center justify-between ${s.authorizedForFinance ? 'bg-blue-50 border-[#0f3460] shadow-md' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                           <div className="space-y-1">
                              <p className={`font-black uppercase text-xs ${s.authorizedForFinance ? 'text-[#0f3460]' : 'text-gray-500'}`}>{s.name}</p>
                              <p className="text-[9px] font-mono text-gray-400">{s.idNumber || 'UBA-S-000'}</p>
                           </div>
                           <input 
                              type="checkbox" 
                              className="w-6 h-6 accent-[#0f3460]" 
                              checked={!!s.authorizedForFinance} 
                              onChange={() => toggleStaffFinanceAuth(s.id)} 
                           />
                        </label>
                     ))}
                     {settings.staff.length === 0 && (
                        <div className="col-span-full p-10 text-center border-2 border-dashed border-gray-200 rounded-[2rem]">
                           <p className="text-gray-400 font-bold text-xs uppercase italic tracking-widest">Register staff in "Staff Management" module first.</p>
                        </div>
                     )}
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                  <h3 className="text-2xl font-black text-[#0f3460] mb-8 uppercase">Institutional Financial Control Unit</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                     {/* Categories Management */}
                     <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-black text-[#cca43b] uppercase tracking-widest border-b pb-2">Revenue Categories</h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">Institutional payment variables</p>
                        </div>
                        <div className="flex gap-2">
                           <input 
                            placeholder="New Fee Category" 
                            className="flex-1 p-3 bg-gray-50 rounded-xl font-bold text-xs" 
                            value={newFinanceCategory}
                            onChange={e => setNewFinanceCategory(e.target.value)}
                           />
                           <button onClick={handleAddCategory} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-md">Add</button>
                        </div>
                        <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                           {settings.financeConfig.categories.map(cat => (
                             <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-red-50 group transition">
                                <span className="text-[11px] font-black text-gray-600 uppercase">{cat}</span>
                                <button onClick={() => handleRemoveCategory(cat)} className="text-red-400 opacity-0 group-hover:opacity-100 transition">✕</button>
                             </div>
                           ))}
                        </div>
                     </div>

                     {/* Thresholds Management */}
                     <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-black text-[#cca43b] uppercase tracking-widest border-b pb-2">Bill Thresholds</h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">Set amounts per academic level</p>
                        </div>
                        <select 
                          className="w-full p-4 bg-[#0f3460] text-white rounded-2xl font-black text-xs uppercase shadow-md"
                          value={selectedFinanceClass}
                          onChange={e => setSelectedFinanceClass(e.target.value)}
                        >
                          {allClasses.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                           {settings.financeConfig.categories.map(cat => (
                             <div key={cat} className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <span className="text-[9px] font-black text-[#0f3460] uppercase">{cat}</span>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-bold text-gray-400">GH₵</span>
                                   <input 
                                    type="number" 
                                    className="w-20 p-2 bg-white rounded-lg text-right font-black text-xs text-[#0f3460] shadow-inner" 
                                    placeholder="0.00"
                                    value={settings.financeConfig.classBills[selectedFinanceClass]?.[cat] || ''}
                                    onChange={e => updateBillAmount(selectedFinanceClass, cat, e.target.value)}
                                   />
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     {/* Tax and Statutory Levies */}
                     <div className="space-y-6">
                        <div className="flex justify-between items-end border-b pb-2">
                           <div>
                              <h4 className="text-sm font-black text-red-600 uppercase tracking-widest">Tax & Statutory Levies</h4>
                              <p className="text-[10px] text-gray-400 font-bold mt-1">Legal financial requirements</p>
                           </div>
                           <label className="flex items-center gap-2 cursor-pointer mb-1">
                              <span className="text-[8px] font-black uppercase text-gray-500">{settings.financeConfig.taxConfig.isTaxEnabled ? 'ACTIVE' : 'INACTIVE'}</span>
                              <input 
                                 type="checkbox" 
                                 className="w-4 h-4 accent-red-600" 
                                 checked={settings.financeConfig.taxConfig.isTaxEnabled} 
                                 onChange={e => updateTax('isTaxEnabled', e.target.checked)} 
                              />
                           </label>
                        </div>
                        
                        <div className={`space-y-4 transition-opacity ${settings.financeConfig.taxConfig.isTaxEnabled ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                           {[
                              { key: 'vatRate', label: 'V.A.T (Value Added Tax)' },
                              { key: 'nhilRate', label: 'N.H.I.L (National Health)' },
                              { key: 'getLevyRate', label: 'GETLevy (Education Trust)' },
                              { key: 'covidLevyRate', label: 'COVID-19 Health Levy' }
                           ].map(t => (
                              <div key={t.key} className="flex items-center justify-between p-4 bg-red-50/30 rounded-2xl border border-red-100 shadow-sm">
                                 <span className="text-[9px] font-black text-red-800 uppercase">{t.label}</span>
                                 <div className="flex items-center gap-1">
                                    <input 
                                       type="number" 
                                       step="0.1"
                                       className="w-16 p-2 bg-white rounded-lg text-center font-black text-xs text-red-600 shadow-inner" 
                                       value={settings.financeConfig.taxConfig[t.key as keyof typeof settings.financeConfig.taxConfig] as number}
                                       onChange={e => updateTax(t.key as any, parseFloat(e.target.value) || 0)}
                                    />
                                    <span className="text-[10px] font-black text-red-400">%</span>
                                 </div>
                              </div>
                           ))}
                           
                           <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                              <p className="text-[8px] font-bold text-gray-400 uppercase italic leading-tight">
                                 Note: Statutory taxes will be automatically appended to new bills generated in the payment terminal.
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-gray-100">
                     <h4 className="text-sm font-black text-[#cca43b] uppercase tracking-widest mb-4">Receipt Messaging Parameters</h4>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase px-1">Closing Institutional Appreciation</label>
                        <textarea 
                          className="w-full p-6 bg-gray-50 rounded-[2.5rem] border-none font-bold italic text-sm text-[#0f3460] resize-none shadow-inner"
                          rows={2}
                          value={settings.financeConfig.receiptMessage}
                          onChange={e => onSettingsChange({
                            ...settings,
                            financeConfig: { ...settings.financeConfig, receiptMessage: e.target.value }
                          })}
                        />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'promotion' && (
            <div className="max-w-4xl mx-auto space-y-10">
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                  <h3 className="text-2xl font-black text-[#0f3460] mb-4 uppercase">Automated Promotion Engine</h3>
                  <p className="text-sm text-gray-500 mb-8 italic">Criteria: (Pass All Subjects) &amp; (Attend &gt;= 95%) &amp; (Fees Cleared)</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                     <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                        <h4 className="text-[10px] font-black uppercase text-blue-900 mb-2">Promotable Pool</h4>
                        <p className="text-4xl font-black text-blue-600">{promotableCount}</p>
                        <p className="text-[9px] font-bold text-blue-400 uppercase mt-1">Learners with cleared fees</p>
                     </div>
                     <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                        <h4 className="text-[10px] font-black uppercase text-red-900 mb-2">Withheld Pool</h4>
                        <p className="text-4xl font-black text-red-600">{withheldCount}</p>
                        <p className="text-[9px] font-bold text-red-400 uppercase mt-1">Learners requiring fee clearance</p>
                     </div>
                  </div>

                  <button 
                    onClick={executePromotion}
                    className="w-full bg-[#0f3460] text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all"
                  >
                    Execute Cycle Promotion Logic
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                <h3 className="text-2xl font-black text-[#0f3460] mb-8 uppercase">Module Access Control</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['Time Table', 'Academic Calendar', 'Staff Management', 'Pupil Management', 'Examination', 'Lesson Plans', 'Finance'].map(m => (
                    <label key={m} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white border-2 border-transparent hover:border-[#cca43b] transition cursor-pointer">
                      <span className="text-xs font-black text-[#0f3460] uppercase">{m}</span>
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 accent-[#0f3460]" 
                        checked={settings.modulePermissions[m] !== false} 
                        onChange={() => toggleModule(m)}
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-12 pt-12 border-t border-gray-100">
                  <h3 className="text-2xl font-black text-[#0f3460] mb-6 uppercase">Assessment Controls</h3>
                  <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-center justify-between">
                     <div className="space-y-1">
                        <h4 className="text-sm font-black text-blue-900 uppercase">Lock SBA Marks Allocation</h4>
                        <p className="text-[10px] font-bold text-blue-700/60 uppercase">Prevents Subject Facilitators from altering mark weightings</p>
                     </div>
                     <button 
                        onClick={() => {
                          onSettingsChange({...settings, sbaMarksLocked: !settings.sbaMarksLocked});
                          notify(settings.sbaMarksLocked ? "SBA Weights UNLOCKED" : "SBA Weights LOCKED", "info");
                        }}
                        className={`w-16 h-8 rounded-full transition-all relative ${settings.sbaMarksLocked ? 'bg-red-500' : 'bg-gray-300'}`}
                     >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md flex items-center justify-center ${settings.sbaMarksLocked ? 'left-9' : 'left-1'}`}>
                           {settings.sbaMarksLocked ? '🔒' : '🔓'}
                        </div>
                     </button>
                  </div>
                </div>

                <div className="mt-12 pt-12 border-t border-red-100">
                  <h4 className="text-red-600 font-black uppercase text-xs mb-4">Danger Zone</h4>
                  <button 
                    onClick={handleSystemReset}
                    className="bg-red-50 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-red-600 transition"
                  >
                    Reset System to Factory Default
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
             <div className="p-10 max-w-4xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-lg text-center">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest">Logo &amp; Branding Master</h4>
                  <div className="w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-200 mx-auto rounded-[2rem] flex items-center justify-center relative overflow-hidden group">
                    {settings.logo ? (
                      <img src={settings.logo} className="w-full h-full object-contain p-4" alt="Logo" />
                    ) : (
                      <span className="text-gray-300 font-black italic">UPLOAD LOGO</span>
                    )}
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (re) => onSettingsChange({...settings, logo: re.target?.result as string});
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <p className="text-[8px] text-gray-400 font-bold uppercase mt-4">Required for all official certificates and receipts</p>
                </div>
                
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase px-1">Institutional Name</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460] shadow-sm uppercase" value={settings.schoolName} onChange={e => onSettingsChange({...settings, schoolName: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase px-1">Official Motto</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460] shadow-sm uppercase" value={settings.motto} onChange={e => onSettingsChange({...settings, motto: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase px-1">Physical/Postal Address</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460] shadow-sm uppercase" value={settings.address} onChange={e => onSettingsChange({...settings, address: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-gray-400 block px-1">Official Email</label>
                         <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460] shadow-sm" value={settings.email} onChange={e => onSettingsChange({...settings, email: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-gray-400 block px-1">Telephone</label>
                         <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460] shadow-sm" value={settings.telephone} onChange={e => onSettingsChange({...settings, telephone: e.target.value})} />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 block px-1">Headteacher/Administrator Name</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460] shadow-sm" value={settings.headteacherName} onChange={e => onSettingsChange({...settings, headteacherName: e.target.value})} />
                   </div>
                   <button onClick={() => notify("Global Particulars Updated!", "success")} className="w-full bg-[#0f3460] text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-[1.02] transition">Push Global Branding Sync</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-10">
                <div>
                  <h3 className="text-2xl font-black text-[#0f3460] uppercase">Bulk Data Operations</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Export/Import Student Records via CSV/Excel</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-4">
                    <h4 className="font-black text-[#0f3460] uppercase text-sm">Download Ledger</h4>
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                      Download the entire student database as a CSV file. This file can be opened in Microsoft Excel, Google Sheets, or any spreadsheet software.
                    </p>
                    <button 
                      onClick={handleExportCSV}
                      className="w-full bg-[#0f3460] text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-[1.02] transition"
                    >
                      Export to CSV File
                    </button>
                  </div>

                  <div className="p-8 bg-yellow-50 rounded-[2rem] border border-yellow-100 space-y-4">
                    <h4 className="font-black text-[#cca43b] uppercase text-sm">Upload Ledger</h4>
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                      Import student data from a CSV file. Ensure the headers match the system format (Name, Class, Gender, etc.) for successful ingestion.
                    </p>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".csv" 
                        ref={fileInputRef}
                        onChange={handleImportCSV}
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-[#cca43b] text-[#0f3460] py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-[1.02] transition"
                      >
                        Choose File &amp; Import
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <h5 className="text-[10px] font-black uppercase text-gray-400 mb-2">CSV Format Guide</h5>
                  <p className="font-mono text-[9px] text-gray-600 break-all bg-white p-3 rounded-lg">
                    ID, SerialID, FirstName, Surname, OtherNames, DOB, Sex, Class, Status, FatherName, MotherName
                  </p>
                  <p className="text-[9px] text-gray-400 mt-2 italic">* Use "Male" or "Female" for Sex. Status should be "Admitted" or "Pending".</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'excellence' && (
             <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center">
                <p className="text-gray-400 font-black uppercase italic text-sm">Academic Excellence Panel - Top 5 Performers Per Class</p>
             </div>
          )}

          {activeTab === 'filing' && (
             <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center">
                <p className="text-gray-400 font-black uppercase italic text-sm">Filing Cabinet - Institutional Record Retrieval</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
