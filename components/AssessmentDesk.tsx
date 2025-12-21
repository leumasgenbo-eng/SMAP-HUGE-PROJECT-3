
import React, { useState } from 'react';
import { GlobalSettings, Student } from '../types';
import { DAYCARE_PERIODS, DAYCARE_VENUES } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  activeClass: string;
  notify: any;
}

const AssessmentDesk: React.FC<Props> = ({ settings, onSettingsChange, students, activeClass, notify }) => {
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState('L1');
  const [duration, setDuration] = useState('45 mins');
  const [venue, setVenue] = useState(DAYCARE_VENUES[0]);
  const [scaleType, setScaleType] = useState<2 | 3 | 5 | 9>(3);
  const [activeIndicator, setActiveIndicator] = useState(settings.activeIndicators[0] || '');

  const getScaleLabel = (val: number) => {
    if (scaleType === 2) return val === 1 ? 'Developing' : 'Achieved';
    if (scaleType === 3) return val === 1 ? 'Developing' : val === 2 ? 'Achieving' : 'Advanced';
    return val.toString();
  };

  const handleSharePDF = () => {
    alert(`Sharing Assessment Report for ${activeClass}...`);
  };

  const isLapsed = date && new Date(date) < new Date();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Development Assessment</h2>
          <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Observation of Development Indicator • Cycle {settings.academicYear}</p>
          <div className="flex gap-6 mt-6 flex-wrap">
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50">Observation Date</label>
                <input type="date" className={`bg-white/10 p-2 rounded-xl border-white/20 font-black ${isLapsed ? 'border-red-500 text-red-400' : ''}`} value={date} onChange={e => setDate(e.target.value)} />
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50">Period</label>
                <select className="bg-white/10 p-2 rounded-xl border-white/20 font-black text-xs" value={period} onChange={e => setPeriod(e.target.value)}>
                   {DAYCARE_PERIODS.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
                </select>
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50">Venue</label>
                <select className="bg-white/10 p-2 rounded-xl border-white/20 font-black text-xs" value={venue} onChange={e => setVenue(e.target.value)}>
                   {DAYCARE_VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50">Rating Scale</label>
                <select className="bg-white/10 p-2 rounded-xl border-white/20 font-black text-xs" value={scaleType} onChange={e => setScaleType(Number(e.target.value) as any)}>
                   <option value={2}>2 Point (D/A)</option>
                   <option value={3}>3 Point (D/A/A+)</option>
                   <option value={5}>5 Point (1-5)</option>
                   <option value={9}>9 Point (1-9)</option>
                </select>
             </div>
          </div>
        </div>
        {isLapsed && (
          <div className="absolute top-0 right-0 bg-red-600 text-white px-10 py-2 rotate-45 translate-x-12 translate-y-4 font-black text-[10px] shadow-lg">
             TASK NOT COMPLETED
          </div>
        )}
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
        <div className="mb-8 border-b pb-6 flex justify-between items-center">
           <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Active Indicator Selection</label>
              <select className="bg-gray-50 p-4 rounded-2xl border-none font-black text-[#0f3460] focus:ring-2 focus:ring-[#cca43b] text-sm shadow-inner min-w-[300px]" value={activeIndicator} onChange={e => setActiveIndicator(e.target.value)}>
                 {settings.activeIndicators.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
           </div>
           <div className="flex gap-3">
              <button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl">Share PDF Report</button>
              <button onClick={() => notify("Assessment Data Stored.", "success")} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl">Save All</button>
           </div>
        </div>

        <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
           <table className="w-full text-sm text-left">
              <thead className="bg-[#f4f6f7] text-[#0f3460] uppercase font-black text-[10px]">
                <tr>
                  <th className="p-5">Pupil Name</th>
                  <th className="p-5">Enrolment Group</th>
                  <th className="p-5">Assessment Entry</th>
                  <th className="p-5 text-center">Entry Average</th>
                  <th className="p-5">Observer Notes</th>
                </tr>
              </thead>
              <tbody>
                {students.filter(s => s.currentClass === activeClass).map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-5 font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</td>
                    <td className="p-5 text-gray-400 font-bold">Group Alpha</td>
                    <td className="p-5">
                       <div className="flex gap-1">
                          {Array.from({ length: scaleType }).map((_, i) => (
                             <button key={i} className="w-8 h-8 rounded-lg bg-gray-100 font-black text-[10px] hover:bg-[#cca43b] hover:text-white transition" title={getScaleLabel(i+1)}>
                                {i + 1}
                             </button>
                          ))}
                       </div>
                    </td>
                    <td className="p-5 text-center font-black text-lg text-blue-600">--</td>
                    <td className="p-5"><input className="w-full bg-transparent border-b italic text-xs" placeholder="Add specific observation..." /></td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default AssessmentDesk;
