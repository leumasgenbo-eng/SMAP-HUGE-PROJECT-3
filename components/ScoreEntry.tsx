
import React, { useState } from 'react';
import { Student, GlobalSettings } from '../types';
import EditableField from './EditableField';

interface Props {
  students: Student[];
  onUpdate: (students: Student[]) => void;
  onSave: () => void;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  subjectList: string[];
  department: string;
  activeClass: string;
}

const ScoreEntry: React.FC<Props> = ({ students, onUpdate, onSave, settings, onSettingsChange, subjectList, department, activeClass }) => {
  const [selectedSubject, setSelectedSubject] = useState(subjectList[0] || '');
  const [activeTab, setActiveTab] = useState<'term' | 'daily' | 'mock'>('term');
  const [showDailyPopout, setShowDailyPopout] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const isEarlyChildhood = department === 'Daycare' || department === 'Nursery' || department === 'KG' || department === 'D&N';
  const isBasic9 = activeClass === 'Basic 9';

  // Retrieve SBA Configuration for the current class and subject to use as thresholds
  const sbaConfig = settings.sbaConfigs?.[activeClass]?.[selectedSubject] || {
    cat1: { marks: 30 },
    cat2: { marks: 40 },
    cat3: { marks: 30 }
  };

  const thresholds = {
    sectionA: sbaConfig.cat1?.marks || 30, // CAT 1,4,7 (Ind)
    sectionC: sbaConfig.cat2?.marks || 40, // CAT 2,5,8 (Grp)
    sectionB: sbaConfig.cat3?.marks || 30, // CAT 3,6,9 (Ind)
  };
  
  const handleScoreChange = (id: string, section: 'sectionA' | 'sectionB' | 'sectionC', val: number) => {
    const updated = students.map(s => {
      if (s.id === id) {
        const currentDetails = s.scoreDetails?.[selectedSubject] || { 
          total: 0, 
          grade: 'F9', 
          facilitatorRemark: '', 
          sectionA: 0, 
          sectionB: 0, 
          sectionC: 0, 
          dailyScores: {} 
        };
        const details = { ...currentDetails };
        
        // Apply thresholds from SBA Config
        if (section === 'sectionA') details.sectionA = Math.min(val, thresholds.sectionA);
        if (section === 'sectionB') details.sectionB = Math.min(val, thresholds.sectionB);
        if (section === 'sectionC') details.sectionC = Math.min(val, thresholds.sectionC);
        
        if (isEarlyChildhood) {
          details.total = Math.round(((details.sectionA || 0) + (details.sectionB || 0)) / 2);
        } else if (activeTab === 'mock') {
          // Mocks usually have their own standard (e.g. 30/70) but we respect the logic
          details.total = Math.min((details.sectionA || 0) + (details.sectionB || 0), 100);
        } else {
          details.total = Math.min((details.sectionA || 0) + (details.sectionB || 0) + (details.sectionC || 0), 100);
        }
        return { ...s, scoreDetails: { ...(s.scoreDetails || {}), [selectedSubject]: details } };
      }
      return s;
    });
    onUpdate(updated);
  };

  const handleDailyScoreUpdate = (id: string, date: string, score: number) => {
    const updated = students.map(s => {
      if (s.id === id) {
        const currentDetails = s.scoreDetails?.[selectedSubject] || { 
          total: 0, 
          grade: 'F9', 
          facilitatorRemark: '', 
          sectionA: 0, 
          sectionB: 0, 
          sectionC: 0, 
          dailyScores: {} 
        };
        const details = { ...currentDetails };
        details.dailyScores = { ...(details.dailyScores || {}), [date]: score };
        
        const scores = Object.values(details.dailyScores);
        // Daily average is capped by CAT 1 threshold as it feeds into sectionA
        details.sectionA = Math.min(Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1)), thresholds.sectionA);
        
        return { ...s, scoreDetails: { ...(s.scoreDetails || {}), [selectedSubject]: details } };
      }
      return s;
    });
    onUpdate(updated);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black text-[#0f3460] uppercase tracking-tighter leading-none">Result Management Hub</h2>
            <span className="bg-[#0f3460] text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">Class: {activeClass}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
             <div className="flex items-center bg-[#cca43b] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm">
               {isEarlyChildhood ? 'Early Childhood Dept' : 'Active Session: '}
               {!isEarlyChildhood && (
                 <EditableField 
                   value={settings.academicYear} 
                   onSave={(v) => onSettingsChange({...settings, academicYear: v})} 
                   className="ml-2 bg-transparent text-white border-none p-0 inline-block w-auto"
                 />
               )}
             </div>
             <div className="bg-blue-50 text-blue-800 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase border border-blue-100">
               Allocation: {thresholds.sectionA} | {thresholds.sectionC} | {thresholds.sectionB}
             </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <select 
            className="bg-[#f4f6f7] border-none rounded-2xl p-4 font-black text-[#0f3460] text-sm shadow-inner min-w-[200px]" 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button onClick={() => setActiveTab('term')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'term' ? 'bg-white text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>Cumulative</button>
            <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'daily' ? 'bg-white text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>Daily Assessment</button>
            {isBasic9 && (
              <button onClick={() => setActiveTab('mock')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'mock' ? 'bg-white text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>Mock Scores</button>
            )}
          </div>
          <button onClick={onSave} className="bg-[#0f3460] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Finalize ledger</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        {activeTab === 'term' || activeTab === 'mock' ? (
          <table className="w-full text-sm">
            <thead className="bg-[#f4f6f7] text-[#0f3460]">
              <tr className="text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                <th className="p-6 text-left">Pupil Name</th>
                {activeTab === 'mock' ? (
                  <>
                    <th className="p-6 text-center">Section A (30)</th>
                    <th className="p-6 text-center">Section B (70)</th>
                  </>
                ) : !isEarlyChildhood ? (
                  <>
                    <th className="p-6 text-center">CAT 1,4,7 ({thresholds.sectionA})</th>
                    <th className="p-6 text-center">CAT 2,5,8 ({thresholds.sectionC})</th>
                    <th className="p-6 text-center">CAT 3,6,9 ({thresholds.sectionB})</th>
                  </>
                ) : (
                  <>
                    <th className="p-6 text-center">Daily Indicator Avg</th>
                    <th className="p-6 text-center">Observation Pts</th>
                  </>
                )}
                <th className="p-6 text-center bg-blue-50/50">Total</th>
                <th className="p-6 text-left">Facilitator Remark</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center font-black uppercase text-gray-300 italic">No Admitted Students Found in {activeClass}</td></tr>
              ) : students.map(s => {
                const details = s.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, sectionC: 0, total: 0, facilitatorRemark: '' };
                return (
                  <tr key={s.id} className="border-b hover:bg-blue-50/10 transition">
                    <td className="p-6 font-black text-[#0f3460] uppercase">{s.firstName} {s.surname}</td>
                    {activeTab === 'mock' ? (
                      <>
                        <td className="p-6 text-center">
                          <input type="number" max={30} className="w-16 bg-gray-50 p-2 rounded-xl text-center font-black" value={details.sectionA} onChange={e => handleScoreChange(s.id, 'sectionA', parseInt(e.target.value) || 0)} />
                        </td>
                        <td className="p-6 text-center">
                          <input type="number" max={70} className="w-16 bg-gray-50 p-2 rounded-xl text-center font-black" value={details.sectionB} onChange={e => handleScoreChange(s.id, 'sectionB', parseInt(e.target.value) || 0)} />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-6 text-center">
                          <input type="number" max={thresholds.sectionA} className="w-16 bg-gray-50 p-2 rounded-xl text-center font-black" value={details.sectionA} onChange={e => handleScoreChange(s.id, 'sectionA', parseInt(e.target.value) || 0)} />
                        </td>
                        {!isEarlyChildhood && (
                          <td className="p-6 text-center">
                            <input type="number" max={thresholds.sectionC} className="w-16 bg-gray-50 p-2 rounded-xl text-center font-black" value={details.sectionC} onChange={e => handleScoreChange(s.id, 'sectionC', parseInt(e.target.value) || 0)} />
                          </td>
                        )}
                        <td className="p-6 text-center">
                          <input type="number" max={thresholds.sectionB} className="w-16 bg-gray-50 p-2 rounded-xl text-center font-black" value={details.sectionB} onChange={e => handleScoreChange(s.id, 'sectionB', parseInt(e.target.value) || 0)} />
                        </td>
                      </>
                    )}
                    <td className="p-6 text-center font-black text-2xl text-[#2e8b57] bg-blue-50/20">{details.total}</td>
                    <td className="p-6"><input className="w-full bg-transparent border-b border-gray-100 text-[10px] italic" value={details.facilitatorRemark} onChange={e => handleScoreChange(s.id, 'facilitatorRemark' as any, e.target.value as any)} placeholder="Observations..." /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Daily assessment of subject score</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Recording individual indicator progress for {activeClass}</p>
              </div>
              <div className="flex gap-3 items-center">
                <input type="date" className="p-2 rounded-xl bg-gray-50 border-none font-bold text-xs" value={newDate} onChange={e => setNewDate(e.target.value)} />
                <button onClick={() => setShowDailyPopout(true)} className="bg-[#cca43b] text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">+ Add Subject-Indicator</button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#f4f6f7] text-[#0f3460] uppercase text-[9px] font-black">
                <tr>
                  <th className="p-4 text-left">Pupil Name</th>
                  <th className="p-4 text-center">Max Score To</th>
                  <th className="p-4 text-center">Indicator Assessed</th>
                  <th className="p-4 text-center">Total Average (Indicator)</th>
                  <th className="p-4 text-center bg-blue-50">Average Daily Score (%)</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const details = s.scoreDetails?.[selectedSubject];
                  const dailyCount = details?.dailyScores ? Object.keys(details.dailyScores).length : 0;
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4 font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</td>
                      <td className="p-4 text-center font-bold text-gray-400">{thresholds.sectionA}</td>
                      <td className="p-4 text-center font-bold text-gray-400">{dailyCount} Entries</td>
                      <td className="p-4 text-center font-black text-lg text-[#cca43b]">{details?.sectionA || 0}</td>
                      <td className="p-4 text-center font-black text-xl text-[#2e8b57] bg-blue-50/30">{Math.round(((details?.sectionA || 0) / thresholds.sectionA) * 100)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDailyPopout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0f3460]/80 backdrop-blur-md p-10 animate-fadeIn">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#cca43b] p-8 text-white flex justify-between items-center">
               <div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Daily Subject Entry Score Ledger</h3>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{selectedSubject} • {activeClass} • {newDate}</p>
               </div>
               <button onClick={() => setShowDailyPopout(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition text-2xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-10">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[#0f3460] uppercase text-[10px] font-black border-b">
                    <tr>
                      <th className="p-4">Pupil Name</th>
                      <th className="p-4 text-center">To Score (Max)</th>
                      <th className="p-4 text-center">Score Obtained</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="border-b hover:bg-yellow-50/30">
                        <td className="p-4 font-black uppercase">{s.firstName} {s.surname}</td>
                        <td className="p-4 text-center font-bold text-gray-300">{thresholds.sectionA}</td>
                        <td className="p-4 text-center">
                          <input 
                            type="number" 
                            max={thresholds.sectionA}
                            className="w-24 bg-gray-50 p-3 rounded-xl text-center font-black outline-none focus:ring-2 focus:ring-[#cca43b] shadow-inner" 
                            value={s.scoreDetails?.[selectedSubject]?.dailyScores?.[newDate] || 0} 
                            onChange={e => handleDailyScoreUpdate(s.id, newDate, parseInt(e.target.value) || 0)} 
                          />
                        </td>
                        <td className="p-4 text-center">
                           <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[8px] font-black uppercase">Recorded</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
            <div className="p-8 bg-gray-50 border-t flex justify-between items-center">
              <p className="text-[10px] font-bold text-gray-400 italic">Scores are auto-averaged and capped by the CAT 1 threshold ({thresholds.sectionA}).</p>
              <button onClick={() => setShowDailyPopout(false)} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition">Sync with Broad Sheet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreEntry;
