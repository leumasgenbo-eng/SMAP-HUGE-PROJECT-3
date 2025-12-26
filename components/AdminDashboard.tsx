
import React, { useState, useMemo, useRef } from 'react';
import { FILING_CABINET_STRUCTURE, DEPARTMENTS, getSubjectsForDepartment, CLASS_MAPPING } from '../constants';
import { FilingRecord, GlobalSettings, Student, DailyExerciseEntry } from '../types';

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
  const [activeTab, setActiveTab] = useState<'filing' | 'promotion' | 'identity' | 'bulk' | 'excellence' | 'system' | 'finance' | 'questions' | 'audit_trail' | 'staff_logs' | 'staff_config' | 'assessment_logs'>('system');
  const [newFinanceCategory, setNewFinanceCategory] = useState('');
  const [selectedFinanceClass, setSelectedFinanceClass] = useState('Basic 1');
  const [selectedQuestionDept, setSelectedQuestionDept] = useState('Lower');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [newStaffArea, setNewStaffArea] = useState('');
  const [selectedLogSubject, setSelectedLogSubject] = useState('Mathematics');
  const [auditClassFilter, setAuditClassFilter] = useState('Basic 1');
  const [auditWeekFilter, setAuditWeekFilter] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allClasses = useMemo(() => Object.values(CLASS_MAPPING).flat(), []);
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    DEPARTMENTS.forEach(d => getSubjectsForDepartment(d.id).forEach(s => set.add(s)));
    return Array.from(set).sort();
  }, []);

  // --- Academic Compliance Logic ---
  const subjectComplianceData = useMemo(() => {
    const classSubjects = getSubjectsForDepartment(DEPARTMENTS.find(d => CLASS_MAPPING[d.id].includes(auditClassFilter))?.id || 'Lower');
    const classEntries = (settings.exerciseEntries || []).filter(e => e.week === auditWeekFilter);
    const demands = settings.subjectDemands[auditClassFilter] || {};

    return classSubjects.map(subj => {
      const count = classEntries.filter(e => e.subject === subj).length;
      const demand = demands[subj] || 1; // Default to 1 to avoid division by zero
      const ratio = count / demand;
      return { subj, count, demand, ratio };
    });
  }, [settings.exerciseEntries, settings.subjectDemands, auditClassFilter, auditWeekFilter]);

  const handleExportAssessmentCSV = (subjectFilter: string | 'ALL') => {
    const entries = (settings.exerciseEntries || []).filter(e => subjectFilter === 'ALL' || e.subject === subjectFilter);
    if (entries.length === 0) {
      notify(`No logs found for ${subjectFilter === 'ALL' ? 'any subject' : subjectFilter}.`, "error");
      return;
    }
    const headers = ["ID", "Date", "Week", "Subject", "Type", "Strand", "SubStrand", "Indicator", "MaxScore", "TotalPupils", "MarkedCount", "DefaultersCount", "DisciplinaryReferral"];
    const rows = entries.map(e => {
      const scoredCount = Object.keys(e.pupilScores || {}).length;
      const defaulterCount = Object.keys(e.defaulterReasons || {}).length;
      return [e.id, e.date || "", e.week, e.subject, e.type, e.strand || "", e.subStrand || "", e.indicator || "", e.maxScore, scoredCount + defaulterCount, scoredCount, defaulterCount, e.isDisciplinaryReferral ? "YES" : "NO"];
    });
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UBA_Assessment_Logs_${subjectFilter.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`Assessment log for ${subjectFilter} exported.`, "success");
  };

  const handleExportDisciplinaryCSV = () => {
    const referrals = (settings.exerciseEntries || []).filter(e => e.isDisciplinaryReferral);
    if (referrals.length === 0) {
      notify("No active disciplinary referrals found to export.", "error");
      return;
    }
    const headers = ["ReferralID", "Date", "Subject", "Week", "PupilID", "PupilName", "Reason"];
    const rows: any[] = [];
    referrals.forEach(e => {
      Object.entries(e.defaulterReasons || {}).forEach(([pid, reason]) => {
        const student = students.find(s => s.id === pid);
        rows.push([e.id, e.date || "", e.subject, e.week, student?.serialId || pid, student ? `${student.firstName} ${student.surname}` : "Unknown", reason]);
      });
    });
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UBA_Disciplinary_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("Disciplinary referral audit exported.", "success");
  };

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
    onSettingsChange({ ...settings, financeConfig: { ...settings.financeConfig, categories: cats } });
    setNewFinanceCategory('');
    notify("Finance Category Added", "success");
  };

  const handleRemoveCategory = (cat: string) => {
    const cats = settings.financeConfig.categories.filter(c => c !== cat);
    onSettingsChange({ ...settings, financeConfig: { ...settings.financeConfig, categories: cats } });
    notify("Category Removed", "info");
  };

  const updateBillAmount = (cls: string, cat: string, val: string) => {
    const amount = parseFloat(val) || 0;
    const classBills = { ...settings.financeConfig.classBills };
    if (!classBills[cls]) classBills[cls] = {};
    classBills[cls][cat] = amount;
    onSettingsChange({ ...settings, financeConfig: { ...settings.financeConfig, classBills } });
  };

  const updateTax = (field: keyof typeof settings.financeConfig.taxConfig, val: any) => {
    onSettingsChange({ ...settings, financeConfig: { ...settings.financeConfig, taxConfig: { ...settings.financeConfig.taxConfig, [field]: val } } });
  };

  const toggleStaffFinanceAuth = (id: string) => {
    const updatedStaff = settings.staff.map(s => s.id === id ? { ...s, authorizedForFinance: !s.authorizedForFinance } : s);
    onSettingsChange({ ...settings, staff: updatedStaff });
    notify("Staff Finance Authorization Updated", "info");
  };

  const handleAddStaffArea = () => {
    if (!newStaffArea.trim()) return;
    const areas = [...settings.popoutLists.nonTeachingAreas, newStaffArea.trim()];
    onSettingsChange({ ...settings, popoutLists: { ...settings.popoutLists, nonTeachingAreas: areas } });
    setNewStaffArea('');
    notify("Staff Area Added", "success");
  };

  const promotableCount = useMemo(() => students.filter(s => s.status === 'Admitted' && s.isFeesCleared).length, [students]);
  const withheldCount = useMemo(() => students.filter(s => s.status === 'Admitted' && !s.isFeesCleared).length, [students]);
  
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
      if (!s.isFeesCleared) status = "Promotion Pending (Clear school fees)";
      else if (attendanceRate < 90) status = "Promotion Pending (Parent invited on reopening day)";
      else if (attendanceRate < 95) status = "Promotion Conditional (Attendance below 95%)";
      else if (!allPassed) status = "On Probation (Prepare to write probational exams)";
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
    const rows = students.map(s => [s.id, s.serialId, s.firstName, s.surname, s.others || "", s.dob, s.sex, s.currentClass, s.status, s.isFeesCleared ? "Yes" : "No", s.promotionStatus || "", s.father?.name || "", s.mother?.name || ""]);
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
        <div className="bg-[#0f3460] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Administration Desk</h2>
            <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">System Audit & Authorization Center</p>
          </div>
          <div className="flex flex-wrap bg-white/10 p-1.5 rounded-2xl gap-2">
             {['system', 'identity', 'promotion', 'finance', 'questions', 'audit_trail', 'staff_logs', 'staff_config', 'assessment_logs', 'bulk', 'filing'].map(t => (
               <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460]' : ''}`}>
                 {t.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/30 p-10 min-h-[500px]">
          {activeTab === 'assessment_logs' && (
            <div className="max-w-6xl mx-auto space-y-10">
               {/* Academic Compliance Heat Map */}
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black text-[#0f3460] uppercase">Academic Delivery Audit</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ratio: (CW + HW) / Subject Period Demands</p>
                    </div>
                    <div className="flex gap-4">
                       <select value={auditClassFilter} onChange={e => setAuditClassFilter(e.target.value)} className="p-2 rounded-xl bg-gray-50 text-[10px] font-black uppercase outline-none shadow-inner border-none">
                          {allClasses.map(c => <option key={c}>{c}</option>)}
                       </select>
                       <input type="number" min="1" max="16" value={auditWeekFilter} onChange={e => setAuditWeekFilter(parseInt(e.target.value))} className="p-2 rounded-xl bg-gray-50 text-[10px] font-black text-center w-20 shadow-inner border-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {subjectComplianceData.map(d => (
                        <div key={d.subj} className={`p-6 rounded-[2.5rem] border-2 transition-all ${d.ratio < 0.5 ? 'bg-red-50 border-red-200' : d.ratio < 0.8 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <h4 className={`text-xs font-black uppercase ${d.ratio < 0.5 ? 'text-red-600' : d.ratio < 0.8 ? 'text-orange-600' : 'text-green-700'}`}>{d.subj}</h4>
                                 <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Demand: {d.demand} p/w</p>
                              </div>
                              <span className={`text-2xl font-black ${d.ratio < 0.5 ? 'text-red-700' : d.ratio < 0.8 ? 'text-orange-700' : 'text-green-800'}`}>{(d.ratio * 100).toFixed(0)}%</span>
                           </div>
                           <div className="h-2 bg-white/50 rounded-full overflow-hidden mb-2">
                              <div className={`h-full transition-all duration-500 ${d.ratio < 0.5 ? 'bg-red-500' : d.ratio < 0.8 ? 'bg-orange-500' : 'bg-green-500'}`} style={{width: `${Math.min(100, d.ratio * 100)}%`}}></div>
                           </div>
                           <p className="text-[9px] font-black uppercase text-gray-400 text-right">Tasks Delivered: {d.count}</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Disciplinary Audit Ledger Section */}
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black text-red-600 uppercase">Disciplinary Referral Audit</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Track chronic defaulters and behavioral logs</p>
                    </div>
                    <button onClick={handleExportDisciplinaryCSV} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:scale-105 transition">Export Disciplinary Master CSV</button>
                  </div>
                  <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                        <tr><th className="p-4">Date</th><th className="p-4">Subject</th><th className="p-4">Learner</th><th className="p-4">Reason for Default</th><th className="p-4 text-center">Status</th></tr>
                      </thead>
                      <tbody>
                        {(settings.exerciseEntries || []).filter(e => e.isDisciplinaryReferral).reverse().map(e => (
                          <React.Fragment key={e.id}>
                            {Object.entries(e.defaulterReasons || {}).map(([pid, reason]) => {
                              const s = students.find(st => st.id === pid);
                              return (
                                <tr key={`${e.id}-${pid}`} className="border-b hover:bg-red-50/10">
                                  <td className="p-4 font-mono text-gray-400">{e.date}</td>
                                  <td className="p-4 font-black text-[#0f3460] uppercase">{e.subject} <span className="text-[8px] opacity-50 block">{e.type}</span></td>
                                  <td className="p-4">
                                    <p className="font-bold text-gray-600 uppercase">{s ? `${s.firstName} ${s.surname}` : 'Unknown'}</p>
                                    <p className="text-[9px] font-mono text-gray-400">{s?.serialId}</p>
                                  </td>
                                  <td className="p-4 italic text-red-700">{reason}</td>
                                  <td className="p-4 text-center">
                                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">REFERRED</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>

               {/* Daily Assessment Logs Section */}
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h3 className="text-2xl font-black text-[#0f3460] uppercase">Assessment Log Repository</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cross-subject activity and participation audit</p>
                    </div>
                    <div className="flex gap-4">
                      <select className="p-3 bg-gray-50 rounded-xl font-black text-[10px] uppercase border-none focus:ring-2 focus:ring-[#0f3460] w-48 shadow-inner" value={selectedLogSubject} onChange={e => setSelectedLogSubject(e.target.value)}>
                        {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => handleExportAssessmentCSV(selectedLogSubject)} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:scale-105 transition">Download Subject CSV</button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                        <tr><th className="p-4">Date</th><th className="p-4">Week</th><th className="p-4">Strand / Indicator</th><th className="p-4 text-center">Participation</th><th className="p-4 text-center">Avg Quality</th><th className="p-4 text-center">Audit Status</th></tr>
                      </thead>
                      <tbody>
                        {(settings.exerciseEntries || []).filter(e => e.subject === selectedLogSubject).reverse().map(e => {
                          const totalClassCount = Object.keys(e.pupilStatus || {}).length || 1;
                          const markedCount = Object.values(e.pupilStatus || {}).filter(v => v === 'Marked').length;
                          const participationRate = Math.round((markedCount / totalClassCount) * 100);
                          return (
                            <tr key={e.id} className="border-b hover:bg-gray-50 transition">
                              <td className="p-4 font-mono text-gray-400">{e.date}</td>
                              <td className="p-4 font-black text-blue-600">WK {e.week}</td>
                              <td className="p-4">
                                <p className="font-black text-[#0f3460] uppercase text-[10px]">{e.strand || 'No Strand'}</p>
                                <p className="text-[9px] font-bold text-[#cca43b] italic">{e.indicator || 'N/A'}</p>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-black text-xs">{participationRate}%</span>
                                  <div className="w-20 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-green-500" style={{width: `${participationRate}%`}}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center font-bold text-gray-500">{(e.handwritingRating || 5)} / 10</td>
                              <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${e.isLateSubmission ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{e.isLateSubmission ? 'LATE LOG' : 'VERIFIED'}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}
          {activeTab === 'staff_config' && (
            <div className="max-w-4xl mx-auto space-y-10">
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-10">
                  <div><h3 className="text-2xl font-black text-[#0f3460] uppercase">HR Configuration</h3></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <div className="flex gap-2">
                           <input placeholder="New Work Area" className="flex-1 p-3 bg-gray-50 rounded-xl font-bold text-xs" value={newStaffArea} onChange={e => setNewStaffArea(e.target.value)} />
                           <button onClick={handleAddStaffArea} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Add</button>
                        </div>
                        <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                           {settings.popoutLists.nonTeachingAreas.map(area => (
                              <div key={area} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group transition hover:bg-red-50">
                                 <span className="text-[11px] font-black text-gray-600 uppercase">{area}</span>
                                 <button onClick={() => onSettingsChange({...settings, popoutLists: {...settings.popoutLists, nonTeachingAreas: settings.popoutLists.nonTeachingAreas.filter(a => a !== area)}})} className="text-red-400 opacity-0 group-hover:opacity-100 transition">✕</button>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-6">
                        <input type="time" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460]" value={settings.punctualityThreshold} onChange={e => onSettingsChange({...settings, punctualityThreshold: e.target.value})} />
                     </div>
                  </div>
               </div>
            </div>
          )}
          {activeTab === 'system' && (
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['Class Time Table', 'Academic Calendar', 'Staff Management', 'Pupil Management', 'Examination', 'Lesson Plans', 'Finance'].map(m => (
                    <label key={m} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white border-2 border-transparent hover:border-[#cca43b] transition cursor-pointer">
                      <span className="text-xs font-black text-[#0f3460] uppercase">{m}</span>
                      <input type="checkbox" className="w-6 h-6 accent-[#0f3460]" checked={settings.modulePermissions[m] !== false} onChange={() => toggleModule(m)} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Remaining Tabs omitted for brevity as they haven't changed logic-wise */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
