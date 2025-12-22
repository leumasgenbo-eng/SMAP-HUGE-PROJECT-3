
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

  const isEarlyChildhood = department === 'Daycare' || department === 'Nursery' || department === 'KG' || department === 'D&N';
  const isBasic9 = activeClass === 'Basic 9';

  // Mapping core headings to activity groups from constants
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
    sectionB: isEarlyChildhood ? 100 : (sbaConfig.cat3?.marks || 30),
  };

  // Helper to derive Developmental Average as a percentage (0-100)
  const getDerivedDevAvg = (student: Student, subject: string) => {
    const activityGroups = groupMapping[subject as keyof typeof groupMapping] || [];
    let totalScore = 0;
    let count = 0;
    const maxIndicatorScore = 3; // Standard Early Childhood scale: 1=D, 2=A, 3=A+

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
    const rawAvg = totalScore / count;
    // Scale 1-3 to 0-100: (avg / max) * 100
    return Math.round((rawAvg / maxIndicatorScore) * 100);
  };

  const computeTotal = (details: any, derivedAvgPercentage?: number) => {
    if (activeTab === 'mock') {
      return (details.mockObj || 0) + (details.mockTheory || 0);
    }
    if (isEarlyChildhood) {
      // For Early Childhood, the 'SBA Total' is the average of two percentages
      const devAvg = derivedAvgPercentage !== undefined ? derivedAvgPercentage : (details.sectionA || 0);
      const obsPoints = details.sectionB || 0;
      return Math.round((devAvg + obsPoints) / 2);
    }
    const sbaSum = (details.sectionA || 0) + (details.sectionC || 0) + (details.sectionB || 0);
    return sbaSum + (details.examScore || 0);
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

  const handleExportSummaryCSV = () => {
    const headers = ["Learner Full Name"];
    const activeIndicators: string[] = [];

    Object.entries(groupMapping).forEach(([header, activityGroups]) => {
      activityGroups.forEach(g => {
        const indicators = DAYCARE_ACTIVITY_GROUPS[g as keyof typeof DAYCARE_ACTIVITY_GROUPS] || [];
        indicators.forEach(ind => {
          if (settings.activeIndicators.includes(ind)) {
            headers.push(`${header}: ${ind} (Avg)`);
            activeIndicators.push(ind);
          }
        });
      });
    });

    const rows = students.map(s => {
      const row = [`${s.firstName} ${s.surname}`];
      activeIndicators.forEach(ind => {
        row.push(s.scoreDetails?.[ind]?.sectionA?.toString() || "0");
      });
      return row;
    });

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${val}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UBA_Indicator_Summary_${activeClass.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn no-print">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 text-center space-y-4">
        <EditableField 
          value={settings.schoolName} 
          onSave={v => onSettingsChange({...settings, schoolName: v})} 
          className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" 
        />
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <span>ADDR:</span>
            <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span>TEL:</span>
            <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span>EMAIL:</span>
            <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-transparent via-[#cca43b] to-transparent w-3/4 mx-auto"></div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter">Result Management Hub</h2>
            <div className="flex gap-4 mt-4">
              <button 
                onClick={() => { setPrimaryMode('sba'); setActiveTab('term'); }}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-md ${primaryMode === 'sba' ? 'bg-[#0f3460] text-white' : 'bg-gray-100 text-gray-400'}`}
              >
                SBA & Continuous Assessment
              </button>
              <button 
                onClick={() => { setPrimaryMode('finals'); setActiveTab('exam'); }}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-md ${primaryMode === 'finals' ? 'bg-[#cca43b] text-[#0f3460]' : 'bg-gray-100 text-gray-400'}`}
              >
                End-of-Cycle Score Entry
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-[2rem] border border-gray-100 shadow-inner">
            <select 
              className="bg-white border-none rounded-xl p-3 font-black text-[#0f3460] text-xs shadow-sm min-w-[200px]" 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
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
                  {isBasic9 && (
                    <button onClick={() => setActiveTab('mock')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition ${activeTab === 'mock' ? 'bg-[#cca43b] text-[#0f3460] shadow-sm' : 'text-gray-400'}`}>Mock Series</button>
                  )}
                </>
              )}
            </div>
            <button onClick={onSave} className="bg-[#2e8b57] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg hover:scale-105 active:scale-95 transition">Sync Changes</button>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-50 pt-8">
          <div className="bg-gray-50 rounded-[2.5rem] border border-gray-200 overflow-hidden">
            {primaryMode === 'sba' && activeTab === 'term' && (
              <SbaTable students={students} thresholds={thresholds} selectedSubject={selectedSubject} isEarlyChildhood={isEarlyChildhood} handleScoreChange={handleScoreChange} getDerivedDevAvg={getDerivedDevAvg} />
            )}
            
            {primaryMode === 'sba' && activeTab === 'daily' && (
              <DailyIndicatorTable 
                students={students} 
                settings={settings}
                activeClass={activeClass}
                newDate={newDate} 
                setNewDate={setNewDate} 
                setShowDailyPopout={setShowDailyPopout}
                onExport={handleExportSummaryCSV}
                groupMapping={groupMapping}
                isEarlyChildhood={isEarlyChildhood}
              />
            )}

            {primaryMode === 'finals' && (
              <FinalsScoreTable 
                students={students} 
                activeTab={activeTab} 
                selectedSubject={selectedSubject} 
                handleFinalScoreChange={handleFinalScoreChange}
                handleRemarkChange={(id, val) => handleScoreChange(id, 'facilitatorRemark', val)}
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

/* --- SUB-COMPONENTS --- */

const SbaTable = ({ students, thresholds, selectedSubject, isEarlyChildhood, handleScoreChange, getDerivedDevAvg }: any) => (
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
        const details = s.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, sectionC: 0, total: 0, facilitatorRemark: '', examScore: 0 };
        const derivedPercentage = isEarlyChildhood ? getDerivedDevAvg(s, selectedSubject) : 0;
        const sbaTotal = isEarlyChildhood ? Math.round((derivedPercentage + (details.sectionB || 0)) / 2) : (details.sectionA || 0) + (details.sectionC || 0) + (details.sectionB || 0);
        
        return (
          <tr key={s.id} className="border-b bg-white border-gray-100 hover:bg-blue-50/20 transition">
            <td className="p-6 font-black text-[#0f3460] uppercase text-xs">{s.firstName} {s.surname}</td>
            {!isEarlyChildhood ? (
              <>
                <td className="p-6 text-center"><input type="number" max={thresholds.sectionA} className="w-16 bg-gray-50 p-2 rounded-xl text-center font-bold" value={details.sectionA} onChange={e => handleScoreChange(s.id, 'sectionA', e.target.value)} /></td>
                <td className="p-6 text-center"><input type="number" max={thresholds.sectionC} className="w-16 bg-gray-50 p-2 rounded-xl text-center font-bold" value={details.sectionC} onChange={e => handleScoreChange(s.id, 'sectionC', e.target.value)} /></td>
                <td className="p-6 text-center"><input type="number" max={thresholds.sectionB} className="w-16 bg-gray-50 p-2 rounded-xl text-center font-bold" value={details.sectionB} onChange={e => handleScoreChange(s.id, 'sectionB', e.target.value)} /></td>
              </>
            ) : (
              <>
                <td className="p-6 text-center">
                  <div className="flex flex-col items-center">
                    <span className={`text-lg font-black px-4 py-1 rounded-xl shadow-inner ${derivedPercentage >= 60 ? 'bg-green-100 text-green-700' : derivedPercentage > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                      {derivedPercentage > 0 ? `${derivedPercentage}%` : '--'}
                    </span>
                    <span className="text-[7px] text-gray-400 font-black uppercase mt-1">Weighted Indicator Avg</span>
                  </div>
                </td>
                <td className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <input type="number" max={100} className="w-16 bg-gray-50 p-2 rounded-xl text-center font-bold" value={details.sectionB} onChange={e => handleScoreChange(s.id, 'sectionB', e.target.value)} />
                    <span className="text-xs font-black text-gray-400">%</span>
                  </div>
                </td>
              </>
            )}
            <td className="p-6 text-center font-black text-xl text-[#2e8b57] bg-blue-50/30">
               {sbaTotal}{isEarlyChildhood ? '%' : ''}
            </td>
            <td className="p-6">
              <input className="w-full bg-transparent border-b border-gray-200 text-[10px] italic outline-none focus:border-[#cca43b]" value={details.facilitatorRemark} onChange={e => handleScoreChange(s.id, 'facilitatorRemark', e.target.value)} placeholder="..." />
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const DailyIndicatorTable = ({ students, settings, activeClass, newDate, setNewDate, setShowDailyPopout, onExport, groupMapping, isEarlyChildhood }: any) => {
  // Compute active structure based on mapping
  const tableStructure = useMemo(() => {
    return Object.entries(groupMapping).map(([header, activityGroups]) => {
      const indicators: string[] = [];
      (activityGroups as string[]).forEach(g => {
        const groupItems = DAYCARE_ACTIVITY_GROUPS[g as keyof typeof DAYCARE_ACTIVITY_GROUPS] || [];
        groupItems.forEach(item => {
          if (settings.activeIndicators.includes(item)) indicators.push(item);
        });
      });
      return { header, indicators };
    }).filter(group => group.indicators.length > 0);
  }, [groupMapping, settings.activeIndicators]);

  const flatIndicators = tableStructure.flatMap(g => g.indicators);

  return (
    <div className="p-10 space-y-6 bg-white overflow-x-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 gap-4">
        <div>
          <h4 className="font-black text-[#0f3460] uppercase text-lg tracking-tighter">Summarised Active Indicators</h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Matrix • {activeClass}</p>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          {!isEarlyChildhood && <input type="date" className="p-3 rounded-xl bg-gray-100 border-none font-bold text-xs" value={newDate} onChange={e => setNewDate(e.target.value)} />}
          <button onClick={onExport} className="bg-[#0f3460] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg hover:scale-105 transition">Export Summary CSV</button>
          <button onClick={() => setShowDailyPopout(true)} className="bg-[#cca43b] text-[#0f3460] px-8 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg hover:scale-105 transition">
             {isEarlyChildhood ? '+ Log Observation Points' : '+ Add Session Entry'}
          </button>
        </div>
      </div>
      <table className="w-full text-left border-collapse min-w-max border border-gray-100">
        <thead className="bg-[#f4f6f7] text-gray-500 text-[8px] font-black uppercase tracking-wider">
          {/* Header Row 1: Groups */}
          <tr>
            <th className="p-4 sticky left-0 bg-[#f4f6f7] z-10 border-r border-b border-gray-200 shadow-sm" rowSpan={2}>Learner Name</th>
            {tableStructure.map(group => (
              <th key={group.header} className="p-2 text-center border-r border-b border-gray-200 bg-[#0f3460] text-white" colSpan={group.indicators.length}>
                {group.header}
              </th>
            ))}
          </tr>
          {/* Header Row 2: Indicators (VERTICAL) */}
          <tr>
            {tableStructure.map(group => (
              group.indicators.map((ind, idx) => (
                <th key={ind} className="p-2 text-center border-r border-gray-200 bg-gray-50 align-bottom h-48 min-w-[50px]">
                  <div className="flex flex-col items-center justify-end h-full pb-2">
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[#0f3460] font-black text-[9px] uppercase whitespace-nowrap">
                      {ind}
                    </span>
                    <span className="text-[6px] text-gray-400 mt-2 uppercase font-bold tracking-tighter">Avg Log</span>
                  </div>
                </th>
              ))
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((s: any) => (
            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
              <td className="p-4 font-black text-[#0f3460] uppercase text-[11px] sticky left-0 bg-white z-10 border-r border-gray-100 shadow-sm">
                {s.firstName} {s.surname}
              </td>
              {flatIndicators.map(ind => {
                const avg = s.scoreDetails?.[ind]?.sectionA || 0;
                const entriesCount = Object.keys(s.scoreDetails?.[ind]?.dailyScores || {}).length;
                return (
                  <td key={ind} className="p-4 text-center border-r border-gray-50">
                    <div className="flex flex-col items-center">
                      <span className={`text-lg font-black px-3 py-1 rounded-xl shadow-inner ${avg >= 2 ? 'text-[#2e8b57] bg-green-50' : avg > 0 ? 'text-orange-500 bg-orange-50' : 'text-gray-300 bg-gray-50'}`}>
                        {avg > 0 ? avg : '--'}
                      </span>
                      {entriesCount > 0 && <span className="text-[6px] font-black text-gray-400 uppercase mt-1">Logs: {entriesCount}</span>}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-6 bg-blue-50 rounded-[2.5rem] border border-blue-100">
         <div className="flex gap-10">
            <div className="flex-1">
               <h5 className="text-[10px] font-black text-blue-900 uppercase mb-2">Institutional Mapping Logic</h5>
               <p className="text-[9px] text-blue-800 leading-relaxed italic">
                Indicators are dynamically mapped to curriculum pillars. <strong>OWOP</strong> specifically integrates <strong>Physical Development</strong> and <strong>Socio-Emotional</strong> metrics to provide a holistic view of the child's environment and personal growth.
               </p>
            </div>
            <div className="w-64 space-y-1">
               <h5 className="text-[9px] font-black text-blue-900 uppercase mb-1">Scale Thresholds</h5>
               <div className="flex items-center gap-2 text-[8px] font-bold text-blue-700">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> 2.0+ : Achieved / Advanced
               </div>
               <div className="flex items-center gap-2 text-[8px] font-bold text-blue-700">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span> 1.0 - 1.9 : Developing / Emerging
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const FinalsScoreTable = ({ students, activeTab, selectedSubject, handleFinalScoreChange, handleRemarkChange }: any) => (
  <table className="w-full text-left bg-white">
    <thead className={`text-white text-[10px] font-black uppercase tracking-widest ${activeTab === 'exam' ? 'bg-[#0f3460]' : 'bg-[#cca43b]'}`}>
      <tr>
        <th className="p-6">Learner Name</th>
        <th className="p-6 text-center">{activeTab === 'exam' ? 'SBA Total Sum (SEC A)' : 'Mock Obj (SEC A)'}</th>
        <th className="p-6 text-center">{activeTab === 'exam' ? 'Exam Paper (SEC B)' : 'Mock Essay (SEC B)'}</th>
        <th className="p-6 text-center bg-black/10">Cumulative Grand Total</th>
        <th className="p-6">Supervisor Remark</th>
      </tr>
    </thead>
    <tbody>
      {students.map((s: any) => {
        const details = s.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, sectionC: 0, total: 0, facilitatorRemark: '', examScore: 0, mockObj: 0, mockTheory: 0 };
        const sbaSum = (details.sectionA || 0) + (details.sectionC || 0) + (details.sectionB || 0);
        return (
          <tr key={s.id} className="border-b border-gray-100 hover:bg-yellow-50/20 transition">
            <td className="p-6 font-black text-[#0f3460] uppercase text-xs">{s.firstName} {s.surname}</td>
            <td className="p-6 text-center">
              {activeTab === 'exam' ? (
                <div className="flex flex-col items-center">
                  <span className="inline-block px-4 py-2 bg-blue-50 text-[#0f3460] rounded-xl font-black text-sm border border-blue-100 shadow-inner">{sbaSum}</span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase mt-1">Mapped Sum</span>
                </div>
              ) : (
                <input type="number" max={30} className="w-20 bg-gray-50 p-2 rounded-xl text-center font-bold outline-none focus:ring-2 focus:ring-[#cca43b]" value={details.mockObj} onChange={e => handleFinalScoreChange(s.id, 'A', Number(e.target.value))} />
              )}
            </td>
            <td className="p-6 text-center">
              {activeTab === 'exam' ? (
                <input type="number" max={100} className="w-24 bg-gray-50 p-2 rounded-xl text-center font-bold outline-none focus:ring-2 focus:ring-[#0f3460]" value={details.examScore} onChange={e => handleFinalScoreChange(s.id, 'B', Number(e.target.value))} />
              ) : (
                <input type="number" max={70} className="w-24 bg-gray-50 p-2 rounded-xl text-center font-bold outline-none focus:ring-2 focus:ring-[#cca43b]" value={details.mockTheory} onChange={e => handleFinalScoreChange(s.id, 'B', Number(e.target.value))} />
              )}
            </td>
            <td className="p-6 text-center font-black text-2xl text-[#0f3460] bg-gray-50/50">{details.total}</td>
            <td className="p-6">
              <input className="w-full bg-transparent border-b border-gray-200 text-[10px] italic outline-none focus:border-[#cca43b]" value={details.facilitatorRemark} onChange={e => handleRemarkChange(s.id, e.target.value)} placeholder="Entry notes..." />
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
        const details = { ... (s.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, sectionC: 0, total: 0, facilitatorRemark: '', dailyScores: {} }) };
        
        if (isEarlyChildhood) {
          // Redirect: Submit to Observation Points (sectionB) as a percentage percentage (0-100)
          details.sectionB = Math.max(0, Math.min(score, 100));
          const derivedPercentage = getDerivedDevAvg(s, selectedSubject);
          details.total = computeTotal(details, derivedPercentage);
        } else {
          // Standard session log entry
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
        <div className="bg-[#cca43b] p-8 text-[#0f3460] flex justify-between items-center">
          <h3 className="text-2xl font-black uppercase tracking-tighter">
            {isEarlyChildhood ? 'Observation Points Entry (%)' : 'Indicator Session Entry'}
          </h3>
          <button onClick={() => setShowDailyPopout(false)} className="text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-10">
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
             <p className="text-[10px] font-black uppercase text-[#0f3460]">Active Pillar: <span className="text-[#cca43b]">{selectedSubject}</span></p>
             {isEarlyChildhood ? (
               <p className="text-[10px] font-black uppercase text-gray-400">Target Field: <span className="text-[#2e8b57]">Observation Points (Manual Entry as %)</span></p>
             ) : (
               <p className="text-[10px] font-black uppercase text-gray-400">Date: {newDate}</p>
             )}
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase border-b">
              <tr>
                <th className="p-4">Learner</th>
                <th className="p-4 text-center">Score (Max: {isEarlyChildhood ? '100%' : thresholds.sectionA})</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s.id} className="border-b hover:bg-yellow-50/30">
                  <td className="p-4 font-black uppercase text-xs">{s.firstName} {s.surname}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                       <input 
                        type="number" 
                        className="w-24 bg-gray-50 p-3 rounded-xl text-center font-black outline-none border border-transparent focus:border-[#cca43b]" 
                        value={isEarlyChildhood ? (s.scoreDetails?.[selectedSubject]?.sectionB || 0) : (s.scoreDetails?.[selectedSubject]?.dailyScores?.[newDate] || 0)} 
                        onChange={e => updateLocalScore(s.id, Number(e.target.value))} 
                      />
                      {isEarlyChildhood && <span className="font-black text-[#0f3460]">%</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-8 bg-gray-50 border-t flex justify-end">
          <button onClick={() => setShowDailyPopout(false)} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase">Close Ledger</button>
        </div>
      </div>
    </div>
  );
};

export default ScoreEntry;
