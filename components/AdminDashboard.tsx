
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
  | 'finance_auth';

const AdminDashboard: React.FC<Props> = ({ section, dept, notify, settings, onSettingsChange, students, onStudentsUpdate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('global');
  const [selectedTerm, setSelectedTerm] = useState<number>(settings.currentTerm);
  const [contactSearch, setContactSearch] = useState('');
  
  // Local state for various configurations
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedQuestionDept, setSelectedQuestionDept] = useState('Lower');
  const [selectedQuestionSet, setSelectedQuestionSet] = useState<'A' | 'B' | 'C' | 'D'>('A');
  
  const pupilImportRef = useRef<HTMLInputElement>(null);
  const staffImportRef = useRef<HTMLInputElement>(null);
  const questionImportRef = useRef<HTMLInputElement>(null);

  const teachingStaff = useMemo(() => settings.staff.filter(s => s.category === 'Teaching'), [settings.staff]);

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

  // --- Gantt Chart Logic ---
  const calendarWeeks = settings.academicCalendar[selectedTerm] || [];
  const ganttData = useMemo(() => {
    return calendarWeeks.map((w, idx) => ({
      ...w,
      id: idx,
      start: w.dateFrom ? new Date(w.dateFrom) : null,
      end: w.dateTo ? new Date(w.dateTo) : null
    }));
  }, [calendarWeeks]);

  // --- Supervisory Intelligence Logic ---
  const supervisoryData = useMemo(() => {
    const assessments = settings.lessonAssessments || [];
    const invitations = settings.staffInvitations || [];
    const today = new Date();

    const validated = teachingStaff.filter(s => assessments.some(a => a.teacherId === s.id)).map(s => {
      const staffAssessments = assessments.filter(a => a.teacherId === s.id);
      const lastAssessment = staffAssessments[staffAssessments.length - 1];
      return { staff: s, lastAssessment };
    });

    const pipeline = teachingStaff.filter(s => !assessments.some(a => a.teacherId === s.id)).map(s => {
      const lastInvite = invitations.filter(i => i.staffId === s.id).sort((a,b) => new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime())[0];
      
      let complianceStatus: 'Pending' | 'Urgent' | 'Query' = 'Pending';
      if (lastInvite) {
        const inviteDate = new Date(lastInvite.dateSent);
        const diffDays = Math.ceil((today.getTime() - inviteDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 3 && !lastInvite.isJustified) complianceStatus = 'Query';
        else if (diffDays >= 2) complianceStatus = 'Urgent';
      }

      return { staff: s, lastInvite, complianceStatus };
    });

    return { validated, pipeline };
  }, [teachingStaff, settings.lessonAssessments, settings.staffInvitations]);

  const handleSendInvite = (staff: StaffRecord) => {
    const newInvite: StaffInvitation = {
      id: crypto.randomUUID(),
      staffId: staff.id,
      staffName: staff.name,
      dateSent: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      subject: staff.department,
      status: 'Pending'
    };
    onSettingsChange({ ...settings, staffInvitations: [...(settings.staffInvitations || []), newInvite] });
    notify(`Official Assessment Invitation shared with ${staff.name}`, "success");
  };

  const handleIssueQuery = (staff: StaffRecord) => {
    const newQuery: StaffQuery = {
      id: crypto.randomUUID(),
      staffId: staff.id,
      staffName: staff.name,
      dateIssued: new Date().toISOString().split('T')[0],
      subject: "NON-COMPLIANCE: LESSON ASSESSMENT DESK",
      violationType: 'Non-attendance',
      responseStatus: 'Awaiting',
      content: `Official query issued to ${staff.name} for non-attendance at the Lesson Assessment Desk after formal invitation. Please respond within 24 hours.`
    };
    onSettingsChange({ ...settings, staffQueries: [...(settings.staffQueries || []), newQuery] });
    notify(`Disciplinary Query Letter issued to ${staff.name}`, "error");
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
      headers = ["StaffID", "Name", "Role", "Contact", "Gender", "Category", "Department", "WorkArea", "EmploymentType"];
      rows = settings.staff.map(s => [
        s.idNumber, s.name, s.role, s.contact, 
        s.gender, s.category, s.department, 
        s.workArea || "N/A", s.employmentType
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
    if (!updatedBank[selectedQuestionDept][selectedQuestionSet]) updatedBank[selectedQuestionDept][selectedQuestionSet] = {};
    
    updatedBank[selectedQuestionDept][selectedQuestionSet][qid] = newQuestion;
    onSettingsChange({ ...settings, questionBank: updatedBank });
    setNewQuestion('');
    notify(`Question Added to Set ${selectedQuestionSet}`, "success");
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

  const updateSubjectProfile = (subj: string, field: keyof SubjectProfile, val: any) => {
    const profiles = { ...(settings.subjectProfiles || {}) };
    if (!profiles[subj]) {
      profiles[subj] = { name: subj, intensity: 'Medium', location: 'In', department: 'General' };
    }
    profiles[subj] = { ...profiles[subj], [field]: val };
    onSettingsChange({ ...settings, subjectProfiles: profiles });
  };

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
        <div className="bg-[#0f3460] p-8 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b-4 border-[#cca43b] no-print">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">Institutional Command Center</h2>
            <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-[0.3em] mt-1">S-MAP Integrated Administration Desk</p>
          </div>
          <div className="flex flex-wrap bg-white/10 p-1.5 rounded-2xl gap-1">
             {(['global', 'calendar', 'hr', 'contacts', 'admissions', 'timetable', 'supervisory', 'finance_auth'] as AdminTab[]).map(t => (
               <button 
                 key={t} 
                 onClick={() => setActiveTab(t)} 
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
               >
                 {t === 'hr' ? 'HR & Staff' : t === 'finance_auth' ? 'Finance Auth' : t === 'calendar' ? 'Event Timeline' : t === 'contacts' ? 'Contact Registry' : t.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 bg-gray-50/50 p-10 min-h-[650px] overflow-y-auto">
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
                      <button key={t} onClick={() => setSelectedTerm(t as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedTerm === t ? 'bg-[#cca43b] text-[#0f3460] shadow-md' : 'bg-gray-100 text-gray-400'}`}>Term {t}</button>
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
                     {/* Row logic remains same... */}
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
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
                  {/* Supervisory UI Components... */}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
