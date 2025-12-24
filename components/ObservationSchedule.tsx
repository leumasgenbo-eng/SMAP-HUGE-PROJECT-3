
import React, { useState } from 'react';
import { GlobalSettings, ObservationScheduleSlot } from '../types';
import { DAYCARE_ACTIVITY_GROUPS, DAYCARE_VENUES } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  activeClass: string;
  notify: any;
}

const ObservationSchedule: React.FC<Props> = ({ settings, onSettingsChange, activeClass, notify }) => {
  const schedule = settings.observationSchedule[activeClass] || [];
  const indicatorList = Object.values(DAYCARE_ACTIVITY_GROUPS).flat();

  const handleAddObservation = () => {
    const newObs: ObservationScheduleSlot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      period: 'L1',
      duration: '45 mins',
      venue: DAYCARE_VENUES[0],
      observerId: settings.observers.length > 0 ? settings.observers[0].id : 'Supervisor',
      pupilGroup: [],
      activityIndicator: indicatorList[0],
      status: 'Pending'
    };
    onSettingsChange({ 
      ...settings, 
      observationSchedule: { ...settings.observationSchedule, [activeClass]: [...schedule, newObs] } 
    });
    notify("New Observation Task Scheduled", "success");
  };

  const updateObs = (idx: number, field: keyof ObservationScheduleSlot, val: any) => {
    const updated = [...schedule];
    updated[idx] = { ...updated[idx], [field]: val };
    onSettingsChange({ 
      ...settings, 
      observationSchedule: { ...settings.observationSchedule, [activeClass]: updated } 
    });
  };

  const removeObs = (idx: number) => {
    const updated = schedule.filter((_, i) => i !== idx);
    onSettingsChange({ 
      ...settings, 
      observationSchedule: { ...settings.observationSchedule, [activeClass]: updated } 
    });
    notify("Observation Entry Removed", "info");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#cca43b] p-8 rounded-[3rem] text-[#0f3460] flex justify-between items-center shadow-xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Observation Registry</h2>
          <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">Daycare & Nursery Behavioral Tracking Hub</p>
        </div>
        <button onClick={handleAddObservation} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 active:scale-95 transition-all">+ New Schedule Entry</button>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] border-collapse min-w-[900px]">
            <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
              <tr>
                <th className="p-4 border-b text-left">Date</th>
                <th className="p-4 border-b text-left">Period</th>
                <th className="p-4 border-b text-left">Location</th>
                <th className="p-4 border-b text-left">Indicator / Target</th>
                <th className="p-4 border-b text-left">Observer</th>
                <th className="p-4 border-b text-center">Work Status</th>
                <th className="p-4 border-b text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {schedule.length === 0 ? (
                <tr><td colSpan={7} className="p-24 text-center text-gray-300 font-black uppercase italic tracking-widest">No behavioral observations scheduled for {activeClass}.</td></tr>
              ) : schedule.map((obs, idx) => {
                const isLapsed = obs.date && new Date(obs.date) < new Date() && obs.status === 'Pending';
                return (
                  <tr key={obs.id} className="border-b hover:bg-yellow-50/30 transition group">
                    <td className="p-4">
                      <input type="date" value={obs.date} onChange={e => updateObs(idx, 'date', e.target.value)} className={`bg-transparent border-b border-gray-100 outline-none font-bold ${isLapsed ? 'text-red-500' : 'text-gray-700'}`} />
                    </td>
                    <td className="p-4">
                      <select value={obs.period} onChange={e => updateObs(idx, 'period', e.target.value)} className="bg-transparent border-b border-gray-100 outline-none font-black text-[#0f3460] uppercase">
                         {['L0','L1','L2','B1','L3','L4','B2','L5','L6','L7'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <select value={obs.venue} onChange={e => updateObs(idx, 'venue', e.target.value)} className="bg-transparent border-b border-gray-100 outline-none font-bold text-gray-500 uppercase">
                        {DAYCARE_VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <select value={obs.activityIndicator} onChange={e => updateObs(idx, 'activityIndicator', e.target.value)} className="bg-transparent border-b border-gray-100 outline-none w-48 font-black uppercase text-[#0f3460] truncate">
                        {indicatorList.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                       <select value={obs.observerId} onChange={e => updateObs(idx, 'observerId', e.target.value)} className="bg-transparent border-b border-gray-100 outline-none font-bold uppercase text-gray-400">
                         <option value="Supervisor">Supervisor</option>
                         {settings.observers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                       </select>
                    </td>
                    <td className="p-4 text-center">
                      {obs.status === 'Completed' ? (
                        <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">Completed ✓</span>
                      ) : isLapsed ? (
                        <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-red-100 animate-pulse">Lapsed</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-400 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest">Pending</span>
                      )}
                    </td>
                    <td className="p-4 text-center no-print">
                      <button onClick={() => removeObs(idx)} className="text-red-300 hover:text-red-600 transition-colors font-black">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 no-print">
         <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-2">Automated Completion Tracking</h4>
         <p className="text-[11px] text-blue-700 leading-relaxed italic">
           The status column automatically toggles to <span className="font-black">"Completed"</span> when scores are logged for the specific date and indicator within the <span className="font-black">"Assessment"</span> module. Manual status overrides are disabled to preserve audit integrity.
         </p>
      </div>
    </div>
  );
};

export default ObservationSchedule;