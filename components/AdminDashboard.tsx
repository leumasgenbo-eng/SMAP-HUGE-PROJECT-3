
import React, { useState, useMemo, useRef } from 'react';
import { FILING_CABINET_STRUCTURE, DEPARTMENTS, getSubjectsForDepartment, CLASS_MAPPING } from '../constants';
import { GlobalSettings, Student, DailyExerciseEntry, LessonPlanAssessment, StaffRecord } from '../types';
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
  | 'finance_auth'
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
  
  const pupilImportRef = useRef<HTMLInputElement>(null);
  const staffImportRef = useRef<HTMLInputElement>(null);

  const allClasses = useMemo(() => Object.values(CLASS_MAPPING).flat(), []);

  // --- CSV Handlers ---
  const handleExportCSV = (type: 'pupils' | 'staff') => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = "";

    if (type === 'pupils') {
      headers = ["SerialID", "FirstName", "Surname", "Others", "DOB", "Sex", "Class", "FeesCleared", "Status"];
      rows = students.map(s => [
        s.serialId, s.firstName, s.surname, s.others || "", 
        s.dob, s.sex, s.currentClass, 
        s.isFeesCleared ? "YES" : "NO", s.status
      ]);
      filename = `UBA_Pupil_Registry_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      headers = ["StaffID", "Name", "Role", "Contact", "Gender", "Category", "Department", "WorkArea", "EmploymentType"];
      rows = settings.staff.map(s => [
        s.idNumber, s.name, s.role, s.contact, 
        s.gender, s.category, s.department, 
        s.workArea || "N/A", s.employmentType
      ]);
      filename = `UBA_Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvContent = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>, type: 'pupils' | 'staff') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) throw new Error("File is empty or missing headers.");

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const dataRows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          return headers.reduce((obj, header, i) => {
            obj[header] = values[i];
            return obj;
          }, {} as Record<string, string>);
        });

        if (type === 'pupils') {
          const newStudents: Student[] = dataRows.map(row => ({
            id: crypto.randomUUID(),
            serialId: row.SerialID || `UBA-NEW-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            firstName: row.FirstName || "Unknown",
            surname: row.Surname || "Unknown",
            others: row.Others || "",
            dob: row.DOB || "",
            sex: (row.Sex === 'Female' ? 'Female' : 'Male'),
            classApplyingFor: row.Class || "Basic 1",
            currentClass: row.Class || "Basic 1",
            status: 'Admitted',
            createdAt: new Date().toISOString(),
            admissionFeeReceipt: "BULK-IMPORT",
            admissionFeeDate: new Date().toISOString().split('T')[0],
            hasSpecialNeeds: false,
            father: { name: "", contact: "", address: "", occupation: "", education: "", religion: "", isDead: false },
            mother: { name: "", contact: "", address: "", occupation: "", education: "", religion: "", isDead: false },
            livesWith: 'Both Parents',
            scoreDetails: {}, attendance: {}, lunchRegister: {}, generalRegister: {},
            ledger: [],
            isFeesCleared: row.FeesCleared === 'YES'
          }));
          onStudentsUpdate([...students, ...newStudents]);
          notify(`${newStudents.length} Pupils Ingested Successfully!`, "success");
        } else {
          const newStaff: StaffRecord[] = dataRows.map(row => ({
            id: crypto.randomUUID(),
            idNumber: row.StaffID || `STF-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            name: row.Name || "Unknown Staff",
            role: row.Role || "Staff",
            contact: row.Contact || "",
            gender: (row.Gender === 'Female' ? 'Female' : 'Male'),
            dob: "", nationality: "Ghanaian", hometown: "", residentialAddress: "", email: "", maritalStatus: "Single",
            category: (row.Category === 'Non-Teaching' ? 'Non-Teaching' : 'Teaching'),
            employmentType: 'Full Time',
            department: row.Department || "General",
            workArea: row.WorkArea || "",
            identificationType: 'Ghana Card',
            identificationNumber: "",
            dateOfAppointment: new Date().toISOString().split('T')[0],
            authorizedForFinance: false
          }));
          onSettingsChange({ ...settings, staff: [...settings.staff, ...newStaff] });
          notify(`${newStaff.length} Staff Records Ingested!`, "success");
        }
      } catch (err) {
        notify("Import Error: Please check CSV formatting.", "error");
      }
      e.target.value = ''; // Reset input
    };
    reader.readAsText(file);
  };

  // --- Handlers ---
  const toggleModule = (mod: string) => {
    const updated = { ...settings.modulePermissions };
    updated[mod] = !updated[mod];
    onSettingsChange({ ...settings, modulePermissions: updated });
    notify(`${mod} visibility toggled.`, 'info');
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

  const toggleFinanceAuth = (staffId: string) => {
    const updatedStaff = settings.staff.map(s => 
      s.id === staffId ? { ...s, authorizedForFinance: !s.authorizedForFinance } : s
    );
    onSettingsChange({ ...settings, staff: updatedStaff });
    const staffName = settings.staff.find(s => s.id === staffId)?.name;
    const isAuth = !settings.staff.find(s => s.id === staffId)?.authorizedForFinance;
    notify(`${staffName} ${isAuth ? 'Authorized' : 'De-authorized'} for Financial Access.`, isAuth ? 'success' : 'info');
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

  const authorizedOfficers = useMemo(() => settings.staff.filter(s => s.authorizedForFinance), [settings.staff]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Branding Header */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <EditableField 
          value={settings.schoolName} 
          onSave={v => onSettingsChange({...settings, schoolName: v})} 
          className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" 
        />
        <EditableField 
          value={settings.motto} 
          onSave={v => onSettingsChange({...settings, motto: v})} 
          className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b]" 
        />
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-50 w-full max-w-2xl">
          <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          <span>•</span>
          <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          <span>•</span>
          <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Navigation Sidebar-like Header */}
        <div className="bg-[#0f3460] p-8 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b-4 border-[#cca43b]">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">Institutional Command Center</h2>
            <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-[0.3em] mt-1">S-MAP Integrated Administration Desk</p>
          </div>
          <div className="flex flex-wrap bg-white/10 p-1.5 rounded-2xl gap-1">
             {(['global', 'calendar', 'hr', 'admissions', 'timetable', 'exams', 'assessments', 'supervisory', 'finance_auth', 'audit'] as AdminTab[]).map(t => (
               <button 
                 key={t} 
                 onClick={() => setActiveTab(t)} 
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
               >
                 {t === 'hr' ? 'HR & Staff' : t === 'finance_auth' ? 'Finance Auth' : t.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 bg-gray-50/50 p-10 min-h-[650px] overflow-y-auto">
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
                                        <button onClick={() => toggleFinanceAuth(s.id)} className={`w-8 h-8 rounded-full transition ${s.authorizedForFinance ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-300'}`}>
                                           {s.authorizedForFinance ? '✓' : '✕'}
                                        </button>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white flex flex-col justify-between shadow-xl">
                         <div>
                            <h4 className="text-sm font-black uppercase text-[#cca43b] tracking-widest">Staff Data Hub</h4>
                            <p className="text-[9px] opacity-60 leading-relaxed mt-2">Bulk manage personnel records via CSV.</p>
                            <div className="mt-6 flex flex-col gap-3">
                               <button onClick={() => handleExportCSV('staff')} className="w-full bg-[#cca43b] text-[#0f3460] py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:scale-105 transition">Export Directory CSV</button>
                               <div className="relative">
                                  <input type="file" accept=".csv" className="hidden" ref={staffImportRef} onChange={e => handleImportCSV(e, 'staff')} />
                                  <button onClick={() => staffImportRef.current?.click()} className="w-full bg-white/10 text-white border-2 border-dashed border-white/20 py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-white/20 transition">Bulk Upload Staff</button>
                               </div>
                            </div>
                         </div>
                         <div className="pt-10 border-t border-white/10">
                            <span className="text-[8px] font-black uppercase text-[#cca43b] block mb-2 tracking-widest">Punctuality Standards</span>
                            <input type="time" className="w-full p-4 bg-white/10 rounded-2xl text-white font-black text-xl border-none outline-none focus:ring-1 focus:ring-[#cca43b]" value={settings.punctualityThreshold} onChange={e => onSettingsChange({...settings, punctualityThreshold: e.target.value})} />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

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
                      <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Pupil Data Hub</h3>
                      <div className="grid grid-cols-1 gap-4">
                         <button onClick={() => handleExportCSV('pupils')} className="w-full bg-[#0f3460] text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition">Download Registry CSV</button>
                         <div className="relative group">
                            <input type="file" accept=".csv" className="hidden" ref={pupilImportRef} onChange={e => handleImportCSV(e, 'pupils')} />
                            <button onClick={() => pupilImportRef.current?.click()} className="w-full bg-gray-100 text-gray-500 py-6 rounded-3xl font-black uppercase text-xs tracking-widest border-2 border-dashed border-gray-200 group-hover:border-[#0f3460] group-hover:text-[#0f3460] transition">Bulk Upload Pupils</button>
                         </div>
                         <button onClick={() => { if(confirm("Mass execute mass promotion?")) notify("Mass promotion logic executed.", "success"); }} className="w-full bg-[#cca43b] text-[#0f3460] py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg hover:scale-[1.02] transition">Mass Execute Promotion</button>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* ... Rest of tabs (calendar, timetable, exams, assessments, supervisory, finance_auth, audit) ... */}
          {activeTab === 'finance_auth' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b pb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl text-blue-600 shadow-inner">🔐</div>
                       <div>
                          <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Finance Person Authorization</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Authorized Financial Staff Entry Registry</p>
                       </div>
                    </div>
                    <div className="bg-green-50 px-6 py-2 rounded-2xl border border-green-100 text-center">
                       <p className="text-[8px] font-black text-green-400 uppercase">Active Officers</p>
                       <p className="text-2xl font-black text-green-700">{authorizedOfficers.length}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest px-2">Personnel Access Registry</h4>
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                           <table className="w-full text-left text-[11px] border-collapse">
                              <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                                 <tr>
                                    <th className="p-5">Staff Identity</th>
                                    <th className="p-5">Role / Area</th>
                                    <th className="p-5 text-center">Authorization Status</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {settings.staff.map(s => (
                                    <tr key={s.id} className="border-b hover:bg-gray-50 transition group">
                                       <td className="p-5">
                                          <p className="font-black text-[#0f3460] uppercase">{s.name}</p>
                                          <p className="text-[9px] font-mono text-gray-400 font-bold">Ref: {s.idNumber}</p>
                                       </td>
                                       <td className="p-5">
                                          <p className="font-bold text-gray-500 uppercase text-[9px]">{s.role}</p>
                                          <p className="text-[8px] text-gray-400 uppercase">{s.category}</p>
                                       </td>
                                       <td className="p-5 text-center">
                                          <button 
                                             onClick={() => toggleFinanceAuth(s.id)}
                                             className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${s.authorizedForFinance ? 'bg-green-600 text-white' : 'bg-red-50 text-red-300 hover:bg-red-100 hover:text-red-500'}`}
                                          >
                                             {s.authorizedForFinance ? 'AUTHORIZED OFFICER' : 'NO ACCESS'}
                                          </button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                     <div className="space-y-6">
                        <div className="bg-[#0f3460] p-8 rounded-[3rem] text-white space-y-6 shadow-2xl">
                           <h4 className="text-sm font-black uppercase text-[#cca43b] tracking-widest border-b border-white/10 pb-4">Security Protocols</h4>
                           <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                              <p className="text-[9px] font-bold text-red-200 leading-relaxed italic">
                                 Authorization gives personnel full access to the Secure Access Terminal. 
                                 All transactions are tied to the processing officer's ID.
                              </p>
                           </div>
                        </div>
                     </div>
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
