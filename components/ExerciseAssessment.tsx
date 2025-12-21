
import React, { useState, useMemo } from 'react';
import { GlobalSettings, DailyExerciseEntry, Student } from '../types';
import { BLOOM_TAXONOMY, getSubjectsForDepartment } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  department: string;
  activeClass: string;
  students: Student[];
  notify: any;
}

const ExerciseAssessment: React.FC<Props> = ({ settings, onSettingsChange, department, activeClass, students, notify }) => {
  const [activeTab, setActiveTab] = useState<'entry' | 'analysis' | 'compliance'>('entry');
  const [entry, setEntry] = useState<Partial<DailyExerciseEntry>>({
    subject: getSubjectsForDepartment(department)[0],
    week: 1, type: 'Classwork', bloomTaxonomy: [], pupilStatus: {},
    hasTestItemPrepared: false, handwritingRating: 5, clarityRating: 5, appearanceRating: 5
  });

  const subjectList = getSubjectsForDepartment(department);
  const classSize = students.length;

  const handleSave = () => {
    // Logic to determine if late submission based on timetable (mocked here)
    const isLate = new Date().getHours() > 16; 
    const newEntry = { 
      ...entry, 
      id: crypto.randomUUID(), 
      isLateSubmission: isLate 
    } as DailyExerciseEntry;

    // Fixed: Updated logic to use the new exerciseEntries property in GlobalSettings
    const updated = [...(settings.exerciseEntries || []), newEntry];
    onSettingsChange({ ...settings, exerciseEntries: updated });
    notify("Daily Exercise Entry Logged Successfully!", "success");
    setEntry({ ...entry, pupilStatus: {}, bloomTaxonomy: [], indicator: '', strand: '', subStrand: '' });
  };

  const handleStatusChange = (pid: string, status: 'Marked' | 'Defaulter' | 'Missing') => {
    setEntry(prev => ({
      ...prev,
      pupilStatus: { ...(prev.pupilStatus || {}), [pid]: status }
    }));
  };

  // Compliance Ratios Calculations
  const complianceData = useMemo(() => {
    const entries = settings.exerciseEntries || [];
    const classEntries = entries.filter(e => e.subject === entry.subject);
    
    // Sort subjects by performance (average handwriting + clarity)
    const performanceMap: Record<string, number> = {};
    subjectList.forEach(s => {
      const subjEntries = entries.filter(e => e.subject === s);
      const avg = subjEntries.length > 0 
        ? subjEntries.reduce((acc, curr) => acc + (curr.handwritingRating + curr.clarityRating) / 2, 0) / subjEntries.length
        : 0;
      performanceMap[s] = avg;
    });

    const sortedSubjects = [...subjectList].sort((a, b) => performanceMap[b] - performanceMap[a]);

    return { 
      classEntries, 
      sortedSubjects,
      totalExercises: classEntries.length,
      lateCount: classEntries.filter(e => e.isLateSubmission).length,
      differentiationNeeded: students.filter(s => {
        const markedCount = classEntries.filter(e => e.pupilStatus[s.id] === 'Marked').length;
        return classEntries.length > 3 && markedCount / classEntries.length < 0.5;
      })
    };
  }, [settings.exerciseEntries, entry.subject, students, subjectList]);

  const sendInvitation = () => {
    const facilitator = settings.facilitatorMapping[entry.subject!] || "Facilitator";
    // Logic to determine free period from timetable
    const freePeriod = "L5 (1:10-1:55)"; 
    const msg = `Dear Sir/Madam ${facilitator}, you are invited to the office at ${freePeriod} for exercise performance review.`;
    notify("Invitation link shared with facilitator!", "info");
    console.log("SMS/Link Message:", msg);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#2e8b57] p-8 rounded-[3rem] text-white flex justify-between items-center shadow-xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Exercise Performance Desk</h2>
          <div className="flex gap-4 mt-4">
            {['entry', 'analysis', 'compliance'].map(t => (
              <button 
                key={t} 
                onClick={() => setActiveTab(t as any)} 
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition ${activeTab === t ? 'bg-white text-[#2e8b57]' : 'border-white/20'}`}
              >
                {t === 'entry' ? 'Daily Exercise Entry' : t === 'analysis' ? 'Analysis Dashboard' : 'Compliance & Ratios'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={sendInvitation} className="bg-white text-[#2e8b57] px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">Send Office Invite</button>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 min-h-[500px]">
        {activeTab === 'entry' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Column 1: Params */}
            <div className="space-y-6">
               <h3 className="text-xl font-black text-[#0f3460] uppercase border-b pb-4 flex items-center gap-2">
                 <span className="w-2 h-2 bg-[#2e8b57] rounded-full"></span> Daily Parameters
               </h3>
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400">Subject</label>
                      <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={entry.subject} onChange={e => setEntry({...entry, subject: e.target.value})}>
                        {subjectList.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400">Week (1-16)</label>
                      <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" min="1" max="16" value={entry.week} onChange={e => setEntry({...entry, week: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Strand" className="w-full p-4 bg-gray-50 rounded-2xl" value={entry.strand} onChange={e => setEntry({...entry, strand: e.target.value})} />
                    <input placeholder="Sub-Strand" className="w-full p-4 bg-gray-50 rounded-2xl" value={entry.subStrand} onChange={e => setEntry({...entry, subStrand: e.target.value})} />
                  </div>
                  <input placeholder="Indicator" className="w-full p-4 bg-gray-50 rounded-2xl" value={entry.indicator} onChange={e => setEntry({...entry, indicator: e.target.value})} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400">Date</label>
                      <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl" value={entry.date} onChange={e => setEntry({...entry, date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400">Type</label>
                      <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={entry.type} onChange={e => setEntry({...entry, type: e.target.value as any})}>
                        <option>Classwork</option><option>Homework</option><option>Project</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl">
                     <span className="text-[10px] font-black text-blue-900 uppercase">Class Enrolment: {classSize}</span>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" checked={entry.hasTestItemPrepared} onChange={e => setEntry({...entry, hasTestItemPrepared: e.target.checked})} />
                        <span className="text-[10px] font-black uppercase">Test Item Prepared</span>
                     </label>
                  </div>
               </div>
            </div>

            {/* Column 2: Bloom's & Quality */}
            <div className="space-y-6 lg:col-span-1 border-x px-10 border-gray-50">
               <h3 className="text-xl font-black text-[#0f3460] uppercase border-b pb-4 flex items-center gap-2">
                 <span className="w-2 h-2 bg-[#cca43b] rounded-full"></span> Nature & Quality
               </h3>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400">Bloom's Taxonomy Coverage</label>
                    <div className="grid grid-cols-2 gap-2">
                      {BLOOM_TAXONOMY.map(b => (
                        <button 
                          key={b} 
                          onClick={() => setEntry({...entry, bloomTaxonomy: entry.bloomTaxonomy?.includes(b) ? entry.bloomTaxonomy.filter(i => i !== b) : [...(entry.bloomTaxonomy || []), b]})}
                          className={`p-2 rounded-xl text-[9px] font-black uppercase transition ${entry.bloomTaxonomy?.includes(b) ? 'bg-[#0f3460] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <QualitySlider label="Handwriting Legibility" value={entry.handwritingRating || 5} onChange={v => setEntry({...entry, handwritingRating: v})} />
                    <QualitySlider label="Handwriting Clarity" value={entry.clarityRating || 5} onChange={v => setEntry({...entry, clarityRating: v})} />
                    <QualitySlider label="Book Appearance" value={entry.appearanceRating || 5} onChange={v => setEntry({...entry, appearanceRating: v})} />
                    
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400">Correct Spellers Count (in book)</label>
                       <input type="number" max={classSize} className="w-full p-4 bg-gray-50 rounded-2xl" value={entry.spellingCount} onChange={e => setEntry({...entry, spellingCount: parseInt(e.target.value)})} />
                    </div>

                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400">Confirmed with Pupil</label>
                       <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" value={entry.confirmedWithPupilId} onChange={e => setEntry({...entry, confirmedWithPupilId: e.target.value})}>
                          <option value="">Select Witness...</option>
                          {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.surname}</option>)}
                       </select>
                    </div>
                  </div>
               </div>
            </div>

            {/* Column 3: Pupil List */}
            <div className="space-y-6">
               <h3 className="text-xl font-black text-[#0f3460] uppercase border-b pb-4 flex items-center gap-2">
                 <span className="w-2 h-2 bg-red-500 rounded-full"></span> Pupil Register
               </h3>
               <div className="h-[450px] overflow-y-auto pr-2 space-y-2">
                  {students.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-white border-2 border-transparent hover:border-gray-100 transition">
                       <span className="text-[10px] font-black uppercase text-[#0f3460] truncate mr-4">{s.firstName} {s.surname}</span>
                       <div className="flex gap-1">
                          {['Marked', 'Defaulter', 'Missing'].map(st => (
                            <button 
                              key={st} 
                              onClick={() => handleStatusChange(s.id, st as any)}
                              className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${entry.pupilStatus?.[s.id] === st ? (st === 'Marked' ? 'bg-green-500 text-white' : st === 'Defaulter' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white') : 'bg-white text-gray-300'}`}
                            >
                              {st[0]}
                            </button>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
               <button onClick={handleSave} className="w-full bg-[#2e8b57] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition mt-4">Finalize Daily Entry</button>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
           <div className="space-y-12">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-[#0f3460] uppercase">Cumulative Impact Dashboard</h3>
                 <span className="bg-[#cca43b]/10 text-[#cca43b] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Active Week: 1-16 Cycle</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <AnalysisCard label="Total Exercises" value={complianceData.totalExercises} trend="+12% from last week" />
                 <AnalysisCard label="Late Submissions" value={complianceData.lateCount} color="text-red-500" />
                 <AnalysisCard label="Avg handwriting" value="7.4/10" color="text-[#2e8b57]" />
                 <AnalysisCard label="Spelling Index" value="68%" trend="Steady" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100">
                    <h4 className="text-xs font-black uppercase text-gray-400 mb-6">Taxonomy Coverage Map</h4>
                    <div className="space-y-4">
                       {BLOOM_TAXONOMY.map((b, i) => (
                         <div key={b} className="space-y-1">
                            <div className="flex justify-between text-[9px] font-black uppercase"><span>{b}</span><span>{90 - i*10}%</span></div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-[#0f3460]" style={{width: `${90 - i*10}%`}}></div></div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100">
                    <h4 className="text-xs font-black uppercase text-gray-400 mb-6">Quality Trend (Last 5 Logs)</h4>
                    <div className="flex items-end justify-between h-40 pb-4 border-b border-gray-200">
                       {[6, 8, 5, 9, 7].map((v, i) => (
                         <div key={i} className="w-12 bg-[#cca43b] rounded-t-xl transition-all hover:opacity-80 cursor-pointer" style={{height: `${v*10}%`}}></div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'compliance' && (
           <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-black text-[#0f3460] uppercase">Subject Performance Hierarchy</h3>
                    <div className="overflow-x-auto rounded-3xl border border-gray-100">
                       <table className="w-full text-left text-[10px]">
                          <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                             <tr><th className="p-4">Rank</th><th className="p-4">Subject</th><th className="p-4">Compliance Status</th><th className="p-4">Action</th></tr>
                          </thead>
                          <tbody>
                             {complianceData.sortedSubjects.map((s, idx) => (
                               <tr key={s} className="border-b hover:bg-gray-50">
                                  <td className="p-4 font-black">#{idx + 1}</td>
                                  <td className="p-4 font-black uppercase text-[#0f3460]">{s}</td>
                                  <td className="p-4">
                                     <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${idx < 3 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {idx < 3 ? 'EXCELLENT CONFORMANCE' : 'NEEDS ATTENTION'}
                                     </span>
                                  </td>
                                  <td className="p-4"><button onClick={sendInvitation} className="text-blue-500 font-black uppercase hover:underline">Invite Office</button></td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
                 
                 <div className="bg-red-50 p-8 rounded-[3rem] border border-red-100 space-y-6">
                    <h4 className="text-xs font-black text-red-700 uppercase">Differentiation Required</h4>
                    <p className="text-[11px] text-red-900 leading-relaxed italic">The following learners have consistent deficits in exercise participation. Individualized learning paths are required.</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                       {complianceData.differentiationNeeded.length > 0 ? complianceData.differentiationNeeded.map(s => (
                         <div key={s.id} className="p-3 bg-white rounded-2xl flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase">{s.firstName} {s.surname}</span>
                            <span className="text-[8px] font-bold text-red-500">CRITICAL</span>
                         </div>
                       )) : <p className="text-gray-400 text-xs italic">No critical cases detected currently.</p>}
                    </div>
                    <button className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">Generate Support Plan</button>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

const QualitySlider = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
  <div>
    <div className="flex justify-between text-[9px] font-black uppercase text-gray-400 mb-1">
      <span>{label}</span>
      <span>{value}/10</span>
    </div>
    <input 
      type="range" min="1" max="10" 
      className="w-full accent-[#2e8b57]" 
      value={value} 
      onChange={e => onChange(parseInt(e.target.value))} 
    />
  </div>
);

const AnalysisCard = ({ label, value, trend, color = "text-[#0f3460]" }: any) => (
  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center text-center">
    <span className="text-[9px] font-black uppercase text-gray-400 mb-2">{label}</span>
    <span className={`text-4xl font-black ${color}`}>{value}</span>
    {trend && <span className="text-[8px] font-black text-gray-300 mt-2 uppercase">{trend}</span>}
  </div>
);

export default ExerciseAssessment;
