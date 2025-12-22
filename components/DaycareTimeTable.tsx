
import React, { useState } from 'react';
import { GlobalSettings, DaycareTimeTableSlot } from '../types';
import { DAYCARE_SLOTS, DAYCARE_SUBJECTS, DAYCARE_DETAILS, TLMS, REMARKS_LIST } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  activeClass: string;
  notify: any;
}

const DaycareTimeTable: React.FC<Props> = ({ settings, onSettingsChange, activeClass, notify }) => {
  const [activeDay, setActiveDay] = useState('Monday');
  const [activeTab, setActiveTab] = useState<'schedule' | 'analysis' | 'compliance'>('schedule');
  const [editingSlot, setEditingSlot] = useState<{ idx: number, field: string } | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const classSchedule = settings.daycareTimeTable[activeClass]?.[activeDay] || DAYCARE_SLOTS.map(s => ({
    ...s, subject: '', detail: '', tlm: '', remark: ''
  }));

  const updateSlot = (idx: number, field: keyof DaycareTimeTableSlot, value: string) => {
    const newSchedule = [...classSchedule];
    newSchedule[idx] = { ...newSchedule[idx], [field]: value };
    const updated = {
      ...settings.daycareTimeTable,
      [activeClass]: { ...(settings.daycareTimeTable[activeClass] || {}), [activeDay]: newSchedule }
    };
    onSettingsChange({ ...settings, daycareTimeTable: updated });
    setEditingSlot(null);
  };

  const getPopoutList = (field: string, currentSubject: string) => {
    if (field === 'activity') return DAYCARE_SLOTS.map(s => s.activity);
    if (field === 'subject') return DAYCARE_SUBJECTS;
    if (field === 'detail') return DAYCARE_DETAILS[currentSubject] || [];
    if (field === 'tlm') return TLMS;
    if (field === 'remark') return REMARKS_LIST;
    return [];
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#cca43b] p-8 rounded-[3rem] text-[#0f3460] flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Daycare Activity Flow</h2>
          <div className="flex gap-2 mt-2">
            {days.map(d => (
              <button key={d} onClick={() => setActiveDay(d)} className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border transition ${activeDay === d ? 'bg-[#0f3460] border-[#0f3460] text-white' : 'border-[#0f3460]/20'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex bg-white/20 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('schedule')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'schedule' ? 'bg-[#0f3460] text-white' : ''}`}>Schedule</button>
          <button onClick={() => setActiveTab('analysis')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'analysis' ? 'bg-[#0f3460] text-white' : ''}`}>Analysis</button>
          <button onClick={() => setActiveTab('compliance')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'compliance' ? 'bg-[#0f3460] text-white' : ''}`}>Compliance</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
        {activeTab === 'schedule' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border-collapse">
              <thead className="bg-gray-50 text-[#0f3460] font-black uppercase">
                <tr>
                  <th className="p-4 border-b text-left w-20">Key</th>
                  <th className="p-4 border-b text-center w-32">Time</th>
                  <th className="p-4 border-b text-left">Activity</th>
                  <th className="p-4 border-b text-left">Learning Area</th>
                  <th className="p-4 border-b text-left">Detail/Skill</th>
                  <th className="p-4 border-b text-left">TLM/Resources</th>
                  <th className="p-4 border-b text-left">Remark</th>
                </tr>
              </thead>
              <tbody>
                {classSchedule.map((s, idx) => (
                  <tr key={idx} className="border-b hover:bg-yellow-50/20 transition">
                    <td className="p-4 font-black text-gray-400">{s.code}</td>
                    <td className="p-4 font-bold text-center">{s.time}</td>
                    {['activity', 'subject', 'detail', 'tlm', 'remark'].map(field => (
                      <td key={field} className="p-4 relative group cursor-pointer" onClick={() => setEditingSlot({ idx, field })}>
                        <div className={`p-2 rounded-lg border-2 border-transparent group-hover:border-[#cca43b]/20 min-h-[35px] ${s[field as keyof DaycareTimeTableSlot] ? 'font-bold' : 'text-gray-300 italic'}`}>
                          {s[field as keyof DaycareTimeTableSlot] || "---"}
                        </div>
                        {editingSlot?.idx === idx && editingSlot.field === field && (
                          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setEditingSlot(null); }}>
                            <div className="bg-white w-96 max-h-[400px] overflow-y-auto rounded-[2rem] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                               <h4 className="text-xs font-black uppercase text-[#0f3460] mb-4 border-b pb-2">Select {field}</h4>
                               <div className="space-y-1">
                                 {getPopoutList(field, s.subject).map(item => (
                                   <button key={item} onClick={() => updateSlot(idx, field as any, item)} className="w-full text-left p-3 rounded-xl text-[10px] font-black uppercase hover:bg-yellow-50 transition">{item}</button>
                                 ))}
                               </div>
                            </div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'analysis' ? (
           <div className="grid grid-cols-2 gap-10">
              <div className="p-10 bg-gray-50 rounded-[3rem] space-y-4">
                 <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Critical Activity Ratio</h4>
                 <div className="h-4 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-[#cca43b] w-[70%]"></div></div>
                 <p className="text-[10px] font-bold text-[#0f3460]">Learning vs Break Time: 7:3 Ratio</p>
              </div>
              <div className="p-10 bg-gray-50 rounded-[3rem]">
                 <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Resource Allocation</h4>
                 <p className="text-sm font-bold text-gray-600 leading-relaxed italic">OWOP and Language &amp; Literacy are the most resource-intensive areas for this class this week.</p>
              </div>
           </div>
        ) : (
          <div className="space-y-8">
             <div className="flex justify-between items-center bg-red-50 p-6 rounded-2xl border border-red-100">
                <p className="text-xs font-black text-red-600 uppercase">Current Session: {new Date().toLocaleTimeString()} (Story Time Slot)</p>
                <button onClick={() => notify("Facilitator Present logged!", "success")} className="bg-red-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px]">Log Check-In</button>
             </div>
             <table className="w-full text-[10px]">
                <thead className="bg-gray-50 text-[#0f3460] font-black uppercase">
                   <tr><th className="p-4">Time Slot</th><th className="p-4">Expected Activity</th><th className="p-4">Actual Compliance</th><th className="p-4">Interruption</th></tr>
                </thead>
                <tbody>
                   <tr className="border-b"><td className="p-4 font-bold">8:30-9:25</td><td className="p-4">Circle Time</td><td className="p-4 text-green-500 font-black">Conformed (In @ 8:28)</td><td className="p-4">None</td></tr>
                </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DaycareTimeTable;
