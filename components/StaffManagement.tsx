
import React, { useState } from 'react';
import { StaffRecord, GlobalSettings, InvigilatorSlot, ObserverEntry, InvigilatorEntry } from '../types';
import { EXAM_VENUES, OBSERVER_ROLES, getSubjectsForDepartment, DEPARTMENTS } from '../constants';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  department: string;
  notify: any;
}

const StaffManagement: React.FC<Props> = ({ settings, onSettingsChange, department, notify }) => {
  const [activeTab, setActiveTab] = useState<'registration' | 'directory' | 'observers' | 'invigilators'>('registration');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [assignmentData, setAssignmentData] = useState({ staffId: '', role: OBSERVER_ROLES[0] });

  // Local form state for Registration
  const [regForm, setRegForm] = useState({
    name: '',
    contact: '',
    department: DEPARTMENTS[0].label,
    category: 'Teaching',
    idNumber: ''
  });

  const subjects = getSubjectsForDepartment(department);

  const handleFinalizeRegistration = () => {
    if (!regForm.name) {
      notify("Please enter staff name.", "error");
      return;
    }
    const newStaff: StaffRecord = {
      ...regForm,
      id: crypto.randomUUID(),
      role: 'Staff'
    };
    onSettingsChange({ ...settings, staff: [...(settings.staff || []), newStaff] });
    notify("Staff Record Created and Saved to Directory!", "success");
    setActiveTab('directory');
  };

  const handleAddInvigilator = () => {
    const defaultStaff = settings.staff && settings.staff.length > 0 ? settings.staff[0].name : 'Unassigned';
    const newSlot: InvigilatorEntry = {
      id: crypto.randomUUID(),
      date: '',
      time: '',
      facilitatorName: defaultStaff,
      role: 'Invigilator',
      subject: subjects[0],
      venue: EXAM_VENUES[0],
      confirmed: false
    };
    onSettingsChange({ ...settings, invigilators: [...settings.invigilators, newSlot] });
  };

  const handleInvite = (idx: number) => {
    const slot = settings.invigilators[idx];
    notify(`Invitation shared with ${slot.facilitatorName}!`, "success");
  };

  const toggleConfirm = (idx: number) => {
    const updated = [...settings.invigilators];
    updated[idx].confirmed = !updated[idx].confirmed;
    onSettingsChange({ ...settings, invigilators: updated });
    notify(`Invigilation status updated.`, "success");
  };

  const handleAssignObserver = () => {
    const staffMember = settings.staff.find(s => s.id === assignmentData.staffId);
    if (!staffMember) {
      notify("Select a staff member first.", "error");
      return;
    }
    const newObserver: ObserverEntry = {
      id: crypto.randomUUID(),
      staffId: staffMember.id,
      name: staffMember.name,
      role: assignmentData.role as any,
      active: true
    };
    onSettingsChange({ ...settings, observers: [...settings.observers, newObserver] });
    setShowAssignModal(false);
    notify(`${staffMember.name} assigned as ${assignmentData.role}`, "success");
  };

  const handleSharePDF = () => {
    window.print();
    setShowExportMenu(false);
  };

  const handleCopyData = () => {
    let copyText = `${settings.schoolName} - ${activeTab.toUpperCase()} LIST\n`;
    
    if (activeTab === 'directory') {
      copyText += `ID\tName\tDepartment\tCategory\tContact\n`;
      settings.staff.forEach(s => {
        copyText += `${s.idNumber || 'N/A'}\t${s.name}\t${s.department}\t${s.category}\t${s.contact}\n`;
      });
    } else if (activeTab === 'observers') {
      copyText += `Name\tRole\tStatus\n`;
      settings.observers.forEach(o => {
        copyText += `${o.name}\t${o.role}\t${o.active ? 'Active' : 'Inactive'}\n`;
      });
    } else if (activeTab === 'invigilators') {
      copyText += `Date\tTime\tName\tRole\tSubject\tVenue\tConfirmed\n`;
      settings.invigilators.forEach(i => {
        copyText += `${i.date}\t${i.time}\t${i.facilitatorName}\t${i.role}\t${i.subject}\t${i.venue}\t${i.confirmed ? 'Yes' : 'No'}\n`;
      });
    }

    navigator.clipboard.writeText(copyText);
    notify(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} data copied to clipboard!`, "success");
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      <div className="bg-[#2e8b57] p-8 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center shadow-xl gap-4 no-print">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Human Resource Desk</h2>
          <div className="flex flex-wrap gap-2 mt-4">
             {[
               {id: 'registration', label: 'Registration'},
               {id: 'directory', label: 'Staff Directory'},
               {id: 'observers', label: 'Observers Registry'},
               {id: 'invigilators', label: 'Invigilation Duty'}
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
        <div className="flex gap-3 relative">
          {activeTab !== 'registration' && (
            <>
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)} 
                className="bg-white text-[#2e8b57] px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition flex items-center gap-2"
              >
                Share / Export <span>▼</span>
              </button>
              {showExportMenu && (
                <div className="absolute top-full mt-2 right-0 w-56 bg-white rounded-2xl shadow-2xl z-[300] border border-gray-100 overflow-hidden flex flex-col p-2">
                  <button onClick={handleSharePDF} className="w-full text-left p-4 hover:bg-blue-50 rounded-xl transition flex flex-col">
                    <span className="text-xs font-black text-[#0f3460] uppercase">Share as PDF</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">Print to Document</span>
                  </button>
                  <button onClick={handleCopyData} className="w-full text-left p-4 hover:bg-yellow-50 rounded-xl transition flex flex-col">
                    <span className="text-xs font-black text-[#cca43b] uppercase">Copy to Clipboard</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">For Word / Excel</span>
                  </button>
                </div>
              )}
            </>
          )}
          {activeTab === 'registration' && (
            <button onClick={() => window.print()} className="bg-white text-[#2e8b57] px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">Print Vacant Form</button>
          )}
          {activeTab === 'observers' && (
            <button onClick={() => setShowAssignModal(true)} className="bg-white text-[#2e8b57] px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">+ Assign Role from Staff</button>
          )}
          {activeTab === 'invigilators' && (
            <button onClick={handleAddInvigilator} className="bg-white text-[#2e8b57] px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">+ Add Invigilator</button>
          )}
        </div>
      </div>

      <div id="hr-desk-content" className="bg-white p-6 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 min-h-[600px]">
        {/* Print Header */}
        <div className="hidden print:block text-center border-b-4 border-double border-[#0f3460] pb-8 mb-10">
          <EditableField value={settings.schoolName} onSave={(v) => onSettingsChange({...settings, schoolName: v})} className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter mb-2" />
          <h2 className="text-xl font-bold text-[#cca43b] uppercase tracking-widest">{activeTab.toUpperCase()} REPORT</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Institutional Resource Audit • {new Date().toLocaleDateString()}</p>
        </div>

        {activeTab === 'registration' && (
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Form Header */}
            <div className="text-center border-b-4 border-double border-[#0f3460] pb-8 print:hidden">
              <EditableField value={settings.schoolName} onSave={(v) => onSettingsChange({...settings, schoolName: v})} className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter mb-2" />
              <h2 className="text-xl font-bold text-[#cca43b] uppercase tracking-widest">School Staff Registration Questionnaire</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase mt-2">(Human Resource Department)</p>
            </div>

            {/* Section A */}
            <div className="space-y-6">
              <h3 className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest">Section A: Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                  <label className="text-[9px] font-black uppercase text-gray-400 block px-1">Full Name (Surname first)</label>
                  <input value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} placeholder="e.g. DOE, John Kwesi" className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-[#cca43b] transition-all shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Gender</label>
                  <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" name="gender" className="accent-[#0f3460]" /> Male</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" name="gender" className="accent-[#0f3460]" /> Female</label>
                  </div>
                </div>
                <InputGroup label="Date of Birth" type="date" />
                <InputGroup label="Age" type="number" />
                <InputGroup label="Nationality" />
                <InputGroup label="Home Town / District" />
                <InputGroup label="Residential Address" fullWidth />
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 block px-1">Contact Phone(s)</label>
                  <input value={regForm.contact} onChange={e => setRegForm({...regForm, contact: e.target.value})} placeholder="+233..." className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-[#cca43b] transition-all shadow-inner" />
                </div>
                <InputGroup label="Email Address" type="email" />
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Marital Status</label>
                  <select className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none border-none">
                    <option>Single</option><option>Married</option><option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section B */}
            <div className="space-y-6">
              <h3 className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest">Section B: Identification Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">National ID Type</label>
                  <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-xl">
                    {['Ghana Card', 'Passport', 'Voter ID'].map(id => (
                      <label key={id} className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" name="idtype" className="accent-[#cca43b]" /> {id}</label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 block px-1">ID Number</label>
                  <input value={regForm.idNumber} onChange={e => setRegForm({...regForm, idNumber: e.target.value})} placeholder="GHA-..." className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-[#cca43b] transition-all shadow-inner" />
                </div>
              </div>
            </div>

            {/* Section C */}
            <div className="space-y-6">
              <h3 className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest">Section C: Employment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Staff Category</label>
                  <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" name="cat" checked={regForm.category === 'Teaching'} onChange={() => setRegForm({...regForm, category: 'Teaching'})} className="accent-[#2e8b57]" /> Teaching</label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer"><input type="radio" name="cat" checked={regForm.category === 'Non-Teaching'} onChange={() => setRegForm({...regForm, category: 'Non-Teaching'})} className="accent-[#2e8b57]" /> Non-Teaching</label>
                  </div>
                </div>
                <InputGroup label="Job Title / Position" />
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Department / Subject Area</label>
                  <select className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none" value={regForm.department} onChange={e => setRegForm({...regForm, department: e.target.value})}>
                    {DEPARTMENTS.map(d => <option key={d.id}>{d.label}</option>)}
                  </select>
                </div>
                <InputGroup label="Date of Appointment" type="date" />
              </div>
            </div>

            <div className="flex justify-end gap-4 no-print border-t pt-10">
               <button className="px-10 py-4 rounded-2xl font-black text-xs uppercase text-gray-400 hover:bg-gray-50 transition">Save Progress</button>
               <button onClick={handleFinalizeRegistration} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-2xl hover:scale-105 active:scale-95 transition tracking-widest">Finalize Registration</button>
            </div>
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="space-y-8">
            <h3 className="text-xl font-black text-[#0f3460] uppercase print:hidden">Staff Directory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {settings.staff?.length > 0 ? settings.staff.map(s => (
                <div key={s.id} className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-gray-100 hover:border-[#cca43b] transition">
                  <span className="text-[8px] font-black text-[#cca43b] uppercase tracking-widest">ID: {s.idNumber || 'UBA-S-001'}</span>
                  <h4 className="text-lg font-black text-[#0f3460] uppercase mt-1">{s.name}</h4>
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Dept: {s.department}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Category: {s.category}</p>
                    <p className="text-[10px] font-mono text-gray-400 font-bold">{s.contact}</p>
                  </div>
                  <div className="mt-6 flex gap-2 no-print">
                    <button onClick={() => { setShowAssignModal(true); setAssignmentData({ staffId: s.id, role: OBSERVER_ROLES[0] }); }} className="bg-[#0f3460] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">Assign as Observer</button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase italic">No registered staff found in directory.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'observers' && (
           <div className="space-y-8">
              <div className="flex justify-between items-center border-b pb-4 print:hidden">
                 <h3 className="text-xl font-black text-[#0f3460] uppercase">Active Observers Directory</h3>
                 <button onClick={() => setShowAssignModal(true)} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Assign Observer Role</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {settings.observers?.length > 0 ? settings.observers.map((obs, idx) => (
                   <div key={idx} className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-transparent hover:border-[#cca43b] transition relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-4">
                         <h4 className="font-black text-[#0f3460] uppercase text-lg leading-tight">{obs.name}</h4>
                         <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${obs.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{obs.active ? 'Active' : 'Inactive'}</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Institutional Role: {obs.role}</p>
                      <div className="mt-4 flex gap-4 no-print">
                        <button className="text-[9px] font-black uppercase text-[#cca43b] hover:underline">Update Role</button>
                        <button className="text-[9px] font-black uppercase text-red-400 hover:underline">Remove</button>
                      </div>
                      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#cca43b]/5 rounded-full group-hover:scale-150 transition-transform"></div>
                   </div>
                 )) : (
                   <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase italic">No staff members currently assigned to observer roles.</div>
                 )}
              </div>
           </div>
        )}

        {activeTab === 'invigilators' && (
           <div className="space-y-8">
              <h3 className="text-xl font-black text-[#0f3460] uppercase print:hidden">Invigilation Duty List</h3>
              <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm">
                <table className="w-full text-[10px]">
                  <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                      <tr>
                        <th className="p-4 text-left">Date / Time</th>
                        <th className="p-4 text-left">Facilitator</th>
                        <th className="p-4 text-left">Role</th>
                        <th className="p-4 text-left">Subject</th>
                        <th className="p-4 text-left">Venue</th>
                        <th className="p-4 text-center no-print">Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {settings.invigilators.map((slot, idx) => (
                        <tr key={idx} className={`border-b transition ${slot.confirmed ? 'bg-green-50' : 'hover:bg-yellow-50/30'}`}>
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
                            <select 
                              value={slot.facilitatorName} 
                              className="bg-transparent border-b w-full font-black uppercase outline-none"
                              onChange={e => {
                                const updated = [...settings.invigilators];
                                updated[idx].facilitatorName = e.target.value;
                                onSettingsChange({...settings, invigilators: updated});
                              }}
                            >
                              <option value="">-- Select Staff --</option>
                              {settings.staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                          </td>
                          <td className="p-4">
                            <select value={slot.role} className="bg-transparent font-bold" onChange={e => {
                                const updated = [...settings.invigilators];
                                updated[idx].role = e.target.value as any;
                                onSettingsChange({...settings, invigilators: updated});
                            }}>
                                <option>Chief Invigilator</option><option>Invigilator</option><option>Officer</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <select 
                              value={slot.subject} 
                              className="bg-transparent border-b w-full font-black uppercase outline-none text-[#0f3460]"
                              onChange={e => {
                                const updated = [...settings.invigilators];
                                updated[idx].subject = e.target.value;
                                onSettingsChange({...settings, invigilators: updated});
                              }}
                            >
                              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="p-4 font-bold">{slot.venue}</td>
                          <td className="p-4 text-center flex gap-2 justify-center no-print">
                            <button onClick={() => handleInvite(idx)} className="text-blue-500 font-black uppercase hover:underline">Share Invite</button>
                            <button onClick={() => toggleConfirm(idx)} className={`font-black uppercase px-2 py-1 rounded ${slot.confirmed ? 'text-green-600 bg-green-100' : 'text-orange-500'}`}>
                                {slot.confirmed ? 'Confirmed ✓' : 'Force Confirm'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}
      </div>

      {/* Role Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#0f3460]/90 backdrop-blur-md p-6 animate-fadeIn no-print">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8 border-t-8 border-[#cca43b]">
            <div>
              <h3 className="text-2xl font-black uppercase text-[#0f3460] tracking-tighter">Assign Staff as Observer</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Institutional Development Tracking</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block px-1">Select Staff Member</label>
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-sm text-[#0f3460] shadow-inner outline-none focus:ring-2 focus:ring-[#cca43b]"
                  value={assignmentData.staffId}
                  onChange={e => setAssignmentData({...assignmentData, staffId: e.target.value})}
                >
                  <option value="">-- Choose from Directory --</option>
                  {settings.staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block px-1">Assign Observer Role</label>
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-sm text-[#0f3460] shadow-inner outline-none focus:ring-2 focus:ring-[#cca43b]"
                  value={assignmentData.role}
                  onChange={e => setAssignmentData({...assignmentData, role: e.target.value})}
                >
                  {OBSERVER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 px-8 py-4 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleAssignObserver} className="flex-1 bg-[#0f3460] text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 active:scale-95 transition tracking-widest">Confirm Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, type = "text", placeholder = "", fullWidth = false }: any) => (
  <div className={`space-y-1 ${fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}`}>
    <label className="text-[9px] font-black uppercase text-gray-400 block px-1">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder}
      className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-[#cca43b] transition-all shadow-inner" 
    />
  </div>
);

export default StaffManagement;
