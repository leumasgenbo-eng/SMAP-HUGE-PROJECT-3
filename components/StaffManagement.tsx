
import React, { useState } from 'react';
import { StaffRecord, GlobalSettings, InvigilatorSlot } from '../types';
import { EXAM_VENUES, OBSERVER_ROLES, getSubjectsForDepartment } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  department: string;
  notify: any;
}

const StaffManagement: React.FC<Props> = ({ settings, onSettingsChange, department, notify }) => {
  const [activeTab, setActiveTab] = useState<'registration' | 'invigilators' | 'observers' | 'movement' | 'summary'>('invigilators');

  const subjects = getSubjectsForDepartment(department);

  const handleAddInvigilator = () => {
    const newSlot: InvigilatorSlot = {
      date: '', time: '', name: 'Facilitator Name', role: 'Invigilator',
      subject: subjects[0], venue: EXAM_VENUES[0], confirmed: false
    };
    onSettingsChange({ ...settings, invigilatorsList: [...settings.invigilatorsList, newSlot] });
  };

  const handleInvite = (idx: number) => {
    const slot = settings.invigilatorsList[idx];
    const msg = `Confirmation Invitation: Dear ${slot.name}, you are scheduled to invigilate ${slot.subject} as ${slot.role} on ${slot.date} @ ${slot.time} in ${slot.venue}.`;
    notify("Invitation shared! Waiting for confirmation link trigger.", "success");
    console.log(msg);
  };

  const toggleConfirm = (idx: number) => {
    const updated = [...settings.invigilatorsList];
    updated[idx].confirmed = !updated[idx].confirmed;
    onSettingsChange({ ...settings, invigilatorsList: updated });
    notify(`Invigilation for ${updated[idx].subject} confirmed!`, "success");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-[#2e8b57] p-8 rounded-[3rem] text-white flex justify-between items-center shadow-xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Human Resource Desk</h2>
          <div className="flex gap-2 mt-4">
             {['registration', 'invigilators', 'observers', 'movement', 'summary'].map(t => (
               <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition ${activeTab === t ? 'bg-white text-[#2e8b57]' : 'bg-white/10'}`}>
                 {t}
               </button>
             ))}
          </div>
        </div>
        {activeTab === 'invigilators' && <button onClick={handleAddInvigilator} className="bg-white text-[#2e8b57] px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg">+ Add To List</button>}
      </div>

      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 min-h-[500px]">
        {activeTab === 'invigilators' && (
           <div className="space-y-8">
              <h3 className="text-xl font-black text-[#0f3460] uppercase">Invigilation Duty List</h3>
              <table className="w-full text-[10px]">
                 <thead className="bg-gray-50 text-[#0f3460] font-black uppercase">
                    <tr>
                       <th className="p-4 text-left">Date / Time</th>
                       <th className="p-4 text-left">Facilitator</th>
                       <th className="p-4 text-left">Role</th>
                       <th className="p-4 text-left">Subject</th>
                       <th className="p-4 text-left">Venue</th>
                       <th className="p-4 text-center">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {settings.invigilatorsList.map((slot, idx) => (
                      <tr key={idx} className={`border-b transition ${slot.confirmed ? 'bg-green-50' : 'hover:bg-yellow-50/30'}`}>
                        <td className="p-4">
                          <input type="date" value={slot.date} onChange={e => {
                            const updated = [...settings.invigilatorsList];
                            updated[idx].date = e.target.value;
                            onSettingsChange({...settings, invigilatorsList: updated});
                          }} className="bg-transparent" />
                          <input type="time" value={slot.time} onChange={e => {
                            const updated = [...settings.invigilatorsList];
                            updated[idx].time = e.target.value;
                            onSettingsChange({...settings, invigilatorsList: updated});
                          }} className="bg-transparent block mt-1" />
                        </td>
                        <td className="p-4 font-black uppercase text-gray-500">{slot.name}</td>
                        <td className="p-4">
                           <select value={slot.role} className="bg-transparent font-bold">
                              <option>Chief Invigilator</option><option>Invigilator</option><option>Officer</option>
                           </select>
                        </td>
                        <td className="p-4 font-black text-[#0f3460]">{slot.subject}</td>
                        <td className="p-4 font-bold">{slot.venue}</td>
                        <td className="p-4 text-center flex gap-2 justify-center">
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
        )}

        {activeTab === 'observers' && (
           <div className="space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-[#0f3460] uppercase">Active Observers Directory</h3>
                 <button onClick={() => alert("Observer Added")} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Assign Role</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {settings.observersList?.map((obs, idx) => (
                   <div key={idx} className="bg-gray-50 p-6 rounded-[2rem] border-2 border-transparent hover:border-[#cca43b] transition">
                      <div className="flex justify-between items-start mb-4">
                         <h4 className="font-black text-[#0f3460] uppercase">{obs.name}</h4>
                         <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${obs.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{obs.active ? 'Active' : 'Inactive'}</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role: {obs.role}</p>
                      <button className="mt-4 text-[9px] font-black uppercase text-[#cca43b] hover:underline">Update Role</button>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;
