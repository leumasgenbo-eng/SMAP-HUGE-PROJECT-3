
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#cca43b] p-8 rounded-[2rem] text-[#0f3460] shadow-2xl flex justify-between items-center no-print">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Observation Registry</h2>
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
                <button onClick={() => window.print()} className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">Print</button>
                <button onClick={handleAddSlot} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">+ Add Slot</button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50/20">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                  <tr><th className="p-6 border-b">Date</th><th className="p-6 border-b">Period</th><th className="p-6 border-b">Location</th><th className="p-6 border-b">Indicator</th><th className="p-6 border-b">Observer</th><th className="p-6 border-b text-center">Status</th><th className="p-6 border-b text-center no-print">Action</th></tr>
                </thead>
                <tbody>
                  {(settings.observationSchedule[activeClass] || []).map((slot) => (
                    <tr key={slot.id} className="border-b bg-white hover:bg-yellow-50 transition border-gray-50">
                      <td className="p-4"><input type="date" className="bg-transparent font-bold" value={slot.date} onChange={e => updateObs(slot.id, 'date', e.target.value)} /></td>
                      <td className="p-4"><select className="bg-transparent" value={slot.period} onChange={e => updateObs(slot.id, 'period', e.target.value)}>{DAYCARE_PERIODS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}</select></td>
                      <td className="p-4"><select className="bg-transparent" value={slot.venue} onChange={e => updateObs(slot.id, 'venue', e.target.value)}>{DAYCARE_VENUES.map(v => <option key={v} value={v}>{v}</option>)}</select></td>
                      <td className="p-4"><select className="bg-transparent max-w-[180px]" value={slot.activityIndicator} onChange={e => updateObs(slot.id, 'activityIndicator', e.target.value)}>{allIndicators.map(i => <option key={i} value={i}>{i}</option>)}</select></td>
                      <td className="p-4"><select className="bg-transparent" value={slot.observerId} onChange={e => updateObs(slot.id, 'observerId', e.target.value)}><option value="">-- personnel --</option>{settings.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
                      <td className="p-4 text-center">
                        <select className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${slot.status === 'Completed' ? 'bg-green-100' : 'bg-orange-100'}`} value={slot.status} onChange={e => updateObs(slot.id, 'status', e.target.value)}><option>Pending</option><option>Completed</option></select>
                      </td>
                      <td className="p-4 text-center no-print"><button onClick={() => {
                        const filtered = (settings.observationSchedule[activeClass] || []).filter(s => s.id !== slot.id);
                        onSettingsChange({...settings, observationSchedule: {...settings.observationSchedule, [activeClass]: filtered}});
                      }} className="text-red-300">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'indicators' && (
          <div className="p-10 text-center opacity-40">
             <span className="text-4xl">📊</span>
             <p className="mt-4 font-black uppercase text-xs">Indicators Registry Operational.</p>
          </div>
        )}

        {activeSubTab === 'observers' && (
          <div className="p-10 text-center opacity-40">
             <span className="text-4xl">👥</span>
             <p className="mt-4 font-black uppercase text-xs">Observer List Management Active.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObservationDesk;
