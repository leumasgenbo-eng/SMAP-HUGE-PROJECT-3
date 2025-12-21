
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
  // Fixed: Updated property name from observationSchedules to observationSchedule to match GlobalSettings
  const schedule = settings.observationSchedule[activeClass] || [];
  const indicatorList = Object.values(DAYCARE_ACTIVITY_GROUPS).flat();

  const handleAddObservation = () => {
    const newObs: ObservationScheduleSlot = {
      id: crypto.randomUUID(),
      date: '', period: 'L1', duration: '45 mins', venue: DAYCARE_VENUES[0],
      observerId: 'Supervisor', pupilGroup: [], activityIndicator: indicatorList[0],
      status: 'Pending'
    };
    onSettingsChange({ ...settings, observationSchedule: { ...settings.observationSchedule, [activeClass]: [...schedule, newObs] } });
  };

  const updateObs = (idx: number, field: keyof ObservationScheduleSlot, val: any) => {
    const updated = [...schedule];
    updated[idx] = { ...updated[idx], [field]: val };
    onSettingsChange({ ...settings, observationSchedule: { ...settings.observationSchedule, [activeClass]: updated } });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#cca43b] p-8 rounded-[3rem] text-[#0f3460] flex justify-between items-center shadow-xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Observation Registry</h2>
          <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">Daycare & Nursery Behavioral Tracking</p>
        </div>
        <button onClick={handleAddObservation} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg">+ New Entry</button>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
        <table className="w-full text-[10px] border-collapse">
          <thead className="bg-gray-50 text-[#0f3460] font-black uppercase">
            <tr>
              <th className="p-4 border-b text-left">Date</th>
              <th className="p-4 border-b text-left">Period</th>
              <th className="p-4 border-b text-left">Location</th>
              <th className="p-4 border-b text-left">Activity / Indicator</th>
              <th className="p-4 border-b text-left">Observer</th>
              <th className="p-4 border-b text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((obs, idx) => {
              const isLapsed = obs.date && new Date(obs.date) < new Date();
              return (
                <tr key={idx} className="border-b hover:bg-blue-50/30 transition">
                  <td className="p-4"><input type="date" value={obs.date} onChange={e => updateObs(idx, 'date', e.target.value)} className={`bg-transparent border-b outline-none ${isLapsed ? 'text-red-500 font-black' : ''}`} /></td>
                  <td className="p-4">
                    <select value={obs.period} onChange={e => updateObs(idx, 'period', e.target.value)} className="bg-transparent border-b outline-none font-bold">
                       {['L0','L1','L2','B1','L3','L4','B2','L5','L6','L7'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="p-4">
                    <select value={obs.venue} onChange={e => updateObs(idx, 'venue', e.target.value)} className="bg-transparent border-b outline-none">
                      {DAYCARE_VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <td className="p-4">
                    <select value={obs.activityIndicator} onChange={e => updateObs(idx, 'activityIndicator', e.target.value)} className="bg-transparent border-b outline-none w-48 font-black">
                      {indicatorList.map(i => <option key={i}>{i}</option>)}
                    </select>
                  </td>
                  <td className="p-4 font-bold text-gray-500">{obs.observerId}</td>
                  <td className="p-4 text-center">
                    {isLapsed ? <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Task Incomplete</span> : <span className="text-gray-300 font-black">{obs.status.toUpperCase()}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ObservationSchedule;
