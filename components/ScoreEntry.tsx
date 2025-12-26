
import React, { useState, useMemo } from 'react';
import { Student, GlobalSettings, SBAConfig, CATConfig, DailyExerciseEntry, GradingScaleEntry } from '../types';
import { DAYCARE_ACTIVITY_GROUPS, BLOOM_TAXONOMY } from '../constants';
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
  notify: any;
  isMockMode?: boolean;
}

const ScoreEntry: React.FC<Props> = ({ students, onUpdate, onSave, settings, onSettingsChange, subjectList, department, activeClass, notify, isMockMode = false }) => {
  const [selectedSubject, setSelectedSubject] = useState(subjectList[0] || '');
  const [hubMode, setHubMode] = useState<'sba' | 'finals' | 'config'>(isMockMode ? 'finals' : 'sba');
  const [sbaSubTab, setSbaSubTab] = useState<'exercises' | 'cat'>('exercises');

  const terminalConfig = settings.terminalConfigs[activeClass] || { sectionAMax: 30, sectionBMax: 70 };
  
  // Science Exception Logic listening to global scienceThreshold
  const isScience = selectedSubject.toLowerCase().includes('science');
  const scienceMax = settings.scienceThreshold || 140;
  const activeThresholds = (isScience && scienceMax === 140) 
    ? { a: 40, b: 100 } 
    : { a: terminalConfig.sectionAMax, b: terminalConfig.sectionBMax };
  const rawSum = activeThresholds.a + activeThresholds.b;

  const handleScoreChange = (id: string, field: string, val: string) => {
    const updated = students.map(s => {
      if (s.id === id) {
        const currentDetails = s.scoreDetails?.[selectedSubject] || { 
          total: 0, grade: 'F9', facilitatorRemark: '', 
          sectionA: 0, sectionB: 0, mockObj: 0, mockTheory: 0 
        };
        const details = { ...currentDetails };
        
        if (field === 'facilitatorRemark') {
          details.facilitatorRemark = val;
        } else {
          let numericVal = parseInt(val) || 0;
          if (field === 'mockObj') details.mockObj = Math.min(numericVal, activeThresholds.a);
          if (field === 'mockTheory') details.mockTheory = Math.min(numericVal, activeThresholds.b);
        }
        
        return { ...s, scoreDetails: { ...(s.scoreDetails || {}), [selectedSubject]: details } };
      }
      return s;
    });
    onUpdate(updated);
  };

  const currentSbaConfig: SBAConfig = settings.sbaConfigs[activeClass]?.[selectedSubject] || {
    cat1: { id: 'cat1', date: '', marks: 20, questionType: 'Multiple Choice', bloomTaxonomy: [], scores: {} },
    cat2: { id: 'cat2', date: '', marks: 20, questionType: 'Theory', bloomTaxonomy: [], scores: {} },
    cat3: { id: 'cat3', date: '', marks: 10, questionType: 'Project', bloomTaxonomy: [], scores: {} }
  };

  const updateCatConfig = (catKey: 'cat1' | 'cat2' | 'cat3', field: keyof CATConfig, value: any) => {
    if (settings.sbaMarksLocked) return;
    const updatedClassConfigs = { ...(settings.sbaConfigs[activeClass] || {}) };
    updatedClassConfigs[selectedSubject] = { ...currentSbaConfig, [catKey]: { ...currentSbaConfig[catKey], [field]: value } };
    onSettingsChange({ ...settings, sbaConfigs: { ...settings.sbaConfigs, [activeClass]: updatedClassConfigs } });
  };

  const handleCatScoreChange = (catKey: 'cat1' | 'cat2' | 'cat3', studentId: string, value: string) => {
    const numericVal = Math.min(Math.max(0, parseInt(value) || 0), currentSbaConfig[catKey].marks);
    const updatedScores = { ...(currentSbaConfig[catKey].scores || {}), [studentId]: numericVal };
    updateCatConfig(catKey, 'scores', updatedScores);
  };

  const weeks = Array.from({ length: 16 }, (_, i) => i + 1);
  const exerciseEntries = (settings.exerciseEntries || []).filter(e => e.subject === selectedSubject);

  const getWeekStats = (studentId: string, week: number) => {
    const weekEntries = exerciseEntries.filter(e => e.week === week);
    const classwork = weekEntries.filter(e => e.type === 'Classwork');
    const homework = weekEntries.filter(e => e.type === 'Homework');

    const calcAvg = (entries: DailyExerciseEntry[]) => {
      if (entries.length === 0) return 0;
      const scores = entries.map(e => {
        const raw = e.pupilScores?.[studentId] || 0;
        return (raw / (e.maxScore || 1)) * 100;
      });
      return Math.round(scores.reduce((a, b) => a + b, 0) / entries.length);
    };

    return {
      cwAvg: calcAvg(classwork),
      cwCount: classwork.length,
      hwAvg: calcAvg(homework),
      hwCount: homework.length
    };
  };

  const updateWeight = (field: keyof typeof settings.assessmentWeights, val: string) => {
    const num = parseInt(val) || 0;
    onSettingsChange({ ...settings, assessmentWeights: { ...settings.assessmentWeights, [field]: num } });
  };

  return (
    <div className="space-y-6 animate-fadeIn no-print">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-4">
          {!isMockMode && (
            <div className="flex gap-4">
              <button onClick={() => setHubMode('sba')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg ${hubMode === 'sba' ? 'bg-[#0f3460] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>SBA / Continuous Assessment</button>
              <button onClick={() => setHubMode('finals')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg ${hubMode === 'finals' ? 'bg-[#cca43b] text-[#0f3460]' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Terminal / Mock Paper Entry</button>
              <button onClick={() => setHubMode('config')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg ${hubMode === 'config' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>SBA Configuration Desk</button>
            </div>
          )}
          {hubMode === 'sba' && !isMockMode && (
             <div className="flex gap-2 ml-2">
                <button onClick={() => setSbaSubTab('exercises')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${sbaSubTab === 'exercises' ? 'bg-[#2e8b57] text-white shadow-sm' : 'bg-gray-50 text-gray-300'}`}>Weekly Exercises Broad Sheet</button>
                <button onClick={() => setSbaSubTab('cat')} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${sbaSubTab === 'cat' ? 'bg-[#2e8b57] text-white shadow-sm' : 'bg-gray-50 text-gray-300'}`}>CAT Broad Sheet</button>
             </div>
          )}
          {isMockMode && (
             <div className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg">
                Mock Examination Entry
             </div>
          )}
        </div>
        <div className="flex gap-3 items-center bg-gray-50 p-4 rounded-[2rem] border border-gray-100 shadow-inner">
           <select className="bg-white border-none rounded-xl p-3 font-black text-[#0f3460] text-xs shadow-sm min-w-[200px]" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
             {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
           <button onClick={onSave} className="bg-[#2e8b57] text-white px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-xl">Sync Hub Data</button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[400px]">
        {hubMode === 'config' && !isMockMode ? (
           <div className="p-10 space-y-10 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-6">
                 <div>
                    <h3 className="text-2xl font-black text-[#0f3460] uppercase">SBA Configuration Desk</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Design paper standards and taxonomy balance</p>
                 </div>
                 {settings.sbaMarksLocked && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-red-100">🔒 Allocation Locked by Admin</div>}
              </div>
              <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-6">
                 <h4 className="text-xs font-black uppercase text-[#0f3460] tracking-widest">Weighting Hierarchy (%)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 px-2">Exercises & Assignments</label>
                       <input type="number" className="w-full p-4 bg-white rounded-2xl border-none font-black text-blue-600 shadow-sm" value={settings.assessmentWeights.exercises} onChange={e => updateWeight('exercises', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 px-2">CAT Multi-Cycle</label>
                       <input type="number" className="w-full p-4 bg-white rounded-2xl border-none font-black text-blue-600 shadow-sm" value={settings.assessmentWeights.cats} onChange={e => updateWeight('cats', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 px-2">Terminal Paper</label>
                       <input type="number" className="w-full p-4 bg-white rounded-2xl border-none font-black text-blue-600 shadow-sm" value={settings.assessmentWeights.terminal} onChange={e => updateWeight('terminal', e.target.value)} />
                    </div>
                 </div>
              </div>
           </div>
        ) : hubMode === 'sba' && sbaSubTab === 'cat' && !isMockMode ? (
           <div className="p-8 space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-4">
                 <h3 className="text-xl font-black text-[#0f3460] uppercase">CAT Multi-Cycle Broad Sheet</h3>
              </div>
              <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm">
                 <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                       <tr>
                          <th className="p-4 border-b w-64">Learner Full Name</th>
                          {(['cat1', 'cat2', 'cat3'] as const).map((catKey, i) => (
                             <th key={catKey} className="p-4 border-b border-x border-gray-200 text-center bg-gray-50/50">
                                <p className="text-blue-600">CAT {i+1} (/{currentSbaConfig[catKey].marks})</p>
                             </th>
                          ))}
                       </tr>
                    </thead>
                    <tbody>
                       {students.map(s => (
                          <tr key={s.id} className="border-b hover:bg-yellow-50/10 transition">
                             <td className="p-4 font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</td>
                             {(['cat1', 'cat2', 'cat3'] as const).map(catKey => (
                                <td key={catKey} className="p-4 text-center border-x border-gray-50">
                                   <input type="number" className="w-16 p-2 bg-white rounded-lg text-center font-black" value={currentSbaConfig[catKey].scores?.[s.id] || 0} onChange={e => handleCatScoreChange(catKey, s.id, e.target.value)} />
                                </td>
                             ))}
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        ) : hubMode === 'sba' && sbaSubTab === 'exercises' && !isMockMode ? (
          <div className="p-8 space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-4">
                 <h3 className="text-xl font-black text-[#0f3460] uppercase">Exercises & Assignments Matrix</h3>
              </div>
              <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm max-h-[600px]">
                 <table className="w-full text-left text-[9px] border-collapse min-w-[2000px]">
                    <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase sticky top-0 z-20">
                       <tr>
                          <th className="p-4 border-b w-64 sticky left-0 bg-[#f4f6f7]" rowSpan={2}>Pupil Names</th>
                          {weeks.map(w => (
                             <th key={w} className="p-2 border-b border-x border-gray-200 text-center bg-gray-50/50" colSpan={4}>Week {w}</th>
                          ))}
                       </tr>
                       <tr className="bg-gray-100">
                          {weeks.map(w => (
                             <React.Fragment key={w}>
                                <th className="p-1 border border-gray-200 text-center w-12">CW Avg</th>
                                <th className="p-1 border border-gray-200 text-center w-8">Cnt</th>
                                <th className="p-1 border border-gray-200 text-center w-12">HW Avg</th>
                                <th className="p-1 border border-gray-200 text-center w-8">Cnt</th>
                             </React.Fragment>
                          ))}
                       </tr>
                    </thead>
                    <tbody>
                       {students.filter(s => s.currentClass === activeClass).map(s => {
                          const weekStats = weeks.map(w => getWeekStats(s.id, w));
                          return (
                            <tr key={s.id} className="border-b hover:bg-yellow-50 transition">
                               <td className="p-4 font-black uppercase text-[#0f3460] sticky left-0 bg-white border-r">{s.firstName} {s.surname}</td>
                               {weekStats.map((ws, i) => (
                                  <React.Fragment key={i}>
                                     <td className="p-1 border-x border-gray-100 text-center font-bold">{ws.cwAvg || '-'}</td>
                                     <td className="p-1 border-x border-gray-100 text-center text-gray-400">{ws.cwCount || '-'}</td>
                                     <td className="p-1 border-x border-gray-100 text-center font-bold">{ws.hwAvg || '-'}</td>
                                     <td className="p-1 border-x border-gray-100 text-center text-gray-400">{ws.hwCount || '-'}</td>
                                  </React.Fragment>
                               ))}
                            </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
          </div>
        ) : hubMode === 'finals' || isMockMode ? (
          <div className="animate-fadeIn">
            <div className="p-6 bg-blue-50 border-b border-blue-100 flex justify-between items-center no-print">
               <div className="flex items-center gap-3">
                  <span className="text-lg">⚙️</span>
                  <div>
                    <p className="text-[10px] font-black text-blue-900 uppercase">Input Normalization Active</p>
                    <p className="text-[9px] font-bold text-blue-700 italic">
                      {(isScience && scienceMax === 140)
                        ? 'Science detected: Section A (40) + Section B (100) = 140. Normalizing to 100% for grading.' 
                        : `Standard subject mapping: Section A (${activeThresholds.a}) + Section B (${activeThresholds.b}) = ${rawSum}.`}
                    </p>
                  </div>
               </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f4f6f7] text-[#0f3460] text-[10px] font-black uppercase tracking-widest border-b">
                <tr>
                  <th className="p-6 border-r w-32">ID</th>
                  <th className="p-6 border-r">Learner Full Name</th>
                  <th className="p-4 text-center border-b bg-[#cca43b]/10" colSpan={3}>Assessment Sections</th>
                  <th className="p-6">Facilitator Remark</th>
                </tr>
                <tr className="bg-[#cca43b]/5 text-[8px]">
                  <th className="border-r"></th>
                  <th className="border-r"></th>
                  <th className="p-3 text-center border-r">Section A (Objectives /{activeThresholds.a})</th>
                  <th className="p-3 text-center border-r">Section B (Theory /{activeThresholds.b})</th>
                  <th className="p-3 text-center border-r font-black text-[#0f3460]">Normalized Total (/100)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const d = s.scoreDetails?.[selectedSubject] || { 
                    sectionA: 0, sectionB: 0, total: 0, 
                    mockObj: 0, mockTheory: 0, facilitatorRemark: '' 
                  };
                  const rawTotal = (d.mockObj || 0) + (d.mockTheory || 0);
                  const normalizedTotal = Math.round((rawTotal / rawSum) * 100);
                  
                  return (
                    <tr key={s.id} className="border-b bg-white hover:bg-yellow-50/10 transition-colors">
                      <td className="p-6 font-mono text-gray-400 border-r">{s.serialId}</td>
                      <td className="p-6 font-black text-[#0f3460] uppercase text-xs border-r">{s.firstName} {s.surname}</td>
                      <td className="p-4 text-center border-r">
                         <input type="number" max={activeThresholds.a} className="w-16 p-2 bg-gray-50 rounded-lg text-center font-bold text-[#0f3460] outline-none" value={d.mockObj || 0} onChange={e => handleScoreChange(s.id, 'mockObj', e.target.value)} />
                      </td>
                      <td className="p-4 text-center border-r">
                         <input type="number" max={activeThresholds.b} className="w-16 p-2 bg-gray-50 rounded-lg text-center font-bold text-[#0f3460] outline-none" value={d.mockTheory || 0} onChange={e => handleScoreChange(s.id, 'mockTheory', e.target.value)} />
                      </td>
                      <td className="p-4 text-center border-r font-black text-[#cca43b] text-sm bg-[#cca43b]/5">
                         {normalizedTotal}
                      </td>
                      <td className="p-6">
                         <textarea className="w-full bg-transparent p-2 border-b border-gray-100 text-[10px] italic h-12 outline-none focus:border-[#cca43b]" value={d.facilitatorRemark} onChange={e => handleScoreChange(s.id, 'facilitatorRemark', e.target.value)} placeholder="Log observation..." />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center text-gray-300 italic uppercase font-black tracking-widest">Select Entry Mode Above</div>
        )}
      </div>
    </div>
  );
};

export default ScoreEntry;
