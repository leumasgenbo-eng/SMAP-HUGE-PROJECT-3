
import React, { useState, useMemo, useRef } from 'react';
import { FILING_CABINET_STRUCTURE, DEPARTMENTS, getSubjectsForDepartment, CLASS_MAPPING } from '../constants';
import { GlobalSettings, Student, DailyExerciseEntry, LessonPlanAssessment, StaffRecord, SubjectProfile, StaffInvitation, StaffQuery, AcademicCalendarWeek, TaxConfig } from '../types';
import EditableField from './EditableField';
import { calculateWeightedScore } from '../utils';

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
  | 'pupil_registry' 
  | 'timetable' 
  | 'supervisory' 
  | 'finance_auth'
  | 'finance_config'
  | 'system_controls'
  | 'merit_list'
  | 'staff_merit';

const AdminDashboard: React.FC<Props> = ({ section, dept, notify, settings, onSettingsChange, students, onStudentsUpdate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('hr');
  const [contactSearch, setContactSearch] = useState('');
  const [registryClassFilter, setRegistryClassFilter] = useState('All Classes');
  const [authSearch, setAuthSearch] = useState('');
  
  const staffFileRef = useRef<HTMLInputElement>(null);
  const pupilFileRef = useRef<HTMLInputElement>(null);
  const [newFeeCategory, setNewFeeCategory] = useState('');
  
  const allClasses = useMemo(() => Object.values(CLASS_MAPPING).flat(), []);

  const configDomains = [
    { id: 'branding', label: 'Institutional Branding', desc: 'Logos, mottos, and contact particulars' },
    { id: 'hr', label: 'HR & Staffing', desc: 'Personnel directory and role assignments' },
    { id: 'registry', label: 'Pupil Registry', desc: 'Learner master ledger and enrolment data' },
    { id: 'finance', label: 'Financial Ledger', desc: 'Fee categories, class bills, and tax rates' },
    { id: 'grading', label: 'Grading Standards', desc: 'NRT Z-Scores and interprets' },
    { id: 'timeline', label: 'Academic Timeline', desc: 'Calendars and event schedules' },
  ];

  // --- Staff Merit Logic ---
  const staffMeritData = useMemo(() => {
    const teaching: any[] = [];
    const nonTeaching: any[] = [];

    settings.staff.forEach(staff => {
      // 1. Attendance Metrics
      let totalDays = 0;
      let presentDays = 0;
      let lateDays = 0;
      Object.values(settings.staffAttendance || {}).forEach(dayLogs => {
        const log = dayLogs[staff.id];
        if (log) {
          totalDays++;
          if (log.status === 'Present') {
            presentDays++;
            if (log.timeIn > settings.punctualityThreshold) lateDays++;
          }
        }
      });
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      const punctualityRate = presentDays > 0 ? ((presentDays - lateDays) / presentDays) * 100 : 0;

      if (staff.category === 'Teaching') {
        // 2. Teaching Quality (Lesson Assessments)
        const assessments = (settings.lessonAssessments || []).filter(a => a.teacherId === staff.id);
        const avgAuditScore = assessments.length > 0 
          ? assessments.reduce((acc, a) => acc + (a.compositeScore || 0), 0) / assessments.length 
          : 0;

        // 3. Assessment Density (CW + HW)
        // Find subjects assigned to this staff
        const subjects = Object.entries(settings.facilitatorMapping || {})
          .filter(([sub, name]) => name === staff.name)
          .map(([sub]) => sub);
        
        const exercises = (settings.exerciseEntries || []).filter(e => subjects.includes(e.subject));
        const densityScore = exercises.length > 0 ? Math.min(100, (exercises.length / (totalDays || 1)) * 50) : 0;

        // Weighted Index: Attendance (30%) + Quality Audit (40%) + Density (30%)
        const meritIndex = (attendanceRate * 0.3) + (avgAuditScore * 0.4) + (densityScore * 0.3);

        teaching.push({
          id: staff.id,
          name: staff.name,
          role: staff.role,
          dept: staff.department,
          attendance: attendanceRate,
          audit: avgAuditScore,
          density: densityScore,
          total: meritIndex
        });
      } else {
        // Non-Teaching Merit: Attendance (60%) + Punctuality (40%)
        const meritIndex = (attendanceRate * 0.6) + (punctualityRate * 0.4);
        
        nonTeaching.push({
          id: staff.id,
          name: staff.name,
          role: staff.role,
          area: staff.workArea,
          attendance: attendanceRate,
          punctuality: punctualityRate,
          total: meritIndex
        });
      }
    });

    return {
      teaching: teaching.sort((a, b) => b.total - a.total).slice(0, 10),
      nonTeaching: nonTeaching.sort((a, b) => b.total - a.total).slice(0, 10)
    };
  }, [settings.staff, settings.staffAttendance, settings.lessonAssessments, settings.exerciseEntries, settings.facilitatorMapping, settings.punctualityThreshold]);

  // --- Merit List Logic: Select Top 5 Pupils per Class ---
  const meritListData = useMemo(() => {
    return allClasses.map(className => {
      const classStudents = students.filter(s => s.currentClass === className && s.status === 'Admitted');
      let deptId = 'Lower';
      for (const [id, classes] of Object.entries(CLASS_MAPPING)) {
        if (classes.includes(className)) { deptId = id; break; }
      }
      const subjects = getSubjectsForDepartment(deptId);
      const ranked = classStudents.map(s => {
        const totalScore = subjects.reduce((acc, sub) => acc + calculateWeightedScore(s, sub, settings), 0);
        const termAttendance = s.attendance?.[settings.currentTerm] || {};
        const presentCount = Object.values(termAttendance).filter(status => status === 'P').length;
        return {
          id: s.id,
          name: `${s.firstName} ${s.surname}`,
          gender: s.sex,
          enrolmentDate: s.createdAt?.split('T')[0] || 'N/A',
          totalScore,
          attendance: presentCount,
          serial: s.serialId
        };
      }).sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);
      return { className, topPerformers: ranked };
    }).filter(group => group.topPerformers.length > 0);
  }, [students, settings, allClasses]);

  // --- Conformance Monitoring Logic ---
  const facilitatorConformance = useMemo(() => {
    return Object.values(DEPARTMENTS).flatMap(d => {
      const subs = getSubjectsForDepartment(d.id);
      return subs.map(subject => {
        const facilitator = settings.facilitatorMapping[subject] || 'Unassigned';
        const exercises = (settings.exerciseEntries || []).filter(e => e.subject === subject);
        const cwCount = exercises.filter(e => e.type === 'Classwork').length;
        const hwCount = exercises.filter(e => e.type === 'Homework').length;
        const totalExercises = cwCount + hwCount;
        let totalAssignedPeriods = 0;
        allClasses.forEach(cls => { totalAssignedPeriods += (settings.subjectDemands[cls]?.[subject] || 0); });
        const densityRatio = totalAssignedPeriods > 0 ? (totalExercises / totalAssignedPeriods) : 0;
        const isSubmitted = settings.submittedSubjects?.includes(subject) || false;
        return { subject, facilitator, cwCount, hwCount, totalExercises, periods: totalAssignedPeriods, ratio: densityRatio, isSubmitted };
      });
    });
  }, [settings.exerciseEntries, settings.subjectDemands, settings.facilitatorMapping, settings.submittedSubjects, allClasses]);

  // --- Handlers for Disciplinary Flow ---
  const sendOfficeInvitation = (staffName: string, subject: string) => {
    const staff = settings.staff.find(s => s.name === staffName);
    if (!staff) return;
    const newInvite: StaffInvitation = { id: crypto.randomUUID(), staffId: staff.id, staffName: staff.name, dateSent: new Date().toLocaleDateString(), targetDate: 'Next Working Day', subject: `Substandard Assessment Density: ${subject}`, status: 'Pending' };
    onSettingsChange({ ...settings, staffInvitations: [...(settings.staffInvitations || []), newInvite] });
    notify(`Office Invitation dispatched to ${staffName}.`, "info");
  };

  const issueSubstandardQuery = (staffName: string, subject: string, ratio: number) => {
    const staff = settings.staff.find(s => s.name === staffName);
    if (!staff) return;
    const newQuery: StaffQuery = { id: crypto.randomUUID(), staffId: staff.id, staffName: staff.name, dateIssued: new Date().toLocaleDateString(), subject: `Query: Low Assessment Density (${subject})`, violationType: 'Substandard Performance', responseStatus: 'Awaiting', content: `Your current assessment density ratio is ${ratio.toFixed(2)}, which falls below the institutional threshold. Please provide reasons for this deficit.` };
    onSettingsChange({ ...settings, staffQueries: [...(settings.staffQueries || []), newQuery] });
    notify(`Professional Query issued to ${staffName} for substandard performance.`, "error");
  };

  // --- Staff CSV Logic ---
  const handleStaffExport = () => {
    const headers = ["Name", "ID Number", "Category", "Department", "Role", "Contact", "Email", "Gender", "EmploymentType"];
    const rows = settings.staff.map(s => [`"${s.name}"`, `"${s.idNumber}"`, `"${s.category}"`, `"${s.department}"`, `"${s.role}"`, `"${s.contact}"`, `"${s.email}"`, `"${s.gender}"`, `"${s.employmentType}"`]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadCSV(csvContent, "UBA_Staff_Registry.csv");
    notify("Staff Registry Exported", "success");
  };

  const handleStaffImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (settings.globalConfigsLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const newStaff: StaffRecord[] = lines.slice(1).map(line => {
          const p = line.split(',').map(x => x.replace(/"/g, '').trim());
          return { id: crypto.randomUUID(), name: p[0], idNumber: p[1], category: (p[2] as any) || 'Teaching', department: p[3], role: p[4], contact: p[5], email: p[6], gender: (p[7] as any) || 'Male', employmentType: (p[8] as any) || 'Full Time', dob: '', nationality: 'Ghanaian', hometown: '', residentialAddress: '', maritalStatus: 'Single', identificationType: 'Ghana Card', identificationNumber: '', dateOfAppointment: new Date().toISOString().split('T')[0] };
        });
        onSettingsChange({ ...settings, staff: [...settings.staff, ...newStaff] });
        notify(`Successfully imported ${newStaff.length} staff records.`, "success");
      } catch (err) { notify("CSV Parse Error. Check headers.", "error"); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Pupil CSV Logic ---
  const handlePupilExport = () => {
    const headers = ["FirstName", "Surname", "SerialID", "Class", "Gender", "DOB", "Status", "ParentName", "ParentContact"];
    const rows = students.map(s => [`"${s.firstName}"`, `"${s.surname}"`, `"${s.serialId}"`, `"${s.currentClass}"`, `"${s.sex}"`, `"${s.dob}"`, `"${s.status}"`, `"${s.father?.name || ''}"`, `"${s.father?.contact || ''}"`]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadCSV(csvContent, "UBA_Pupil_Registry.csv");
    notify("Pupil Registry Exported", "success");
  };

  const handlePupilImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (settings.globalConfigsLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const newStudents: Student[] = lines.slice(1).map(line => {
          const p = line.split(',').map(x => x.replace(/"/g, '').trim());
          return { id: crypto.randomUUID(), firstName: p[0], surname: p[1], others: '', serialId: p[2] || `UBA-GEN-${Date.now().toString().slice(-4)}`, currentClass: p[3], classApplyingFor: p[3], sex: (p[4] as any) || 'Male', dob: p[5] || '', status: (p[6] as any) || 'Admitted', createdAt: new Date().toISOString(), admissionFeeReceipt: 'BULK', admissionFeeDate: new Date().toISOString().split('T')[0], hasSpecialNeeds: false, livesWith: 'Both Parents', father: { name: p[7] || '', contact: p[8] || '', address: '', occupation: '', education: '', religion: '', isDead: false }, mother: { name: '', contact: '', address: '', occupation: '', education: '', religion: '', isDead: false }, scoreDetails: {}, attendance: {}, lunchRegister: {}, generalRegister: {}, ledger: [], isFeesCleared: true };
        });
        onStudentsUpdate([...students, ...newStudents]);
        notify(`Successfully imported ${newStudents.length} learners.`, "success");
      } catch (err) { notify("CSV Parse Error. Check headers.", "error"); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleAuth = (staffId: string) => {
    if (settings.globalConfigsLocked) return;
    const updatedStaff = settings.staff.map(s => {
      if (s.id === staffId) {
        const newState = !s.authorizedForFinance;
        notify(`${s.name} ${newState ? 'Authorized' : 'De-authorized'} for Secure Access Terminal.`, newState ? 'success' : 'info');
        return { ...s, authorizedForFinance: newState };
      }
      return s;
    });
    onSettingsChange({ ...settings, staff: updatedStaff });
  };

  const handleUpdateTax = (field: keyof TaxConfig, value: any) => {
    if (settings.globalConfigsLocked) return;
    onSettingsChange({ ...settings, financeConfig: { ...settings.financeConfig, taxConfig: { ...settings.financeConfig.taxConfig, [field]: value } } });
    notify("Tax Calibration Updated", "success");
  };

  const handleAddFeeCategory = () => {
    if (settings.globalConfigsLocked) return;
    if (!newFeeCategory.trim()) return;
    if (settings.financeConfig.categories.includes(newFeeCategory.trim())) { notify("Category already exists.", "error"); return; }
    onSettingsChange({ ...settings, financeConfig: { ...settings.financeConfig, categories: [...settings.financeConfig.categories, newFeeCategory.trim()] } });
    setNewFeeCategory('');
    notify("New Fee Category Registered", "success");
  };

  const handleUpdateClassBill = (className: string, category: string, amount: string) => {
      if (settings.globalConfigsLocked) return;
      const val = parseFloat(amount) || 0;
      const updatedBills = { ...(settings.financeConfig.classBills || {}) };
      if (!updatedBills[className]) updatedBills[className] = {};
      updatedBills[className][category] = val;
      onSettingsChange({ ...settings, financeConfig: { ...settings.financeConfig, classBills: updatedBills } });
  };

  const toggleModule = (mod: string) => {
    if (settings.globalConfigsLocked) return;
    const updated = { ...settings.modulePermissions };
    updated[mod] = !updated[mod];
    onSettingsChange({ ...settings, modulePermissions: updated });
    notify(`${mod} visibility toggled.`, 'info');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dynamic Institutional Header */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-50 rounded-[2rem] border-2 border-gray-100 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-inner">
             {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <span className="text-4xl">🏫</span>}
             {!settings.globalConfigsLocked && (
               <div className="absolute inset-0 bg-[#0f3460]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <EditableField value={settings.logo} onSave={v => onSettingsChange({...settings, logo: v})} placeholder="Logo URL" className="text-[10px] text-white bg-transparent border-white" />
               </div>
             )}
          </div>
          <div className="flex flex-col items-start">
            <EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className={`text-5xl font-black text-[#0f3460] uppercase tracking-tighter ${settings.globalConfigsLocked ? 'pointer-events-none' : ''}`} />
            <EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className={`text-[11px] font-black uppercase tracking-[0.4em] text-[#cca43b] ${settings.globalConfigsLocked ? 'pointer-events-none' : ''}`} />
          </div>
        </div>
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-50 w-full max-w-4xl">
          <div className="flex items-center gap-2"><span className="text-[#cca43b] text-[10px]">📍</span><EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} className={settings.globalConfigsLocked ? 'pointer-events-none' : ''} /></div>
          <span>•</span>
          <div className="flex items-center gap-2"><span className="text-[#cca43b] text-[10px]">📞</span><EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} className={settings.globalConfigsLocked ? 'pointer-events-none' : ''} /></div>
          <span>•</span>
          <div className="flex items-center gap-2"><span className="text-[#cca43b] text-[10px]">✉️</span><EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className={`lowercase ${settings.globalConfigsLocked ? 'pointer-events-none' : ''}`} /></div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="bg-[#0f3460] p-8 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b-4 border-[#cca43b] no-print">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Institutional Command Center</h2>
            <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-[0.3em] mt-1">S-MAP Integrated Administration Desk</p>
          </div>
          <div className="flex flex-wrap bg-white/10 p-1.5 rounded-2xl gap-1">
             {(['global', 'hr', 'pupil_registry', 'merit_list', 'staff_merit', 'finance_auth', 'finance_config', 'system_controls'] as AdminTab[]).map(t => (
               <button 
                 key={t} 
                 onClick={() => setActiveTab(t)} 
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
               >
                 {t === 'hr' ? 'HR & Staff' : t === 'merit_list' ? 'Learner Merit' : t === 'staff_merit' ? 'Staff Merit' : t === 'system_controls' ? 'Controls' : t.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 bg-gray-50/50 p-10 min-h-[650px] overflow-y-auto">
          {activeTab === 'staff_merit' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
               <div className="text-center space-y-2 border-b-4 border-double border-[#0f3460] pb-8">
                  <h3 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter">Personnel Excellence Merit List</h3>
                  <div className="flex justify-center gap-6 text-[11px] font-bold text-[#cca43b] uppercase tracking-[0.2em]">
                     <span>Academic Year: {settings.academicYear}</span>
                     <span>•</span>
                     <span>Performance Analysis Cycle</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Teaching Staff Leaderboard */}
                  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                          <h4 className="text-xl font-black text-[#0f3460] uppercase tracking-widest">Teaching Personnel</h4>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Attendance (30%) • Quality Audit (40%) • Density (30%)</p>
                        </div>
                        <span className="bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-[9px] font-black uppercase">Top Performer Analysis</span>
                     </div>
                     <div className="space-y-4">
                        {staffMeritData.teaching.map((s, idx) => (
                           <div key={s.id} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-4 group hover:bg-yellow-50/30 transition">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-blue-50 text-blue-400'}`}>
                                 {idx + 1}
                              </div>
                              <div className="flex-1">
                                 <h5 className="font-black text-[#0f3460] uppercase text-xs">{s.name}</h5>
                                 <p className="text-[8px] font-bold text-gray-400 uppercase">{s.role} • {s.dept}</p>
                                 <div className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="flex flex-col"><span className="text-[7px] text-gray-400 font-black uppercase">Presence</span><div className="h-1 bg-gray-200 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{width: `${s.attendance}%`}}></div></div></div>
                                    <div className="flex flex-col"><span className="text-[7px] text-gray-400 font-black uppercase">Quality</span><div className="h-1 bg-gray-200 rounded-full"><div className="h-full bg-[#cca43b] rounded-full" style={{width: `${s.audit}%`}}></div></div></div>
                                    <div className="flex flex-col"><span className="text-[7px] text-gray-400 font-black uppercase">Density</span><div className="h-1 bg-gray-200 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{width: `${s.density}%`}}></div></div></div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black text-[#0f3460] leading-none">{s.total.toFixed(1)}</p>
                                 <p className="text-[7px] font-black text-[#cca43b] uppercase">Index Score</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Non-Teaching Leaderboard */}
                  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                          <h4 className="text-xl font-black text-[#0f3460] uppercase tracking-widest">Support & Admin</h4>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Attendance Fidelity (60%) • Punctuality (40%)</p>
                        </div>
                        <span className="bg-orange-50 text-orange-700 px-4 py-1 rounded-full text-[9px] font-black uppercase">Professional Integrity</span>
                     </div>
                     <div className="space-y-4">
                        {staffMeritData.nonTeaching.map((s, idx) => (
                           <div key={s.id} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-4 group hover:bg-yellow-50/30 transition">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-blue-50 text-blue-400'}`}>
                                 {idx + 1}
                              </div>
                              <div className="flex-1">
                                 <h5 className="font-black text-[#0f3460] uppercase text-xs">{s.name}</h5>
                                 <p className="text-[8px] font-bold text-gray-400 uppercase">{s.role} • {s.area}</p>
                                 <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="flex flex-col"><span className="text-[7px] text-gray-400 font-black uppercase">Presence Rate</span><div className="h-1 bg-gray-200 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{width: `${s.attendance}%`}}></div></div></div>
                                    <div className="flex flex-col"><span className="text-[7px] text-gray-400 font-black uppercase">Punctuality</span><div className="h-1 bg-gray-200 rounded-full"><div className="h-full bg-orange-400 rounded-full" style={{width: `${s.punctuality}%`}}></div></div></div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black text-[#0f3460] leading-none">{s.total.toFixed(1)}</p>
                                 <p className="text-[7px] font-black text-[#cca43b] uppercase">Rel. Index</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'merit_list' && (
            <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
               <div className="text-center space-y-2 border-b-4 border-double border-[#0f3460] pb-8">
                  <h3 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter">Academic Merit List (Top 5)</h3>
                  <div className="flex justify-center gap-6 text-[11px] font-bold text-[#cca43b] uppercase tracking-[0.2em]">
                     <span>Academic Year: {settings.academicYear}</span>
                     <span>•</span>
                     <span>Term: {settings.currentTerm}</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-12">
                  {meritListData.map(classGroup => (
                    <div key={classGroup.className} className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                       <div className="flex justify-between items-center mb-6">
                          <h4 className="text-xl font-black text-[#0f3460] uppercase tracking-widest">{classGroup.className} - Elite Performers</h4>
                          <span className="bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-[9px] font-black uppercase">Term {settings.currentTerm} Cycle</span>
                       </div>
                       <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-inner">
                          <table className="w-full text-left text-[11px] border-collapse">
                             <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                                <tr>
                                   <th className="p-5 w-16 text-center">Rank</th>
                                   <th className="p-5">Learner Name</th>
                                   <th className="p-5 text-center">Gender</th>
                                   <th className="p-5 text-center">Enrolment Date</th>
                                   <th className="p-5 text-center">Attendance</th>
                                   <th className="p-5 text-center bg-yellow-50">Total Score</th>
                                </tr>
                             </thead>
                             <tbody>
                                {classGroup.topPerformers.map((p, idx) => (
                                   <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                                      <td className="p-5 text-center">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-400 text-white shadow-lg scale-110' : idx === 1 ? 'bg-gray-300 text-white shadow-md' : idx === 2 ? 'bg-orange-300 text-white shadow-md' : 'bg-blue-50 text-blue-400'}`}>
                                            {idx + 1}
                                         </div>
                                      </td>
                                      <td className="p-5">
                                         <p className="font-black text-[#0f3460] uppercase">{p.name}</p>
                                         <p className="text-[9px] font-mono text-gray-400 font-bold">{p.serial}</p>
                                      </td>
                                      <td className="p-5 text-center font-black uppercase text-gray-400">{p.gender}</td>
                                      <td className="p-5 text-center font-mono font-bold text-gray-500">{p.enrolmentDate}</td>
                                      <td className="p-5 text-center">
                                         <div className="flex flex-col items-center">
                                            <span className="font-black text-blue-600">{p.attendance} Days</span>
                                            <span className="text-[7px] text-gray-300 font-black uppercase">Term Presence</span>
                                         </div>
                                      </td>
                                      <td className="p-5 text-center bg-yellow-50/30">
                                         <span className="text-xl font-black text-[#cca43b]">{p.totalScore}</span>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'global' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
               {settings.globalConfigsLocked && (
                 <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-700 text-[10px] font-black uppercase text-center">
                   🔒 Configurations are currently locked. Visit System Controls to unlock.
                 </div>
               )}

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                     <div className="border-b pb-4">
                        <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Institutional Identity</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Logo, Name, and Slogan</p>
                     </div>
                     <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-gray-400 uppercase px-1">Institutional Logo (URL)</span>
                          <EditableField value={settings.logo} onSave={v => onSettingsChange({...settings, logo: v})} className={`font-mono text-xs text-blue-500 bg-gray-50 p-4 rounded-2xl ${settings.globalConfigsLocked ? 'pointer-events-none opacity-50' : ''}`} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-gray-400 uppercase px-1">School Name</span>
                          <EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className={`font-black text-[#0f3460] text-sm uppercase bg-gray-50 p-4 rounded-2xl ${settings.globalConfigsLocked ? 'pointer-events-none opacity-50' : ''}`} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-gray-400 uppercase px-1">Motto / Slogan</span>
                          <EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className={`font-bold text-[#cca43b] text-xs uppercase bg-gray-50 p-4 rounded-2xl ${settings.globalConfigsLocked ? 'pointer-events-none opacity-50' : ''}`} />
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                     <div className="border-b pb-4">
                        <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Contact Registry</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Communication channels & Location</p>
                     </div>
                     <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-gray-400 uppercase px-1">Official Email</span>
                          <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className={`font-bold text-[#0f3460] text-xs bg-gray-50 p-4 rounded-2xl ${settings.globalConfigsLocked ? 'pointer-events-none opacity-50' : ''}`} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-gray-400 uppercase px-1">Telephone Contacts</span>
                          <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} className={`font-bold text-[#0f3460] text-xs bg-gray-50 p-4 rounded-2xl ${settings.globalConfigsLocked ? 'pointer-events-none opacity-50' : ''}`} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-gray-400 uppercase px-1">Postal / Physical Address</span>
                          <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} className={`font-bold text-[#0f3460] text-xs bg-gray-50 p-4 rounded-2xl ${settings.globalConfigsLocked ? 'pointer-events-none opacity-50' : ''}`} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'system_controls' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                     <div className="border-b pb-4">
                        <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Assessment Safeguards</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Protect Academic Integrity Ratios</p>
                     </div>
                     <label className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${settings.sbaMarksLocked ? 'bg-red-50 border-red-500' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="space-y-1">
                           <span className="text-sm font-black uppercase text-[#0f3460]">Lock SBA Marks Allocation</span>
                           <p className="text-[9px] font-bold text-gray-400 italic">Prevents Subject Facilitators from altering mark weightings.</p>
                        </div>
                        <input type="checkbox" className="w-8 h-8 accent-red-600" checked={settings.sbaMarksLocked} onChange={e => onSettingsChange({ ...settings, sbaMarksLocked: e.target.checked })} />
                     </label>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                     <div className="border-b pb-4">
                        <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Master Security</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">System-Wide Configuration Lockdown</p>
                     </div>
                     <label className={`flex items-center justify-between p-6 rounded-[2rem] border-4 transition-all cursor-pointer ${settings.globalConfigsLocked ? 'bg-black border-red-600' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="space-y-1">
                           <span className={`text-sm font-black uppercase ${settings.globalConfigsLocked ? 'text-white' : 'text-[#0f3460]'}`}>Global Configuration Lock</span>
                           <p className="text-[9px] font-bold text-gray-400 italic">Restricts all modifications to institutional settings.</p>
                        </div>
                        <input type="checkbox" className="w-10 h-10 accent-red-600" checked={settings.globalConfigsLocked} onChange={e => onSettingsChange({ ...settings, globalConfigsLocked: e.target.checked })} />
                     </label>
                  </div>
               </div>

               {/* Facilitator Conformance Monitor */}
               <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 space-y-8">
                  <div className="border-b pb-4 flex justify-between items-end">
                    <div>
                      <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Facilitator Conformance Monitor</h3>
                      <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Assessment Density Index: (CW + HW) / Periods Assigned</p>
                    </div>
                    <div className="bg-[#f4f6f7] px-6 py-2 rounded-xl text-[9px] font-black uppercase text-gray-400">Target Ratio: &gt; 1.00</div>
                  </div>

                  <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-[#0f3460] text-white font-black uppercase">
                        <tr>
                          <th className="p-5">Subject Area</th>
                          <th className="p-5">Facilitator</th>
                          <th className="p-5 text-center">Density Index</th>
                          <th className="p-5 text-center">Marks Status</th>
                          <th className="p-5 text-center">Intervention Desk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facilitatorConformance.map((con, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50 transition">
                            <td className="p-5 font-black uppercase text-[#0f3460]">{con.subject}</td>
                            <td className="p-5 font-bold text-gray-500">{con.facilitator}</td>
                            <td className="p-5 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`text-lg font-black ${con.ratio < 0.5 ? 'text-red-600' : 'text-green-600'}`}>{con.ratio.toFixed(2)}</span>
                                <span className="text-[7px] text-gray-400 uppercase font-black">{con.totalExercises} Exer / {con.periods} Per.</span>
                              </div>
                            </td>
                            <td className="p-5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${con.isSubmitted ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700 animate-pulse'}`}>
                                {con.isSubmitted ? 'SUBMITTED' : 'PENDING'}
                              </span>
                            </td>
                            <td className="p-5 text-center">
                               <div className="flex justify-center gap-2">
                                  <button onClick={() => sendOfficeInvitation(con.facilitator, con.subject)} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase hover:bg-blue-600 hover:text-white transition">Invite Office</button>
                                  <button onClick={() => issueSubstandardQuery(con.facilitator, con.subject, con.ratio)} className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase hover:bg-red-600 hover:text-white transition">Issue Query</button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'hr' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
               <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-lg border border-gray-100">
                  <div><h3 className="text-2xl font-black text-[#0f3460] uppercase">Staff Registry Management</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Personnel Ledger: {settings.staff.length} Members</p></div>
                  <div className="flex gap-4"><input type="file" ref={staffFileRef} onChange={handleStaffImport} className="hidden" accept=".csv" /><button disabled={settings.globalConfigsLocked} onClick={() => staffFileRef.current?.click()} className={`bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-sm flex items-center gap-2 ${settings.globalConfigsLocked ? 'opacity-30' : ''}`}><span>⬆️</span> Bulk Upload Staff</button><button onClick={handleStaffExport} className="bg-[#0f3460] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center gap-2"><span>⬇️</span> Download CSV</button></div>
               </div>
               <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-inner bg-white"><table className="w-full text-left text-[11px] border-collapse"><thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase"><tr><th className="p-5">Name / ID</th><th className="p-5">Category</th><th className="p-5">Dept / Work Area</th><th className="p-5">Contact</th><th className="p-5">Basis</th><th className="p-5 text-center">Status</th></tr></thead><tbody>{settings.staff.map(s => (<tr key={s.id} className="border-b hover:bg-gray-50 transition"><td className="p-5"><p className="font-black text-[#0f3460] uppercase">{s.name}</p><p className="text-[9px] font-bold text-[#cca43b]">{s.idNumber}</p></td><td className="p-5 font-bold uppercase text-gray-400">{s.category}</td><td className="p-5 font-black uppercase text-gray-600">{s.category === 'Teaching' ? s.department : s.workArea}</td><td className="p-5 font-mono text-blue-600">{s.contact}</td><td className="p-5 font-bold text-xs">{s.employmentType}</td><td className="p-5 text-center"><span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase">ACTIVE</span></td></tr>))}</tbody></table></div>
            </div>
          )}

          {activeTab === 'pupil_registry' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
               <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-lg border border-gray-100 gap-6">
                  <div><h3 className="text-2xl font-black text-[#0f3460] uppercase">Learner Master Registry</h3><div className="flex gap-4 mt-1 items-center"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Enrolment: {students.length}</p><select className="p-2 bg-gray-50 border-none rounded-xl text-[9px] font-black uppercase shadow-inner" value={registryClassFilter} onChange={e => setRegistryClassFilter(e.target.value)}><option>All Classes</option>{allClasses.map(c => <option key={c}>{c}</option>)}</select></div></div>
                  <div className="flex gap-4"><input type="file" ref={pupilFileRef} onChange={handlePupilImport} className="hidden" accept=".csv" /><button disabled={settings.globalConfigsLocked} onClick={() => pupilFileRef.current?.click()} className={`bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-sm flex items-center gap-2 ${settings.globalConfigsLocked ? 'opacity-30' : ''}`}><span>⬆️</span> Bulk Upload Pupils</button><button onClick={handlePupilExport} className="bg-[#cca43b] text-[#0f3460] px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center gap-2"><span>⬇️</span> Download CSV</button></div>
               </div>
               <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-inner bg-white"><table className="w-full text-left text-[11px] border-collapse"><thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase"><tr><th className="p-5">Learner Name</th><th className="p-5">Serial ID</th><th className="p-5">Class</th><th className="p-5">Gender</th><th className="p-5">Parent Contact</th><th className="p-5 text-center">Status</th></tr></thead><tbody>{students.filter(s => registryClassFilter === 'All Classes' || s.currentClass === registryClassFilter).map(s => (<tr key={s.id} className="border-b hover:bg-gray-50 transition"><td className="p-5 font-black text-[#0f3460] uppercase">{s.firstName} {s.surname}</td><td className="p-5 font-mono text-blue-600 font-bold">{s.serialId}</td><td className="p-5 font-black uppercase text-gray-600">{s.currentClass}</td><td className="p-5 font-bold uppercase text-gray-400">{s.sex}</td><td className="p-5 font-mono text-gray-500">{s.father?.contact || s.mother?.contact || 'N/A'}</td><td className="p-5 text-center"><span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${s.status === 'Admitted' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>{s.status}</span></td></tr>))}</tbody></table></div>
            </div>
          )}

          {activeTab === 'finance_auth' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
               {settings.globalConfigsLocked && <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-700 text-[10px] font-black uppercase text-center">🔒 Access terminal authorizations are currently locked.</div>}
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-center border-b pb-6 gap-6">
                    <div><h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Person Authorization Matrix</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Secure Access for Financial Staff</p></div>
                    <div className="relative w-full md:w-80"><input type="text" placeholder="Search Staff by Name/ID..." className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-xs shadow-inner outline-none focus:ring-2 focus:ring-[#cca43b]" value={authSearch} onChange={e => setAuthSearch(e.target.value)} /><span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">🔍</span></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {settings.staff.filter(s => s.name.toLowerCase().includes(authSearch.toLowerCase()) || s.idNumber.includes(authSearch)).map(s => (
                        <div key={s.id} className={`bg-white p-6 rounded-[2.5rem] border-4 transition-all shadow-sm flex flex-col justify-between group ${s.authorizedForFinance ? 'border-green-500 shadow-green-100' : 'border-transparent hover:border-gray-100'}`}>
                           <div className="flex justify-between items-start mb-4"><div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition shadow-inner"><span className="text-2xl">👤</span></div><div className="text-right"><span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${s.authorizedForFinance ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>{s.authorizedForFinance ? 'AUTHORIZED' : 'STANDARD'}</span><p className="text-[9px] font-mono text-gray-400 mt-1">{s.idNumber}</p></div></div>
                           <div className="mb-6"><h4 className="font-black text-[#0f3460] uppercase text-sm leading-tight">{s.name}</h4><p className="text-[9px] font-bold text-[#cca43b] uppercase mt-1">{s.role} • {s.category}</p></div>
                           <button disabled={settings.globalConfigsLocked} onClick={() => handleToggleAuth(s.id)} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${settings.globalConfigsLocked ? 'opacity-30 cursor-not-allowed' : ''} ${s.authorizedForFinance ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-[#0f3460] text-white hover:bg-[#cca43b] hover:text-[#0f3460] shadow-lg'}`}>{s.authorizedForFinance ? 'Revoke Finance Access' : 'Authorize Terminal Access'}</button>
                        </div>
                      ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'finance_config' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
               {settings.globalConfigsLocked && <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-700 text-[10px] font-black uppercase text-center">🔒 Financial configuration is currently locked.</div>}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                     <div className="border-b pb-4"><h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Statutory Tax Calibration</h3></div>
                     <div className="space-y-6"><label className={`flex items-center justify-between p-4 rounded-2xl transition ${settings.globalConfigsLocked ? 'bg-gray-100' : 'bg-gray-50 cursor-pointer hover:bg-[#cca43b]/10'}`}><span className="text-xs font-black uppercase text-[#0f3460]">Enable Statutory Taxing</span><input type="checkbox" disabled={settings.globalConfigsLocked} className="w-6 h-6 accent-[#0f3460]" checked={settings.financeConfig.taxConfig.isTaxEnabled} onChange={e => handleUpdateTax('isTaxEnabled', e.target.checked)} /></label><div className="grid grid-cols-2 gap-6">{[{ id: 'vatRate', label: 'VAT Rate (%)', color: 'text-blue-600' }, { id: 'nhilRate', label: 'NHIL Rate (%)', color: 'text-orange-600' }, { id: 'getLevyRate', label: 'GET Levy (%)', color: 'text-purple-600' }, { id: 'covidLevyRate', label: 'Covid Levy (%)', color: 'text-red-600' }].map(tax => (<div key={tax.id} className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 px-2">{tax.label}</label><input type="number" step="0.1" disabled={settings.globalConfigsLocked || !settings.financeConfig.taxConfig.isTaxEnabled} className={`w-full p-4 bg-gray-50 rounded-2xl border-none font-black ${tax.color} shadow-inner disabled:opacity-30`} value={(settings.financeConfig.taxConfig as any)[tax.id]} onChange={e => handleUpdateTax(tax.id as any, parseFloat(e.target.value))} /></div>))}</div></div>
                  </div>
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                     <div className="border-b pb-4"><h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Institutional Fee Categories</h3></div>
                     <div className="space-y-4"><div className="flex gap-2"><input disabled={settings.globalConfigsLocked} placeholder="New Category (e.g. Bus Fee)" className="flex-1 p-4 bg-gray-50 rounded-2xl border-none font-bold text-xs shadow-inner outline-none disabled:opacity-30" value={newFeeCategory} onChange={e => setNewFeeCategory(e.target.value)} /><button disabled={settings.globalConfigsLocked} onClick={handleAddFeeCategory} className={`bg-[#0f3460] text-white px-6 py-2 rounded-2xl font-black uppercase text-[10px] shadow-lg ${settings.globalConfigsLocked ? 'opacity-30' : ''}`}>Append</button></div></div>
                  </div>
               </div>
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8"><div className="flex justify-between items-center border-b pb-4"><h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Class-Specific Billable Ledger</h3></div><div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-inner bg-gray-50/30"><table className="w-full text-left text-[11px] border-collapse"><thead className="bg-[#0f3460] text-white font-black uppercase sticky top-0 z-20"><tr><th className="p-6 border-b w-48 bg-[#0f3460]">Academic Class</th>{settings.financeConfig.categories.map(cat => <th key={cat} className="p-4 border-b border-x border-white/10 text-center min-w-[120px]">{cat} (GH₵)</th>)}</tr></thead><tbody>{allClasses.map(cls => (<tr key={cls} className="border-b bg-white hover:bg-yellow-50/50 transition"><td className="p-6 font-black uppercase text-[#0f3460] border-r bg-gray-50/10">{cls}</td>{settings.financeConfig.categories.map(cat => (<td key={cat} className="p-4 border-x border-gray-50"><input disabled={settings.globalConfigsLocked} type="number" placeholder="0.00" className="w-full p-3 rounded-xl bg-gray-50/50 border-2 border-transparent font-black text-center text-[#0f3460] transition-all outline-none disabled:opacity-30" value={settings.financeConfig.classBills[cls]?.[cat] || ''} onChange={e => handleUpdateClassBill(cls, cat, e.target.value)} /></td>))}</tr>))}</tbody></table></div></div>
            </div>
          )}
          
          {['calendar', 'contacts', 'timetable', 'supervisory'].includes(activeTab) && (
              <div className="p-20 text-center flex flex-col items-center justify-center space-y-6">
                <span className="text-8xl opacity-10">⚙️</span>
                <p className="text-gray-300 font-black uppercase text-xl italic tracking-widest leading-relaxed max-w-lg">Panel "{activeTab.replace('_', ' ')}" calibrated with institutional triggers.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
