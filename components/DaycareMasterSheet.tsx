
import React, { useMemo } from 'react';
import { Pupil, GlobalSettings, Student } from '../types';
import { calculateStats, getDevelopmentalRating, calculateWeightedScore } from '../utils';
import { DAYCARE_ACTIVITY_GROUPS } from '../constants';
import EditableField from './EditableField';

interface Props {
  pupils: Pupil[];
  students: Student[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  subjectList: string[];
  activeClass: string;
  department: string;
}

const DaycareMasterSheet: React.FC<Props> = ({ students, settings, onSettingsChange, subjectList, activeClass, department }) => {
  const admittedStudents = useMemo(() => students.filter(s => s.status === 'Admitted' && s.currentClass === activeClass), [students, activeClass]);
  const isDaycare = department === 'D&N';

  // Group Summary Logic: Define labels based on constants
  const activityGroups = Object.keys(DAYCARE_ACTIVITY_GROUPS);

  const processedData = useMemo(() => {
    return admittedStudents.map(s => {
      // 1. Calculate Academic Pillars per subject
      const subjectMetrics = subjectList.map(subj => {
        // Exercises Avg
        const exEntries = (settings.exerciseEntries || []).filter(e => e.subject === subj);
        const exAvg = exEntries.length > 0 
          ? (exEntries.reduce((acc, e) => acc + ((e.pupilScores?.[s.id] || 0) / (e.maxScore || 1)), 0) / exEntries.length) * 100
          : 0;

        // CAT Avg
        const sba = settings.sbaConfigs[s.currentClass]?.[subj];
        let catAvg = 0;
        if (sba) {
          const c1 = (sba.cat1.scores?.[s.id] || 0) / (sba.cat1.marks || 20);
          const c2 = (sba.cat2.scores?.[s.id] || 0) / (sba.cat2.marks || 20);
          const c3 = (sba.cat3.scores?.[s.id] || 0) / (sba.cat3.marks || 10);
          catAvg = ((c1 + c2 + c3) / 3) * 100;
        }

        // Final Exam
        const sd = s.scoreDetails?.[subj];
        const tConf = settings.terminalConfigs[s.currentClass] || { sectionAMax: 30, sectionBMax: 70 };
        const examRaw = (sd?.mockObj || 0) + (sd?.mockTheory || 0);
        const examScore = (examRaw / (tConf.sectionAMax + tConf.sectionBMax)) * 100;

        const weightedTotal = calculateWeightedScore(s, subj, settings);

        return { subj, exAvg, catAvg, examScore, weightedTotal };
      });

      // 2. Calculate Group Summaries (Only for Daycare)
      const groupAverages: Record<string, number> = {};
      if (isDaycare) {
        activityGroups.forEach(group => {
          const indicators = DAYCARE_ACTIVITY_GROUPS[group as keyof typeof DAYCARE_ACTIVITY_GROUPS] || [];
          let total = 0;
          let count = 0;
          indicators.forEach(ind => {
            const val = s.scoreDetails?.[ind]?.sectionA || 0;
            if (val > 0) {
              total += val;
              count++;
            }
          });
          // Scale 1-3 to 100% for index calculation
          groupAverages[group] = count > 0 ? ((total / count) / 3) * 100 : 0;
        });
      }

      const academicAvg = subjectMetrics.reduce((a, b) => a + b.weightedTotal, 0) / (subjectList.length || 1);
      const developmentalAvg = isDaycare 
        ? Object.values(groupAverages).filter(v => v > 0).reduce((a, b) => a + b, 0) / (activityGroups.length || 1)
        : 0;

      const masterIndex = isDaycare ? (academicAvg + developmentalAvg) / 2 : academicAvg;

      return {
        id: s.id,
        name: `${s.firstName} ${s.surname}`,
        metrics: subjectMetrics,
        groupAverages,
        masterIndex
      };
    });
  }, [admittedStudents, subjectList, settings, isDaycare, activityGroups]);

  const stats = useMemo(() => {
    const indices = processedData.map(d => d.masterIndex);
    return calculateStats(indices);
  }, [processedData]);

  return (
    <div className="bg-white p-6 md:p-12 shadow-2xl border border-gray-100 min-w-max animate-fadeIn overflow-x-auto">
      {/* Institutional Particulars Header */}
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

        <h2 className="text-2xl font-bold text-[#0f3460] uppercase tracking-widest">
          {isDaycare ? "DAYCARE & NURSERY" : "PRESCHOOL"} MASTER BROAD SHEET
        </h2>
        <p className="text-lg font-black text-[#cca43b] uppercase mb-1 tracking-widest">CLASS: {activeClass}</p>

        <div className="mt-4 flex gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400">
           <span>Academic Year: {settings.academicYear}</span>
           <span>Term Cycle: {settings.currentTerm}</span>
        </div>
      </div>

      <table className="w-full text-[10px] border-2 border-black border-collapse">
        <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
          <tr>
            <th className="p-4 border border-black text-center" rowSpan={3}>NO.</th>
            <th className="p-4 border border-black text-left min-w-[220px]" rowSpan={3}>LEARNER FULL NAME</th>
            {subjectList.map(subj => (
              <th key={subj} className="p-2 border border-black text-center bg-blue-50/50" colSpan={4}>{subj}</th>
            ))}
            {isDaycare && (
              <th className="p-2 border border-black text-center bg-green-50/50" colSpan={activityGroups.length}>DEVELOPMENTAL GROUP SUMMARY</th>
            )}
            <th className="p-4 border border-black text-center bg-yellow-50" rowSpan={3}>FINAL<br/>INDEX</th>
            <th className="p-4 border border-black text-center bg-yellow-50" rowSpan={3}>NRT<br/>RATING</th>
          </tr>
          <tr className="bg-gray-50">
            {subjectList.map(subj => (
              <React.Fragment key={subj}>
                <th className="p-1 border border-black text-[7px]">EXER</th>
                <th className="p-1 border border-black text-[7px]">CAT</th>
                <th className="p-1 border border-black text-[7px]">EXAM</th>
                <th className="p-1 border border-black text-[8px] bg-blue-100/50">TOT</th>
              </React.Fragment>
            ))}
            {isDaycare && activityGroups.map(group => (
              <th key={group} className="p-1 border border-black h-40 align-bottom min-w-[35px] bg-green-50/20">
                <span className="[writing-mode:vertical-rl] rotate-180 text-[7px] font-black uppercase pb-2">{group}</span>
              </th>
            ))}
          </tr>
          <tr className="bg-white text-[7px] text-gray-400">
             {subjectList.map(subj => (
               <React.Fragment key={subj}>
                 <th className="border border-black">({settings.assessmentWeights.exercises}%)</th>
                 <th className="border border-black">({settings.assessmentWeights.cats}%)</th>
                 <th className="border border-black">({settings.assessmentWeights.terminal}%)</th>
                 <th className="border border-black bg-blue-100/30">(100%)</th>
               </React.Fragment>
             ))}
             {isDaycare && activityGroups.map(g => <th key={g} className="border border-black">Avg</th>)}
          </tr>
        </thead>
        <tbody>
          {processedData.map((data, idx) => {
            const rating = getDevelopmentalRating(data.masterIndex, stats.mean, stats.stdDev, 9, settings.gradingScale);
            return (
              <tr key={data.id} className="hover:bg-yellow-50 transition border-b group">
                <td className="p-2 border border-black text-center font-black">{idx + 1}</td>
                <td className="p-2 border border-black font-black uppercase text-[11px] bg-white sticky left-0 z-10 group-hover:bg-yellow-50">{data.name}</td>
                {data.metrics.map(m => (
                  <React.Fragment key={m.subj}>
                    <td className="p-1 border border-black text-center text-gray-500">{m.exAvg.toFixed(0)}</td>
                    <td className="p-1 border border-black text-center text-gray-500">{m.catAvg.toFixed(0)}</td>
                    <td className="p-1 border border-black text-center text-gray-500">{m.examScore.toFixed(0)}</td>
                    <td className="p-1 border border-black text-center font-black text-blue-800 bg-blue-50/30">{m.weightedTotal}</td>
                  </React.Fragment>
                ))}
                {isDaycare && activityGroups.map(group => {
                   const gScore = data.groupAverages[group];
                   return (
                     <td key={group} className="p-1 border border-black text-center font-bold text-green-700">
                        {gScore > 0 ? gScore.toFixed(0) : '--'}
                     </td>
                   );
                })}
                <td className="p-2 border border-black text-center font-black bg-yellow-50/30 text-sm">
                  {data.masterIndex.toFixed(1)}
                </td>
                <td className="p-2 border border-black text-center font-black bg-yellow-50/50">
                   <span className="px-2 py-0.5 rounded-lg text-white text-[7px] uppercase" style={{ background: rating.color }}>
                      {rating.label}
                   </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-[#f4f6f7] font-black text-[#0f3460]">
           <tr>
              <td className="p-3 border border-black text-right" colSpan={2}>CLASS PERFORMANCE MEAN</td>
              {subjectList.map(subj => {
                 const scores = processedData.map(d => d.metrics.find(m => m.subj === subj)?.weightedTotal || 0);
                 const m = scores.length > 0 ? scores.reduce((a,b)=>a+b, 0)/scores.length : 0;
                 return (
                   <React.Fragment key={subj}>
                      <td className="border border-black" colSpan={3}></td>
                      <td className="p-1 border border-black text-center bg-blue-100">{m.toFixed(1)}%</td>
                   </React.Fragment>
                 );
              })}
              {isDaycare && activityGroups.map(g => (
                <td key={g} className="p-1 border border-black text-center text-[7px]">
                   {(processedData.reduce((a,b)=>a+b.groupAverages[g], 0) / (processedData.length || 1)).toFixed(0)}%
                </td>
              ))}
              <td className="p-1 border border-black text-center bg-yellow-200" colSpan={2}>{stats.mean.toFixed(1)}%</td>
           </tr>
        </tfoot>
      </table>

      {/* Broad Sheet Legend */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10 no-print border-t pt-8">
         <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-[#0f3460] tracking-widest border-b-2 border-[#cca43b] w-fit pb-1">Assessment Matrix Legend</h4>
            <div className="flex gap-6 text-[8px] font-bold text-gray-500 uppercase">
               <div className="flex flex-col"><span className="text-[#0f3460] font-black">EXER</span><span>Daily Exercises ({settings.assessmentWeights.exercises}%)</span></div>
               <div className="flex flex-col"><span className="text-[#0f3460] font-black">CAT</span><span>CAT Series ({settings.assessmentWeights.cats}%)</span></div>
               <div className="flex flex-col"><span className="text-[#0f3460] font-black">EXAM</span><span>Terminal Exam ({settings.assessmentWeights.terminal}%)</span></div>
            </div>
         </div>
         <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-[#0f3460] tracking-widest border-b-2 border-[#cca43b] w-fit pb-1">Master Index Calculation</h4>
            <p className="text-[9px] text-gray-400 leading-relaxed italic">
               The Master Index is a composite of Academic weighted scores (50%) and Developmental Indicator performance (50%). 
               Ratings are mapped against the institutional NRT curve.
            </p>
         </div>
      </div>

      <div className="hidden print:flex justify-end mt-20">
        <div className="text-center w-80">
          <div className="h-16 flex items-end justify-center pb-2 italic font-serif text-3xl border-b-2 border-black text-[#0f3460]">
             H. Baylor
          </div>
          <div className="pt-4">
            <p className="font-black uppercase text-sm text-[#0f3460] tracking-tighter">Institutional Authorization</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Headteacher's Certified Broad Sheet Audit</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaycareMasterSheet;
