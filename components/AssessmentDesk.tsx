
import React, { useState, useMemo } from 'react';
import { GlobalSettings, Student, ObservationScheduleSlot } from '../types';
import { DAYCARE_PERIODS } from '../constants';
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
  const [executionDate, setExecutionDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyPeriod, setDailyPeriod] = useState('L1 (Lesson 1)');
  const [activeIndicator, setActiveIndicator] = useState('Vocabulary building');
  const [ratingSystem, setRatingSystem] = useState('3 Point (D / A / A+)');

  const filteredStudents = useMemo(() => students.filter(s => s.currentClass === activeClass && s.status === 'Admitted'), [students, activeClass]);

  // Track how many students have scores for THIS indicator on THIS date
  const progressStats = useMemo(() => {
    const assessed = filteredStudents.filter(s => {
      const details = s.scoreDetails?.[activeIndicator];
      return details?.dailyScores?.[executionDate] !== undefined;
    }).length;
    const total = filteredStudents.length || 1;
    return { assessed, total, percent: Math.round((assessed / total) * 100) };
  }, [filteredStudents, activeIndicator, executionDate]);

  const handleScoreUpdate = (studentId: string, score: number) => {
    const updatedStudents = students.map(s => {
      if (s.id === studentId) {
        const indicatorData = s.scoreDetails?.[activeIndicator] || { total: 0, grade: '', sectionA: 0, dailyScores: {} };
        const newDaily = { ...(indicatorData.dailyScores || {}), [executionDate]: score };
        
        const allScores = Object.values(newDaily) as number[];
        const avg = Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length);
        
        return {
          ...s,
          scoreDetails: {
            ...(s.scoreDetails || {}),
            [activeIndicator]: {
              ...indicatorData,
              dailyScores: newDaily,
              sectionA: avg,
              total: avg,
              grade: score === 3 ? 'A+' : score === 2 ? 'A' : 'D'
            }
          }
        } as Student;
      }
      return s;
    });

    onStudentsUpdate(updatedStudents);

    // Sync status with Observation Schedule if a match exists
    const classSchedule = settings.observationSchedule[activeClass] || [];
    const updatedSchedule = classSchedule.map(slot => {
      if (slot.date === executionDate && slot.activityIndicator === activeIndicator) {
        return { ...slot, status: 'Completed' as const };
      }
      return slot;
    });

    if (JSON.stringify(classSchedule) !== JSON.stringify(updatedSchedule)) {
      onSettingsChange({
        ...settings,
        observationSchedule: { ...settings.observationSchedule, [activeClass]: updatedSchedule }
      });
    }
  };

  const handleNoteUpdate = (studentId: string, note: string) => {
    onStudentsUpdate(students.map(s => {
      if (s.id === studentId) {
        const indicatorData = s.scoreDetails?.[activeIndicator] || { total: 0, grade: '', sectionA: 0, dailyScores: {} };
        return {
          ...s,
          scoreDetails: {
            ...(s.scoreDetails || {}),
            [activeIndicator]: { ...indicatorData, facilitatorRemark: note }
          }
        } as Student;
      }
      return s;
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Standard Institutional Header */}
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

      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden no-print">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Current Session Configuration</h2>
            <div className="text-right">
              <span className="text-[9px] font-black uppercase text-white/40 block mb-1">Session Progress</span>
              <div className="w-48 h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div className="h-full bg-[#cca43b] transition-all duration-700" style={{ width: `${progressStats.percent}%` }}></div>
              </div>
              <p className="text-[10px] font-black mt-1 text-[#cca43b]">{progressStats.assessed} / {progressStats.total} Learners Scored</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50 px-1">Execution Date</label>
                <input type="date" className="bg-white/10 p-3 rounded-xl border-white/20 font-black text-xs outline-none focus:ring-2 focus:ring-[#cca43b]" value={executionDate} onChange={e => setExecutionDate(e.target.value)} />
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50 px-1">Daily Period</label>
                <select className="bg-white/10 p-3 rounded-xl border-white/20 font-black text-xs outline-none" value={dailyPeriod} onChange={e => setDailyPeriod(e.target.value)}>
                   {DAYCARE_PERIODS.map(p => <option key={p.code} value={`${p.code} (${p.label})`}>{p.code} ({p.label})</option>)}
                </select>
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50 px-1">Rating System</label>
                <select className="bg-white/10 p-3 rounded-xl border-none font-black text-xs outline-none" value={ratingSystem} onChange={e => setRatingSystem(e.target.value)}>
                   <option>3 Point (D / A / A+)</option>
                   <option>2 Point (Developing / Achieved)</option>
                   <option>5 Point (1-5 Scale)</option>
                </select>
             </div>
             <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-white/50 px-1">Active Indicator</label>
                <select className="bg-[#cca43b] p-3 rounded-xl border-none font-black text-xs text-[#0f3460] outline-none shadow-lg" value={activeIndicator} onChange={e => setActiveIndicator(e.target.value)}>
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
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Targeting: {activeIndicator}</p>
           </div>
           <div className="flex gap-3">
              <button onClick={() => window.print()} className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Export PDF</button>
              <button className="bg-[#cca43b] text-[#0f3460] px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Export Master CSV</button>
           </div>
        </div>

        <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
           <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase text-[10px]">
             <tr>
               <th className="p-6 border-b border-gray-200">Learner Full Name</th>
               <th className="p-6 border-b border-gray-200 text-center bg-blue-50/50">Assessment Rating ({executionDate})</th>
               <th className="p-6 border-b border-gray-200 text-center">Entry Average (Cumulative)</th>
               <th className="p-6 border-b border-gray-200">Qualitative Observation Notes</th>
             </tr>
           </thead>
           <tbody>
             {filteredStudents.map(s => {
               const details = s.scoreDetails?.[activeIndicator] || { total: 0, grade: '', sectionA: 0, facilitatorRemark: '', dailyScores: {} };
               const currentDayScore = details.dailyScores?.[executionDate];
               
               return (
                 <tr key={s.id} className="border-b hover:bg-blue-50/10 transition border-gray-50 group">
                   <td className="p-6 border-r border-gray-50">
                      <div className="flex items-center gap-3">
                        {currentDayScore !== undefined && <span className="text-green-500 animate-bounce">✓</span>}
                        <span className="font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</span>
                      </div>
                   </td>
                   <td className="p-6 text-center border-r border-gray-50">
                      <div className="flex gap-2 justify-center no-print">
                         {[
                           { val: 1, label: 'D' },
                           { val: 2, label: 'A' },
                           { val: 3, label: 'A+' }
                         ].map(item => (
                            <button 
                              key={item.label} 
                              onClick={() => handleScoreUpdate(s.id, item.val)}
                              className={`w-14 h-11 rounded-xl text-[10px] font-black transition-all shadow-sm ${currentDayScore === item.val ? 'bg-[#0f3460] text-white scale-110' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                            >
                              {item.label}
                            </button>
                         ))}
                      </div>
                      <span className="hidden print:inline font-black text-lg">
                        {currentDayScore === 1 ? 'D' : currentDayScore === 2 ? 'A' : currentDayScore === 3 ? 'A+' : '--'}
                      </span>
                   </td>
                   <td className="p-6 text-center border-r border-gray-50 bg-gray-50/30">
                      <span className={`text-2xl font-black ${details.sectionA > 0 ? 'text-[#cca43b]' : 'text-gray-200'}`}>
                        {details.sectionA || '--'}
                      </span>
                   </td>
                   <td className="p-6">
                     <textarea 
                       className="w-full bg-transparent border-b border-gray-100 italic text-[11px] font-medium outline-none h-12 focus:border-[#cca43b] transition-all" 
                       placeholder="Enter qualitative details for this session..." 
                       value={details.facilitatorRemark || ''} 
                       onChange={(e) => handleNoteUpdate(s.id, e.target.value)}
                     />
                   </td>
                 </tr>
               );
             })}
             {filteredStudents.length === 0 && (
               <tr><td colSpan={4} className="p-20 text-center text-gray-300 font-black uppercase italic tracking-widest">No learners admitted to this class yet.</td></tr>
             )}
           </tbody>
        </table>
        
        <div className="mt-8 p-10 bg-blue-50 rounded-[2.5rem] border border-blue-100 no-print shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest border-b border-blue-200 pb-2">Entry Average Logic Disclosure</h4>
              <p className="text-[11px] text-blue-700 leading-relaxed italic font-medium">
                The cumulative average is derived by summing all recorded assessment scores (1-3) for this specific indicator and dividing by the total number of sessions logged. This ensures a proportional representation of learner development over time.
              </p>
           </div>
           <div className="space-y-2">
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest border-b border-blue-200 pb-2">System Sync Rules</h4>
              <p className="text-[11px] text-blue-700 leading-relaxed italic font-medium">
                Marking a learner's score automatically updates their Individual Report Card and the Master Broad Sheet. The Observation Schedule status for this indicator will toggle to <span className="font-black text-blue-900">"Completed"</span> once the session is initiated.
              </p>
           </div>
        </div>
        
        <div className="mt-12 flex justify-end no-print gap-4">
           <button onClick={() => notify("Ledger Synced Locally", "success")} className="bg-[#0f3460] text-white px-16 py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Manual Sync All Records</button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentDesk;