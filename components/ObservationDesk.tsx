
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
    onSettingsChange({ ...settings, observers: [...(settings.observers || []), newObs] });
  };

  const handleAddSlot = () => {
    const newSlot: ObservationScheduleSlot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      period: DAYCARE_PERIODS[0].code,
      duration: '30 mins',
      venue: DAYCARE_VENUES[0],
      observerId: settings.observers?.filter(o => o.active)[0]?.id || '',
      pupilGroup: [],
      activityIndicator: allIndicators[0],
      status: 'Pending'
    };
    const currentSched = settings.observationSchedule[activeClass] || [];
    onSettingsChange({ 
      ...settings, 
      observationSchedule: { ...settings.observationSchedule, [activeClass]: [newSlot, ...currentSched] } 
    });
    notify("New Observation Slot Initialized", "success");
  };

  const updateObs = (id: string, field: keyof ObservationScheduleSlot, val: any) => {
    const currentSched = settings.observationSchedule[activeClass] || [];
    const updated = currentSched.map(slot => slot.id === id ? { ...slot, [field]: val } : slot);
    onSettingsChange({ ...settings, observationSchedule: { ...settings.observationSchedule, [activeClass]: updated } });
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
      notify("No unique indicators found.", "info");
      return;
    }
    const updated = [...settings.activeIndicators, ...newItems];
    onSettingsChange({ ...settings, activeIndicators: updated });
    setNewIndicatorsText('');
    notify(`Added ${newItems.length} indicators!`, "success");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* UNITED BAYLOR ACADEMY HEADER */}
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

      <div className="bg-[#cca43b] p-8 rounded-[3rem] text-[#0f3460] shadow-2xl flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Observation Registry</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-1 italic">Developmental Tracking Terminal • {activeClass}</p>
        </div>
        <div className="flex gap-2 bg-white/20 p-1.5 rounded-2xl">
          <button onClick={() => setActiveSubTab('schedule')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'schedule' ? 'bg-[#0f3460] text-white shadow-lg' : 'hover:bg-white/10'}`}>1. Schedule Matrix</button>
          <button onClick={() => setActiveSubTab('indicators')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'indicators' ? 'bg-[#0f3460] text-white shadow-lg' : 'hover:bg-white/10'}`}>2. Indicators</button>
          <button onClick={() => setActiveSubTab('observers')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'observers' ? 'bg-[#0f3460] text-white shadow-lg' : 'hover:bg-white/10'}`}>3. Observers</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 min-h-[600px]">
        {activeSubTab === 'schedule' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-4 no-print">
              <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Class Observation Ledger</h3>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">Print Schedule</button>
                <button onClick={handleAddSlot} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">+ Add Slot</button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50/20">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                  <tr>
                    <th className="p-6 border-b">Date Selection</th>
                    <th className="p-6 border-b">Period</th>
                    <th className="p-6 border-b">Location</th>
                    <th className="p-6 border-b">Activity / Learning Area</th>
                    <th className="p-6 border-b">Observer Name</th>
                    <th className="p-6 border-b text-center">Current Status</th>
                    <th className="p-6 border-b text-center no-print">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {(settings.observationSchedule[activeClass] || []).map((slot) => (
                    <tr key={slot.id} className="border-b bg-white hover:bg-yellow-50 transition border-gray-50">
                      <td className="p-4">
                        <input 
                          type="date" 
                          className="bg-transparent font-bold text-[#0f3460] outline-none focus:text-[#cca43b]" 
                          value={slot.date} 
                          onChange={e => updateObs(slot.id, 'date', e.target.value)} 
                        />
                      </td>
                      <td className="p-4">
                        <select 
                          className="bg-transparent border-none font-black text-xs uppercase outline-none focus:text-[#cca43b]"
                          value={slot.period} 
                          onChange={e => updateObs(slot.id, 'period', e.target.value)}
                        >
                          {DAYCARE_PERIODS.map(p => <option key={p.code} value={p.code}>{p.code} - {p.label}</option>)}
                        </select>
                      </td>
                      <td className="p-4">
                        <select 
                          className="bg-transparent border-none font-bold text-gray-500 uppercase outline-none focus:text-[#cca43b]"
                          value={slot.venue} 
                          onChange={e => updateObs(slot.id, 'venue', e.target.value)}
                        >
                          {DAYCARE_VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </td>
                      <td className="p-4">
                         <select 
                           className="bg-transparent border-none font-black text-[#0f3460] max-w-[200px] outline-none focus:text-[#cca43b]"
                           value={slot.activityIndicator} 
                           onChange={e => updateObs(slot.id, 'activityIndicator', e.target.value)}
                         >
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
                         <select 
                           className="bg-transparent border-none font-bold text-[#0f3460] outline-none focus:text-[#cca43b]"
                           value={slot.observerId} 
                           onChange={e => updateObs(slot.id, 'observerId', e.target.value)}
                         >
                           <option value="">-- Select Personnel --</option>
                           {settings.staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.idNumber})</option>)}
                         </select>
                      </td>
                      <td className="p-4 text-center">
                        <select 
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase outline-none border-none shadow-sm ${
                            slot.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                            slot.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}
                          value={slot.status}
                          onChange={e => updateObs(slot.id, 'status', e.target.value)}
                        >
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Completed</option>
                          <option>Lapsed</option>
                        </select>
                      </td>
                      <td className="p-4 text-center no-print">
                        <button 
                          onClick={() => {
                            const filtered = (settings.observationSchedule[activeClass] || []).filter(s => s.id !== slot.id);
                            onSettingsChange({...settings, observationSchedule: {...settings.observationSchedule, [activeClass]: filtered}});
                          }} 
                          className="text-red-300 hover:text-red-600 transition"
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                  {(!settings.observationSchedule[activeClass] || settings.observationSchedule[activeClass].length === 0) && (
                    <tr><td colSpan={7} className="p-20 text-center text-gray-300 font-black uppercase italic tracking-widest">No active observation slots in ledger.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'indicators' && (
          <div className="space-y-12 animate-fadeIn">
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
                  <h4 className="text-lg font-black text-[#0f3460] uppercase tracking-tighter mb-6">Bulk Add Custom Targets</h4>
                  <textarea 
                     className="w-full h-64 p-6 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 outline-none focus:border-[#cca43b] transition-all text-[11px] font-bold shadow-inner resize-none italic leading-relaxed"
                     placeholder="e.g. Can name 5 primary colors&#10;Identifies common farm animals..."
                     value={newIndicatorsText}
                     onChange={e => setNewIndicatorsText(e.target.value)}
                  />
                  <button onClick={handleBulkAddIndicators} className="w-full bg-[#0f3460] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4">Sync to Registry</button>
               </div>
            </div>
          </div>
        )}

        {activeSubTab === 'observers' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Observer Allocation List</h3>
                <button onClick={handleAddObserver} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">+ New Deployment</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {settings.observers?.map((obs, idx) => (
                  <div key={obs.id} className="bg-gray-50 p-8 rounded-[3rem] border-4 border-white hover:border-[#cca43b] transition group relative shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-inner">👤</div>
                      <button onClick={() => onSettingsChange({...settings, observers: settings.observers.filter(o => o.id !== obs.id)})} className="text-red-300 opacity-0 group-hover:opacity-100 transition">✕</button>
                    </div>
                    <select 
                      className="w-full bg-transparent border-b-2 border-gray-200 font-black text-xs uppercase mb-2 outline-none focus:border-[#cca43b]"
                      value={obs.staffId}
                      onChange={e => {
                        const s = settings.staff.find(x => x.id === e.target.value);
                        const updated = [...settings.observers];
                        updated[idx] = { ...updated[idx], staffId: e.target.value, name: s?.name || '' };
                        onSettingsChange({...settings, observers: updated});
                      }}
                    >
                      <option value="">-- Choose Personnel --</option>
                      {settings.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select 
                      className="w-full bg-transparent text-[10px] font-bold text-gray-400 uppercase outline-none"
                      value={obs.role}
                      onChange={e => {
                        const updated = [...settings.observers];
                        updated[idx].role = e.target.value as any;
                        onSettingsChange({...settings, observers: updated});
                      }}
                    >
                      {OBSERVER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                ))}
              </div>
           </div>
        )}
      </div>

      {/* FOOTER AUTHORIZATION FOR PRINT */}
      <div className="hidden print:flex justify-between items-end mt-20 px-10">
        <div className="text-center w-64 border-t-2 border-black pt-2">
           <p className="text-[10px] font-black uppercase">Filing Officer Signature</p>
        </div>
        <div className="text-center w-80">
           <p className="italic font-serif text-3xl mb-2 text-[#0f3460]">{settings.headteacherName}</p>
           <div className="border-t-2 border-black pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-center">Headteacher Certified Approval</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ObservationDesk;
