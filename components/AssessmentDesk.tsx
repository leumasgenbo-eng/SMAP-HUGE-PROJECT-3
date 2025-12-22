
import React, { useState } from 'react';
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

  const currentObserver = settings.observers.find(o => o.id === selectedObserverId) || { name: 'Unassigned', role: 'Staff' };

  const getScaleLabel = (val: number) => {
    if (scaleType === 2) return val === 1 ? 'Developing' : 'Achieved';
    if (scaleType === 3) return val === 1 ? 'Developing' : val === 2 ? 'Achieving' : 'Advanced';
    return val.toString();
  };

  const handleScoreUpdate = (studentId: string, score: number) => {
    if (!activeIndicator || !date) {
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
        
        const newDailyScores = { ...(currentDetails.dailyScores || {}), [date]: score };
        const scores = Object.values(newDailyScores) as number[];
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
        
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

    const headers = [
      "School Name", "Academic Year", "Class", "Assessment Venue", "Observer Name", 
      "Observer Role", "Date", "Period", "Indicator", "Student Name", 
      "Session Score", "Cumulative Average", "Observation Notes"
    ];

    const rows = students
      .filter(s => s.currentClass === activeClass)
      .map(s => {
        const details = s.scoreDetails?.[activeIndicator];
        return [
          settings.schoolName,
          settings.academicYear,
          activeClass,
          venue,
          currentObserver.name,
          currentObserver.role,
          date,
          period,
          activeIndicator,
          `${s.firstName} ${s.surname}`,
          details?.dailyScores?.[date] || "0",
          details?.sectionA || "0",
          (details?.facilitatorRemark || "").replace(/"/g, '""')
        ];
      });

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${val}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UBA_Assessment_${activeIndicator.replace(/\s+/g, '_')}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("Assessment ledger exported as CSV!", "success");
  };

  const isLapsed = date && new Date(date).getTime() < new Date().setHours(0,0,0,0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* COMPREHENSIVE PARTICULARS HEADER FOR EXPORT/REPORTING */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4">
        <EditableField 
          value={settings.schoolName} 
          onSave={v => onSettingsChange({...settings, schoolName: v})} 
          className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" 
        />
        <div className="bg-[#cca43b] px-8 py-2 rounded-full text-[#0f3460] font-black text-xs uppercase tracking-widest">
          Developmental Progress Assessment Record
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full pt-4 text-[10px] font-black uppercase text-gray-400">
           <div className="flex flex-col gap-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <span className="opacity-50">Academic Cycle</span>
              <EditableField value={settings.academicYear} onSave={v => onSettingsChange({...settings, academicYear: v})} className="text-[#0f3460]" />
           </div>
           <div className="flex flex-col gap-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <span className="opacity-50">Active Class</span>
              <span className="text-[#0f3460]">{activeClass}</span>
           </div>
           <div className="flex flex-col gap-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <span className="opacity-50">Assessment Venue</span>
              <select className="bg-transparent text-[#0f3460] text-center border-none font-black outline-none" value={venue} onChange={e => setVenue(e.target.value)}>
                {DAYCARE_VENUES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
           </div>
           <div className="flex flex-col gap-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <span className="opacity-50">Primary Observer</span>
              <select className="bg-transparent text-[#0f3460] text-center border-none font-black outline-none" value={selectedObserverId} onChange={e => setSelectedObserverId(e.target.value)}>
                 <option value="">Select Observer...</option>
                 {settings.observers.filter(o => o.active).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
           </div>
        </div>
      </div>

      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden no-print">
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Indicator Data Entry</h2>
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
                <label className="text-[9px] font-black uppercase text-white/50">Observation Venue</label>
                <select className="bg-white/10 p-2 rounded-xl border-white/20 font-black text-xs" value={venue} onChange={e => setVenue(e.target.value)}>
                   {DAYCARE_VENUES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50">Rating System</label>
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
             HISTORICAL ENTRY
          </div>
        )}
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
        <div className="mb-8 border-b pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
           <div className="flex-1 w-full md:w-auto">
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Active Development Indicator Selection</label>
              <select className="w-full md:w-auto bg-gray-50 p-4 rounded-2xl border-none font-black text-[#0f3460] focus:ring-2 focus:ring-[#cca43b] text-sm shadow-inner min-w-[300px]" value={activeIndicator} onChange={e => setActiveIndicator(e.target.value)}>
                 {settings.activeIndicators.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
           </div>
           <div className="flex flex-wrap gap-3">
              <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-200">
                <button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] shadow-sm hover:scale-105 transition">Export PDF</button>
                <button onClick={handleExportCSV} className="bg-[#cca43b] text-[#0f3460] px-6 py-3 rounded-xl font-black uppercase text-[10px] shadow-sm hover:scale-105 transition">Export CSV</button>
              </div>
              <button onClick={() => notify("Assessment ledger committed and synced.", "success")} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Commit Changes</button>
           </div>
        </div>

        {/* PRINT SPECIFIC META DATA */}
        <div className="hidden print:block mb-8 bg-gray-50 p-6 rounded-3xl border border-gray-200">
           <div className="grid grid-cols-2 gap-4 text-[11px] font-bold">
              <p className="uppercase"><span className="text-gray-400">Date of Observation:</span> {date}</p>
              <p className="uppercase"><span className="text-gray-400">Target Indicator:</span> <span className="text-[#0f3460]">{activeIndicator}</span></p>
              <p className="uppercase"><span className="text-gray-400">Daily Period:</span> {period}</p>
              <p className="uppercase"><span className="text-gray-400">Observer Role:</span> {currentObserver.role}</p>
           </div>
        </div>

        <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
           <table className="w-full text-sm text-left">
              <thead className="bg-[#f4f6f7] text-[#0f3460] uppercase font-black text-[10px]">
                <tr>
                  <th className="p-5">Learner Full Name</th>
                  <th className="p-5">Assessment Ledger (Current Session)</th>
                  <th className="p-5 text-center">Cumulative Average</th>
                  <th className="p-5">Qualitative Observation Notes</th>
                </tr>
              </thead>
              <tbody>
                {students.filter(s => s.currentClass === activeClass).map(s => {
                  const details = s.scoreDetails?.[activeIndicator];
                  const currentScore = details?.dailyScores?.[date];
                  const avg = details?.sectionA || 0;
                  
                  return (
                    <tr key={s.id} className="border-b hover:bg-yellow-50 transition border-gray-50">
                      <td className="p-5 font-black uppercase text-[#0f3460] border-r border-gray-50">{s.firstName} {s.surname}</td>
                      <td className="p-5">
                         <div className="flex gap-1">
                            {Array.from({ length: scaleType }).map((_, i) => {
                              const val = i + 1;
                              const isActive = currentScore === val;
                              return (
                                <button 
                                  key={i} 
                                  onClick={() => handleScoreUpdate(s.id, val)}
                                  className={`w-8 h-8 rounded-lg font-black text-[10px] transition-all border-2 ${isActive ? 'bg-[#0f3460] text-white border-[#0f3460] shadow-md scale-110' : 'bg-gray-100 text-gray-400 border-transparent hover:bg-gray-200'} no-print`} 
                                  title={getScaleLabel(val)}
                                >
                                  {val}
                                </button>
                              );
                            })}
                            <span className="hidden print:inline font-black text-[#0f3460]">{currentScore || '--'}</span>
                         </div>
                      </td>
                      <td className="p-5 text-center bg-gray-50/50 border-x border-gray-50">
                        <span className={`text-xl font-black px-4 py-1 rounded-xl shadow-inner ${avg >= (scaleType/2) ? 'text-[#2e8b57] bg-green-50' : 'text-orange-500 bg-orange-50'}`}>
                          {avg > 0 ? avg : '--'}
                        </span>
                      </td>
                      <td className="p-5">
                        <input 
                          className="w-full bg-transparent p-1 border-b border-gray-100 italic text-xs font-medium focus:ring-0 outline-none focus:border-[#cca43b]" 
                          placeholder="Log detail..." 
                          value={details?.facilitatorRemark || ''}
                          onChange={(e) => handleNoteUpdate(s.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
           </table>
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-[2rem] border border-blue-100 no-print">
           <h4 className="text-[10px] font-black text-blue-900 uppercase mb-2">Computation Algorithm Audit</h4>
           <p className="text-[10px] text-blue-700 italic leading-relaxed">
             Entry Average is calculated as: Round(Sum of all scores logged for this indicator / Total logs). 
             The current session ({date}) contributes {100 / (Object.keys(students[0]?.scoreDetails?.[activeIndicator]?.dailyScores || {}).length || 1)}% to the cumulative score.
           </p>
        </div>
      </div>
    </div>
  );
};

export default AssessmentDesk;
