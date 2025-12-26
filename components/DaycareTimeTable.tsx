
import React, { useState, useMemo } from 'react';
import { GlobalSettings, DaycareTimeTableSlot, ObservationScheduleSlot } from '../types';
import { DAYCARE_SLOTS, DAYCARE_PERIODS, DAYCARE_VENUES, DAYCARE_ACTIVITY_GROUPS } from '../constants';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  activeClass: string;
  notify: any;
}

const DaycareTimeTable: React.FC<Props> = ({ settings, onSettingsChange, activeClass, notify }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'indicators' | 'observers'>('schedule');
  
  // Flattened activities for the dropdown
  const allActivities = useMemo(() => {
    return Object.entries(DAYCARE_ACTIVITY_GROUPS).flatMap(([group, items]) => items);
  }, []);

  const schedule = useMemo(() => {
    return settings.observationSchedule[activeClass] || [];
  }, [settings.observationSchedule, activeClass]);

  const handleAddSlot = () => {
    const newSlot: ObservationScheduleSlot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      period: DAYCARE_PERIODS[0].code,
      duration: '45 mins',
      venue: DAYCARE_VENUES[0],
      observerId: settings.staff[0]?.id || '',
      pupilGroup: [],
      activityIndicator: allActivities[0],
      status: 'Pending'
    };
    
    onSettingsChange({
      ...settings,
      observationSchedule: {
        ...settings.observationSchedule,
        [activeClass]: [newSlot, ...schedule]
      }
    });
    notify("Observation Slot Initialized", "success");
  };

  const updateSlot = (id: string, field: keyof ObservationScheduleSlot, val: any) => {
    const updated = schedule.map(s => s.id === id ? { ...s, [field]: val } : s);
    onSettingsChange({
      ...settings,
      observationSchedule: {
        ...settings.observationSchedule,
        [activeClass]: updated
      }
    });
  };

  const removeSlot = (id: string) => {
    const updated = schedule.filter(s => s.id !== id);
    onSettingsChange({
      ...settings,
      observationSchedule: {
        ...settings.observationSchedule,
        [activeClass]: updated
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Institutional Particulars Header */}
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

      <div className="bg-[#cca43b] p-8 rounded-[3rem] text-[#0f3460] shadow-2xl flex flex-col gap-6 no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Development Observation Desk</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-70">Integrated Schedule Management • {activeClass}</p>
          </div>
          <div className="flex bg-white/20 p-1 rounded-2xl">
            <button onClick={() => setActiveTab('schedule')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'schedule' ? 'bg-[#0f3460] text-white shadow-md' : 'hover:bg-white/10'}`}>1. Observation Schedule</button>
            <button onClick={() => setActiveTab('indicators')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'indicators' ? 'bg-[#0f3460] text-white shadow-md' : 'hover:bg-white/10'}`}>2. Learning Indicators</button>
            <button onClick={() => setActiveTab('observers')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'observers' ? 'bg-[#0f3460] text-white shadow-md' : 'hover:bg-white/10'}`}>3. Staff Deployment</button>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[600px] relative">
        {activeTab === 'schedule' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b pb-6 no-print">
               <div>
                  <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Class Observation Registry</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live tracking of facilitator-led learning sessions</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => window.print()} className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition flex items-center gap-2">
                    <span>🖨️</span> Print Schedule
                  </button>
                  <button onClick={handleAddSlot} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition flex items-center gap-2">
                    <span>+</span> Add Slot
                  </button>
               </div>
            </div>

            {/* Formal Report Header for Print Only */}
            <div className="hidden print:block text-center border-b-4 border-double border-[#0f3460] pb-6 mb-10">
               <h1 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter">{settings.schoolName}</h1>
               <p className="text-xs font-bold text-[#cca43b] uppercase tracking-[0.4em]">{settings.motto}</p>
               <h2 className="mt-8 text-xl font-black uppercase tracking-widest">OFFICIAL OBSERVATION SCHEDULE - {activeClass}</h2>
               <div className="flex justify-center gap-10 mt-2 text-[10px] font-bold text-gray-500 uppercase">
                  <span>Academic Year: {settings.academicYear}</span>
                  <span>Cycle Date: {new Date().toLocaleDateString()}</span>
               </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                  <tr>
                    <th className="p-5 border-b">Date Selection</th>
                    <th className="p-5 border-b">Period</th>
                    <th className="p-5 border-b">Location</th>
                    <th className="p-5 border-b">Activity / Learning Area</th>
                    <th className="p-5 border-b">Observer Name</th>
                    <th className="p-5 border-b text-center">Current Status</th>
                    <th className="p-5 border-b text-center no-print">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((slot) => (
                    <tr key={slot.id} className="border-b hover:bg-yellow-50/30 transition group">
                      <td className="p-4 border-r border-gray-50">
                        <input 
                          type="date" 
                          className="bg-transparent font-black text-[#0f3460] outline-none focus:text-[#cca43b] w-full"
                          value={slot.date}
                          onChange={e => updateSlot(slot.id, 'date', e.target.value)}
                        />
                      </td>
                      <td className="p-4 border-r border-gray-50">
                        <select 
                          className="bg-transparent font-bold text-gray-600 outline-none w-full uppercase text-[10px]"
                          value={slot.period}
                          onChange={e => updateSlot(slot.id, 'period', e.target.value)}
                        >
                          {DAYCARE_PERIODS.map(p => <option key={p.code} value={p.code}>{p.code} - {p.label}</option>)}
                        </select>
                      </td>
                      <td className="p-4 border-r border-gray-50">
                         <select 
                          className="bg-transparent font-bold text-gray-600 outline-none w-full uppercase text-[10px]"
                          value={slot.venue}
                          onChange={e => updateSlot(slot.id, 'venue', e.target.value)}
                        >
                          {DAYCARE_VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                      <td className="p-4 border-r border-gray-50">
                        <select 
                          className="bg-transparent font-black text-[#0f3460] outline-none w-full uppercase text-[10px] max-w-[220px]"
                          value={slot.activityIndicator}
                          onChange={e => updateSlot(slot.id, 'activityIndicator', e.target.value)}
                        >
                          {Object.entries(DAYCARE_ACTIVITY_GROUPS).map(([group, items]) => (
                            <optgroup key={group} label={group}>
                              {items.map(item => <option key={item} value={item}>{item}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 border-r border-gray-50">
                        <select 
                          className="bg-transparent font-bold text-gray-500 outline-none w-full text-[10px] uppercase"
                          value={slot.observerId}
                          onChange={e => updateSlot(slot.id, 'observerId', e.target.value)}
                        >
                          <option value="">-- Choose Personnel --</option>
                          {settings.staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.idNumber})</option>)}
                        </select>
                      </td>
                      <td className="p-4 text-center">
                         <select 
                            className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase border-none shadow-inner outline-none transition-colors ${
                              slot.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                              slot.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-50 text-orange-600'
                            }`}
                            value={slot.status}
                            onChange={e => updateSlot(slot.id, 'status', e.target.value)}
                         >
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                            <option>Lapsed</option>
                         </select>
                      </td>
                      <td className="p-4 text-center no-print">
                         <button onClick={() => removeSlot(slot.id)} className="text-red-300 hover:text-red-600 transition p-2">✕</button>
                      </td>
                    </tr>
                  ))}
                  {schedule.length === 0 && (
                    <tr><td colSpan={7} className="p-32 text-center text-gray-300 font-black uppercase italic tracking-widest">No active observation slots in ledger. Click "+ Add Slot" to begin.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Verification Footer for Print Only */}
            <div className="hidden print:flex justify-between items-end mt-32">
               <div className="text-center w-64 border-t-2 border-black pt-4">
                  <p className="text-[10px] font-black uppercase">Registry Officer</p>
               </div>
               <div className="text-center w-80">
                  <p className="italic font-serif text-3xl mb-1 text-[#0f3460]">{settings.headteacherName}</p>
                  <div className="border-t-2 border-black pt-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-center">Headteacher Certified Approval</p>
                     <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold italic tracking-tighter">Official United Baylor Academy Audit Log</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'indicators' && (
          <div className="space-y-10 animate-fadeIn">
             <div className="flex justify-between items-center border-b pb-6">
                <div>
                   <h3 className="text-2xl font-black text-[#0f3460] uppercase">Learning Milestone Registry</h3>
                   <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 italic">Active Development Indicators Mapping</p>
                </div>
                <div className="bg-[#cca43b]/10 text-[#cca43b] px-6 py-2 rounded-2xl border border-[#cca43b]/20 text-center">
                   <p className="text-[8px] font-black uppercase">Active Milestones</p>
                   <p className="text-xl font-black">{allActivities.length}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.entries(DAYCARE_ACTIVITY_GROUPS).map(([group, items]) => (
                  <div key={group} className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 hover:border-[#cca43b] transition group shadow-sm">
                    <h4 className="text-[#cca43b] font-black uppercase text-xs mb-6 border-b-2 border-white pb-2">{group}</h4>
                    <div className="space-y-3">
                      {items.map(item => (
                        <div key={item} className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-transparent hover:border-gray-100 transition">
                           <div className="w-1.5 h-1.5 bg-[#0f3460] rounded-full opacity-30"></div>
                           <span className="text-[10px] font-black text-gray-500 uppercase leading-tight">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'observers' && (
           <div className="space-y-10 animate-fadeIn">
              <div className="border-b pb-6">
                 <h3 className="text-2xl font-black text-[#0f3460] uppercase">Personnel Allocation</h3>
                 <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Supervisory staff assigned to developmental observation</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {settings.staff.filter(s => s.category === 'Teaching').map(staff => (
                   <div key={staff.id} className="bg-white p-8 rounded-[3rem] border-4 border-gray-50 hover:border-blue-100 transition flex flex-col items-center text-center shadow-sm">
                      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner grayscale opacity-40 mb-4">👤</div>
                      <h4 className="font-black text-[#0f3460] uppercase text-lg leading-tight">{staff.name}</h4>
                      <p className="text-[9px] font-black text-[#cca43b] uppercase tracking-widest mt-1">{staff.role}</p>
                      <div className="mt-6 pt-6 border-t border-gray-50 w-full flex justify-between px-4">
                         <div className="text-left">
                            <p className="text-[7px] font-black text-gray-300 uppercase">Staff ID</p>
                            <p className="text-[10px] font-mono text-gray-400">{staff.idNumber}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[7px] font-black text-gray-300 uppercase">Class Auth</p>
                            <p className="text-[10px] font-bold text-blue-600 uppercase">{staff.department}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default DaycareTimeTable;
