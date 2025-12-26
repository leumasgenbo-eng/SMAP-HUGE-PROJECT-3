import React, { useState, useMemo, useRef } from 'react';
import { FILING_CABINET_STRUCTURE, DEPARTMENTS, getSubjectsForDepartment, CLASS_MAPPING } from '../constants';
import { GlobalSettings, Student, DailyExerciseEntry, LessonPlanAssessment, StaffRecord, SubjectProfile, StaffInvitation, StaffQuery, AcademicCalendarWeek } from '../types';
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
  | 'contacts'
  | 'admissions' 
  | 'timetable' 
  | 'supervisory' 
  | 'finance_auth'
  | 'finance_config';

const AdminDashboard: React.FC<Props> = ({ section, dept, notify, settings, onSettingsChange, students, onStudentsUpdate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('hr');
  const [selectedTerm, setSelectedTerm] = useState<number>(settings.currentTerm);
  const [contactSearch, setContactSearch] = useState('');
  const [financeClassFilter, setFinanceClassFilter] = useState('Basic 1');
  const [registryFilter, setRegistryFilter] = useState<'All' | 'Admitted' | 'Pending'>('Admitted');
  
  // Local state for finance authorization
  const [provisionStaffId, setProvisionStaffId] = useState('');
  
  // Local state for various configurations
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedQuestionDept, setSelectedQuestionDept] = useState('Lower');
  const [selectedQuestionSet, setSelectedQuestionSet] = useState<'A' | 'B' | 'C' | 'D'>('A');
  
  const pupilImportRef = useRef<HTMLInputElement>(null);
  const staffImportRef = useRef<HTMLInputElement>(null);
  const questionImportRef = useRef<HTMLInputElement>(null);

  const teachingStaff = useMemo(() => settings.staff.filter(s => s.category === 'Teaching'), [settings.staff]);

  const allClasses = useMemo(() => Object.values(CLASS_MAPPING).flat(), []);

  // --- Unified Contacts Registry Logic ---
  const contactRegistry = useMemo(() => {
    const staffContacts = settings.staff.map(s => ({
      id: s.id,
      name: s.name,
      type: 'Staff',
      role: s.role,
      contact: s.contact,
      email: s.email,
      meta: s.department
    }));

    const parentContacts = students.filter(s => s.status === 'Admitted').map(s => ({
      id: s.id,
      name: s.father.name || s.mother.name || 'Unknown Parent',
      type: 'Parent',
      role: `Parent of ${s.firstName} ${s.surname}`,
      contact: s.father.contact || s.mother.contact || 'N/A',
      email: s.email || 'N/A',
      meta: s.currentClass
    }));

    return [...staffContacts, ...parentContacts].filter(c => 
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) || 
      c.contact.includes(contactSearch)
    );
  }, [settings.staff, students, contactSearch]);

  const handleUpdateContact = (id: string, type: 'Staff' | 'Parent', field: 'contact' | 'email', value: string) => {
    if (type === 'Staff') {
      const updatedStaff = settings.staff.map(s => s.id === id ? { ...s, [field]: value } : s);
      onSettingsChange({ ...settings, staff: updatedStaff });
    } else {
      const updatedStudents = students.map(s => {
        if (s.id === id) {
          if (field === 'contact') {
            return { ...s, father: { ...s.father, contact: value } };
          }
          return { ...s, email: value };
        }
        return s;
      });
      onStudentsUpdate(updatedStudents);
    }
    notify(`Contact Registry Synchronized: ${field} updated.`, "success");
  };

  const handleExportCSV = (type: 'pupils' | 'staff' | 'questions') => {
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
    } else if (type === 'staff') {
      headers = ["StaffID", "Name", "Role", "Contact", "Gender", "Category", "Department", "WorkArea", "EmploymentType", "FinanceAuth"];
      rows = settings.staff.map(s => [
        s.idNumber, s.name, s.role, s.contact, 
        s.gender, s.category, s.department, 
        s.workArea || "N/A", s.employmentType,
        s.authorizedForFinance ? "YES" : "NO"
      ]);
      filename = `UBA_Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      headers = ["Department", "Set", "QuestionID", "QuestionText"];
      Object.entries(settings.questionBank || {}).forEach(([deptId, sets]) => {
        Object.entries(sets || {}).forEach(([setName, qs]) => {
          Object.entries(qs || {}).forEach(([qid, text]) => {
            rows.push([deptId, setName, qid, text]);
          });
        });
      });
      filename = `UBA_Question_Bank_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csvContent = [headers, ...rows].map(r => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>, type: 'pupils' | 'staff' | 'questions') => {
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
        } else if (type === 'staff') {
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
            authorizedForFinance: row.FinanceAuth === 'YES'
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

  const toggleModule = (mod: string) => {
    const updated = { ...settings.modulePermissions };
    updated[mod] = !updated[mod];
    onSettingsChange({ ...settings, modulePermissions: updated });
    notify(`${mod} visibility toggled.`, 'info');
  };

  const toggleFinanceAuth = (staffId: string) => {
    const updatedStaff = settings.staff.map(s => 
      s.id === staffId ? { ...s, authorizedForFinance: !s.authorizedForFinance } : s
    );
    onSettingsChange({ ...settings, staff: updatedStaff });
    const staffMember = settings.staff.find(s => s.id === staffId);
    const isNowAuth = !staffMember?.authorizedForFinance;
    notify(`${staffMember?.name} ${isNowAuth ? 'Authorized' : 'De-authorized'} for Finance.`, isNowAuth ? "success" : "info");
  };

  const handleProvisionFinance = () => {
    if (!provisionStaffId) return;
    toggleFinanceAuth(provisionStaffId);
    setProvisionStaffId('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Branding Header */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-50 rounded-[2rem] border-2 border-gray-100 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-inner">
             {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <span className="text-4xl">🏫</span>}
             <div className="absolute inset-0 bg-[#0f3460]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <EditableField value={settings.logo} onSave={v => onSettingsChange({...settings, logo: v})} placeholder="Logo URL" className="text-[10px] text-white bg-transparent border-white" />
             </div>
          </div>
          <div className="flex flex-col items-start">
            <EditableField 
              value={settings.schoolName} 
              onSave={v => onSettingsChange({...settings, schoolName: v})} 
              className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" 
            />
            <EditableField 
              value={settings.motto} 
              onSave={v => onSettingsChange({...settings, motto: v})} 
              className="text-[11px] font-black uppercase tracking-[0.4em] text-[#cca43b]" 
            />
          </div>
        </div>
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-50 w-full max-w-4xl">
          <div className="flex items-center gap-2">
             <span className="text-[#cca43b] text-[10px]">📍</span>
             <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
             <span className="text-[#cca43b] text-[10px]">📞</span>
             <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
             <span className="text-[#cca43b] text-[10px]">✉️</span>
             <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className="lowercase" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Navigation Sidebar-like Header */}
        <div className="bg-[#0f3460] p-8 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b-4 border-[#cca43b] no-print">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">Institutional Command Center</h2>
            <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-[0.3em] mt-1">S-MAP Integrated Administration Desk</p>
          </div>
          <div className="flex flex-wrap bg-white/10 p-1.5 rounded-2xl gap-1">
             {(['global', 'calendar', 'hr', 'contacts', 'admissions', 'timetable', 'supervisory', 'finance_auth', 'finance_config'] as AdminTab[]).map(t => (
               <button 
                 key={t} 
                 onClick={() => setActiveTab(t)} 
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
               >
                 {t === 'hr' ? 'HR & Staff' : t === 'finance_auth' ? 'Finance Auth' : t === 'finance_config' ? 'Finance Config' : t === 'calendar' ? 'Event Timeline' : t === 'contacts' ? 'Contact Registry' : t.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 bg-gray-50/50 p-10 min-h-[650px] overflow-y-auto">
          {activeTab === 'finance_config' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Institutional Billable Parameters */}
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                     <div>
                        <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Institutional Billable Items</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Standard Fees & Periodic Charges per Class</p>
                     </div>
                     
                     <div className="space-y-6">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-gray-400 px-2">1. Choose Targeted Level</label>
                           <select 
                              className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460] text-xs outline-none focus:ring-2 focus:ring-[#cca43b]"
                              value={financeClassFilter}
                              onChange={e => setFinanceClassFilter(e.target.value)}
                           >
                              {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>

                        <div className="space-y-4">
                           {settings.financeConfig.categories.map(cat => (
                              <div key={cat} className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm group">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-sm shadow-sm group-hover:bg-[#cca43b] group-hover:text-white transition">🏷️</div>
                                    <span className="text-[10px] font-black uppercase text-gray-500">{cat}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-gray-400">GH₵</span>
                                    <input 
                                       type="number"
                                       className="w-24 p-2 bg-white rounded-xl text-right font-black text-blue-600 outline-none border border-transparent focus:border-[#cca43b] transition"
                                       value={settings.financeConfig.classBills[financeClassFilter]?.[cat] || 0}
                                       onChange={e => {
                                          const updatedBills = { ...settings.financeConfig.classBills };
                                          if (!updatedBills[financeClassFilter]) updatedBills[financeClassFilter] = {};
                                          updatedBills[financeClassFilter][cat] = parseFloat(e.target.value) || 0;
                                          onSettingsChange({
                                             ...settings,
                                             financeConfig: { ...settings.financeConfig, classBills: updatedBills }
                                          });
                                       }}
                                    />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Statutory Tax Matrix */}
                  <div className="space-y-8">
                     <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl space-y-8">
                        <div>
                           <h3 className="text-2xl font-black uppercase tracking-tighter">Statutory Tax Matrix</h3>
                           <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Configurable Levies & Regulatory Compliances</p>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                              <span className="text-[10px] font-black uppercase">Enable Statutory Taxation</span>
                              <button 
                                 onClick={() => {
                                    const config = { ...settings.financeConfig.taxConfig, isTaxEnabled: !settings.financeConfig.taxConfig.isTaxEnabled };
                                    onSettingsChange({ ...settings, financeConfig: { ...settings.financeConfig, taxConfig: config } });
                                 }}
                                 className={`w-12 h-6 rounded-full relative transition-all ${settings.financeConfig.taxConfig.isTaxEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                              >
                                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.financeConfig.taxConfig.isTaxEnabled ? 'right-1' : 'left-1'}`}></div>
                              </button>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              {[
                                 { id: 'vatRate', label: 'VAT Rate (%)' },
                                 { id: 'nhilRate', label: 'NHIL Rate (%)' },
                                 { id: 'getLevyRate', label: 'GET Levy (%)' },
                                 { id: 'covidLevyRate', label: 'Covid-19 Levy (%)' }
                              ].map(tax => (
                                 <div key={tax.id} className="bg-white/10 p-5 rounded-[2rem] border border-white/10 space-y-2">
                                    <label className="text-[8px] font-black uppercase text-[#cca43b]">{tax.label}</label>
                                    <input 
                                       type="number" 
                                       step="0.1"
                                       className="w-full bg-transparent border-b-2 border-white/20 font-black text-xl text-white outline-none focus:border-[#cca43b] transition"
                                       value={(settings.financeConfig.taxConfig as any)[tax.id]}
                                       onChange={e => {
                                          const config = { ...settings.financeConfig.taxConfig, [tax.id]: parseFloat(e.target.value) || 0 };
                                          onSettingsChange({ ...settings, financeConfig: { ...settings.financeConfig, taxConfig: config } });
                                       }}
                                    />
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="p-6 bg-yellow-50/10 rounded-2xl border border-yellow-50/20">
                           <p className="text-[9px] text-yellow-50/60 leading-relaxed font-bold italic">
                              * Tax rates are applied to 'New Bill' entries during transaction processing. <br/>Historical transactions remain unaffected by rate adjustments.
                           </p>
                        </div>
                     </div>

                     <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Global Financial Message</h4>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-gray-300 uppercase px-1">Receipt Footer Narrative</label>
                           <textarea 
                              className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-xs italic shadow-inner resize-none h-24"
                              value={settings.financeConfig.receiptMessage}
                              onChange={e => onSettingsChange({
                                 ...settings,
                                 financeConfig: { ...settings.financeConfig, receiptMessage: e.target.value }
                              })}
                              placeholder="e.g. Thanks for your payment..."
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'finance_auth' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Provisioning Form */}
                  <div className="lg:col-span-1 space-y-6">
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-8">
                        <div className="space-y-2">
                           <span className="text-3xl">🔑</span>
                           <h3 className="text-xl font-black text-[#0f3460] uppercase">Provision Terminal Access</h3>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorized Financial Staff Entry Only</p>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-gray-400 px-2">1. Select Staff Identity</label>
                              <select 
                                 className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460] text-sm shadow-inner outline-none focus:ring-2 focus:ring-[#cca43b]"
                                 value={provisionStaffId}
                                 onChange={e => setProvisionStaffId(e.target.value)}
                              >
                                 <option value="">-- Choose Account --</option>
                                 {settings.staff.filter(s => !s.authorizedForFinance).map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.idNumber})</option>
                                 ))}
                              </select>
                           </div>
                           <button 
                              onClick={handleProvisionFinance}
                              disabled={!provisionStaffId}
                              className="w-full bg-[#0f3460] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-all disabled:opacity-30 disabled:grayscale"
                           >
                              Authorize for Terminal
                           </button>
                        </div>
                        
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                           <p className="text-[9px] text-blue-800 leading-relaxed font-bold italic">
                              Unauthorized access to the payment terminal is strictly prohibited. <br/>Approved staff will require OTP verification for all sessions.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Directory of Authorized Personnel */}
                  <div className="lg:col-span-2 space-y-6">
                     <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Authorized Financial Personnel</h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase">Total Provisioned: {settings.staff.filter(s => s.authorizedForFinance).length}</span>
                     </div>
                     <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                           <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                              <tr>
                                 <th className="p-6 border-b">Identity</th>
                                 <th className="p-6 border-b">ID Number</th>
                                 <th className="p-6 border-b">System Role</th>
                                 <th className="p-6 border-b text-center">Status</th>
                              </tr>
                           </thead>
                           <tbody>
                              {settings.staff.filter(s => s.authorizedForFinance).map(s => (
                                <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                                   <td className="p-6 font-black uppercase text-[#0f3460]">{s.name}</td>
                                   <td className="p-6 font-mono text-gray-400 font-bold">{s.idNumber}</td>
                                   <td className="p-6 font-bold text-blue-600 uppercase">{s.role}</td>
                                   <td className="p-6 text-center">
                                      <button 
                                         onClick={() => toggleFinanceAuth(s.id)}
                                         className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[8px] font-black uppercase hover:bg-red-100 transition"
                                      >
                                         Revoke Access
                                      </button>
                                   </td>
                                </tr>
                              ))}
                              {settings.staff.filter(s => s.authorizedForFinance).length === 0 && (
                                 <tr><td colSpan={4} className="p-32 text-center text-gray-300 font-black uppercase italic tracking-widest">No authorized terminal operators found.</td></tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'hr' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 no-print">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                       <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Personnel Directory Audit</h3>
                       <span className="text-[10px] font-black text-gray-400 uppercase">Total Personnel: {settings.staff.length}</span>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                       <table className="w-full text-left text-[11px]">
                          <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                             <tr>
                                <th className="p-5 border-b">Name</th>
                                <th className="p-5 border-b">Role</th>
                                <th className="p-5 border-b">Dept/Area</th>
                                <th className="p-5 border-b text-center">Finance Auth</th>
                             </tr>
                          </thead>
                          <tbody>
                             {settings.staff.map(s => (
                               <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                                  <td className="p-5 font-black uppercase text-[#0f3460]">{s.name}</td>
                                  <td className="p-5 font-bold text-gray-500 uppercase">{s.role}</td>
                                  <td className="p-5 font-bold text-blue-600 uppercase">{s.category === 'Teaching' ? s.department : (s.workArea || 'Gen')}</td>
                                  <td className="p-5 text-center">
                                     <button 
                                        onClick={() => toggleFinanceAuth(s.id)}
                                        className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${s.authorizedForFinance ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                                     >
                                        {s.authorizedForFinance ? 'AUTHORIZED' : 'REVOKED'}
                                     </button>
                                  </td>
                               </tr>
                             ))}
                             {settings.staff.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-gray-300 italic uppercase font-black">No personnel in registry.</td></tr>}
                          </tbody>
                       </table>
                    </div>
                  </div>

                  <div className="space-y-8">
                     <div className="bg-[#0f3460] p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl">
                        <h4 className="text-sm font-black uppercase text-[#cca43b] tracking-widest border-b border-white/10 pb-2">Staff Data Hub</h4>
                        <p className="text-[10px] font-medium opacity-60 leading-relaxed italic">Bulk manage personnel records via CSV. Ensure headers match the institutional schema.</p>
                        <div className="space-y-3">
                           <button onClick={() => handleExportCSV('staff')} className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl text-[10px] font-black uppercase transition-all border border-white/10">Export Directory CSV</button>
                           <div className="relative">
                              <input type="file" accept=".csv" ref={staffImportRef} className="hidden" onChange={e => handleImportCSV(e, 'staff')} />
                              <button onClick={() => staffImportRef.current?.click()} className="w-full bg-[#cca43b] text-[#0f3460] py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:scale-[1.02] transition">Bulk Upload Staff</button>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Punctuality Standards</h4>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-gray-300 uppercase px-1">Lateness Threshold</label>
                           <input 
                              type="time" 
                              className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-lg text-[#0f3460] shadow-inner"
                              value={settings.punctualityThreshold}
                              onChange={e => onSettingsChange({...settings, punctualityThreshold: e.target.value})}
                           />
                        </div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase italic">Entries after this time are logged as 'Late' in the attendance ledger.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'admissions' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center no-print">
                       <div className="space-y-1">
                          <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Pupil Registry Audit</h3>
                          <div className="flex gap-4">
                            <button onClick={() => setRegistryFilter('Admitted')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${registryFilter === 'Admitted' ? 'bg-[#cca43b] text-[#0f3460]' : 'bg-gray-100 text-gray-400'}`}>Admitted ({students.filter(s => s.status === 'Admitted').length})</button>
                            <button onClick={() => setRegistryFilter('Pending')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${registryFilter === 'Pending' ? 'bg-[#cca43b] text-[#0f3460]' : 'bg-gray-100 text-gray-400'}`}>Applicants ({students.filter(s => s.status !== 'Admitted' && s.status !== 'Denied' && s.status !== 'Withdrawn').length})</button>
                            <button onClick={() => setRegistryFilter('All')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${registryFilter === 'All' ? 'bg-[#cca43b] text-[#0f3460]' : 'bg-gray-100 text-gray-400'}`}>Total Registry ({students.length})</button>
                          </div>
                       </div>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
                       <table className="w-full text-left text-[11px]">
                          <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                             <tr>
                                <th className="p-5 border-b">Serial ID</th>
                                <th className="p-5 border-b">Learner Name</th>
                                <th className="p-5 border-b">Status / Class</th>
                                <th className="p-5 border-b text-center">Fees Status</th>
                             </tr>
                          </thead>
                          <tbody>
                             {students
                               .filter(s => registryFilter === 'All' || (registryFilter === 'Admitted' ? s.status === 'Admitted' : s.status !== 'Admitted'))
                               .map(s => (
                               <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                                  <td className="p-5 font-mono text-gray-400 font-bold">{s.serialId}</td>
                                  <td className="p-5 font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</td>
                                  <td className="p-5">
                                     <p className="font-bold text-blue-600 uppercase">{s.currentClass}</p>
                                     <p className={`text-[8px] font-black uppercase ${s.status === 'Admitted' ? 'text-green-500' : 'text-orange-500'}`}>{s.status}</p>
                                  </td>
                                  <td className="p-5 text-center">
                                     <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${s.isFeesCleared ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {s.isFeesCleared ? 'CLEARED' : 'OWING'}
                                     </span>
                                  </td>
                               </tr>
                             ))}
                             {students.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-gray-300 italic uppercase font-black">No pupils in institutional registry.</td></tr>}
                          </tbody>
                       </table>
                    </div>
                  </div>

                  <div className="space-y-8">
                     <div className="bg-[#0f3460] p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl">
                        <h4 className="text-sm font-black uppercase text-[#cca43b] tracking-widest border-b border-white/10 pb-2">Pupil Data Hub</h4>
                        <p className="text-[10px] font-medium opacity-60 leading-relaxed italic">Bulk manage pupil records via CSV. Critical for institutional migration and end-of-year rollovers.</p>
                        <div className="space-y-3">
                           <button onClick={() => handleExportCSV('pupils')} className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl text-[10px] font-black uppercase transition-all border border-white/10">Export Registry CSV</button>
                           <div className="relative">
                              <input type="file" accept=".csv" ref={pupilImportRef} className="hidden" onChange={e => handleImportCSV(e, 'pupils')} />
                              <button onClick={() => pupilImportRef.current?.click()} className="w-full bg-[#cca43b] text-[#0f3460] py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:scale-[1.02] transition">Bulk Upload Pupils</button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'timetable' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                     <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Subject Intensity Configuration</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Defines morning priority and cognitive load balancing</p>
                     <div className="space-y-2 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {DEPARTMENTS.flatMap(d => getSubjectsForDepartment(d.id)).filter((v, i, a) => a.indexOf(v) === i).map(subj => {
                           const profile = settings.subjectProfiles[subj] || { name: subj, intensity: 'Medium', location: 'In', department: 'General' };
                           return (
                              <div key={subj} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                                 <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-[#0f3460] uppercase">{subj}</span>
                                    <span className="text-[8px] font-bold text-gray-400 uppercase">Profile Settings</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                       <label className="text-[7px] font-black uppercase text-gray-400">Intensity</label>
                                       <select 
                                          className="w-full p-2 bg-white rounded-lg text-[9px] font-black border-none shadow-sm"
                                          value={profile.intensity}
                                          onChange={e => {
                                             const updated = { ...settings.subjectProfiles };
                                             updated[subj] = { ...profile, name: profile.name, intensity: e.target.value as any };
                                             onSettingsChange({ ...settings, subjectProfiles: updated });
                                          }}
                                       >
                                          <option>High</option><option>Medium</option><option>Low</option>
                                       </select>
                                    </div>
                                    <div className="space-y-1">
                                       <label className="text-[7px] font-black uppercase text-gray-400">Location</label>
                                       <select 
                                          className="w-full p-2 bg-white rounded-lg text-[9px] font-black border-none shadow-sm"
                                          value={profile.location}
                                          onChange={e => {
                                             const updated = { ...settings.subjectProfiles };
                                             updated[subj] = { ...profile, name: profile.name, location: e.target.value as any };
                                             onSettingsChange({ ...settings, subjectProfiles: updated });
                                          }}
                                       >
                                          <option>In</option><option>Out</option><option>Both</option>
                                       </select>
                                    </div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl space-y-8">
                     <div className="space-y-2">
                        <span className="text-3xl">🗓️</span>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Scheduling Intelligence Hub</h3>
                        <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest">Global Constraints & Pedagogical Logic</p>
                     </div>
                     <div className="space-y-6 opacity-60">
                        <p className="text-xs font-medium leading-relaxed italic">
                           The UBA synthesis engine respects these configuration profiles when generating weekly grids. High-intensity subjects are prioritized for 08:00 - 11:00 windows.
                        </p>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                           <h4 className="text-[10px] font-black uppercase text-[#cca43b] mb-4 tracking-[0.2em]">Institutional Defaults</h4>
                           <ul className="space-y-3 text-[10px] font-bold list-disc pl-5">
                              <li>Worship: Fixed at Period 0 (08:00 Daily)</li>
                              <li>PLC Meetings: Fixed at Friday Period 4</li>
                              <li>Clubs: Fixed at Friday Period 5</li>
                              <li>Break 1: 10:00 - 10:30</li>
                              <li>Break 2: 12:30 - 13:00</li>
                           </ul>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-[#0f3460] uppercase tracking-tighter">Unified Contact Registry</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Source of Truth for Broadcast Communications</p>
                  </div>
                  <div className="flex gap-4">
                     <input 
                       type="text" 
                       placeholder="Search Name or Phone..." 
                       className="bg-white p-4 rounded-2xl border-none shadow-md text-xs font-bold w-64 outline-none focus:ring-2 focus:ring-[#cca43b]"
                       value={contactSearch}
                       onChange={e => setContactSearch(e.target.value)}
                     />
                     <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg">Export Directory</button>
                  </div>
               </div>

               <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                     <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                        <tr>
                           <th className="p-6 border-b">Recipient Identity</th>
                           <th className="p-6 border-b">Type / Group</th>
                           <th className="p-6 border-b">Mobile (Direct)</th>
                           <th className="p-6 border-b">Email (Portal)</th>
                           <th className="p-6 border-b text-center">Status</th>
                        </tr>
                     </thead>
                     <tbody>
                        {contactRegistry.map(contact => (
                          <tr key={contact.id} className="border-b hover:bg-yellow-50/10 transition group">
                             <td className="p-6">
                                <p className="font-black text-[#0f3460] uppercase text-sm leading-none">{contact.name}</p>
                                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase italic">{contact.role}</p>
                             </td>
                             <td className="p-6">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${contact.type === 'Staff' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                  {contact.type} • {contact.meta}
                                </span>
                             </td>
                             <td className="p-6">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-300">📱</span>
                                  <EditableField 
                                    value={contact.contact} 
                                    onSave={v => handleUpdateContact(contact.id, contact.type as any, 'contact', v)}
                                    className="font-mono font-black text-gray-600 text-xs"
                                  />
                                </div>
                             </td>
                             <td className="p-6">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-300">✉️</span>
                                  <EditableField 
                                    value={contact.email} 
                                    onSave={v => handleUpdateContact(contact.id, contact.type as any, 'email', v)}
                                    className="font-bold text-gray-500 lowercase text-[10px]"
                                  />
                                </div>
                             </td>
                             <td className="p-6 text-center">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="Verified Delivery Point"></span>
                             </td>
                          </tr>
                        ))}
                        {contactRegistry.length === 0 && (
                          <tr><td colSpan={5} className="p-32 text-center text-gray-300 font-black uppercase italic tracking-widest">No matching contacts found in database.</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

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
                          {['Academic Calendar', 'Pupil Management', 'Announcements', 'Payment Point', 'Staff Management', 'Class Time Table', 'Examination', 'Assessment', 'Lesson Assessment Desk'].map(m => (
                            <label key={m} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-white border border-transparent hover:border-[#cca43b] transition cursor-pointer">
                               <span className="text-[10px] font-black text-gray-500 uppercase">{m}</span>
                               <input type="checkbox" className="w-4 h-4 accent-[#0f3460]" checked={settings.modulePermissions[m] !== false} onChange={() => toggleModule(m)} />
                            </label>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                 <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Governance & Security</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Assessment Controls */}
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Assessment Controls</label>
                       <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4 shadow-inner">
                          <div className="flex justify-between items-center">
                             <div className="space-y-1">
                                <p className="text-xs font-black text-[#0f3460] uppercase">Lock SBA Marks Allocation</p>
                                <p className="text-[9px] font-bold text-gray-400 leading-tight">Prevents Subject Facilitators from altering mark weightings</p>
                             </div>
                             <button 
                               onClick={() => onSettingsChange({...settings, sbaMarksLocked: !settings.sbaMarksLocked})}
                               className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all shadow-md ${settings.sbaMarksLocked ? 'bg-red-500 text-white' : 'bg-white text-gray-400'}`}
                             >
                                {settings.sbaMarksLocked ? '🔒' : '🔓'}
                             </button>
                          </div>
                       </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-red-400 uppercase tracking-widest px-1">Danger Zone</label>
                       <div className="p-6 bg-red-50 rounded-3xl border border-red-100 space-y-4 shadow-inner">
                          <div className="flex justify-between items-center">
                             <div className="space-y-1">
                                <p className="text-xs font-black text-red-700 uppercase">System Factory Reset</p>
                                <p className="text-[9px] font-bold text-red-400 leading-tight">Purge all local records and return to baseline configuration</p>
                             </div>
                             <button 
                               onClick={() => {
                                 if(confirm("CRITICAL WARNING: This will permanently delete all pupils, staff, and transaction records. This action cannot be undone. Proceed?")) {
                                   localStorage.clear();
                                   window.location.reload();
                                 }
                               }}
                               className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition"
                             >
                                Reset System
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn">
               <div className="flex flex-col md:flex-row justify-between items-center no-print gap-4">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-[#0f3460] uppercase tracking-tighter">Academic Gantt Matrix</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Institutional Timeline of Major Activities</p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(t => (
                      <button key={t} onClick={() => setSelectedTerm(t as any)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${selectedTerm === t ? 'bg-[#cca43b] text-[#0f3460] shadow-md' : 'bg-gray-100 text-gray-400'}`}>Term {t}</button>
                    ))}
                    <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg ml-4">Execute Master Print</button>
                  </div>
               </div>

               <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 min-h-[600px] overflow-x-auto">
                  <div className="hidden print:block text-center border-b-4 border-double border-[#0f3460] pb-8 mb-10">
                    <h1 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter mb-2">{settings.schoolName}</h1>
                    <p className="text-xs font-bold text-[#cca43b] uppercase tracking-[0.4em]">{settings.motto}</p>
                    <h2 className="mt-8 text-xl font-black uppercase tracking-widest text-[#0f3460]">TERM {selectedTerm} INSTITUTIONAL EVENT TIMELINE (GANTT)</h2>
                  </div>

                  <div className="flex flex-col gap-6 min-w-[1000px]">
                     <div className="flex border-b-2 border-gray-100 pb-4">
                        <div className="w-64 font-black text-[#0f3460] uppercase text-[10px] tracking-widest px-4">Event Group / Weekly Phase</div>
                        <div className="flex-1 grid grid-cols-16 gap-1 px-2">
                           {Array.from({length: 16}).map((_, i) => (
                             <div key={i} className="text-center font-black text-[9px] text-gray-400 border-x border-gray-50 uppercase">W{i+1}</div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'supervisory' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
               <div className="hidden print:block text-center border-b-4 border-double border-[#0f3460] pb-8 mb-10">
                  <h1 className="text-4xl font-black text-[#0f3460] uppercase">{settings.schoolName}</h1>
                  <p className="text-xs font-bold text-[#cca43b] uppercase tracking-[0.4em]">{settings.motto}</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;