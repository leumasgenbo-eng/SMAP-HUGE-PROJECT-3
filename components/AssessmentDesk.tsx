
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GlobalSettings, Student } from '../types';
import { DAYCARE_PERIODS, DAYCARE_VENUES } from '../constants';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  activeClass: string;
  notify: any;
}

const AssessmentDesk: React.FC<Props> = ({ settings, onSettingsChange, students, onStudentsUpdate, activeClass, notify }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('L1');
  const [venue, setVenue] = useState(DAYCARE_VENUES[0]);
  const [scaleType, setScaleType] = useState<2 | 3 | 5 | 9>(3);
  const [activeIndicator, setActiveIndicator] = useState(settings.activeIndicators[0] || '');
  const [selectedObserverId, setSelectedObserverId] = useState('');
  const [activeNoteStudentId, setActiveNoteStudentId] = useState<string | null>(null);

  // Track the previous scale to perform proportional conversion
  const prevScaleRef = useRef<2 | 3 | 5 | 9>(3);

  const currentObserver = settings.observers.find(o => o.id === selectedObserverId) || { name: 'Unassigned', role: 'Staff' };

  // Handle Rating System Change with Proportional Scaling
  const handleScaleChange = (newScale: 2 | 3 | 5 | 9) => {
    const oldScale = scaleType;
    if (oldScale === newScale) return;

    const updated = students.map(s => {
      if (s.currentClass === activeClass && s.scoreDetails?.[activeIndicator]) {
        const details = s.scoreDetails[activeIndicator];
        const daily = details.dailyScores || {};
        const newDaily: Record<string, number> = {};

        // Recalibrate each daily entry
        Object.entries(daily).forEach(([d, val]) => {
          // NewValue = Round((OldValue / OldMax) * NewMax)
          // Ensure we don't drop to 0 if original was > 0
          const scaled = Math.round((val / oldScale) * newScale);
          newDaily[d] = val > 0 ? Math.max(1, scaled) : 0;
        });

        const scores = Object.values(newDaily);
        const sum = scores.reduce((a, b) => a + b, 0);
        const count = scores.length || 1;
        const avg = Math.round(sum / count);

        return {
          ...s,
          scoreDetails: {
            ...s.scoreDetails,
            [activeIndicator]: {
              ...details,
              dailyScores: newDaily,
              sectionA: avg,
              total: avg
            }
          }
        };
      }
      return s;
    });

    onStudentsUpdate(updated);
    setScaleType(newScale);
    notify(`Rating system recalibrated from ${oldScale} to ${newScale} points.`, "info");
  };

  const historicalDates = useMemo(() => {
    const datesSet = new Set<string>();
    students.filter(s => s.currentClass === activeClass).forEach(s => {
      const daily = s.scoreDetails?.[activeIndicator]?.dailyScores;
      if (daily) Object.keys(daily).forEach(d => datesSet.add(d));
    });
    datesSet.add(date);
    return Array.from(datesSet).sort();
  }, [students, activeClass, activeIndicator, date]);

  const handleScoreUpdate = (studentId: string, score: number, targetDate: string) => {
    if (!activeIndicator || !targetDate) {
      notify("Select indicator and date first", "error");
      return;
    }

    const updated = students.map(s => {
      if (s.id === studentId) {
        const currentDetails = s.scoreDetails?.[activeIndicator] || { 
          total: 0, 
          grade: '', 
          facilitatorRemark: '', 
          dailyScores: {} 
        };
        
        const newDailyScores = { ...(currentDetails.dailyScores || {}), [targetDate]: score };
        const scores = Object.values(newDailyScores) as number[];
        
        const sum = scores.reduce((a, b) => a + b, 0);
        const count = scores.length || 1;
        const avg = Math.round(sum / count);
        
        return {
          ...s,
          scoreDetails: {
            ...(s.scoreDetails || {}),
            [activeIndicator]: {
              ...currentDetails,
              dailyScores: newDailyScores,
              sectionA: avg, 
              total: avg
            }
          }
        };
      }
      return s;
    });
    onStudentsUpdate(updated);
  };

  const handleNoteUpdate = (studentId: string, note: string) => {
    const updated = students.map(s => {
      if (s.id === studentId) {
        const currentDetails = s.scoreDetails?.[activeIndicator] || { total: 0, grade: '', facilitatorRemark: '', dailyScores: {} };
        return {
          ...s,
          scoreDetails: {
            ...(s.scoreDetails || {}),
            [activeIndicator]: { ...currentDetails, facilitatorRemark: note }
          }
        };
      }
      return s;
    });
    onStudentsUpdate(updated);
  };

  const handleSharePDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!activeIndicator) {
      notify("Select an indicator to export.", "error");
      return;
    }

    const filteredStudents = students.filter(s => s.currentClass === activeClass);
    const metaRows = [
      ["Institution Name", settings.schoolName],
      ["Academic Year", settings.academicYear],
      ["Class", activeClass],
      ["Observer", currentObserver.name],
      ["Target Indicator", activeIndicator],
      ["Rating System", `${scaleType}-Point Scale`],
      [], 
    ];

    const headers = [
      "Learner Full Name", 
      ...historicalDates.map((d, idx) => `${idx + 1}) Assessment Score (${d})`), 
      "Entry Average", 
      "Observation Notes"
    ];

    const dataRows = filteredStudents.map(s => {
      const details = s.scoreDetails?.[activeIndicator];
      const scores = historicalDates.map(d => details?.dailyScores?.[d] || "0");
      return [
        `${s.firstName} ${s.surname}`,
        ...scores,
        details?.sectionA?.toString() || "0",
        (details?.facilitatorRemark || "").replace(/"/g, '""')
      ];
    });

    const csvContent = [...metaRows, headers, ...dataRows]
      .map(e => e.map(val => `"${val}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UBA_Assessment_${activeIndicator.replace(/\s+/g, '_')}_Master.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("Master Assessment CSV exported!", "success");
  };

  const isLapsed = date && new Date(date).getTime() < new Date().setHours(0,0,0,0);

  return (
    <div className="space-y-6 animate-fadeIn relative">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4">
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
          <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          <span>•</span>
          <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          <span>•</span>
          <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
        </div>

        <div className="bg-[#0f3460] px-8 py-2 rounded-full text-white font-black text-xs uppercase tracking-widest mt-4 shadow-lg">
          INDICATOR DATA ENTRY LEDGER
        </div>
      </div>

      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden no-print">
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Current Session Configuration</h2>
          <div className="flex gap-6 mt-6 flex-wrap">
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50">Execution Date</label>
                <input type="date" className={`bg-white/10 p-2 rounded-xl border-white/20 font-black ${isLapsed ? 'border-red-500 text-red-400' : ''}`} value={date} onChange={e => setDate(e.target.value)} />
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50">Daily Period</label>
                <select className="bg-white/10 p-2 rounded-xl border-white/20 font-black text-xs" value={period} onChange={e => setPeriod(e.target.value)}>
                   {DAYCARE_PERIODS.map(p => <option key={p.code} value={p.code}>{p.code} ({p.label})</option>)}
                </select>
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50">Rating System</label>
                <select 
                  className="bg-white/10 p-2 rounded-xl border-white/20 font-black text-xs border-2 border-dashed border-[#cca43b]" 
                  value={scaleType} 
                  onChange={e => handleScaleChange(Number(e.target.value) as any)}
                >
                   <option value={2}>2 Point (Developing / Achieved)</option>
                   <option value={3}>3 Point (D / A / A+)</option>
                   <option value={5}>5 Point (1-5 Scale)</option>
                   <option value={9}>9 Point (1-9 Scale)</option>
                </select>
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50">Active Indicator</label>
                <select className="bg-[#cca43b] p-2 rounded-xl border-none font-black text-xs text-[#0f3460]" value={activeIndicator} onChange={e => setActiveIndicator(e.target.value)}>
                   {settings.activeIndicators.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 overflow-x-auto">
        <div className="mb-8 border-b pb-6 flex justify-between items-center no-print">
           <div>
              <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Master Assessment Ledger</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Targeting: {activeIndicator}</p>
           </div>
           <div className="flex gap-3">
              <button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Export PDF</button>
              <button onClick={handleExportCSV} className="bg-[#cca43b] text-[#0f3460] px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Export Master CSV</button>
           </div>
        </div>

        <table className="w-full text-sm text-left border-collapse min-w-[1200px]">
           <thead className="bg-[#f4f6f7] text-[#0f3460] uppercase font-black text-[10px]">
             <tr>
               <th className="p-5 border-b border-gray-200">Learner Full Name</th>
               {historicalDates.map((d, idx) => (
                 <th key={d} className={`p-5 border-b border-gray-200 text-center ${d === date ? 'bg-blue-50 border-x border-blue-100' : ''}`}>
                   {idx + 1}) Assessment ({d})
                 </th>
               ))}
               <th className="p-5 border-b border-gray-200 text-center bg-gray-100">Proportional Avg</th>
               <th className="p-5 border-b border-gray-200">Observation Notes</th>
             </tr>
           </thead>
           <tbody>
             {students.filter(s => s.currentClass === activeClass).map(s => {
               const details = s.scoreDetails?.[activeIndicator];
               const avg = details?.sectionA || 0;
               const entriesCount = Object.keys(details?.dailyScores || {}).length;
               
               return (
                 <tr key={s.id} className="border-b hover:bg-yellow-50 transition border-gray-50">
                   <td className="p-5 font-black uppercase text-[#0f3460] border-r border-gray-50 bg-gray-50/20">
                     {s.firstName} {s.surname}
                   </td>
                   
                   {historicalDates.map(d => {
                     const isCurrentDate = d === date;
                     const score = details?.dailyScores?.[d];
                     
                     return (
                       <td key={d} className={`p-5 text-center ${isCurrentDate ? 'bg-blue-50/30' : ''}`}>
                         {isCurrentDate ? (
                            <div className="flex flex-col items-center gap-2 no-print">
                               <div className="flex gap-1">
                                  {Array.from({ length: Math.min(scaleType, 5) }).map((_, i) => {
                                    const val = i + 1;
                                    const isActive = score === val;
                                    return (
                                      <button 
                                        key={i} 
                                        onClick={() => handleScoreUpdate(s.id, val, d)}
                                        className={`w-7 h-7 rounded-lg font-black text-[9px] transition-all ${isActive ? 'bg-[#0f3460] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                      >
                                        {val}
                                      </button>
                                    );
                                  })}
                               </div>
                               {scaleType > 5 && (
                                 <input 
                                  type="number" 
                                  max={scaleType} 
                                  className="w-12 p-1 text-center font-black border-2 rounded-lg bg-white" 
                                  value={score || 0} 
                                  onChange={(e) => handleScoreUpdate(s.id, parseInt(e.target.value), d)} 
                                 />
                               )}
                            </div>
                         ) : (
                           <span className="font-black text-[#0f3460] text-lg">{score || '--'}</span>
                         )}
                         <span className="hidden print:inline font-black text-[#0f3460]">{score || '--'}</span>
                       </td>
                     );
                   })}

                   <td className="p-5 text-center bg-gray-100/50 border-x border-gray-100">
                     <div className="flex flex-col items-center">
                       <span className={`text-2xl font-black px-5 py-2 rounded-2xl shadow-inner ${avg >= (scaleType/2) ? 'text-[#2e8b57] bg-green-50' : 'text-orange-500 bg-orange-50'}`}>
                         {avg > 0 ? avg : '--'}
                       </span>
                       <span className="text-[7px] font-black text-gray-400 uppercase mt-2 tracking-tighter">Scaled Avg ({entriesCount} logs)</span>
                     </div>
                   </td>
                   <td className="p-5 relative">
                     <div className="flex items-center gap-2">
                        <textarea 
                          className="flex-1 bg-transparent p-2 border-b border-gray-100 italic text-[11px] font-medium focus:ring-0 outline-none focus:border-[#cca43b] resize-none h-12" 
                          placeholder="Observations..." 
                          value={details?.facilitatorRemark || ''}
                          onChange={(e) => handleNoteUpdate(s.id, e.target.value)}
                        />
                        <button 
                          onClick={() => setActiveNoteStudentId(activeNoteStudentId === s.id ? null : s.id)}
                          className="p-2 rounded-xl bg-gray-100 text-gray-400 hover:text-[#0f3460] transition shadow-sm"
                        >
                          📋
                        </button>
                     </div>
                     {activeNoteStudentId === s.id && (
                       <div className="absolute right-10 top-12 z-[200] w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 max-h-60 overflow-y-auto animate-fadeIn">
                          <p className="text-[9px] font-black uppercase text-gray-400 mb-4 border-b pb-2">Observation Note Registry</p>
                          <div className="space-y-1">
                             {(settings.popoutLists.observationNotes || []).map((note, idx) => (
                               <button 
                                  key={idx}
                                  onClick={() => { handleNoteUpdate(s.id, note); setActiveNoteStudentId(null); }}
                                  className="w-full text-left p-3 rounded-xl text-[10px] font-bold uppercase italic hover:bg-yellow-50 text-[#0f3460] transition border border-transparent hover:border-yellow-100"
                               >
                                  {note}
                               </button>
                             ))}
                             {(!settings.popoutLists.observationNotes || settings.popoutLists.observationNotes.length === 0) && (
                               <p className="text-[10px] text-gray-300 italic text-center py-4">No pre-configured notes found. Add some in Examination > Management Desk.</p>
                             )}
                          </div>
                       </div>
                     )}
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

export default AssessmentDesk;
