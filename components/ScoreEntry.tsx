
import React, { useState, useMemo } from 'react';
import { Student, GlobalSettings } from '../types';
import { DAYCARE_ACTIVITY_GROUPS } from '../constants';
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
  const [primaryMode, setPrimaryMode] = useState<'sba' | 'finals'>('sba');
  const [activeTab, setActiveTab] = useState<'term' | 'daily' | 'exam' | 'mock'>('term');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDailyPopout, setShowDailyPopout] = useState(false);
  const [activeRemarkStudentId, setActiveRemarkStudentId] = useState<string | null>(null);

  const isEarlyChildhood = department === 'Daycare' || department === 'Nursery' || department === 'KG' || department === 'D&N';
  const isBasic9 = activeClass === 'Basic 9';

  const groupMapping = useMemo(() => ({
    "Language & Literacy": ["Language & Literacy"],
    "Numeracy": ["Numeracy"],
    "OWOP": ["Physical Development", "Socio-Emotional"],
    "Creative Activity": ["Creative Arts"]
  }), []);

  const sbaConfig = settings.sbaConfigs?.[activeClass]?.[selectedSubject] || {
    cat1: { marks: 30 },
    cat2: { marks: 40 },
    cat3: { marks: 30 }
  };

  const thresholds = {
    sectionA: sbaConfig.cat1?.marks || 30,
    sectionC: sbaConfig.cat2?.marks || 40,
    sectionB: isEarlyChildhood ? 100 : (sbaConfig.cat3?.marks || 30)
  };

  const getDerivedDevAvg = (student: Student, subject: string) => {
    const activityGroups = groupMapping[subject as keyof typeof groupMapping] || [];
    let totalScore = 0;
    let count = 0;
    const maxIndicatorScore = 3;

    activityGroups.forEach(group => {
      const indicators = DAYCARE_ACTIVITY_GROUPS[group as keyof typeof DAYCARE_ACTIVITY_GROUPS] || [];
      indicators.forEach(ind => {
        if (settings.activeIndicators.includes(ind)) {
          const indicatorAvg = student.scoreDetails?.[ind]?.sectionA || 0;
          if (indicatorAvg > 0) {
            totalScore += indicatorAvg;
            count++;
          }
        }
      });
    });

    if (count === 0) return 0;
    return Math.round(((totalScore / count) / maxIndicatorScore) * 100);
  };

  const computeTotal = (details: any, derivedAvgPercentage?: number) => {
    if (activeTab === 'mock') return (details.mockObj || 0) + (details.mockTheory || 0);
    if (isEarlyChildhood) {
      const devAvg = derivedAvgPercentage !== undefined ? derivedAvgPercentage : (details.sectionA || 0);
      const obsPoints = details.sectionB || 0;
      return Math.round((devAvg + obsPoints) / 2);
    }
    return (details.sectionA || 0) + (details.sectionC || 0) + (details.sectionB || 0) + (details.examScore || 0);
  };

  const handleScoreChange = (id: string, section: string, val: number | string) => {
    const updated = students.map(s => {
      if (s.id === id) {
        const currentDetails = s.scoreDetails?.[selectedSubject] || { 
          total: 0, grade: 'F9', facilitatorRemark: '', 
          sectionA: 0, sectionB: 0, sectionC: 0, examScore: 0, dailyScores: {} 
        };
        const details = { ...currentDetails };
        
        if (section === 'sectionA') details.sectionA = Math.max(0, Math.min(Number(val), thresholds.sectionA));
        if (section === 'sectionB') details.sectionB = Math.max(0, Math.min(Number(val), thresholds.sectionB));
        if (section === 'sectionC') details.sectionC = Math.max(0, Math.min(Number(val), thresholds.sectionC));
        if (section === 'facilitatorRemark') details.facilitatorRemark = String(val);

        const derived = isEarlyChildhood ? getDerivedDevAvg(s, selectedSubject) : undefined;
        details.total = computeTotal(details, derived);
        
        return { ...s, scoreDetails: { ...(s.scoreDetails || {}), [selectedSubject]: details } };
      }
      return s;
    });
    onUpdate(updated);
  };

  const handleFinalScoreChange = (id: string, section: 'A' | 'B', val: number) => {
    const updated = students.map(s => {
      if (s.id === id) {
        const currentDetails = s.scoreDetails?.[selectedSubject] || { 
          total: 0, grade: 'F9', sectionA: 0, sectionB: 0, sectionC: 0, examScore: 0, mockObj: 0, mockTheory: 0 
        };
        const details = { ...currentDetails };
        
        if (activeTab === 'exam') {
          details.examScore = Math.max(0, val);
          details.total = computeTotal(details);
        } else if (activeTab === 'mock') {
          if (section === 'A') details.mockObj = Math.max(0, Math.min(val, 30));
          if (section === 'B') details.mockTheory = Math.max(0, Math.min(val, 70));
          details.total = computeTotal(details);
        }

        return { ...s, scoreDetails: { ...(s.scoreDetails || {}), [selectedSubject]: details } };
      }
      return s;
    });
    onUpdate(updated);
  };

  return (
    <div className="space-y-8 animate-fadeIn no-print relative">
      {/* Redundant Institutional Particulars Header Removed from here to fix duplication */}

      <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter">Result Management Hub</h2>
            <div className="flex gap-4 mt-4">
              <button onClick={() => { setPrimaryMode('sba'); setActiveTab('term'); }} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-md ${primaryMode === 'sba' ? 'bg-[#0f3460] text-white' : 'bg-gray-100 text-gray-400'}`}>SBA & Continuous Assessment</button>
              <button onClick={() => { setPrimaryMode('finals'); setActiveTab('exam'); }} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-md ${primaryMode === 'finals' ? 'bg-[#cca43b] text-[#0f3460]' : 'bg-gray-100 text-gray-400'}`}>End-of-Cycle Entry</button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-[2rem] border border-gray-100 shadow-inner">
            <select className="bg-white border-none rounded-xl p-3 font-black text-[#0f3460] text-xs shadow-sm min-w-[200px]" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex bg-white p-1 rounded-xl shadow-sm">
              {primaryMode === 'sba' ? (
                <>
                  <button onClick={() => setActiveTab('term')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition ${activeTab === 'term' ? 'bg-[#0f3460] text-white shadow-sm' : 'text-gray-400'}`}>SBA Ledger</button>
                  <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition ${activeTab === 'daily' ? 'bg-[#0f3460] text-white shadow-sm' : 'text-gray-400'}`}>Indicator Summary</button>
                </>
              ) : (
                <>
                  <button onClick={() => setActiveTab('exam')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition ${activeTab === 'exam' ? 'bg-[#cca43b] text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>Exam Entry</button>
                  {isBasic9 && <button onClick={() => setActiveTab('mock')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition ${activeTab === 'mock' ? 'bg-[#cca43b] text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>Mock Series</button>}
                </>
              )}
            </div>
            <button onClick={onSave} className="bg-[#2e8b57] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg hover:scale-105 active:scale-95 transition">Sync Changes</button>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-50 pt-8 overflow-hidden">
          <div className="bg-gray-50 rounded-[2.5rem] border border-gray-200 overflow-hidden">
            {primaryMode === 'sba' && activeTab === 'term' && (
              <SbaTable 
                students={students} 
                thresholds={thresholds} 
                selectedSubject={selectedSubject} 
                isEarlyChildhood={isEarlyChildhood} 
                handleScoreChange={handleScoreChange} 
                getDerivedDevAvg={getDerivedDevAvg} 
                facilitatorRemarks={settings.popoutLists.facilitatorRemarks}
                activeRemarkId={activeRemarkStudentId}
                setActiveRemarkId={setActiveRemarkStudentId}
              />
            )}
            {primaryMode === 'sba' && activeTab === 'daily' && (
              <DailyIndicatorTable students={students} settings={settings} activeClass={activeClass} newDate={newDate} setNewDate={setNewDate} setShowDailyPopout={setShowDailyPopout} isEarlyChildhood={isEarlyChildhood} groupMapping={groupMapping} />
            )}
            {primaryMode === 'finals' && (
              <FinalsScoreTable 
                students={students} 
                activeTab={activeTab} 
                selectedSubject={selectedSubject} 
                handleFinalScoreChange={handleFinalScoreChange} 
                handleRemarkChange={(id, val) => handleScoreChange(id, 'facilitatorRemark', val)} 
                facilitatorRemarks={settings.popoutLists.facilitatorRemarks}
                activeRemarkId={activeRemarkStudentId}
                setActiveRemarkId={setActiveRemarkStudentId}
              />
            )}
          </div>
        </div>
      </div>

      {showDailyPopout && (
        <DailyEntryModal students={students} thresholds={thresholds} selectedSubject={selectedSubject} newDate={newDate} setShowDailyPopout={setShowDailyPopout} onUpdate={onUpdate} isEarlyChildhood={isEarlyChildhood} getDerivedDevAvg={getDerivedDevAvg} computeTotal={computeTotal} />
      )}
    </div>
  );
};

const SbaTable = ({ students, thresholds, selectedSubject, isEarlyChildhood, handleScoreChange, getDerivedDevAvg, facilitatorRemarks, activeRemarkId, setActiveRemarkId }: any) => (
  <table className="w-full text-left">
    <thead className="bg-[#0f3460] text-white text-[10px] font-black uppercase tracking-widest">
      <tr>
        <th className="p-6">Learner Name</th>
        {!isEarlyChildhood ? (
          <>
            <th className="p-6 text-center">CAT 1 ({thresholds.sectionA})</th>
            <th className="p-6 text-center">CAT 2 ({thresholds.sectionC})</th>
            <th className="p-6 text-center">CAT 3 ({thresholds.sectionB})</th>
          </>
        ) : (
          <>
            <th className="p-6 text-center">Developmental Avg (%)</th>
            <th className="p-6 text-center">Observation Points (100%)</th>
          </>
        )}
        <th className="p-6 text-center bg-white/10">SBA Total (%)</th>
        <th className="p-6">Facilitator Remark</th>
      </tr>
    </thead>
    <tbody>
      {students.map((s: any) => {
        const details = s.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, sectionC: 0, total: 0, facilitatorRemark: '' };
        const derived = isEarlyChildhood ? getDerivedDevAvg(s, selectedSubject) : 0;
        const total = isEarlyChildhood ? Math.round((derived + (details.sectionB || 0)) / 2) : (details.sectionA + details.sectionC + details.sectionB);
        return (
          <tr key={s.id} className="border-b bg-white border-gray-100 hover:bg-blue-50/20 transition">
            <td className="p-6 font-black text-[#0f3460] uppercase text-xs">{s.firstName} {s.surname}</td>
            {!isEarlyChildhood ? (
              <>
                <td className="p-6 text-center"><input type="number" className="w-16 bg-gray-50 p-2 rounded-xl text-center font-bold" value={details.sectionA} onChange={e => handleScoreChange(s.id, 'sectionA', e.target.value)} /></td>
                <td className="p-6 text-center"><input type="number" className="w-16 bg-gray-50 p-2 rounded-xl text-center font-bold" value={details.sectionC} onChange={e => handleScoreChange(s.id, 'sectionC', e.target.value)} /></td>
                <td className="p-6 text-center"><input type="number" className="w-16 bg-gray-50 p-2 rounded-xl text-center font-bold" value={details.sectionB} onChange={e => handleScoreChange(s.id, 'sectionB', e.target.value)} /></td>
              </>
            ) : (
              <>
                <td className="p-6 text-center"><span className="text-lg font-black px-4 py-1 rounded-xl bg-orange-50 text-orange-700">{derived}%</span></td>
                <td className="p-6 text-center"><div className="flex items-center justify-center gap-2"><input type="number" className="w-16 bg-gray-50 p-2 rounded-xl text-center font-bold" value={details.sectionB} onChange={e => handleScoreChange(s.id, 'sectionB', e.target.value)} /><span className="text-xs font-black text-gray-400">%</span></div></td>
              </>
            )}
            <td className="p-6 text-center font-black text-xl text-[#2e8b57] bg-blue-50/30">{total}%</td>
            <td className="p-6 relative">
              <div className="flex items-center gap-2">
                 <input 
                    className="flex-1 bg-transparent border-b border-gray-200 text-[10px] italic outline-none focus:border-[#cca43b]" 
                    value={details.facilitatorRemark} 
                    onChange={e => handleScoreChange(s.id, 'facilitatorRemark', e.target.value)} 
                    placeholder="..." 
                 />
                 <button 
                    onClick={() => setActiveRemarkId(activeRemarkId === s.id ? null : s.id)}
                    className="p-1 rounded bg-gray-100 text-gray-400 hover:text-[#0f3460] transition shadow-sm"
                 >
                    📋
                 </button>
              </div>
              {activeRemarkId === s.id && (
                 <div className="absolute right-6 top-12 z-[100] w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-h-48 overflow-y-auto animate-fadeIn">
                    <p className="text-[8px] font-black uppercase text-gray-400 mb-2">Select Remark</p>
                    {facilitatorRemarks.map((rem: string) => (
                       <button 
                          key={rem}
                          onClick={() => { handleScoreChange(s.id, 'facilitatorRemark', rem); setActiveRemarkId(null); }}
                          className="w-full text-left p-2 rounded-lg text-[9px] font-bold uppercase italic hover:bg-blue-50 text-gray-600 transition"
                       >
                          {rem}
                       </button>
                    ))}
                 </div>
              )}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const DailyIndicatorTable = ({ students, settings, activeClass, newDate, setNewDate, setShowDailyPopout, isEarlyChildhood, groupMapping }: any) => {
  const tableStructure = useMemo(() => {
    return Object.entries(groupMapping).map(([header, activityGroups]) => {
      const indicators: string[] = [];
      (activityGroups as string[]).forEach(g => {
        const groupItems = DAYCARE_ACTIVITY_GROUPS[g as keyof typeof DAYCARE_ACTIVITY_GROUPS] || [];
        groupItems.forEach(item => { if (settings.activeIndicators.includes(item)) indicators.push(item); });
      });
      return { header, indicators };
    }).filter(group => group.indicators.length > 0);
  }, [groupMapping, settings.activeIndicators]);

  const flatIndicators = tableStructure.flatMap(g => g.indicators);

  return (
    <div className="p-10 space-y-6 bg-white overflow-x-auto">
      <div className="flex flex-col md:flex-row justify-between items-center border-b pb-6 gap-4">
        <div><h4 className="font-black text-[#0f3460] uppercase text-lg">Summarised Active Indicators</h4></div>
        <div className="flex gap-4 items-center">
          {!isEarlyChildhood && <input type="date" className="p-3 rounded-xl bg-gray-100 border-none font-bold text-xs" value={newDate} onChange={e => setNewDate(e.target.value)} />}
          <button onClick={() => setShowDailyPopout(true)} className="bg-[#cca43b] text-[#0f3460] px-8 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg hover:scale-105 transition">{isEarlyChildhood ? '+ Log Observation Points' : '+ Add Session'}</button>
        </div>
      </div>
      <table className="w-full text-left border-collapse min-w-max border border-gray-100">
        <thead className="bg-[#f4f6f7] text-gray-500 text-[8px] font-black uppercase tracking-wider">
          <tr>
            <th className="p-4 sticky left-0 bg-[#f4f6f7] z-10 border-r border-b border-gray-200 shadow-sm" rowSpan={2}>Learner Name</th>
            {tableStructure.map(group => (<th key={group.header} className="p-2 text-center border-r border-b border-gray-200 bg-[#0f3460] text-white" colSpan={group.indicators.length}>{group.header}</th>))}
          </tr>
          <tr>
            {tableStructure.map(group => group.indicators.map(ind => (
              <th key={ind} className="p-2 text-center border-r border-gray-200 bg-gray-50 align-bottom h-48 min-w-[50px]">
                <div className="flex flex-col items-center justify-end h-full pb-2"><span className="[writing-mode:vertical-rl] rotate-180 text-[#0f3460] font-black text-[9px] uppercase whitespace-nowrap">{ind}</span></div>
              </th>
            )))}
          </tr>
        </thead>
        <tbody>
          {students.map((s: any) => (
            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
              <td className="p-4 font-black text-[#0f3460] uppercase text-[11px] sticky left-0 bg-white z-10 border-r border-gray-100 shadow-sm">{s.firstName} {s.surname}</td>
              {flatIndicators.map(ind => {
                const avg = s.scoreDetails?.[ind]?.sectionA || 0;
                return (
                  <td key={ind} className="p-4 text-center border-r border-gray-50">
                    <span className={`text-lg font-black px-3 py-1 rounded-xl shadow-inner ${avg >= 2 ? 'text-[#2e8b57] bg-green-50' : avg > 0 ? 'text-orange-500 bg-orange-50' : 'text-gray-300'}`}>{avg > 0 ? avg : '--'}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const FinalsScoreTable = ({ students, activeTab, selectedSubject, handleFinalScoreChange, handleRemarkChange, facilitatorRemarks, activeRemarkId, setActiveRemarkId }: any) => (
  <table className="w-full text-left bg-white">
    <thead className={`text-white text-[10px] font-black uppercase tracking-widest ${activeTab === 'exam' ? 'bg-[#0f3460]' : 'bg-[#cca43b]'}`}>
      <tr>
        <th className="p-6">Learner Name</th>
        <th className="p-6 text-center">{activeTab === 'exam' ? 'SBA Total Sum' : 'Mock Obj (A)'}</th>
        <th className="p-6 text-center">{activeTab === 'exam' ? 'Exam Paper' : 'Mock Essay (B)'}</th>
        <th className="p-6 text-center bg-black/10">Cumulative Total</th>
        <th className="p-6">Supervisor Remark</th>
      </tr>
    </thead>
    <tbody>
      {students.map((s: any) => {
        const details = s.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, sectionC: 0, total: 0, facilitatorRemark: '', examScore: 0, mockObj: 0, mockTheory: 0 };
        const sbaSum = (details.sectionA + details.sectionC + details.sectionB);
        return (
          <tr key={s.id} className="border-b border-gray-100 hover:bg-yellow-50/20 transition">
            <td className="p-6 font-black text-[#0f3460] uppercase text-xs">{s.firstName} {s.surname}</td>
            <td className="p-6 text-center">{activeTab === 'exam' ? <span className="inline-block px-4 py-2 bg-blue-50 text-[#0f3460] rounded-xl font-black text-sm">{sbaSum}</span> : <input type="number" className="w-20 bg-gray-50 p-2 rounded-xl text-center font-bold" value={details.mockObj} onChange={e => handleFinalScoreChange(s.id, 'A', Number(e.target.value))} />}</td>
            <td className="p-6 text-center">{activeTab === 'exam' ? <input type="number" className="w-24 bg-gray-50 p-2 rounded-xl text-center font-bold" value={details.examScore} onChange={e => handleFinalScoreChange(s.id, 'B', Number(e.target.value))} /> : <input type="number" className="w-24 bg-gray-50 p-2 rounded-xl text-center font-bold" value={details.mockTheory} onChange={e => handleFinalScoreChange(s.id, 'B', Number(e.target.value))} />}</td>
            <td className="p-6 text-center font-black text-2xl text-[#0f3460] bg-gray-50/50">{details.total}</td>
            <td className="p-6 relative">
               <div className="flex items-center gap-2">
                  <input 
                    className="flex-1 bg-transparent border-b border-gray-200 text-[10px] italic outline-none focus:border-[#cca43b]" 
                    value={details.facilitatorRemark} 
                    onChange={e => handleRemarkChange(s.id, e.target.value)} 
                    placeholder="..." 
                  />
                  <button 
                    onClick={() => setActiveRemarkId(activeRemarkId === s.id ? null : s.id)}
                    className="p-1 rounded bg-gray-100 text-gray-400 hover:text-[#0f3460] transition shadow-sm"
                  >
                    📋
                  </button>
               </div>
               {activeRemarkId === s.id && (
                 <div className="absolute right-6 top-12 z-[100] w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-h-48 overflow-y-auto animate-fadeIn">
                    <p className="text-[8px] font-black uppercase text-gray-400 mb-2">Select Supervisor Remark</p>
                    {facilitatorRemarks.map((rem: string) => (
                       <button 
                          key={rem}
                          onClick={() => { handleRemarkChange(s.id, rem); setActiveRemarkId(null); }}
                          className="w-full text-left p-2 rounded-lg text-[9px] font-bold uppercase italic hover:bg-blue-50 text-gray-600 transition"
                       >
                          {rem}
                       </button>
                    ))}
                 </div>
              )}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const DailyEntryModal = ({ students, thresholds, selectedSubject, newDate, setShowDailyPopout, onUpdate, isEarlyChildhood, getDerivedDevAvg, computeTotal }: any) => {
  const updateLocalScore = (id: string, score: number) => {
    const updated = students.map((s: any) => {
      if (s.id === id) {
        const details = { ...(s.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, sectionC: 0, total: 0, facilitatorRemark: '', dailyScores: {} }) };
        if (isEarlyChildhood) {
          details.sectionB = Math.max(0, Math.min(score, 100));
          details.total = computeTotal(details, getDerivedDevAvg(s, selectedSubject));
        } else {
          details.dailyScores = { ...(details.dailyScores || {}), [newDate]: Math.min(score, thresholds.sectionA) };
          const scores = Object.values(details.dailyScores) as number[];
          details.sectionA = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
        }
        return { ...s, scoreDetails: { ...(s.scoreDetails || {}), [selectedSubject]: details } };
      }
      return s;
    });
    onUpdate(updated);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0f3460]/80 backdrop-blur-md p-10 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#cca43b] p-8 text-[#0f3460] flex justify-between items-center"><h3 className="text-2xl font-black uppercase tracking-tighter">{isEarlyChildhood ? 'Observation Points (%)' : 'Indicator Session Entry'}</h3><button onClick={() => setShowDailyPopout(false)} className="text-xl">✕</button></div>
        <div className="flex-1 overflow-y-auto p-10">
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
             <p className="text-[10px] font-black uppercase text-[#0f3460]">Active Pillar: <span className="text-[#cca43b]">{selectedSubject}</span></p>
             <p className="text-[10px] font-black uppercase text-gray-400">{isEarlyChildhood ? 'Target Field: Observation Points' : 'Date: ' + newDate}</p>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase border-b"><tr><th className="p-4">Learner</th><th className="p-4 text-center">Score (Max: {isEarlyChildhood ? '100%' : thresholds.sectionA})</th></tr></thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s.id} className="border-b hover:bg-yellow-50/30">
                  <td className="p-4 font-black uppercase text-xs">{s.firstName} {s.surname}</td>
                  <td className="p-4 text-center"><div className="flex items-center justify-center gap-2"><input type="number" className="w-24 bg-gray-50 p-3 rounded-xl text-center font-black outline-none border focus:border-[#cca43b]" value={isEarlyChildhood ? (s.scoreDetails?.[selectedSubject]?.sectionB || 0) : (s.scoreDetails?.[selectedSubject]?.dailyScores?.[newDate] || 0)} onChange={e => updateLocalScore(s.id, Number(e.target.value))} />{isEarlyChildhood && <span className="font-black text-[#0f3460]">%</span>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-8 bg-gray-50 border-t flex justify-end"><button onClick={() => setShowDailyPopout(false)} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase">Close Ledger</button></div>
      </div>
    </div>
  );
};

export default ScoreEntry;
