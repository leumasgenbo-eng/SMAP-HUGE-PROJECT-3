
import React, { useMemo } from 'react';
import { Pupil, GlobalSettings, Student } from '../types';
import { calculateStats, getDevelopmentalRating } from '../utils';
import EditableField from './EditableField';

interface Props {
  pupils: Pupil[];
  students: Student[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  subjectList: string[];
  activeClass: string;
}

const DaycareMasterSheet: React.FC<Props> = ({ pupils, students, settings, onSettingsChange, subjectList, activeClass }) => {
  const admittedStudents = useMemo(() => students.filter(s => s.status === 'Admitted'), [students]);

  const populatedIndicators = useMemo(() => {
    return (settings.activeIndicators || []).filter(ind => {
      return admittedStudents.some(s => (s.scoreDetails?.[ind]?.sectionA || 0) > 0);
    });
  }, [settings.activeIndicators, admittedStudents]);
  
  const populationStats = useMemo(() => {
    if (admittedStudents.length === 0) return { mean: 0, stdDev: 0, subjectMeans: {} };
    const subjectMeans: Record<string, number> = {};
    subjectList.forEach(subj => {
      const scores = admittedStudents.map(s => s.scoreDetails?.[subj]?.sectionB || 0);
      subjectMeans[subj] = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
    });
    const masterIndices = admittedStudents.map(s => {
      const obsScores = subjectList.map(subj => s.scoreDetails?.[subj]?.sectionB || 0);
      const obsAvg = obsScores.reduce((a, b) => a + b, 0) / (obsScores.length || 1);
      const indScores = populatedIndicators.map(ind => ((s.scoreDetails?.[ind]?.sectionA || 0) / 3) * 100);
      const indAvg = populatedIndicators.length > 0 ? indScores.reduce((a, b) => a + b, 0) / indScores.length : 0;
      return populatedIndicators.length > 0 ? (obsAvg + indAvg) / 2 : obsAvg;
    });
    return { ...calculateStats(masterIndices), subjectMeans };
  }, [admittedStudents, subjectList, populatedIndicators]);

  return (
    <div className="bg-white p-12 shadow-2xl border border-gray-100 min-w-max animate-fadeIn overflow-x-auto">
      <div className="text-center mb-12 border-b-4 border-double border-[#0f3460] pb-8 flex flex-col items-center">
        <EditableField 
          value={settings.schoolName} 
          onSave={v => onSettingsChange({...settings, schoolName: v})} 
          className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter mb-2" 
        />
        <EditableField 
          value={settings.motto} 
          onSave={v => onSettingsChange({...settings, motto: v})} 
          className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b] mb-4" 
        />
        
        <div className="flex flex-col items-center gap-2 text-sm font-bold text-gray-500 mb-6">
           <div className="flex items-center gap-2">
             <span className="text-gray-300 uppercase text-[9px] font-black">Location:</span>
             <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} className="uppercase" />
           </div>
           <div className="flex gap-6">
             <div className="flex items-center gap-2">
               <span className="text-gray-300 uppercase text-[9px] font-black">Contact:</span>
               <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
             </div>
             <span>|</span>
             <div className="flex items-center gap-2">
               <span className="text-gray-300 uppercase text-[9px] font-black">Email:</span>
               <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
             </div>
           </div>
        </div>

        <EditableField 
          value={settings.reportTitle || "EARLY CHILDHOOD MASTER BROAD SHEET"} 
          onSave={v => onSettingsChange({...settings, reportTitle: v})}
          className="text-2xl font-bold text-[#0f3460] uppercase tracking-widest"
        />
        <p className="text-lg font-black text-[#cca43b] uppercase mb-1 tracking-widest">CLASS: {activeClass}</p>

        <div className="mt-4 flex gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400">
           <span>Cycle: <EditableField value={settings.academicYear} onSave={v => onSettingsChange({...settings, academicYear: v})} className="inline-block" /></span>
           <span>Term: {settings.currentTerm}</span>
        </div>
      </div>

      <table className="w-full text-[10px] border-2 border-black border-collapse">
        <thead>
          <tr className="bg-[#f4f6f7] font-black text-[#0f3460] uppercase">
            <th className="p-4 border border-black text-center" rowSpan={2}>NO.</th>
            <th className="p-4 border border-black text-left min-w-[200px]" rowSpan={2}>LEARNER FULL NAME</th>
            <th className="p-2 border border-black text-center bg-blue-50" colSpan={subjectList.length}>SUBJECT SUMMARIES (100%)</th>
            {populatedIndicators.length > 0 && (
              <th className="p-2 border border-black text-center bg-green-50" colSpan={populatedIndicators.length}>DEVELOPMENT INDICATORS</th>
            )}
            <th className="p-2 border border-black text-center bg-yellow-50" rowSpan={2}>DEV. INDEX<br/>(RATING)</th>
          </tr>
          <tr className="bg-gray-50">
            {subjectList.map(subj => <th key={subj} className="p-1 border border-black h-48 align-bottom min-w-[40px]"><span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-black uppercase pb-2">{subj}</span></th>)}
            {populatedIndicators.map(ind => <th key={ind} className="p-1 border border-black h-48 align-bottom min-w-[35px] bg-green-50/30"><span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold uppercase pb-2 text-green-800">{ind}</span></th>)}
          </tr>
        </thead>
        <tbody>
          {admittedStudents.map((s, idx) => {
            const obsScores = subjectList.map(subj => s.scoreDetails?.[subj]?.sectionB || 0);
            const obsAvg = obsScores.reduce((a, b) => a + b, 0) / (obsScores.length || 1);
            const indScores = populatedIndicators.map(ind => (s.scoreDetails?.[ind]?.sectionA || 0));
            const indAvgScaled = populatedIndicators.length > 0 ? (indScores.reduce((a, b) => a + b, 0) / indScores.length / 3) * 100 : 0;
            const studentMasterIndex = populatedIndicators.length > 0 ? (obsAvg + indAvgScaled) / 2 : obsAvg;
            // Pass scale from settings to satisfy the 5-argument requirement of getDevelopmentalRating
            const rating = getDevelopmentalRating(studentMasterIndex, populationStats.mean, populationStats.stdDev, settings.earlyChildhoodGrading.indicators.type as any, settings.gradingScale);
            return (
              <tr key={s.id} className="hover:bg-blue-50/30 transition border-b">
                <td className="p-2 border border-black text-center font-black">{idx + 1}</td>
                <td className="p-2 border border-black font-black uppercase text-[11px]">{s.firstName} {s.surname}</td>
                {subjectList.map(subj => <td key={subj} className="p-2 border border-black text-center font-black text-blue-800">{s.scoreDetails?.[subj]?.sectionB || 0}%</td>)}
                {populatedIndicators.map(ind => <td key={ind} className="p-1 border border-black text-center font-bold text-green-700 bg-green-50/10">{s.scoreDetails?.[ind]?.sectionA || '--'}</td>)}
                <td className="p-2 border border-black text-center font-black bg-yellow-50/30">
                   <div className="flex flex-col items-center">
                      <span className="px-3 py-1 rounded-lg text-white text-[8px] uppercase tracking-tighter shadow-sm" style={{ background: rating.color }}>{rating.label}</span>
                   </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DaycareMasterSheet;
