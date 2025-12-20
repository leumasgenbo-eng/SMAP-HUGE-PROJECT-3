
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
    hasTestItemPrepared: false, handwritingRating: 5, clarityRating: 5
  });

  const subjectList = getSubjectsForDepartment(department);
  const classSize = students.length;

  const handleSave = () => {
    const isLate = new Date(entry.date || '').getDay() === 0; // Simple placeholder logic
    const updated = [...(settings.exerciseEntries || []), { 
      ...entry, 
      id: crypto.randomUUID(), 
      isLateSubmission: isLate 
    } as DailyExerciseEntry];
    onSettingsChange({ ...settings, exerciseEntries: updated });
    notify("Daily Exercise Entry Logged Successfully!", "success");
    setEntry({ ...entry, pupilStatus: {}, bloomTaxonomy: [] });
  };

  const handleStatusChange = (pid: string, status: 'Marked' | 'Defaulter' | 'Missing') => {
    setEntry(prev => ({
      ...prev,
      pupilStatus: { ...(prev.pupilStatus || {}), [pid]: status }
    }));
  };

  // Compliance Ratios
  const complianceStats = useMemo(() => {
    const classEntries = (settings.exerciseEntries || []).filter(e => e.subject === entry.subject);
    const total = classEntries.length;
    const late = classEntries.filter(e => e.isLateSubmission).length;
    return { total, lateRate: total > 0 ? (late / total) * 100 : 0 };
  }, [settings.exerciseEntries, entry.subject]);

  const sendInvitation = () => {
    // Determine free period logic (Placeholder)
    const facilitator = settings.facilitatorMapping[entry.subject!] || "Facilitator";
    const msg = `Dear ${facilitator}, you are invited to the office at Period L5 (Your free period) for exercise review.`;
    notify("Invitation link shared with facilitator.", "info");
    console.log(msg);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#2e8b57] p-8 rounded-[3rem] text-white flex justify-between items-center shadow-xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Exercise Assessment</h2>
          <div className="flex gap-4 mt-4">
            {['entry', 'analysis', 'compliance'].map(t => (
              <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition ${activeTab === t ? 'bg-white text-[#2e8b57]' : 'border-white/20'}`}>
                {t === 'entry' ? 'Daily Exercise Entry' : t === 'analysis' ? 'Exercise Analysis Dashboard' : 'Compliance & Critical Ratios'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={sendInvitation} className="bg-white text-[#2e8b57] px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">Send Office Invite</button>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 min-h-[500px]">
        {activeTab === 'entry' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="space-y-6 lg:col-span-1">
               <h3 className="text-xl font-black text-[#0f3460] uppercase border-b pb-4">Activity Parameters</h3>
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
                  <input placeholder="Strand" className="w-full p-4 bg-gray-50 rounded-2xl" value={entry.strand} onChange={e => setEntry({...entry, strand: e.target.value})} />
                  <input placeholder="Sub-Strand" className="w-full p-4 bg-gray-50 rounded-2xl" value={entry.subStrand} onChange={e => setEntry({...entry, subStrand: e.target.value})} />
                  <input placeholder="Indicator" className="w-full p-4 bg-gray-50 rounded-2xl" value={entry.indicator} onChange={e => setEntry({...entry, indicator: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl" value={entry.date} onChange={e => setEntry({...entry, date: e.target.value})} />
                    <div className="flex flex-col justify-center bg-gray-50 rounded-2xl p-4 text-center">
                       <span className="text-[8px] font-black text-gray-400 uppercase">Class Enrolment</span>
                       <span className="text-lg font-black">{classSize}</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl cursor-pointer">
                    <input type="checkbox" className="w-5 h-5" checked={entry.hasTestItemPrepared} onChange={e => setEntry({...entry, hasTestItemPrepared: e.target.checked})} />
                    <span className="text-[10px] font-black text-blue-900 uppercase">Test Items Prepared?</span>
                  </label>
               </div>
            </div>

            <div className="space-y-6 lg:col-span-1 border-x px-10 border-gray-50">
               <h3 className="text-xl font-black text-[#0f3460] uppercase border-b pb-4">Bloom's & Ratings</h3>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400">Nature of Questions (Taxonomy)</label>
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
                    <div>
                      <div className="flex justify-between text-[9px] font-black uppercase text-gray-400 mb-1">
                        <span>Handwriting Legibility</span>
                        <span>{entry.handwritingRating}/10</span>
                      </div>
                      <input type="range" min="1" max="10" className="w-full accent-[#2e8b57]" value={entry.handwritingRating} onChange={e => setEntry({...entry, handwritingRating: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] font-black uppercase text-gray-400 mb-1">
                        <span>Clarity & Appearance</span>
                        <span>{entry.clarityRating}/10</span>
                      </div>
                      <input type="range" min="1" max="10" className="w-full accent-[#2e8b57]" value={entry.clarityRating} onChange={e => setEntry({...entry, clarityRating: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400">Pupils who spell well (Count)</label>
                       <input type="number" max={classSize} className="w-full p-4 bg-gray-50 rounded-2xl" value={entry.spellingCount} onChange={e => setEntry({...entry, spellingCount: parseInt(e.target.value)})} />
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6 lg:col-span-1">
               <h3 className="text-xl font-black text-[#0f3460] uppercase border-b pb-4">Pupil Tracking</h3>
               <div className="h-[400px] overflow-y-auto pr-2 space-y-2">
                  {students.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                       <span className="text-[10px] font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</span>
                       <div className="flex gap-1">
                          {['Marked', 'Defaulter', 'Missing'].map(st => (
                            <button 
                              key={st} 
                              onClick={() => handleStatusChange(s.id, st as any)}
                              className={`w-6 h-6 rounded flex items-center justify-center text-[8px] font-black uppercase ${entry.pupilStatus?.[s.id] === st ? 'bg-[#0f3460] text-white' : 'bg-white text-gray-300 border border-gray-100'}`}
                              title={st}
                            >
                              {st[0]}
                            </button>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
               <button onClick={handleSave} className="w-full bg-[#2e8b57] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition mt-4">Log Exercise Performance</button>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
           <div className="space-y-10">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-[#0f3460] uppercase">Cumulative Exercise Impact</h3>
                 <span className="text-[10px] font-black text-gray-400 uppercase">Subject: {entry.subject}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-gray-400 mb-2">Total Exercises Given</span>
                    <span className="text-4xl font-black text-[#0f3460]">{complianceStats.total}</span>
                 </div>
                 <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-gray-400 mb-2">Lateness Index</span>
                    <span className="text-4xl font-black text-red-500">{complianceStats.lateRate.toFixed(1)}%</span>
                 </div>
                 <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-gray-400 mb-2">Handwriting Trend</span>
                    <span className="text-4xl font-black text-[#2e8b57]">Rising</span>
                 </div>
                 <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-gray-400 mb-2">Bloom's Coverage</span>
                    <span className="text-4xl font-black text-[#cca43b]">85%</span>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'compliance' && (
           <div className="space-y-10">
              <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100">
                 <h4 className="text-xs font-black text-red-700 uppercase mb-2">Attention Required: Differentiated Learners</h4>
                 <p className="text-[11px] font-medium text-red-900 leading-relaxed italic">The following group of learners show a consistent "Defaulter" status in exercises. Differentiation strategies are recommended for upcoming lesson cycles.</p>
                 <div className="mt-4 flex flex-wrap gap-2">
                    {students.slice(0,3).map(s => <span key={s.id} className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-red-600 border border-red-100 uppercase">{s.firstName} {s.surname}</span>)}
                 </div>
              </div>
              <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
                 <table className="w-full text-left text-[10px]">
                    <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                       <tr><th className="p-4">Subject</th><th className="p-4">Exercises/Week</th><th className="p-4">Compliance Status</th><th className="p-4">Action</th></tr>
                    </thead>
                    <tbody>
                       {subjectList.map(s => (
                         <tr key={s} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-black uppercase">{s}</td>
                            <td className="p-4 font-bold">2 / Week (Std: 2)</td>
                            <td className="p-4"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-black uppercase text-[8px]">CONFORMED</span></td>
                            <td className="p-4"><button className="text-blue-500 font-black uppercase">Review</button></td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseAssessment;
