
import React, { useState, useMemo, useEffect } from 'react';
import { GlobalSettings, Student, DailyExerciseEntry, SpecialDisciplinaryLog } from '../types';
import { BLOOM_TAXONOMY, getSubjectsForDepartment, DAYCARE_ACTIVITY_GROUPS, STANDARD_CLASS_RULES } from '../constants';
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
  const [activeHubTab, setActiveHubTab] = useState<'indicators' | 'exercises' | 'disciplinary'>('exercises');
  const [indicatorMode, setIndicatorMode] = useState<'DeepSession' | 'DailyMonitoring' | 'GroupSummary'>('DailyMonitoring');
  const [exerciseMode, setExerciseMode] = useState<'Classwork' | 'Homework'>('Classwork');
  const [disciplinarySubTab, setDisciplinarySubTab] = useState<'automatic' | 'special'>('automatic');
  
  const [defaulterModalOpen, setDefaulterModalOpen] = useState(false);
  const [defaultersList, setDefaultersList] = useState<Student[]>([]);
  const [tempDefaulterReasons, setTempDefaulterReasons] = useState<Record<string, string>>({});

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGroup, setSelectedGroup] = useState<string>(Object.keys(DAYCARE_ACTIVITY_GROUPS)[0]);
  const [activeIndicator, setActiveIndicator] = useState(DAYCARE_ACTIVITY_GROUPS[selectedGroup as keyof typeof DAYCARE_ACTIVITY_GROUPS]?.[0] || '');

  // Special Indiscipline Logic
  const [newRule, setNewRule] = useState('');
  const [specialForm, setSpecialForm] = useState<Partial<SpecialDisciplinaryLog>>({
    studentId: '', type: '', date: new Date().toISOString().split('T')[0], repeatCount: 1,
    correction1: 'Verbal Warning & Classroom Redirect',
    correction2: 'Loss of Recreational Privileges',
    correction3: 'Administrative Referral & Parental Conference'
  });

  const isDaycare = department === 'D&N';

  // Ensure tab validity when switching classes/levels
  useEffect(() => {
    if (!isDaycare && activeHubTab === 'indicators') {
      setActiveHubTab('exercises');
    }
  }, [department, isDaycare]);

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

  const groupSummaryData = useMemo(() => {
    if (indicatorMode !== 'GroupSummary') return null;
    const groupNames = Object.keys(DAYCARE_ACTIVITY_GROUPS);
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
            [indicator]: { ...currentDetails, dailyScores: newDailyScores, sectionA: avg, total: avg } 
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
    setExEntry({ ...exEntry, pupilStatus: {}, pupilScores: {}, bloomTaxonomy: [], strand: '', subStrand: '', indicator: '' });
    setDefaulterModalOpen(false);
  };

  const handleLogSpecialIndiscipline = () => {
    if (!specialForm.studentId || !specialForm.type) {
      notify("Incomplete fields detected. Please check student and type of indiscipline.", "error");
      return;
    }
    const student = classStudents.find(s => s.id === specialForm.studentId);
    const log: SpecialDisciplinaryLog = {
      ...specialForm as SpecialDisciplinaryLog,
      id: crypto.randomUUID(),
      studentName: `${student?.firstName} ${student?.surname}`,
      class: activeClass
    };
    onSettingsChange({ ...settings, specialDisciplinaryLogs: [...(settings.specialDisciplinaryLogs || []), log] });
    notify(`Special Indiscipline Logged for ${log.studentName}`, "success");
    setSpecialForm({ ...specialForm, studentId: '', type: '', repeatCount: 1 });
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    const currentRules = settings.popoutLists.classRules || [...STANDARD_CLASS_RULES];
    onSettingsChange({ ...settings, popoutLists: { ...settings.popoutLists, classRules: [...currentRules, newRule.trim()] } });
    setNewRule('');
  };

  const activeClassRules = settings.popoutLists.classRules || STANDARD_CLASS_RULES;
  const currentIndicators = DAYCARE_ACTIVITY_GROUPS[selectedGroup as keyof typeof DAYCARE_ACTIVITY_GROUPS] || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Branding Header */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" />
        <EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b]" />
      </div>

      <div className="bg-[#0f3460] p-6 rounded-[3rem] text-white flex justify-center gap-4 no-print shadow-xl">
        {isDaycare && (
          <button onClick={() => setActiveHubTab('indicators')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition ${activeHubTab === 'indicators' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>Indicator Terminal</button>
        )}
        <button onClick={() => setActiveHubTab('exercises')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition ${activeHubTab === 'exercises' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>Assessment Log Entry</button>
        <button onClick={() => setActiveHubTab('disciplinary')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition ${activeHubTab === 'disciplinary' ? 'bg-red-600 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>Disciplinary Records</button>
      </div>

      {activeHubTab === 'indicators' && isDaycare ? (
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 border-b pb-8">
                 <div className="space-y-1">
                    <h3 className="text-3xl font-black text-[#0f3460] uppercase tracking-tighter">Preschool Indicator Terminal</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Measure: Emerging (D) • Achieving (A) • Advanced (A+)</p>
                 </div>
                 <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner no-print">
                    <button onClick={() => setIndicatorMode('DailyMonitoring')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${indicatorMode === 'DailyMonitoring' ? 'bg-white text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>Monitoring Grid</button>
                    <button onClick={() => setIndicatorMode('DeepSession')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${indicatorMode === 'DeepSession' ? 'bg-white text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>Deep Session</button>
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
                       <button onClick={() => notify("Routine snapshot saved!", "success")} className="bg-[#2e8b57] text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl">Sync Monitoring</button>
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
                                                  <button key={v} onClick={() => handleIndicatorScore(s.id, ind, v)} className={`w-8 h-8 rounded-lg text-[9px] font-black transition-all ${score === v ? (v === 3 ? 'bg-green-600 text-white' : v === 2 ? 'bg-[#cca43b] text-white' : 'bg-red-500 text-white') : 'bg-gray-100 text-gray-300'}`}>
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
              ) : indicatorMode === 'GroupSummary' ? (
                <div className="space-y-10 animate-fadeIn">
                   <div className="flex justify-between items-center no-print">
                      <h4 className="text-xl font-black text-[#cca43b] uppercase">Activity Group Performance Broad Sheet</h4>
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
                                              ) : <span className="text-gray-300 italic text-[10px]">---</span>}
                                           </td>
                                        );
                                     })}
                                     <td className="p-8 text-center bg-yellow-50/50 font-black text-2xl text-[#cca43b]">{studentTotalAvg > 0 ? studentTotalAvg.toFixed(2) : '--'}</td>
                                  </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   </div>
                </div>
              ) : (
                <div className="p-20 text-center text-gray-300 font-black uppercase italic tracking-widest">Select Mode Above</div>
              )}
           </div>
        </div>
      ) : activeHubTab === 'exercises' ? (
        <div className="space-y-6">
           <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10 border-b pb-10">
                 <div className="space-y-6">
                    <h3 className="text-2xl font-black text-[#0f3460] uppercase">{exerciseMode} Detail</h3>
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
                             <input type="number" className="w-16 p-2 bg-white rounded-lg text-center font-black text-blue-600 shadow-inner" placeholder="Scr" value={exEntry.pupilScores?.[s.id] || ''} onChange={e => setExEntry({...exEntry, pupilScores: {...(exEntry.pupilScores || {}), [s.id]: parseInt(e.target.value)}})} />
                             <div className="flex gap-1">
                                {['M', 'D', 'X'].map(st => (
                                   <button key={st} onClick={() => setExEntry({...exEntry, pupilStatus: {...(exEntry.pupilStatus || {}), [s.id]: (st === 'M' ? 'Marked' : st === 'D' ? 'Defaulter' : 'Missing') as any}})} className={`w-8 h-8 rounded-lg text-[9px] font-black transition ${exEntry.pupilStatus?.[s.id] === (st === 'M' ? 'Marked' : st === 'D' ? 'Defaulter' : 'Missing') ? 'bg-[#0f3460] text-white shadow-md' : 'bg-white text-gray-300'}`}>{st}</button>
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
        <div className="space-y-6">
           <div className="flex justify-center bg-gray-100 p-2 rounded-[2.5rem] w-fit mx-auto no-print shadow-inner">
              <button onClick={() => setDisciplinarySubTab('automatic')} className={`px-10 py-3 rounded-[2rem] text-[10px] font-black uppercase transition ${disciplinarySubTab === 'automatic' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400'}`}>Automatic Referrals</button>
              <button onClick={() => setDisciplinarySubTab('special')} className={`px-10 py-3 rounded-[2rem] text-[10px] font-black uppercase transition ${disciplinarySubTab === 'special' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400'}`}>Special Indiscipline Reports</button>
           </div>

           {disciplinarySubTab === 'automatic' ? (
              <div className="bg-white p-20 rounded-[3rem] shadow-xl border border-gray-100 text-center animate-fadeIn">
                 <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
                 <h3 className="text-2xl font-black text-red-600 uppercase">Institutional Disciplinary Hub (Automatic)</h3>
                 <p className="text-gray-400 font-bold uppercase tracking-widest mt-2 max-w-lg mx-auto">Auto-synced behavioral referrals from exercise defaulters.</p>
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
           ) : (
              <div className="space-y-10 animate-fadeIn">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Special Indiscipline Form */}
                    <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
                       <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4">Log Special Incident</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-gray-400 px-2">Learner Selection</label>
                             <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-xs" value={specialForm.studentId} onChange={e => setSpecialForm({...specialForm, studentId: e.target.value})}>
                                <option value="">-- Select Student --</option>
                                {classStudents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.surname}</option>)}
                             </select>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-gray-400 px-2">Incident Date</label>
                             <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-xs" value={specialForm.date} onChange={e => setSpecialForm({...specialForm, date: e.target.value})} />
                          </div>
                          <div className="md:col-span-2 space-y-1">
                             <label className="text-[9px] font-black uppercase text-gray-400 px-2">Type of Indiscipline</label>
                             <input type="text" placeholder="e.g. Inappropriate Language, Property Damage..." className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-xs" value={specialForm.type} onChange={e => setSpecialForm({...specialForm, type: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-gray-400 px-2">Times Repeated</label>
                             <div className="flex gap-2">
                                {[1, 2, 3].map(v => (
                                   <button key={v} onClick={() => setSpecialForm({...specialForm, repeatCount: v})} className={`flex-1 py-3 rounded-xl font-black transition ${specialForm.repeatCount === v ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>{v}{v === 3 ? '+' : ''}</button>
                                ))}
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4 pt-6 border-t">
                          <h4 className="text-[10px] font-black uppercase text-red-600">Correction Protocol Matrix</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className={`p-4 rounded-2xl border-2 transition ${specialForm.repeatCount === 1 ? 'border-red-500 bg-red-50' : 'border-gray-100 opacity-50'}`}>
                                <span className="text-[8px] font-black uppercase block mb-1">1st Count Measure</span>
                                <textarea className="w-full bg-transparent text-[9px] font-bold italic resize-none" rows={2} value={specialForm.correction1} onChange={e => setSpecialForm({...specialForm, correction1: e.target.value})} />
                             </div>
                             <div className={`p-4 rounded-2xl border-2 transition ${specialForm.repeatCount === 2 ? 'border-red-500 bg-red-50' : 'border-gray-100 opacity-50'}`}>
                                <span className="text-[8px] font-black uppercase block mb-1">2nd Count Measure</span>
                                <textarea className="w-full bg-transparent text-[9px] font-bold italic resize-none" rows={2} value={specialForm.correction2} onChange={e => setSpecialForm({...specialForm, correction2: e.target.value})} />
                             </div>
                             <div className={`p-4 rounded-2xl border-2 transition ${specialForm.repeatCount === 3 ? 'border-red-500 bg-red-50' : 'border-gray-100 opacity-50'}`}>
                                <span className="text-[8px] font-black uppercase block mb-1">3rd Count Measure</span>
                                <textarea className="w-full bg-transparent text-[9px] font-bold italic resize-none" rows={2} value={specialForm.correction3} onChange={e => setSpecialForm({...specialForm, correction3: e.target.value})} />
                             </div>
                          </div>
                       </div>
                       <button onClick={handleLogSpecialIndiscipline} className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.01] transition">Authorize Special Report</button>
                    </div>

                    {/* Class Rules Registry */}
                    <div className="space-y-6">
                       <div className="bg-[#0f3460] p-8 rounded-[3rem] text-white shadow-xl space-y-4">
                          <h4 className="text-sm font-black uppercase text-[#cca43b] tracking-widest border-b border-white/10 pb-2">Class Rules Registry</h4>
                          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                             {activeClassRules.map((rule, i) => (
                                <div key={i} className="flex gap-3 items-start group">
                                   <span className="text-[#cca43b] font-black text-[10px]">{i+1}.</span>
                                   <p className="flex-1 text-[10px] font-bold italic opacity-80 leading-relaxed">{rule}</p>
                                   <button onClick={() => onSettingsChange({...settings, popoutLists: {...settings.popoutLists, classRules: activeClassRules.filter(r => r !== rule)}})} className="text-red-400 opacity-0 group-hover:opacity-100 transition text-[8px] font-black uppercase">Remove</button>
                                </div>
                             ))}
                          </div>
                          <div className="pt-4 border-t border-white/10 space-y-2">
                             <input placeholder="New Class Rule..." className="w-full p-3 bg-white/10 rounded-xl border-none text-[10px] text-white outline-none focus:ring-1 focus:ring-[#cca43b]" value={newRule} onChange={e => setNewRule(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddRule()} />
                             <button onClick={handleAddRule} className="w-full bg-[#cca43b] text-[#0f3460] py-2 rounded-xl text-[9px] font-black uppercase shadow-lg">Append Rule</button>
                          </div>
                       </div>
                       <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Correction Guide</h4>
                          <div className="space-y-3 text-[9px] font-bold text-gray-500 uppercase leading-relaxed">
                             <p>1. Immediate redirection and supportive coaching.</p>
                             <p>2. Temporary exclusion from preferred class activities.</p>
                             <p>3. Formal parental meeting and disciplinary committee referral.</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-6">
                    <h3 className="text-xl font-black text-[#0f3460] uppercase">Incident Audit Trail</h3>
                    <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
                       <table className="w-full text-left text-[11px] border-collapse">
                          <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                             <tr>
                                <th className="p-4 border-b">Date</th>
                                <th className="p-4 border-b">Learner</th>
                                <th className="p-4 border-b">Offense Type</th>
                                <th className="p-4 border-b text-center">Repeat</th>
                                <th className="p-4 border-b">Resolution</th>
                             </tr>
                          </thead>
                          <tbody>
                             {(settings.specialDisciplinaryLogs || []).filter(l => l.class === activeClass).reverse().map(log => (
                                <tr key={log.id} className="border-b hover:bg-gray-50 transition">
                                   <td className="p-4 font-mono text-gray-400">{log.date}</td>
                                   <td className="p-4 font-black uppercase text-[#0f3460]">{log.studentName}</td>
                                   <td className="p-4 font-bold text-red-600 uppercase italic">{log.type}</td>
                                   <td className="p-4 text-center font-black text-lg text-red-400">{log.repeatCount}</td>
                                   <td className="p-4 italic text-gray-500 text-[10px]">
                                      {log.repeatCount === 1 ? log.correction1 : log.repeatCount === 2 ? log.correction2 : log.correction3}
                                   </td>
                                </tr>
                             ))}
                             {(!settings.specialDisciplinaryLogs || settings.specialDisciplinaryLogs.filter(l => l.class === activeClass).length === 0) && (
                                <tr><td colSpan={5} className="p-20 text-center text-gray-300 font-black uppercase italic tracking-widest">No special records for this class.</td></tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           )}
        </div>
      )}

      {/* Defaulter Logic */}
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
