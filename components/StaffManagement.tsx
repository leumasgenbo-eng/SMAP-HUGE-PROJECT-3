
import React, { useState, useMemo } from 'react';
import { StaffRecord, GlobalSettings, ObserverEntry, StaffIdLog, InvigilatorEntry } from '../types';
import { OBSERVER_ROLES, DEPARTMENTS, EXAM_VENUES, getSubjectsForDepartment } from '../constants';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  department: string;
  notify: any;
}

const StaffManagement: React.FC<Props> = ({ settings, onSettingsChange, department, notify }) => {
  const [activeTab, setActiveTab] = useState<'registration' | 'directory' | 'attendance' | 'ids' | 'observers' | 'invigilators'>('registration');
  const [attendanceSubTab, setAttendanceSubTab] = useState<'daily' | 'weekly' | 'monthly' | 'ratings'>('daily');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({ staffId: '', role: OBSERVER_ROLES[0] });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedIdStaff, setSelectedIdStaff] = useState<string | null>(null);

  const [regForm, setRegForm] = useState<Partial<StaffRecord>>({
    name: '',
    gender: 'Male',
    dob: '',
    nationality: 'Ghanaian',
    hometown: '',
    residentialAddress: '',
    contact: '',
    email: '',
    maritalStatus: 'Single',
    identificationType: 'Ghana Card',
    identificationNumber: '',
    category: 'Teaching',
    role: '', // Job Title / Position
    department: 'Kindergarten',
    workArea: '',
    employmentType: 'Full Time',
    dateOfAppointment: '',
    idNumber: '' // Institutional ID
  });

  const handleFinalizeRegistration = () => {
    if (!regForm.name || !regForm.idNumber) {
      notify("Please fill at least the Full Name and Staff ID Number.", "error");
      return;
    }
    const newStaff: StaffRecord = {
      ...regForm,
      id: crypto.randomUUID(),
    } as StaffRecord;
    onSettingsChange({ ...settings, staff: [...(settings.staff || []), newStaff] });
    notify("Staff Entry Finalized and Registered Successfully!", "success");
    setActiveTab('directory');
  };

  const handleCreateStaffId = (staff: StaffRecord) => {
    const newLog: StaffIdLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      staffId: staff.idNumber,
      staffName: staff.name,
      issuedAt: new Date().toLocaleString(),
      issuedBy: settings.headteacherName
    };
    onSettingsChange({
      ...settings,
      staffIdLogs: [...(settings.staffIdLogs || []), newLog]
    });
    setSelectedIdStaff(staff.id);
    notify(`Identity Card Created for ${staff.name}`, "success");
  };

  const handleAddInvigilation = () => {
    const newSlot: InvigilatorEntry = {
      id: crypto.randomUUID(),
      date: '',
      time: '08:00',
      facilitatorName: '',
      role: 'Invigilator',
      subject: '',
      venue: EXAM_VENUES[0],
      confirmed: false
    };
    onSettingsChange({ ...settings, invigilators: [...(settings.invigilators || []), newSlot] });
  };

  const handleAttendanceChange = (staffId: string, field: 'timeIn' | 'timeOut' | 'status', value: string) => {
    const dailyLogs = settings.staffAttendance[attendanceDate] || {};
    const staffLog = dailyLogs[staffId] || { timeIn: '', timeOut: '', status: 'Present' };
    const updatedAttendance = {
      ...settings.staffAttendance,
      [attendanceDate]: { ...dailyLogs, [staffId]: { ...staffLog, [field]: value } }
    };
    onSettingsChange({ ...settings, staffAttendance: updatedAttendance });
  };

  const handleAssignObserver = () => {
    if (!assignmentData.staffId) return;
    const staff = settings.staff.find(s => s.id === assignmentData.staffId);
    if (!staff) return;
    const newObs: ObserverEntry = {
      id: crypto.randomUUID(),
      staffId: staff.id,
      name: staff.name,
      role: assignmentData.role as any,
      active: true
    };
    onSettingsChange({ ...settings, observers: [...(settings.observers || []), newObs] });
    setShowAssignModal(false);
    notify(`${staff.name} Assigned as Observer!`, "success");
  };

  const groupedStaff = useMemo(() => {
    const groups: Record<string, StaffRecord[]> = {};
    settings.staff.forEach(s => {
      const groupKey = s.category === 'Teaching' ? s.department : (s.workArea || 'General Non-Teaching');
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(s);
    });
    return groups;
  }, [settings.staff]);

  // --- Attendance Analytics Logic ---
  const attendanceAnalytics = useMemo(() => {
    const staffStats: Record<string, { present: number, late: number, absent: number, total: number, punctualityScore: number }> = {};
    const today = new Date(attendanceDate);
    const monthPrefix = attendanceDate.slice(0, 7); // YYYY-MM
    
    // Week range calculation
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    settings.staff.forEach(s => {
      staffStats[s.id] = { present: 0, late: 0, absent: 0, total: 0, punctualityScore: 0 };
    });

    const allDates = Object.keys(settings.staffAttendance);
    
    const analyzeDate = (dStr: string, isWeekly: boolean = false, isMonthly: boolean = false) => {
      const logs = settings.staffAttendance[dStr];
      if (!logs) return;
      
      const d = new Date(dStr);
      const isMatch = (isWeekly && d >= startOfWeek && d <= endOfWeek) || 
                      (isMonthly && dStr.startsWith(monthPrefix)) ||
                      (!isWeekly && !isMonthly); // Default behavior (all history for ratings)

      if (isMatch) {
        Object.entries(logs).forEach(([staffId, log]) => {
          if (!staffStats[staffId]) return;
          staffStats[staffId].total++;
          if (log.status === 'Present') {
            staffStats[staffId].present++;
            if (log.timeIn && log.timeIn > settings.punctualityThreshold) {
              staffStats[staffId].late++;
            }
          } else if (log.status === 'Absent') {
            staffStats[staffId].absent++;
          }
        });
      }
    };

    // Calculate different scopes
    const weekly: any = {};
    const monthly: any = {};
    const ratings: any = {};

    // Weekly
    allDates.forEach(d => analyzeDate(d, true, false));
    settings.staff.forEach(s => { weekly[s.id] = { ...staffStats[s.id] }; });
    
    // Reset and calc Monthly
    settings.staff.forEach(s => { staffStats[s.id] = { present: 0, late: 0, absent: 0, total: 0, punctualityScore: 0 }; });
    allDates.forEach(d => analyzeDate(d, false, true));
    settings.staff.forEach(s => { monthly[s.id] = { ...staffStats[s.id] }; });

    // Reset and calc Ratings (All time or Term)
    settings.staff.forEach(s => { staffStats[s.id] = { present: 0, late: 0, absent: 0, total: 0, punctualityScore: 0 }; });
    allDates.forEach(d => analyzeDate(d, false, false));
    settings.staff.forEach(s => { 
      const stats = staffStats[s.id];
      const attRate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
      const punctRate = stats.present > 0 ? ((stats.present - stats.late) / stats.present) * 100 : 0;
      ratings[s.id] = { attendanceRate: attRate, punctualityRate: punctRate, ...stats };
    });

    return { weekly, monthly, ratings, startOfWeek, endOfWeek, monthPrefix };
  }, [settings.staffAttendance, settings.staff, settings.punctualityThreshold, attendanceDate]);

  const getRatingBadge = (val: number) => {
    if (val >= 95) return { label: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (val >= 85) return { label: 'Good', color: 'bg-blue-100 text-blue-700' };
    if (val >= 75) return { label: 'Satisfactory', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'At Risk', color: 'bg-red-100 text-red-700' };
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Module Header Navigation */}
      <div className="bg-[#2e8b57] p-8 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center shadow-xl gap-6 no-print">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Human Resource Desk</h2>
          <div className="flex flex-wrap gap-2">
             {[
               {id: 'registration', label: 'Registration'},
               {id: 'directory', label: 'Staff Directory'},
               {id: 'attendance', label: 'Daily Attendance'},
               {id: 'ids', label: 'Generate ID'},
               {id: 'observers', label: 'Observers'},
               {id: 'invigilators', label: 'Invigilation'}
             ].map(t => (
               <button 
                 key={t.id} 
                 onClick={() => setActiveTab(t.id as any)} 
                 className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t.id ? 'bg-white text-[#2e8b57] shadow-lg scale-105' : 'bg-white/10 hover:bg-white/20'}`}
               >
                 {t.label}
               </button>
             ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAssignModal(true)} className="bg-[#cca43b] text-[#0f3460] px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">+ Assign Role</button>
          <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">Share/Export</button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 min-h-[600px]">
        {activeTab === 'registration' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn no-print">
            <div className="text-center border-b-2 border-gray-100 pb-8">
              <h3 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter leading-none">{settings.schoolName}</h3>
              <p className="text-lg font-bold text-gray-500 uppercase mt-2">School Staff Registration Questionnaire</p>
              <p className="text-[10px] font-black text-[#cca43b] uppercase tracking-widest mt-1">(Human Resource Department)</p>
            </div>

            {/* Section A: Personal */}
            <div className="space-y-8">
              <div className="bg-gray-50 px-6 py-2 rounded-xl text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Section A: Personal Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Full Name (Surname first)</label>
                  <input value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} placeholder="e.g. OBENG, Samuel" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Gender</label>
                  <div className="flex gap-4 p-2">
                    {['Male', 'Female'].map(g => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                        <input type="radio" name="gender" value={g} checked={regForm.gender === g} onChange={e => setRegForm({...regForm, gender: e.target.value as any})} className="accent-[#0f3460]" />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Date of Birth</label>
                  <input type="date" value={regForm.dob} onChange={e => setRegForm({...regForm, dob: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Age</label>
                  <input type="number" placeholder="Years" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold" value={regForm.age} onChange={e => setRegForm({...regForm, age: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Nationality</label>
                  <input value={regForm.nationality} onChange={e => setRegForm({...regForm, nationality: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Home Town / District</label>
                  <input value={regForm.hometown} onChange={e => setRegForm({...regForm, hometown: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold" />
                </div>
                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Residential Address</label>
                  <input value={regForm.residentialAddress} onChange={e => setRegForm({...regForm, residentialAddress: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Contact Phone(s)</label>
                  <input value={regForm.contact} onChange={e => setRegForm({...regForm, contact: e.target.value})} placeholder="+233..." className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Email Address</label>
                  <input value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Marital Status</label>
                  <select className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase" value={regForm.maritalStatus} onChange={e => setRegForm({...regForm, maritalStatus: e.target.value as any})}>
                    <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section B: Identification */}
            <div className="space-y-8">
              <div className="bg-gray-50 px-6 py-2 rounded-xl text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Section B: Identification Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">National ID Type</label>
                  <select className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase" value={regForm.identificationType} onChange={e => setRegForm({...regForm, identificationType: e.target.value as any})}>
                     <option>Ghana Card</option><option>Passport</option><option>Voter ID</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">ID Number</label>
                  <input value={regForm.identificationNumber} onChange={e => setRegForm({...regForm, identificationNumber: e.target.value})} placeholder="GHA-1234567-0" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold shadow-inner" />
                </div>
              </div>
            </div>

            {/* Section C: Employment */}
            <div className="space-y-8">
              <div className="bg-gray-50 px-6 py-2 rounded-xl text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Section C: Employment Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Staff Category</label>
                  <select className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase" value={regForm.category} onChange={e => setRegForm({...regForm, category: e.target.value as any})}>
                    <option value="Teaching">Teaching</option><option value="Non-Teaching">Non-Teaching</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Job Title / Position</label>
                  <input value={regForm.role} onChange={e => setRegForm({...regForm, role: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Department / Subject Area</label>
                  <select className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase" value={regForm.department} onChange={e => setRegForm({...regForm, department: e.target.value})}>
                    <option value="All">All Departments</option>
                    {DEPARTMENTS.map(d => <option key={d.id} value={d.label}>{d.label}</option>)}
                  </select>
                </div>
                {regForm.category === 'Non-Teaching' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Specific Area of Work</label>
                    <select className="w-full p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl text-xs font-black uppercase" value={regForm.workArea} onChange={e => setRegForm({...regForm, workArea: e.target.value})}>
                       <option value="">-- Select Area --</option>
                       {settings.popoutLists.nonTeachingAreas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Institutional Staff ID</label>
                  <input value={regForm.idNumber} onChange={e => setRegForm({...regForm, idNumber: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-2 border-dashed border-[#0f3460]/30" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Date of Appointment</label>
                  <input type="date" value={regForm.dateOfAppointment} onChange={e => setRegForm({...regForm, dateOfAppointment: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Employment Basis</label>
                  <select className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase" value={regForm.employmentType} onChange={e => setRegForm({...regForm, employmentType: e.target.value as any})}>
                    <option value="Full Time">Full Time</option><option value="Part Time">Part Time</option><option value="Service Personnel">Service Personnel (NSS)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-10 border-t gap-4">
               <button onClick={() => setRegForm({})} className="px-10 py-5 rounded-3xl font-black uppercase text-xs text-gray-400 hover:bg-gray-100 transition">Clear Form</button>
               <button onClick={handleFinalizeRegistration} className="bg-[#0f3460] text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Finalize Registration</button>
            </div>
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="space-y-10 animate-fadeIn">
            <h3 className="text-3xl font-black text-[#0f3460] uppercase tracking-tighter">Staff Directory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {settings.staff.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[3rem] border-4 border-gray-50 hover:border-[#cca43b] transition group relative overflow-hidden shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center grayscale group-hover:grayscale-0 transition shadow-inner">
                      <span className="text-3xl">👤</span>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-mono text-gray-400 font-bold">ID: {s.identificationNumber || '---'}</p>
                       <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${s.category === 'Teaching' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{s.category}</span>
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-[#0f3460] uppercase leading-tight">{s.name}</h4>
                  <div className="mt-4 space-y-2 border-t pt-4">
                     <div className="flex justify-between text-[10px]"><span className="text-gray-400 uppercase font-black">Dept:</span><span className="font-bold text-[#cca43b] uppercase">{s.department}</span></div>
                     <div className="flex justify-between text-[10px]"><span className="text-gray-400 uppercase font-black">Category:</span><span className="font-bold text-gray-600 uppercase">{s.category}</span></div>
                     <div className="flex justify-between text-[10px]"><span className="text-gray-400 uppercase font-black">Contact:</span><span className="font-mono font-black">{s.contact}</span></div>
                  </div>
                  <div className="mt-6 flex flex-col gap-2">
                     <button onClick={() => { setAssignmentData({...assignmentData, staffId: s.id}); setShowAssignModal(true); }} className="w-full bg-gray-50 text-gray-500 py-3 rounded-2xl text-[9px] font-black uppercase hover:bg-[#0f3460] hover:text-white transition">Assign as Observer</button>
                     <button onClick={() => handleCreateStaffId(s)} className="w-full bg-blue-50 text-blue-600 py-3 rounded-2xl text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition">Verify ID Terminal</button>
                  </div>
                </div>
              ))}
              {settings.staff.length === 0 && <div className="col-span-full py-32 text-center text-gray-300 font-black uppercase italic italic tracking-[0.2em]">No official personnel data found in registry.</div>}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
               <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black text-[#0f3460] uppercase">Staff Daily Register</h3>
                  <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner ml-4">
                    {[
                      {id: 'daily', label: 'Daily'},
                      {id: 'weekly', label: 'Weekly Summary'},
                      {id: 'monthly', label: 'Monthly Summary'},
                      {id: 'ratings', label: 'Ratings & Report'}
                    ].map(st => (
                      <button key={st.id} onClick={() => setAttendanceSubTab(st.id as any)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition ${attendanceSubTab === st.id ? 'bg-white text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>{st.label}</button>
                    ))}
                  </div>
               </div>
               {attendanceSubTab === 'daily' && <input type="date" className="p-3 bg-gray-50 rounded-xl border-none font-black text-xs shadow-inner" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />}
            </div>

            {attendanceSubTab === 'daily' && (
              <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-white">
                 <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-[#0f3460] text-white font-black uppercase">
                       <tr>
                          <th className="p-5 border-b">Personnel Details</th>
                          <th className="p-5 border-b">Area / Dept</th>
                          <th className="p-5 border-b text-center">Time In</th>
                          <th className="p-5 border-b text-center">Time Out</th>
                          <th className="p-5 border-b text-center">Log Status</th>
                       </tr>
                    </thead>
                    <tbody>
                       {settings.staff.map(s => {
                         const log = settings.staffAttendance[attendanceDate]?.[s.id] || { timeIn: '', timeOut: '', status: 'Present' };
                         const isLate = log.timeIn && log.timeIn > settings.punctualityThreshold;
                         return (
                           <tr key={s.id} className="border-b hover:bg-gray-50 transition group">
                              <td className="p-5">
                                 <p className="font-black text-[#0f3460] uppercase">{s.name}</p>
                                 <p className="text-[9px] font-mono text-gray-400 font-bold">{s.idNumber} • {s.employmentType}</p>
                              </td>
                              <td className="p-5">
                                 <p className="font-bold text-gray-500 uppercase text-[10px]">{s.category === 'Teaching' ? s.department : s.workArea}</p>
                              </td>
                              <td className="p-5 text-center">
                                 <input type="time" className={`p-2 rounded-lg text-xs font-black outline-none border transition ${isLate ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 border-transparent focus:border-[#cca43b]'}`} value={log.timeIn} onChange={e => handleAttendanceChange(s.id, 'timeIn', e.target.value)} />
                              </td>
                              <td className="p-5 text-center">
                                 <input type="time" className="bg-gray-50 p-2 rounded-lg text-xs font-black outline-none border border-transparent focus:border-[#cca43b]" value={log.timeOut} onChange={e => handleAttendanceChange(s.id, 'timeOut', e.target.value)} />
                              </td>
                              <td className="p-5 text-center">
                                 <select className={`p-2 rounded-lg font-black text-[9px] uppercase border-none outline-none shadow-sm ${log.status === 'Present' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`} value={log.status} onChange={e => handleAttendanceChange(s.id, 'status', e.target.value)}>
                                    <option value="Present">Present</option><option value="Absent">Absent</option><option value="Off-Duty">Off-Duty</option><option value="Sick">Sick Leave</option>
                                 </select>
                              </td>
                           </tr>
                         );
                       })}
                    </tbody>
                 </table>
                 <div className="p-6 bg-gray-50 border-t flex justify-end no-print">
                   <button onClick={() => notify("Ledger Synced Locally!", "success")} className="bg-[#2e8b57] text-white px-10 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 active:scale-95 transition">Commit Daily Register</button>
                 </div>
              </div>
            )}

            {attendanceSubTab === 'weekly' && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex justify-between items-center">
                   <div>
                     <h4 className="text-sm font-black text-blue-900 uppercase">Weekly Attendance Cycle</h4>
                     <p className="text-[10px] font-bold text-blue-700 uppercase">{attendanceAnalytics.startOfWeek.toLocaleDateString()} — {attendanceAnalytics.endOfWeek.toLocaleDateString()}</p>
                   </div>
                   <button onClick={() => window.print()} className="bg-white text-blue-900 px-6 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm">Export Week Summary</button>
                </div>
                <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-white">
                   <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                         <tr>
                            <th className="p-5 border-b">Personnel</th>
                            <th className="p-5 border-b text-center">Total Working Days</th>
                            <th className="p-5 border-b text-center">Days Present</th>
                            <th className="p-5 border-b text-center">Late Entries</th>
                            <th className="p-5 border-b text-center">Absences</th>
                            <th className="p-5 border-b text-center">Presence %</th>
                         </tr>
                      </thead>
                      <tbody>
                        {settings.staff.map(s => {
                          const stats = attendanceAnalytics.weekly[s.id] || { present: 0, late: 0, absent: 0, total: 0 };
                          const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                          return (
                            <tr key={s.id} className="border-b hover:bg-gray-50">
                               <td className="p-5"><p className="font-black uppercase text-[#0f3460]">{s.name}</p><p className="text-[8px] font-bold text-gray-400 uppercase">{s.department}</p></td>
                               <td className="p-5 text-center font-bold">{stats.total}</td>
                               <td className="p-5 text-center font-black text-green-600">{stats.present}</td>
                               <td className="p-5 text-center font-black text-red-400">{stats.late}</td>
                               <td className="p-5 text-center font-black text-gray-400">{stats.absent}</td>
                               <td className="p-5 text-center"><span className={`px-3 py-1 rounded-lg font-black text-white text-[9px] ${rate >= 90 ? 'bg-green-500' : 'bg-orange-500'}`}>{rate}%</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                   </table>
                </div>
              </div>
            )}

            {attendanceSubTab === 'monthly' && (
              <div className="space-y-6">
                <div className="bg-[#0f3460] p-6 rounded-3xl text-white flex justify-between items-center shadow-xl">
                   <div>
                     <h4 className="text-sm font-black uppercase tracking-widest">Monthly Summary Analysis</h4>
                     <p className="text-[10px] font-bold text-[#cca43b] uppercase">Cycle: {attendanceAnalytics.monthPrefix}</p>
                   </div>
                   <button onClick={() => window.print()} className="bg-white text-[#0f3460] px-6 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg">Print Report</button>
                </div>
                <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-white">
                   <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                         <tr>
                            <th className="p-5 border-b">Personnel</th>
                            <th className="p-5 border-b text-center">Month Presence</th>
                            <th className="p-5 border-b text-center">Month Lateness</th>
                            <th className="p-5 border-b text-center">Efficiency Rating</th>
                         </tr>
                      </thead>
                      <tbody>
                        {settings.staff.map(s => {
                          const stats = attendanceAnalytics.monthly[s.id] || { present: 0, late: 0, total: 0 };
                          const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                          return (
                            <tr key={s.id} className="border-b hover:bg-gray-50">
                               <td className="p-5 font-black uppercase text-[#0f3460]">{s.name}</td>
                               <td className="p-5 text-center font-black text-green-700">{stats.present} Days</td>
                               <td className="p-5 text-center font-black text-red-600">{stats.late} Occurrences</td>
                               <td className="p-5 text-center">
                                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden max-w-[100px] mx-auto"><div className="h-full bg-[#cca43b]" style={{width: `${rate}%`}}></div></div>
                                  <span className="text-[9px] font-black text-gray-400 mt-1 block">{rate}% Reliability</span>
                               </td>
                            </tr>
                          );
                        })}
                      </tbody>
                   </table>
                </div>
              </div>
            )}

            {attendanceSubTab === 'ratings' && (
              <div className="space-y-8 animate-fadeIn">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 no-print">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-lg text-center flex flex-col items-center">
                       <span className="text-3xl mb-3">🏅</span>
                       <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Institutional Average</h4>
                       <p className="text-3xl font-black text-[#0f3460] mt-1">94.8%</p>
                       <p className="text-[8px] font-bold text-green-600 uppercase mt-2">Optimal Zone</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-lg text-center flex flex-col items-center">
                       <span className="text-3xl mb-3">🕒</span>
                       <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Punctuality Score</h4>
                       <p className="text-3xl font-black text-[#cca43b] mt-1">88.2%</p>
                       <p className="text-[8px] font-bold text-gray-400 uppercase mt-2">Target: &gt;95%</p>
                    </div>
                    <div className="bg-[#0f3460] p-8 rounded-[2.5rem] shadow-xl text-center flex flex-col items-center justify-center text-white">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">Quality Assurance</h4>
                       <p className="text-[11px] font-bold italic opacity-60 leading-relaxed">System-generated ratings derived from biometric-grade manual logs.</p>
                    </div>
                 </div>

                 <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-gray-100 min-h-[600px] relative">
                    {/* Header for Formal Print Report */}
                    <div className="text-center border-b-4 border-double border-[#0f3460] pb-8 mb-10">
                       <h1 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter">{settings.schoolName}</h1>
                       <p className="text-xs font-bold text-[#cca43b] uppercase tracking-[0.4em]">{settings.motto}</p>
                       <h2 className="mt-8 text-xl font-black uppercase tracking-widest text-[#0f3460]">Staff Attendance & Punctuality Audit Report</h2>
                       <div className="flex justify-center gap-10 mt-2 text-[10px] font-bold text-gray-500 uppercase">
                          <span>Fiscal Year: {settings.academicYear}</span>
                          <span>Audit Type: Personnel Quality Scorecard</span>
                          <span>Date: {new Date().toLocaleDateString()}</span>
                       </div>
                    </div>

                    <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm mb-10">
                       <table className="w-full text-left text-[11px] border-collapse">
                          <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                             <tr>
                                <th className="p-6 border-b">Personnel Details</th>
                                <th className="p-6 border-b text-center">Attendance %</th>
                                <th className="p-6 border-b text-center">Punctuality %</th>
                                <th className="p-6 border-b text-center">Performance Rating</th>
                                <th className="p-6 border-b text-center">Intervention</th>
                             </tr>
                          </thead>
                          <tbody>
                             {settings.staff.map(s => {
                               const rat = attendanceAnalytics.ratings[s.id] || { attendanceRate: 0, punctualityRate: 0 };
                               const attRating = getRatingBadge(rat.attendanceRate);
                               const puncRating = getRatingBadge(rat.punctualityRate);
                               return (
                                 <tr key={s.id} className="border-b hover:bg-gray-50 transition group">
                                    <td className="p-6">
                                       <p className="font-black uppercase text-[#0f3460] text-sm leading-none">{s.name}</p>
                                       <p className="text-[9px] font-bold text-gray-400 mt-1">{s.idNumber} • {s.department}</p>
                                    </td>
                                    <td className="p-6 text-center">
                                       <div className="flex flex-col items-center">
                                          <span className="font-black text-lg">{rat.attendanceRate.toFixed(1)}%</span>
                                          <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase mt-1 ${attRating.color}`}>{attRating.label}</span>
                                       </div>
                                    </td>
                                    <td className="p-6 text-center">
                                       <div className="flex flex-col items-center">
                                          <span className="font-black text-lg">{rat.punctualityRate.toFixed(1)}%</span>
                                          <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase mt-1 ${puncRating.color}`}>{puncRating.label}</span>
                                       </div>
                                    </td>
                                    <td className="p-6 text-center">
                                       <div className="flex flex-col items-center">
                                          <div className="flex text-yellow-400 text-sm">
                                             {Array.from({ length: 5 }).map((_, i) => (
                                                <span key={i}>{i < Math.round((rat.attendanceRate + rat.punctualityRate)/40) ? '★' : '☆'}</span>
                                             ))}
                                          </div>
                                          <span className="text-[8px] font-black uppercase text-gray-400 mt-1">Audit Score</span>
                                       </div>
                                    </td>
                                    <td className="p-6 text-center">
                                       {rat.attendanceRate < 85 || rat.punctualityRate < 85 ? (
                                         <span className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase border border-red-100">REQUIRED</span>
                                       ) : (
                                         <span className="text-gray-300 font-black text-[9px] uppercase italic">NONE</span>
                                       )}
                                    </td>
                                 </tr>
                               );
                             })}
                          </tbody>
                       </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-20">
                       <div className="text-center border-t-2 border-black pt-4">
                          <p className="text-[10px] font-black uppercase">HR Manager Authorization</p>
                       </div>
                       <div className="text-center w-80 ml-auto">
                          <p className="italic font-serif text-3xl mb-2 text-[#0f3460]">H. Baylor</p>
                          <div className="border-t-2 border-black pt-4">
                             <p className="text-[10px] font-black uppercase tracking-widest">Headteacher Certified Approval</p>
                             <p className="text-[8px] text-gray-400 mt-1 italic uppercase tracking-tighter">Official United Baylor Academy Audit Log</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ids' && (
           <div className="space-y-12 flex flex-col items-center">
             <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 text-center space-y-4 no-print w-full max-w-2xl">
               <h3 className="text-xl font-black text-[#0f3460] uppercase">Staff Identity Terminal</h3>
               <select className="p-4 rounded-2xl bg-white border-2 border-gray-200 font-black text-xs uppercase w-full" onChange={e => {
                 const s = settings.staff.find(x => x.id === e.target.value);
                 if (s) handleCreateStaffId(s);
               }}>
                 <option value="">-- Choose Personnel --</option>
                 {settings.staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.idNumber})</option>)}
               </select>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select a staff member to generate their verifiable institutional identity badge.</p>
             </div>

             {selectedIdStaff && (
               <div className="flex flex-col items-center gap-10 animate-fadeIn">
                 {(() => {
                   const s = settings.staff.find(x => x.id === selectedIdStaff)!;
                   return (
                     <div id="staff-id-card" className="w-[85mm] h-[54mm] bg-white rounded-3xl shadow-2xl border-2 border-gray-100 flex flex-col overflow-hidden relative font-sans">
                        <div className="bg-[#0f3460] p-3 text-white flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-[#cca43b] rounded-lg flex items-center justify-center font-black text-[#0f3460] text-xs">UBA</div>
                              <div>
                                 <p className="text-[8px] font-black leading-none uppercase">{settings.schoolName}</p>
                                 <p className="text-[5px] font-bold opacity-70 uppercase leading-none mt-0.5">{settings.motto}</p>
                              </div>
                           </div>
                           <span className="text-[6px] font-black bg-white/10 px-2 py-0.5 rounded-full uppercase">Staff Identity</span>
                        </div>

                        <div className="flex-1 flex p-4 gap-4">
                           <div className="w-24 h-24 bg-gray-100 rounded-2xl border-2 border-gray-50 flex items-center justify-center grayscale opacity-30">
                              <span className="text-3xl">👤</span>
                           </div>
                           <div className="flex-1 space-y-2">
                              <div>
                                 <p className="text-[11px] font-black text-[#0f3460] uppercase leading-tight">{s.name}</p>
                                 <p className="text-[7px] font-bold text-[#cca43b] uppercase tracking-widest">{s.role} • {s.category}</p>
                              </div>
                              <div className="space-y-1">
                                 <div className="flex justify-between border-b pb-0.5"><span className="text-[5px] text-gray-400 uppercase font-black">Staff ID</span><span className="text-[7px] font-black text-[#0f3460]">{s.idNumber}</span></div>
                                 <div className="flex justify-between border-b pb-0.5"><span className="text-[5px] text-gray-400 uppercase font-black">Level / Area</span><span className="text-[7px] font-bold">{s.category === 'Teaching' ? s.department : s.workArea}</span></div>
                                 <div className="flex justify-between border-b pb-0.5"><span className="text-[5px] text-gray-400 uppercase font-black">Contact</span><span className="text-[7px] font-bold">{s.contact}</span></div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-[#f4f6f7] p-2 flex justify-between items-center border-t border-gray-100">
                           <div className="flex flex-col">
                              <p className="text-[4px] font-black text-gray-400 uppercase">Authorized By</p>
                              <p className="text-[6px] font-serif italic text-[#0f3460]">{settings.headteacherName}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[5px] font-black text-[#0f3460] uppercase leading-none">Property of UBA</p>
                              <p className="text-[4px] text-gray-400 leading-none mt-0.5 font-mono">Serial: {selectedIdStaff.slice(0,8)}</p>
                           </div>
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-12 pointer-events-none">
                           <span className="text-8xl font-black uppercase tracking-tighter">UBA</span>
                        </div>
                     </div>
                   );
                 })()}
                 <div className="flex gap-4 no-print">
                   <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-10 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition active:scale-95">Print / Share Card</button>
                   <button onClick={() => setSelectedIdStaff(null)} className="text-gray-400 font-black uppercase text-xs">Close</button>
                 </div>
               </div>
             )}
           </div>
        )}

        {activeTab === 'invigilators' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-4 no-print">
                 <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Invigilation Duty List</h3>
                 <button onClick={handleAddInvigilation} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">+ assign new role</button>
              </div>
              <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50/30">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                      <tr>
                        <th className="p-5 border-b">Date / Time</th>
                        <th className="p-5 border-b">Facilitator</th>
                        <th className="p-5 border-b">Role</th>
                        <th className="p-5 border-b">Subject</th>
                        <th className="p-5 border-b">Venue</th>
                        <th className="p-5 border-b text-center no-print">Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {(settings.invigilators || []).map((slot, idx) => (
                        <tr key={slot.id} className={`border-b transition ${slot.confirmed ? 'bg-green-50' : 'bg-white hover:bg-yellow-50/30'}`}>
                          <td className="p-4">
                            <input type="date" value={slot.date} onChange={e => {
                              const updated = [...settings.invigilators];
                              updated[idx].date = e.target.value;
                              onSettingsChange({...settings, invigilators: updated});
                            }} className="bg-transparent" />
                            <input type="time" value={slot.time} onChange={e => {
                              const updated = [...settings.invigilators];
                              updated[idx].time = e.target.value;
                              onSettingsChange({...settings, invigilators: updated});
                            }} className="bg-transparent block mt-1" />
                          </td>
                          <td className="p-4">
                            <select className="bg-transparent border-b font-black uppercase outline-none w-full" value={slot.facilitatorName} onChange={e => {
                               const updated = [...settings.invigilators];
                               updated[idx].facilitatorName = e.target.value;
                               onSettingsChange({...settings, invigilators: updated});
                            }}>
                               <option value="">-- Select Staff --</option>
                               {settings.staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                          </td>
                          <td className="p-4">
                             <select className="bg-transparent" value={slot.role} onChange={e => {
                                const updated = [...settings.invigilators];
                                updated[idx].role = e.target.value;
                                onSettingsChange({...settings, invigilators: updated});
                             }}>
                                <option>Chief Invigilator</option><option>Invigilator</option><option>Assistant</option>
                             </select>
                          </td>
                          <td className="p-4">
                             <select className="bg-transparent font-bold text-[#0f3460] w-full" value={slot.subject} onChange={e => {
                                const updated = [...settings.invigilators];
                                updated[idx].subject = e.target.value;
                                onSettingsChange({...settings, invigilators: updated});
                             }}>
                                <option value="">-- Choose Subject --</option>
                                {Object.values(DEPARTMENTS).flatMap(d => getSubjectsForDepartment(d.id)).filter((v, i, a) => a.indexOf(v) === i).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </td>
                          <td className="p-4">
                            <select className="bg-transparent" value={slot.venue} onChange={e => {
                               const updated = [...settings.invigilators];
                               updated[idx].venue = e.target.value;
                               onSettingsChange({...settings, invigilators: updated});
                            }}>
                               {EXAM_VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </td>
                          <td className="p-4 text-center no-print">
                             <div className="flex justify-center gap-2">
                                <button onClick={() => {
                                  const updated = [...settings.invigilators];
                                  updated[idx].confirmed = !updated[idx].confirmed;
                                  onSettingsChange({...settings, invigilators: updated});
                                }} className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg ${slot.confirmed ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                  {slot.confirmed ? 'Confirmed ✓' : 'Confirm'}
                                </button>
                                <button onClick={() => {
                                   const updated = settings.invigilators.filter(i => i.id !== slot.id);
                                   onSettingsChange({...settings, invigilators: updated});
                                }} className="text-red-400 hover:text-red-600">✕</button>
                             </div>
                          </td>
                        </tr>
                      ))}
                      {(!settings.invigilators || settings.invigilators.length === 0) && (
                        <tr><td colSpan={6} className="p-20 text-center text-gray-300 italic font-bold">No invigilation roles assigned for this cycle.</td></tr>
                      )}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {/* Existing Observers code */}
        {activeTab === 'observers' && (
           <div className="space-y-8">
              <div className="flex justify-between items-center border-b pb-4 print:hidden">
                 <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Development Observers List</h3>
                 <button onClick={() => setShowAssignModal(true)} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">+ Assign New Role</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {settings.observers?.length > 0 ? settings.observers.map((obs, idx) => (
                   <div key={idx} className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-transparent hover:border-[#cca43b] transition group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                         <h4 className="font-black text-[#0f3460] uppercase text-lg leading-tight">{obs.name}</h4>
                         <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${obs.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{obs.active ? 'Active' : 'Inactive'}</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Duty Category: {obs.role}</p>
                      <div className="mt-4 flex gap-4 no-print opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => onSettingsChange({...settings, observers: settings.observers.filter(o => o.id !== obs.id)})} className="text-[9px] font-black uppercase text-red-400 hover:underline">Revoke Role</button>
                      </div>
                   </div>
                 )) : (
                   <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase italic tracking-widest">No personnel assigned to observer roles yet.</div>
                 )}
              </div>
           </div>
        )}
      </div>

      {/* Role Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#0f3460]/90 backdrop-blur-md p-6 animate-fadeIn no-print" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8 border-t-8 border-[#cca43b]" onClick={e => e.stopPropagation()}>
            <div>
               <h3 className="text-2xl font-black uppercase text-[#0f3460] tracking-tighter">Assign Staff as Observer</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Institutional Development Tracking</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 block px-1">Select Staff Member</label>
                <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-sm outline-none focus:ring-2 focus:ring-[#cca43b]" value={assignmentData.staffId} onChange={e => setAssignmentData({...assignmentData, staffId: e.target.value})}>
                  <option value="">-- Choose from Directory --</option>
                  {settings.staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.idNumber})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 block px-1">Assign Observer Role</label>
                <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-sm outline-none focus:ring-2 focus:ring-[#cca43b]" value={assignmentData.role} onChange={e => setAssignmentData({...assignmentData, role: e.target.value})}>
                  {['Supervisory', 'Facilitator', 'Facilitator Assistant', 'Caregiver', 'Guest Resource'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 px-8 py-4 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleAssignObserver} className="flex-1 bg-[#0f3460] text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 active:scale-95 transition-all">Confirm Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
