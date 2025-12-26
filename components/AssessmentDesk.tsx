
import React, { useState, useMemo } from 'react';
import { GlobalSettings, Student, DailyExerciseEntry } from '../types';
import { BLOOM_TAXONOMY, getSubjectsForDepartment, DAYCARE_ACTIVITY_GROUPS } from '../constants';
import EditableField from './EditableField';
import { getDevelopmentalRating, calculateStats, getNRTGrade } from '../utils';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  activeClass: string;
  department: string;
  notify: any;
}

const AssessmentDesk: React.FC<Props> = ({ settings, onSettingsChange, students, onStudentsUpdate, activeClass, department, notify }) => {
  const [activeHubTab, setActiveHubTab] = useState<'indicators' | 'exercises' | 'disciplinary'>('indicators');
  const [indicatorMode, setIndicatorMode] = useState<'DeepSession' | 'DailyMonitoring' | 'GroupSummary'>('DailyMonitoring');
  const [exerciseMode, setExerciseMode] = useState<'Classwork' | 'Homework'>('Classwork');
  
  const [defaulterModalOpen, setDefaulterModalOpen] = useState(false);
  const [defaultersList, setDefaultersList] = useState<Student[]>([]);
  const [tempDefaulterReasons, setTempDefaulterReasons] = useState<Record<string, string>>({});

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGroup, setSelectedGroup] = useState<string>(Object.keys(DAYCARE_ACTIVITY_GROUPS)[0]);
  const [activeIndicator, setActiveIndicator] = useState(DAYCARE_ACTIVITY_GROUPS[selectedGroup as keyof typeof DAYCARE_ACTIVITY_GROUPS]?.[0] || '');

  const subjectList = getSubjectsForDepartment(department);
  const [exEntry, setExEntry] = useState<Partial<DailyExerciseEntry>>({
    subject: subjectList[0],
    week: 1, type: 'Classwork', bloomTaxonomy: [], pupilStatus: {}, pupilScores: {},
    maxScore: 10, date: new Date().toISOString().split('T')[0],
    strand: '', subStrand: '', indicator: ''
  });

  const classStudents = useMemo(() => students.filter(s => s.currentClass === activeClass), [students, activeClass]);

  const currentCompliance = useMemo(() => {
    const demand = settings.subjectDemands[activeClass]?.[exEntry.subject || ''] || 1;
    const weeklyEntries = (settings.exerciseEntries || []).filter(e => e.week === exEntry.week && e.subject === exEntry.subject);
    const count = weeklyEntries.length;
    const ratio = count / demand;
    return { count, demand, ratio };
  }, [settings.exerciseEntries, settings.subjectDemands, activeClass, exEntry.subject, exEntry.week]);

  // --- Group Summary Logic (3-Point NRT) ---
  const groupSummaryData = useMemo(() => {
    if (indicatorMode !== 'GroupSummary') return null;

    const groupNames = Object.keys(DAYCARE_ACTIVITY_GROUPS);
    
    // 1. Calculate raw averages per student per group
    const studentAverages = classStudents.map(s => {
      const groupAvgs: Record<string, number> = {};
      groupNames.forEach(group => {
        const indicatorsInGroup = DAYCARE_ACTIVITY_GROUPS[group as keyof typeof DAYCARE_ACTIVITY_GROUPS] || [];
        let totalVal = 0;
        let count = 0;
        indicatorsInGroup.forEach(ind => {
          const detail = s.scoreDetails?.[ind];
          if (detail?.dailyScores) {
            const vals = Object.values(detail.dailyScores).map(Number);
            if (vals.length > 0) {
              totalVal += vals.reduce((a, b) => a + b, 0) / vals.length;
              count++;
            }
          }
        });
        groupAvgs[group] = count > 0 ? totalVal / count : 0;
      });
      return { id: s.id, name: `${s.firstName} ${s.surname}`, avgs: groupAvgs };
    });

    // 2. Calculate Class-wide stats for each group for NRT
    const groupStats: Record<string, { mean: number, stdDev: number }> = {};
    groupNames.forEach(group => {
      const scores = studentAverages.map(sa => sa.avgs[group]).filter(v => v > 0);
      groupStats[group] = calculateStats(scores);
    });

    return { studentAverages, groupStats, groupNames };
  }, [classStudents, indicatorMode]);

  const handleIndicatorScore = (studentId: string, indicator: string, score: number) => {
    const updated = students.map(s => {
      if (s.id === studentId) {
        const currentDetails = s.scoreDetails?.[indicator] || { total: 0, grade: '', facilitatorRemark: '', dailyScores: {} };
        const newDailyScores = { ...(currentDetails.dailyScores || {}), [date]: score };
        const scores = Object.values(newDailyScores).map(v => Number(v));
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
        
        return {
          ...s,
          scoreDetails: { 
            ...(s.scoreDetails || {}), 
            [indicator]: { 
              ...currentDetails, 
              dailyScores: newDailyScores, 
              sectionA: avg, // Normalized score for broad sheets
              total: avg 
            } 
          }
        };
      }
      return s;
    });
    onStudentsUpdate(updated);
  };

  const validateAndSave = () => {
    const scoredIds = Object.keys(exEntry.pupilScores || {});
    if (scoredIds.length < classStudents.length) {
      const missing = classStudents.filter(s => !scoredIds.includes(s.id));
      setDefaultersList(missing);
      setDefaulterModalOpen(true);
      return;
    }
    commitSave();
  };

  const commitSave = (defaulterReasonsMap?: Record<string, string>) => {
    const now = new Date();
    const entryDate = new Date(exEntry.date || date);
    const isDisciplinary = now.getHours() >= 14 && entryDate.toDateString() === now.toDateString();

    const newEntry = { 
      ...exEntry, 
      id: crypto.randomUUID(), 
      type: exerciseMode,
      defaulterReasons: defaulterReasonsMap || {},
      isDisciplinaryReferral: isDisciplinary || (Object.keys(exEntry.pupilScores || {}).length < classStudents.length)
    } as DailyExerciseEntry;

    const updated = [...(settings.exerciseEntries || []), newEntry];
    onSettingsChange({ ...settings, exerciseEntries: updated });
    notify(`${exerciseMode} Logged. ${newEntry.isDisciplinaryReferral ? 'DISCIPLINARY ALERT ACTIVE.' : ''}`, "success");
    
    setExEntry({ 
      ...exEntry, 
      pupilStatus: {}, pupilScores: {}, bloomTaxonomy: [], strand: '', subStrand: '', indicator: ''
    });
    setDefaulterModalOpen(false);
  };

  const currentIndicators = DAYCARE_ACTIVITY_GROUPS[selectedGroup as keyof typeof DAYCARE_ACTIVITY_GROUPS] || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Branding Header */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" />
        <EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b]" />
      </div>

      <div className="bg-[#0f3460] p-6 rounded-[3rem] text-white flex justify-center gap-4 no-print shadow-xl">
        <button onClick={() => setActiveHubTab('indicators')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition ${activeHubTab === 'indicators' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>Development Indicator Desk</button>
        <button onClick={() => setActiveHubTab('exercises')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition ${activeHubTab === 'exercises' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>Assessment Log Entry</button>
        <button onClick={() => setActiveHubTab('disciplinary')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition ${activeHubTab === 'disciplinary' ? 'bg-red-600 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>Disciplinary Records</button>
      </div>

      {activeHubTab === 'indicators' ? (
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 border-b pb-8">
                 <div className="space-y-1">
                    <h3 className="text-3xl font-black text-[#0f3460] uppercase tracking-tighter">Preschool Indicator Terminal</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Measure: Emerging (D) • Achieving (A) • Advanced (A+)</p>
                 </div>
                 <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner no-print">
                    <button onClick={() => setIndicatorMode('DailyMonitoring')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${indicatorMode === 'DailyMonitoring' ? 'bg-white text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>Daily Monitoring Grid</button>
                    <button onClick={() => setIndicatorMode('DeepSession')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${indicatorMode === 'DeepSession' ? 'bg-white text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>Deep Session Focus</button>
                    <button onClick={() => setIndicatorMode('GroupSummary')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${indicatorMode === 'GroupSummary' ? 'bg-white text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>Group Summary (NRT)</button>
                 </div>
              </div>

              {indicatorMode === 'DailyMonitoring' ? (
                 <div className="space-y-10 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end no-print">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-400 px-2">1. Select Activity Group</label>
                          <select className="w-full p-4 bg-gray-50 rounded-2xl font-black text-[#0f3460] border-none shadow-inner text-xs" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
                             {Object.keys(DAYCARE_ACTIVITY_GROUPS).map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-400 px-2">2. Monitoring Date</label>
                          <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-[#0f3460] border-none shadow-inner text-xs" value={date} onChange={e => setDate(e.target.value)} />
                       </div>
                       <button onClick={() => notify("Routine snapshot saved!", "success")} className="bg-[#2e8b57] text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl">Finalize Today's Monitoring</button>
                    </div>

                    <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-lg">
                       <table className="w-full text-left text-[11px] border-collapse">
                          <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase sticky top-0 z-20">
                             <tr>
                                <th className="p-6 border-b w-64 bg-[#f4f6f7]">Pupil Name</th>
                                {currentIndicators.map(ind => (
                                   <th key={ind} className="p-4 border-b border-x border-gray-200 h-48 align-bottom text-center min-w-[120px] bg-white/50">
                                      <div className="[writing-mode:vertical-rl] rotate-180 text-[9px] uppercase tracking-tighter pb-4">{ind}</div>
                                   </th>
                                ))}
                             </tr>
                          </thead>
                          <tbody>
                             {classStudents.map(s => (
                                <tr key={s.id} className="border-b hover:bg-yellow-50 transition border-gray-50">
                                   <td className="p-6 font-black uppercase text-[#0f3460] bg-white sticky left-0 z-10 border-r">{s.firstName} {s.surname}</td>
                                   {currentIndicators.map(ind => {
                                      const score = s.scoreDetails?.[ind]?.dailyScores?.[date] || 0;
                                      return (
                                         <td key={ind} className="p-4 text-center border-x border-gray-50">
                                            <div className="flex gap-1 justify-center">
                                               {[1, 2, 3].map(v => (
                                                  <button 
                                                    key={v} 
                                                    onClick={() => handleIndicatorScore(s.id, ind, v)}
                                                    className={`w-8 h-8 rounded-lg text-[9px] font-black transition-all ${score === v ? (v === 3 ? 'bg-green-600 text-white shadow-md' : v === 2 ? 'bg-[#cca43b] text-white shadow-md' : 'bg-red-500 text-white shadow-md') : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
                                                  >
                                                     {v === 3 ? 'A+' : v === 2 ? 'A' : 'D'}
                                                  </button>
                                               ))}
                                            </div>
                                         </td>
                                      );
                                   })}
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              ) : indicatorMode === 'DeepSession' ? (
                 <div className="space-y-10 animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                       <div className="space-y-8 p-10 bg-gray-50 rounded-[3rem] border border-gray-100">
                          <h4 className="text-xl font-black text-[#cca43b] uppercase">Session Focus Settings</h4>
                          <div className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-gray-400 px-2">Target Indicator</label>
                                <select className="w-full p-5 bg-white rounded-2xl border-none font-black text-[#0f3460] text-sm shadow-sm" value={activeIndicator} onChange={e => setActiveIndicator(e.target.value)}>
                                   {Object.entries(DAYCARE_ACTIVITY_GROUPS).map(([group, items]) => (
                                      <optgroup key={group} label={group}>
                                         {items.map(i => <option key={i} value={i}>{i}</option>)}
                                      </optgroup>
                                   ))}
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-gray-400 px-2">Observation Logic / Context</label>
                                <textarea className="w-full h-32 p-5 bg-white rounded-2xl border-none font-bold text-xs italic outline-none shadow-sm" placeholder="Specify activity details e.g. 'Can balance on one leg during outdoor play'..." />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <h4 className="text-xl font-black text-[#0f3460] uppercase px-4">Learner Response (Live Log)</h4>
                          <div className="h-[500px] overflow-y-auto pr-4 space-y-3 custom-scrollbar">
                             {classStudents.map(s => {
                                const score = s.scoreDetails?.[activeIndicator]?.dailyScores?.[date] || 0;
                                const rating = getDevelopmentalRating(score * 33.3, 50, 20, 3, settings.gradingScale);
                                return (
                                   <div key={s.id} className="p-6 bg-white rounded-[2rem] border-2 border-gray-100 hover:border-[#cca43b] transition-all flex justify-between items-center shadow-sm">
                                      <div>
                                         <p className="font-black uppercase text-[#0f3460] text-sm">{s.firstName} {s.surname}</p>
                                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${score > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-300'}`}>
                                            {score > 0 ? `Level: ${rating.label}` : 'Pending Observation'}
                                         </span>
                                      </div>
                                      <div className="flex gap-2">
                                         {[1, 2, 3].map(v => (
                                            <button 
                                              key={v} 
                                              onClick={() => handleIndicatorScore(s.id, activeIndicator, v)}
                                              className={`w-14 h-14 rounded-2xl font-black transition-all border-2 ${score === v ? 'bg-[#0f3460] border-[#0f3460] text-white shadow-xl scale-110' : 'bg-white border-gray-100 text-gray-300 hover:border-[#cca43b]'}`}
                                            >
                                               {v === 3 ? 'A+' : v === 2 ? 'A' : 'D'}
                                            </button>
                                         ))}
                                      </div>
                                   </div>
                                );
                             })}
                          </div>
                       </div>
                    </div>
                 </div>
              ) : (
                <div className="space-y-10 animate-fadeIn">
                   <div className="flex justify-between items-center no-print">
                      <h4 className="text-xl font-black text-[#cca43b] uppercase">Class Activity Group Performance Broad Sheet</h4>
                      <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg">Print Group Analysis</button>
                   </div>
                   
                   <div className="overflow-x-auto rounded-[3rem] border border-gray-100 shadow-2xl">
                      <table className="w-full text-left text-[11px] border-collapse">
                         <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase sticky top-0 z-20">
                            <tr>
                               <th className="p-8 border-b w-64 bg-[#f4f6f7]">Learner Profile</th>
                               {groupSummaryData?.groupNames.map(gn => (
                                  <th key={gn} className="p-4 border-b border-x border-gray-200 h-48 align-bottom text-center min-w-[100px]">
                                     <div className="[writing-mode:vertical-rl] rotate-180 text-[10px] uppercase tracking-tighter pb-6 font-black">{gn}</div>
                                  </th>
                               ))}
                               <th className="p-8 border-b text-center bg-yellow-50">Combined Index</th>
                            </tr>
                         </thead>
                         <tbody>
                            {groupSummaryData?.studentAverages.map(sa => {
                               const validAvgs = Object.values(sa.avgs).filter(v => v > 0);
                               const studentTotalAvg = validAvgs.length > 0 ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : 0;
                               
                               return (
                                  <tr key={sa.id} className="border-b hover:bg-blue-50/20 transition group">
                                     <td className="p-8 font-black uppercase text-[#0f3460] bg-white sticky left-0 z-10 border-r">{sa.name}</td>
                                     {groupSummaryData.groupNames.map(gn => {
                                        const avg = sa.avgs[gn];
                                        const stats = groupSummaryData.groupStats[gn];
                                        const rating = getDevelopmentalRating(avg * 33.3, stats.mean * 33.3, stats.stdDev * 33.3, 3, settings.gradingScale);
                                        
                                        return (
                                           <td key={gn} className="p-4 text-center border-x border-gray-50">
                                              {avg > 0 ? (
                                                <div className="flex flex-col items-center gap-1">
                                                   <span className="font-black text-lg text-[#0f3460]">{avg.toFixed(1)}</span>
                                                   <span className="px-2 py-0.5 rounded-full text-white text-[7px] font-black uppercase shadow-sm" style={{ background: rating.color }}>{rating.label}</span>
                                                </div>
                                              ) : (
                                                <span className="text-gray-300 italic text-[10px]">---</span>
                                              )}
                                           </td>
                                        );
                                     })}
                                     <td className="p-8 text-center bg-yellow-50/50 font-black text-2xl text-[#cca43b]">
                                        {studentTotalAvg > 0 ? studentTotalAvg.toFixed(2) : '--'}
                                     </td>
                                  </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   </div>

                   <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                         <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">NRT Scale Key (3-Point)</h5>
                         <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-green-600"></span><span className="text-[10px] font-bold text-gray-600 uppercase">Advanced (A+) (High Distribution)</span></div>
                            <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-[#cca43b]"></span><span className="text-[10px] font-bold text-gray-600 uppercase">Achieving (A) (Mean Zone)</span></div>
                            <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-[10px] font-bold text-gray-600 uppercase">Developing (D) (Low Distribution)</span></div>
                         </div>
                      </div>
                      <div className="md:col-span-2">
                         <p className="text-[11px] font-bold text-gray-400 italic leading-relaxed">
                            The Group Performance Summary automatically normalizes all daily indicator observations into a single developmental index per group. 
                            The grading system uses <strong>Normal Reference Testing (NRT)</strong>, benchmarking each learner's progress against the current class population mean.
                         </p>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      ) : activeHubTab === 'exercises' ? (
        <div className="space-y-6">
           <div className="flex justify-center bg-gray-100 p-2 rounded-[2.5rem] w-fit mx-auto no-print shadow-inner">
              <button onClick={() => setExerciseMode('Classwork')} className={`px-10 py-3 rounded-[2rem] text-[10px] font-black uppercase transition ${exerciseMode === 'Classwork' ? 'bg-[#2e8b57] text-white shadow-lg' : 'text-gray-400'}`}>Class-Activity Log</button>
              <button onClick={() => setExerciseMode('Homework')} className={`px-10 py-3 rounded-[2rem] text-[10px] font-black uppercase transition ${exerciseMode === 'Homework' ? 'bg-[#2e8b57] text-white shadow-lg' : 'text-gray-400'}`}>Home Assignment</button>
           </div>

           <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10 border-b pb-10">
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <h3 className="text-2xl font-black text-[#0f3460] uppercase">{exerciseMode} Detail</h3>
                       <div className={`flex flex-col items-end p-4 rounded-2xl border-2 transition-colors ${currentCompliance.ratio < 0.5 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                          <span className={`text-[10px] font-black uppercase ${currentCompliance.ratio < 0.5 ? 'text-red-600' : 'text-green-600'}`}>Compliance</span>
                          <span className={`text-2xl font-black ${currentCompliance.ratio < 0.5 ? 'text-red-700' : 'text-green-700'}`}>{(currentCompliance.ratio * 100).toFixed(0)}%</span>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-400">Subject / Pillar</label>
                          <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={exEntry.subject} onChange={e => setExEntry({...exEntry, subject: e.target.value})}>
                             {subjectList.map(s => <option key={s}>{s}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-400">Term Week</label>
                          <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl" value={exEntry.week} onChange={e => setExEntry({...exEntry, week: parseInt(e.target.value)})} />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                       <input type="text" placeholder="Enter Strand / Main Topic..." className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-xs" value={exEntry.strand} onChange={e => setExEntry({...exEntry, strand: e.target.value})} />
                       <input type="text" placeholder="Indicator Reference..." className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-blue-600 text-xs" value={exEntry.indicator} onChange={e => setExEntry({...exEntry, indicator: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl" value={exEntry.date} onChange={e => setExEntry({...exEntry, date: e.target.value})} />
                       <input type="number" className="w-full p-4 bg-[#0f3460] text-white rounded-2xl font-black text-lg" value={exEntry.maxScore} onChange={e => setExEntry({...exEntry, maxScore: parseInt(e.target.value)})} />
                    </div>
                    
                    <button onClick={validateAndSave} className="w-full bg-[#2e8b57] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.01] transition">Authorize Log Entry</button>
                 </div>

                 <div className="h-[600px] overflow-y-auto pr-4 space-y-2 border-l pl-10 border-gray-100">
                    <h4 className="text-xs font-black uppercase text-gray-400 mb-6 sticky top-0 bg-white py-2 z-10">Class Scoring Desk</h4>
                    {classStudents.map(s => (
                       <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-[1.5rem] hover:bg-white border-2 border-transparent hover:border-gray-100 transition shadow-sm">
                          <span className="text-[11px] font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</span>
                          <div className="flex gap-4 items-center">
                             <input 
                                type="number" 
                                className="w-16 p-2 bg-white rounded-lg text-center font-black text-blue-600 shadow-inner" 
                                placeholder="Scr" 
                                value={exEntry.pupilScores?.[s.id] || ''}
                                onChange={e => setExEntry({...exEntry, pupilScores: {...(exEntry.pupilScores || {}), [s.id]: parseInt(e.target.value)}})}
                             />
                             <div className="flex gap-1">
                                {['M', 'D', 'X'].map(st => (
                                   <button key={st} onClick={() => setExEntry({...exEntry, pupilStatus: {...(exEntry.pupilStatus || {}), [s.id]: (st === 'M' ? 'Marked' : st === 'D' ? 'Defaulter' : 'Missing') as any}})} className={`w-8 h-8 rounded-lg text-[9px] font-black transition ${exEntry.pupilStatus?.[s.id] === (st === 'M' ? 'Marked' : st === 'D' ? 'Defaulter' : 'Missing') ? 'bg-[#0f3460] text-white shadow-md scale-110' : 'bg-white text-gray-300'}`}>{st}</button>
                                ))}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white p-20 rounded-[3rem] shadow-xl border border-gray-100 text-center animate-fadeIn">
           <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
           <h3 className="text-2xl font-black text-red-600 uppercase">Institutional Disciplinary Hub</h3>
           <p className="text-gray-400 font-bold uppercase tracking-widest mt-2 max-w-lg mx-auto">This module synchronizes automatically with the assessment logs to track chronic defaulters and behavioral referrals.</p>
           <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {(settings.exerciseEntries || []).filter(e => e.isDisciplinaryReferral).reverse().slice(0, 4).map(e => (
                 <div key={e.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl text-left">
                    <p className="text-[10px] font-black text-red-700 uppercase">Ref: {e.id.slice(0,8)} • Week {e.week}</p>
                    <p className="text-xs font-bold text-[#0f3460] mt-1">{e.subject} - {e.type}</p>
                    <p className="text-[9px] text-red-400 mt-1 italic">Defaulters Detected: {Object.keys(e.defaulterReasons || {}).length}</p>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Defaulter Logic Placeholder for consistency */}
      {defaulterModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#0f3460]/90 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 space-y-8 border-t-8 border-red-500 animate-fadeIn">
            <div>
               <h3 className="text-2xl font-black uppercase text-red-600 tracking-tighter">Roll Discrepancy Detected</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Number on Roll: {classStudents.length} • Entries Found: {Object.keys(exEntry.pupilScores || {}).length}</p>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
              <p className="text-xs font-bold text-gray-500 italic">Select reason for the following defaulting pupils:</p>
              {defaultersList.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                  <span className="text-11px font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</span>
                  <select 
                    className="p-2 rounded-xl bg-white border-none font-black text-[9px] uppercase outline-none shadow-sm"
                    value={tempDefaulterReasons[s.id] || ''}
                    onChange={e => setTempDefaulterReasons({...tempDefaulterReasons, [s.id]: e.target.value})}
                  >
                    <option value="">-- Choose Reason --</option>
                    <option>Absent from Class</option><option>Refused Task</option><option>Ill Health</option><option>No Writing Material</option><option>Delayed Submission</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setDefaulterModalOpen(false)} className="flex-1 px-8 py-4 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 transition">Review Entry</button>
              <button onClick={() => commitSave(tempDefaulterReasons)} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition-all">Authorize Referral</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentDesk;
