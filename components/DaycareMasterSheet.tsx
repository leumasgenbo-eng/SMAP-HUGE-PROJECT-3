
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

  // Filter out indicators that have no data across the entire class to prevent clutter
  const populatedIndicators = useMemo(() => {
    return (settings.activeIndicators || []).filter(ind => {
      return admittedStudents.some(s => (s.scoreDetails?.[ind]?.sectionA || 0) > 0);
    });
  }, [settings.activeIndicators, admittedStudents]);
  
  // Population statistics for subjects and the Dev Index
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

      const indScores = populatedIndicators.map(ind => {
        const raw = s.scoreDetails?.[ind]?.sectionA || 0;
        return (raw / 3) * 100;
      });
      const indAvg = populatedIndicators.length > 0 
        ? indScores.reduce((a, b) => a + b, 0) / indScores.length 
        : 0;

      return populatedIndicators.length > 0 ? (obsAvg + indAvg) / 2 : obsAvg;
    });

    const stats = calculateStats(masterIndices);
    return { ...stats, subjectMeans };
  }, [admittedStudents, subjectList, populatedIndicators]);

  const handleSharePDF = () => {
    window.print();
  };

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
        
        <h2 className="text-2xl font-bold text-[#0f3460] uppercase tracking-widest">EARLY CHILDHOOD MASTER BROAD SHEET - {activeClass}</h2>
        
        <div className="flex flex-col items-center gap-1 text-sm font-bold text-gray-500 mt-4 mb-4">
          <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} className="uppercase" />
          <div className="flex gap-4">
            <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
            <span>|</span>
            <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
          </div>
        </div>

        <div className="mt-4 flex gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400 no-print">
           <span>Cycle: {settings.academicYear}</span>
           <span>Term: {settings.currentTerm}</span>
           <span>Rating Standard: {settings.earlyChildhoodGrading.indicators.type}-Point Scale</span>
           <button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-4 py-1 rounded-lg hover:scale-105 transition shadow-lg">Share Broad Sheet</button>
        </div>
      </div>

      <table className="w-full text-[10px] border-2 border-black border-collapse">
        <thead>
          <tr className="bg-[#f4f6f7] font-black text-[#0f3460] uppercase">
            <th className="p-4 border border-black text-center" rowSpan={2}>NO.</th>
            <th className="p-4 border border-black text-left min-w-[200px]" rowSpan={2}>LEARNER FULL NAME</th>
            <th className="p-2 border border-black text-center bg-blue-50" colSpan={subjectList.length}>SUBJECT SUMMARIES (OBS. POINTS 100%)</th>
            {populatedIndicators.length > 0 && (
              <th className="p-2 border border-black text-center bg-green-50" colSpan={populatedIndicators.length}>OBSERVATION DATA (INDICATOR SUMMARIES)</th>
            )}
            <th className="p-2 border border-black text-center bg-yellow-50" rowSpan={2}>DEV. INDEX<br/>(RATING)</th>
          </tr>
          <tr className="bg-gray-50">
            {subjectList.map(subj => (
              <th key={subj} className="p-1 border border-black h-48 align-bottom min-w-[40px]">
                 <div className="flex flex-col items-center justify-end h-full">
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-black uppercase pb-2">
                      {subj}
                    </span>
                 </div>
              </th>
            ))}
            {populatedIndicators.map(ind => (
              <th key={ind} className="p-1 border border-black h-48 align-bottom min-w-[35px] bg-green-50/30">
                 <div className="flex flex-col items-center justify-end h-full">
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold uppercase pb-2 text-green-800">
                      {ind}
                    </span>
                 </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {admittedStudents.map((s, idx) => {
            const obsScores = subjectList.map(subj => s.scoreDetails?.[subj]?.sectionB || 0);
            const obsAvg = obsScores.reduce((a, b) => a + b, 0) / (obsScores.length || 1);
            const indScores = populatedIndicators.map(ind => (s.scoreDetails?.[ind]?.sectionA || 0));
            const indAvgScaled = populatedIndicators.length > 0 
                ? (indScores.reduce((a, b) => a + b, 0) / indScores.length / 3) * 100
                : 0;
            
            const studentMasterIndex = populatedIndicators.length > 0 ? (obsAvg + indAvgScaled) / 2 : obsAvg;
            const rating = getDevelopmentalRating(studentMasterIndex, populationStats.mean, populationStats.stdDev, settings.earlyChildhoodGrading.indicators.type as any);

            return (
              <tr key={s.id} className="hover:bg-blue-50/30 transition border-b border-gray-100">
                <td className="p-2 border border-black text-center font-black">{idx + 1}</td>
                <td className="p-2 border border-black font-black uppercase text-xs truncate max-w-[200px]">{s.firstName} {s.surname}</td>
                
                {subjectList.map(subj => (
                  <td key={subj} className="p-2 border border-black text-center font-black text-blue-800">
                    {s.scoreDetails?.[subj]?.sectionB || 0}%
                  </td>
                ))}

                {populatedIndicators.map(ind => (
                  <td key={ind} className="p-1 border border-black text-center font-bold text-green-700 bg-green-50/10">
                    {s.scoreDetails?.[ind]?.sectionA || '--'}
                  </td>
                ))}

                <td className="p-2 border border-black text-center font-black bg-yellow-50/30">
                   <div className="flex flex-col items-center">
                      <span className="px-3 py-1 rounded-lg text-white text-[9px] uppercase tracking-tighter shadow-sm" style={{ background: rating.color }}>
                        {rating.label}
                      </span>
                      <span className="text-[7px] text-gray-400 mt-1 uppercase font-bold">Z: {((studentMasterIndex - populationStats.mean) / (populationStats.stdDev || 1)).toFixed(2)}</span>
                   </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-100 font-black">
          <tr>
            <td className="p-3 border border-black text-right uppercase" colSpan={2}>Class Average Performance:</td>
            {subjectList.map(subj => (
              <td key={subj} className="p-2 border border-black text-center text-blue-900 bg-blue-50">
                {(populationStats.subjectMeans as any)[subj]?.toFixed(1)}%
              </td>
            ))}
            {populatedIndicators.map(ind => (
               <td key={ind} className="p-1 border border-black text-center text-green-900 bg-green-50">
                 {/* Average indicator score for the class */}
                 {(admittedStudents.reduce((a, b) => a + (b.scoreDetails?.[ind]?.sectionA || 0), 0) / (admittedStudents.length || 1)).toFixed(1)}
               </td>
            ))}
            <td className="p-2 border border-black text-center text-[#0f3460] bg-yellow-100">
              {populationStats.mean.toFixed(1)}%
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="p-6 bg-blue-50 rounded-[2.5rem] border border-blue-100">
            <h4 className="text-[10px] font-black uppercase text-blue-500 mb-4 tracking-widest">A) Subject Summaries Logic</h4>
            <p className="text-[9px] text-blue-700 leading-relaxed italic">
              Percentages represent manual Observation Points logged from the result hub. These track coreLearning Area pillars.
            </p>
         </div>
         
         <div className="p-6 bg-green-50 rounded-[2.5rem] border border-green-100">
            <h4 className="text-[10px] font-black uppercase text-green-500 mb-4 tracking-widest">B) Observation Data Logic</h4>
            <p className="text-[9px] text-green-700 leading-relaxed italic">
              Values represent individual Summarised Active Indicators. Columns are hidden if no learner in the class has data.
            </p>
         </div>

         <div className="p-6 bg-yellow-50/50 rounded-[2.5rem] border border-yellow-100">
            <h4 className="text-[10px] font-black uppercase text-yellow-600 mb-4 tracking-widest">C) Statistical Population Index</h4>
            <div className="space-y-3">
               <p className="text-[8px] font-bold text-yellow-800 uppercase leading-tight">
                Rating based on {settings.earlyChildhoodGrading.indicators.type}-Point Cut-off. 
                Class Mean: {populationStats.mean.toFixed(1)}% | σ: {populationStats.stdDev.toFixed(2)}
               </p>
            </div>
         </div>
      </div>

      <div className="mt-16 flex justify-end">
        <div className="text-center w-80">
          <div className="h-20 flex items-end justify-center pb-2 italic font-serif text-3xl border-b-2 border-black text-[#0f3460]">
             H. Baylor
          </div>
          <div className="pt-3">
            <p className="font-black uppercase text-sm tracking-tighter text-[#0f3460]">HEADTEACHER'S AUTHORIZATION</p>
            <p className="text-[10px] text-gray-400 italic uppercase mt-1">United Baylor Academy Official Certification</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaycareMasterSheet;
