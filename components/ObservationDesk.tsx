
import React, { useState } from 'react';
import { GlobalSettings, ObserverEntry, ObservationScheduleSlot } from '../types';
import { DAYCARE_VENUES, DAYCARE_PERIODS, DAYCARE_ACTIVITY_GROUPS, OBSERVER_ROLES } from '../constants';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  activeClass: string;
  notify: any;
}

const ObservationDesk: React.FC<Props> = ({ settings, onSettingsChange, activeClass, notify }) => {
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'indicators' | 'observers'>('schedule');
  const [newIndicatorsText, setNewIndicatorsText] = useState('');
  const allIndicators = Object.values(DAYCARE_ACTIVITY_GROUPS).flat();

  const handleAddObserver = () => {
    const newObs: ObserverEntry = {
      id: crypto.randomUUID(),
      name: '',
      role: 'Facilitator',
      active: true,
      staffId: ''
    };
    onSettingsChange({ ...settings, observers: [...settings.observers, newObs] });
  };

  const handleAddSlot = () => {
    const newSlot: ObservationScheduleSlot = {
      id: crypto.randomUUID(),
      date: '',
      period: 'L1',
      duration: '30 mins',
      venue: DAYCARE_VENUES[0],
      observerId: settings.observers.filter(o => o.active)[0]?.id || '',
      pupilGroup: [],
      activityIndicator: allIndicators[0],
      status: 'Pending'
    };
    const currentSched = settings.observationSchedule[activeClass] || [];
    onSettingsChange({ ...settings, observationSchedule: { ...settings.observationSchedule, [activeClass]: [...currentSched, newSlot] } });
  };

  const handleBulkAddIndicators = () => {
    if (!newIndicatorsText.trim()) {
      notify("Please enter at least one indicator name.", "error");
      return;
    }

    const newItems = newIndicatorsText
      .split('\n')
      .map(item => item.trim())
      .filter(item => item !== '' && !settings.activeIndicators.includes(item));

    if (newItems.length === 0) {
      notify("All entered indicators already exist or are invalid.", "info");
      return;
    }

    const updated = [...settings.activeIndicators, ...newItems];
    onSettingsChange({ ...settings, activeIndicators: updated });
    setNewIndicatorsText('');
    notify(`Successfully added ${newItems.length} new development indicators!`, "success");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Standard Institutional Particulars Header */}
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
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-300">ADDR:</span>
            <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-300">TEL:</span>
            <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-300">EMAIL:</span>
            <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
          </div>
        </div>
      </div>

      <div className="bg-[#cca43b] p-8 rounded-[3rem] text-[#0f3460] shadow-2xl flex justify-between items-center no-print">
        <div>
           <h2 className="text-2xl font-black uppercase tracking-tighter">Observation and Development Desk</h2>
           <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">{activeClass} • Tracking Institutional Behavioral Targets</p>
        </div>
        <div className="flex gap-2 bg-white/20 p-1 rounded-2xl">
          <button onClick={() => setActiveSubTab('schedule')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'schedule' ? 'bg-[#0f3460] text-white' : ''}`}>Schedule</button>
          <button onClick={() => setActiveSubTab('indicators')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'indicators' ? 'bg-[#0f3460] text-white' : ''}`}>Indicators</button>
          <button onClick={() => setActiveSubTab('observers')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'observers' ? 'bg-[#0f3460] text-white' : ''}`}>Observers</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 min-h-[500px]">
        {activeSubTab === 'schedule' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black text-[#0f3460] uppercase">Observation Schedule</h3>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">Print Schedule</button>
                <button onClick={handleAddSlot} className="bg-[#cca43b] text-[#0f3460] px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">+ Add Slot</button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50/30">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f4f6f7] text-[#0f3460] uppercase font-black text-[10px]">
                  <tr>
                    <th className="p-5">Date</th>
                    <th className="p-5">Period</th>
                    <th className="p-5">Location</th>
                    <th className="p-5">Activity / Learning Area</th>
                    <th className="p-5">Observer</th>
                    <th className="p-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(settings.observationSchedule[activeClass] || []).map((slot, idx) => {
                    const isLapsed = slot.date && new Date(slot.date) < new Date() && slot.status === 'Pending';
                    return (
                      <tr key={slot.id} className="border-b border-gray-50 bg-white hover:bg-yellow-50 transition">
                        <td className="p-4">
                          <input type="date" className={`bg-transparent border-b ${isLapsed ? 'text-red-600 font-black' : ''}`} value={slot.date} onChange={e => {
                            const sched = [...settings.observationSchedule[activeClass]];
                            sched[idx].date = e.target.value;
                            onSettingsChange({...settings, observationSchedule: {...settings.observationSchedule, [activeClass]: sched}});
                          }} />
                        </td>
                        <td className="p-4">
                          <select className="bg-transparent" value={slot.period} onChange={e => {
                            const sched = [...settings.observationSchedule[activeClass]];
                            sched[idx].period = e.target.value;
                            onSettingsChange({...settings, observationSchedule: {...settings.observationSchedule, [activeClass]: sched}});
                          }}>
                            {DAYCARE_PERIODS.map(p => <option key={p.code} value={p.code}>{p.code} ({p.label})</option>)}
                          </select>
                        </td>
                        <td className="p-4">
                          <select className="bg-transparent" value={slot.venue} onChange={e => {
                            const sched = [...settings.observationSchedule[activeClass]];
                            sched[idx].venue = e.target.value;
                            onSettingsChange({...settings, observationSchedule: {...settings.observationSchedule, [activeClass]: sched}});
                          }}>
                            {DAYCARE_VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </td>
                        <td className="p-4">
                           <select className="bg-transparent font-bold max-w-[150px]" value={slot.activityIndicator} onChange={e => {
                            const sched = [...settings.observationSchedule[activeClass]];
                            sched[idx].activityIndicator = e.target.value;
                            onSettingsChange({...settings, observationSchedule: {...settings.observationSchedule, [activeClass]: sched}});
                           }}>
                             {Object.entries(DAYCARE_ACTIVITY_GROUPS).map(([group, items]) => (
                               <optgroup key={group} label={group}>
                                 {items.map(item => <option key={item} value={item}>{item}</option>)}
                               </optgroup>
                             ))}
                             {settings.activeIndicators.filter(i => !allIndicators.includes(i)).map(item => (
                               <option key={item} value={item}>{item}</option>
                             ))}
                           </select>
                        </td>
                        <td className="p-4">
                           <select className="bg-transparent" value={slot.observerId} onChange={e => {
                             const sched = [...settings.observationSchedule[activeClass]];
                             sched[idx].observerId = e.target.value;
                             onSettingsChange({...settings, observationSchedule: {...settings.observationSchedule, [activeClass]: sched}});
                           }}>
                             <option value="">Select Observer</option>
                             {settings.observers.filter(o => o.active).map(o => <option key={o.id} value={o.id}>{o.name} ({o.role})</option>)}
                           </select>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-black uppercase text-[8px] ${slot.status === 'Completed' ? 'text-green-600' : 'text-orange-500'}`}>{slot.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'indicators' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               <div className="lg:col-span-2 space-y-8">
                  <div className="flex justify-between items-center border-b pb-4">
                     <h3 className="text-xl font-black text-[#0f3460] uppercase">Active Development Registry</h3>
                     <span className="bg-[#cca43b] text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase shadow-sm">
                       Total Indicators: {settings.activeIndicators.length}
                     </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(DAYCARE_ACTIVITY_GROUPS).map(([group, items]) => (
                      <div key={group} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                        <h4 className="text-[#cca43b] font-black uppercase text-xs mb-4 border-b pb-2">{group}</h4>
                        <div className="space-y-2">
                          {items.map(item => (
                            <label key={item} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-yellow-50 transition">
                               <span className="text-[10px] font-bold text-gray-700 uppercase">{item}</span>
                               <input type="checkbox" className="w-5 h-5 accent-[#0f3460]" checked={settings.activeIndicators.includes(item)} onChange={() => {
                                 const updated = settings.activeIndicators.includes(item) 
                                  ? settings.activeIndicators.filter(i => i !== item)
                                  : [...settings.activeIndicators, item];
                                 onSettingsChange({...settings, activeIndicators: updated});
                               }} />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 h-fit sticky top-0">
                  <h4 className="text-lg font-black text-[#0f3460] uppercase tracking-tighter mb-6">Add Custom Indicators</h4>
                  <textarea 
                     className="w-full h-64 p-6 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 outline-none focus:border-[#cca43b] transition-all text-[11px] font-bold shadow-inner resize-none italic leading-relaxed"
                     placeholder="e.g. Can name 5 primary colors&#10;Identifies common farm animals..."
                     value={newIndicatorsText}
                     onChange={e => setNewIndicatorsText(e.target.value)}
                  />
                  <button onClick={handleBulkAddIndicators} className="w-full bg-[#0f3460] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4">Save to Registry</button>
               </div>
            </div>
          </div>
        )}

        {activeSubTab === 'observers' && (
           <div className="space-y-8">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-black text-[#0f3460] uppercase">Observers Deployment List</h3>
                <button onClick={handleAddObserver} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">+ New Entry</button>
              </div>
              <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#f4f6f7] text-[#0f3460] uppercase font-black text-[10px]">
                    <tr>
                      <th className="p-5">Name (Select from Staff)</th>
                      <th className="p-5">Institutional Role</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.observers.map((obs, idx) => (
                      <tr key={obs.id} className="border-b bg-white hover:bg-yellow-50 transition">
                        <td className="p-4">
                          <select 
                            className="bg-transparent border-b font-black uppercase w-full outline-none"
                            value={obs.staffId || ''}
                            onChange={e => {
                              const staff = settings.staff.find(s => s.id === e.target.value);
                              const updated = [...settings.observers];
                              updated[idx] = { ...updated[idx], staffId: e.target.value, name: staff?.name || '' };
                              onSettingsChange({...settings, observers: updated});
                            }}
                          >
                            <option value="">-- Choose Staff --</option>
                            {settings.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </td>
                        <td className="p-4">
                          <select className="bg-transparent" value={obs.role} onChange={e => {
                             const injs = [...settings.observers];
                             injs[idx].role = e.target.value as any;
                             onSettingsChange({...settings, observers: injs});
                          }}>
                            {OBSERVER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="p-4">
                           <button onClick={() => {
                             const injs = [...settings.observers];
                             injs[idx].active = !injs[idx].active;
                             onSettingsChange({...settings, observers: injs});
                           }} className={`px-4 py-1 rounded-full text-[10px] font-black uppercase transition ${obs.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {obs.active ? 'Active' : 'Not Active'}
                           </button>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => onSettingsChange({...settings, observers: settings.observers.filter(o => o.id !== obs.id)})} className="text-red-500 font-black">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default ObservationDesk;
