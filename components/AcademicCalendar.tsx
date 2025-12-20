
import React, { useState } from 'react';
import { GlobalSettings, AcademicCalendarWeek } from '../types';
import { CALENDAR_PERIODS } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  notify: any;
}

const AcademicCalendar: React.FC<Props> = ({ settings, onSettingsChange, notify }) => {
  const [activeTerm, setActiveTerm] = useState<number>(settings.currentTerm);
  const [activeTab, setActiveTab] = useState<'plan' | 'manage'>('plan');
  const [editingCell, setEditingCell] = useState<{ weekIdx: number, field: keyof AcademicCalendarWeek } | null>(null);

  const termWeeks = settings.academicCalendar[activeTerm] || CALENDAR_PERIODS.map(p => ({
    week: p, dateFrom: '', dateTo: '', mainActivity: '', leadTeam: '', extraCurricular: ''
  }));

  const updateWeek = (idx: number, field: keyof AcademicCalendarWeek, value: string) => {
    const newWeeks = [...termWeeks];
    newWeeks[idx] = { ...newWeeks[idx], [field]: value };
    const updated = { ...settings.academicCalendar, [activeTerm]: newWeeks };
    onSettingsChange({ ...settings, academicCalendar: updated });
    setEditingCell(null);
  };

  // Fixed generic type error by narrowing listKey to only string[] keys of popoutLists
  const manageList = (listKey: 'activities' | 'leadTeam' | 'extraCurricular', item: string, action: 'add' | 'remove') => {
    const updatedLists = { ...settings.popoutLists };
    const currentList = updatedLists[listKey] as string[];
    if (action === 'add') {
      updatedLists[listKey] = [...currentList, item];
    } else {
      updatedLists[listKey] = currentList.filter(i => i !== item);
    }
    onSettingsChange({ ...settings, popoutLists: updatedLists });
  };

  const getPopoutList = (field: string) => {
    if (field === 'mainActivity') return settings.popoutLists.activities;
    if (field === 'leadTeam') return settings.popoutLists.leadTeam;
    if (field === 'extraCurricular') return settings.popoutLists.extraCurricular;
    return [];
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Academic Calendar Desk</h2>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map(t => (
              <button key={t} onClick={() => setActiveTerm(t)} className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border transition ${activeTerm === t ? 'bg-[#cca43b] border-[#cca43b] text-[#0f3460]' : 'border-white/20'}`}>
                Term {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex bg-white/10 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('plan')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'plan' ? 'bg-[#cca43b] text-[#0f3460]' : ''}`}>Master Plan</button>
          <button onClick={() => setActiveTab('manage')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'manage' ? 'bg-[#cca43b] text-[#0f3460]' : ''}`}>List Manager</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
        {activeTab === 'plan' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border-collapse">
              <thead className="bg-gray-50 text-[#0f3460] font-black uppercase">
                <tr>
                  <th className="p-4 border-b text-left w-32">Week</th>
                  <th className="p-4 border-b text-center">Duration (From - To)</th>
                  <th className="p-4 border-b text-left">Main Activity</th>
                  <th className="p-4 border-b text-left">Lead Team</th>
                  <th className="p-4 border-b text-left">Extra-Curricular</th>
                </tr>
              </thead>
              <tbody>
                {termWeeks.map((w, idx) => (
                  <tr key={idx} className="border-b hover:bg-yellow-50/30 transition">
                    <td className="p-4 font-black text-[#0f3460] uppercase">{w.week}</td>
                    <td className="p-4">
                      <div className="flex gap-2 items-center justify-center">
                        <input type="date" value={w.dateFrom} onChange={e => updateWeek(idx, 'dateFrom', e.target.value)} className="bg-transparent border-b outline-none text-[9px] w-24" />
                        <span className="text-gray-300">→</span>
                        <input type="date" value={w.dateTo} onChange={e => updateWeek(idx, 'dateTo', e.target.value)} className="bg-transparent border-b outline-none text-[9px] w-24" />
                      </div>
                    </td>
                    {['mainActivity', 'leadTeam', 'extraCurricular'].map(field => (
                      <td key={field} className="p-4 relative group cursor-pointer" onClick={() => setEditingCell({ weekIdx: idx, field: field as any })}>
                        <div className={`p-2 rounded-lg border-2 border-transparent group-hover:border-[#cca43b]/20 min-h-[30px] italic ${w[field as keyof AcademicCalendarWeek] ? 'text-gray-800 font-bold' : 'text-gray-300'}`}>
                          {w[field as keyof AcademicCalendarWeek] || "---"}
                        </div>
                        {editingCell?.weekIdx === idx && editingCell.field === field && (
                          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setEditingCell(null); }}>
                            <div className="bg-white w-96 max-h-[400px] overflow-y-auto rounded-[2rem] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                               <h4 className="text-xs font-black uppercase text-[#0f3460] mb-4 border-b pb-2">Select {field.replace(/([A-Z])/g, ' $1')}</h4>
                               <div className="space-y-1">
                                 {getPopoutList(field).map(item => (
                                   <button key={item} onClick={() => updateWeek(idx, field as any, item)} className="w-full text-left p-3 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50 transition">{item}</button>
                                 ))}
                                 <button onClick={() => {
                                   const val = prompt("Enter Custom Item:");
                                   if (val) updateWeek(idx, field as any, val);
                                 }} className="w-full text-left p-3 rounded-xl text-[10px] font-black uppercase text-[#cca43b] italic">+ Add Custom...</button>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {Object.entries(settings.popoutLists).filter(([k]) => ['activities', 'leadTeam', 'extraCurricular'].includes(k)).map(([key, list]) => (
              <div key={key} className="space-y-4">
                <h4 className="font-black text-[#0f3460] uppercase border-b pb-2 text-xs">{key.replace(/([A-Z])/g, ' $1')} Management</h4>
                <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                  {(list as string[]).map(item => (
                    <div key={item} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-[10px] font-bold uppercase">{item}</span>
                      <button onClick={() => manageList(key as any, item, 'remove')} className="text-red-400 hover:text-red-600 font-black">✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                  const val = prompt(`Add to ${key}:`);
                  if (val) manageList(key as any, val, 'add');
                }} className="w-full bg-[#0f3460] text-white py-3 rounded-xl font-black uppercase text-[10px]">+ Add New Item</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicCalendar;
