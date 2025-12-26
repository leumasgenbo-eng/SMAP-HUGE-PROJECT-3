
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
  const isDaycare = department === 'D&N' || department === 'KG';

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

      // 2. Calculate Group Summaries (Developmental Milestones)
      const groupAverages: Record<string, number> = {};
      activityGroups.forEach(group => {
        const indicators = DAYCARE_ACTIVITY_GROUPS[group as keyof typeof DAYCARE_ACTIVITY_GROUPS] || [];
        let total = 0;
        let count = 0;
        indicators.forEach(ind => {
          const detail = s.scoreDetails?.[ind];
          if (detail?.dailyScores) {
            const vals = Object.values(detail.dailyScores).map(Number);
            if (vals.length > 0) {
              total += vals.reduce((a, b) => a + b, 0) / vals.length;
              count++;
            }
          }
        });
        // Scale 1-3 to 100% for index calculation
        groupAverages[group] = count > 0 ? ((total / count) / 3) * 100 : 0;
      });

      const academicAvg = subjectMetrics.length > 0 
        ? subjectMetrics.reduce((a, b) => a + b.weightedTotal, 0) / subjectMetrics.length
        : 0;
        
      const developmentalAvg = activityGroups.length > 0
        ? Object.values(groupAverages).filter(v => v > 0).reduce((a, b) => a + b, 0) / activityGroups.length
        : 0;

      const masterIndex = (academicAvg + developmentalAvg) / 2;

      return {
        id: s.id,
        name: `${s.firstName} ${s.surname}`,
        metrics: subjectMetrics,
        groupAverages,
        masterIndex
      };
    });
  }, [admittedStudents, subjectList, settings, activityGroups]);

  const stats = useMemo(() => {
    const indices = processedData.map(d => d.masterIndex);
    return calculateStats(indices);
  }, [processedData]);

  return (
    <div className="bg-white p-4 md:p-12 shadow-2xl border border-gray-100 min-w-max animate-fadeIn overflow-x-auto">
      {/* Comprehensive Editable Branding Header */}
      <div className="text-center mb-12 border-b-4 border-double border-[#0f3460] pb-8 flex flex-col items-center">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-gray-100 flex items-center justify-center overflow-hidden group relative">
            {settings.logo ? (
              <img src={settings.logo} className="w-full h-full object-contain" alt="Logo" />
            ) : (
              <span className="text-4xl">👶</span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center no-print">
              <EditableField 
                value={settings.logo} 
                onSave={v => onSettingsChange({...settings, logo: v})} 
                placeholder="Logo URL"
                className="text-[8px] text-white bg-transparent border-white"
              />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <EditableField 
              value={settings.schoolName} 
              onSave={v => onSettingsChange({...settings, schoolName: v})} 
              className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter mb-1" 
            />
            <EditableField 
              value={settings.motto} 
              onSave={v => onSettingsChange({...settings, motto: v})} 
              className="text-[11px] font-black uppercase tracking-[0.4em] text-[#cca43b]" 
            />
          </div>
        </div>
        
        <div className="flex justify-center gap-8 text-xs font-bold text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-100 w-full max-w-5xl">
          <div className="flex items-center gap-2">
            <span className="text-[#cca43b] text-[10px]">📍</span>
            <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#cca43b] text-[10px]">📞</span>
            <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#cca43b] text-[10px]">✉️</span>
            <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className="lowercase" />
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <h2 className="text-2xl font-black text-[#0f3460] uppercase tracking-widest border-b-2 border-black/5 pb-1">
            {department} DEVELOPMENTAL MASTER BROAD SHEET
          </h2>
          <p className="text-lg font-black text-[#cca43b] uppercase tracking-[0.2em]">CLASS: {activeClass}</p>
        </div>

        <div className="mt-4 flex gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-6 py-2 rounded-full no-print">
           <span>Academic Year: <EditableField value={settings.academicYear} onSave={v => onSettingsChange({...settings, academicYear: v})} className="inline-block" /></span>
           <span>Term Cycle: {settings.currentTerm}</span>
           <span>Audit Date: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <table className="w-full text-[10px] border-2 border-black border-collapse">
        <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
          <tr>
            <th className="p-4 border border-black text-center" rowSpan={3}>NO.</th>
            <th className="p-4 border border-black text-left min-w-[220px]" rowSpan={3}>LEARNER FULL NAME</th>
            {subjectList.map(subj => (
              <th key={subj} className="p-2 border border-black text-center bg-blue-50/30" colSpan={4}>{subj}</th>
            ))}
            <th className="p-2 border border-black text-center bg-green-50/30" colSpan={activityGroups.length}>DEVELOPMENTAL GROUP SUMMARY (AVGS)</th>
            <th className="p-4 border border-black text-center bg-yellow-50" rowSpan={3}>FINAL<br/>INDEX</th>
            <th className="p-4 border border-black text-center bg-yellow-50" rowSpan={3}>NRT<br/>RATING</th>
          </tr>
          <tr className="bg-gray-50 text-[7px]">
            {subjectList.map(subj => (
              <React.Fragment key={subj}>
                <th className="p-1 border border-black">EXER</th>
                <th className="p-1 border border-black">CAT</th>
                <th className="p-1 border border-black">EXAM</th>
                <th className="p-1 border border-black bg-blue-100/50">TOT</th>
              </React.Fragment>
            ))}
            {activityGroups.map(group => (
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
             {activityGroups.map(g => <th key={g} className="border border-black">--</th>)}
          </tr>
        </thead>
        <tbody>
          {processedData.length === 0 ? (
            <tr><td colSpan={subjectList.length * 4 + activityGroups.length + 4} className="p-32 text-center font-black uppercase text-gray-300 italic">No Enrolled Pupils Found for {activeClass}</td></tr>
          ) : processedData.map((data, idx) => {
            const rating = getDevelopmentalRating(data.masterIndex, stats.mean, stats.stdDev, 3, settings.gradingScale);
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
                {activityGroups.map(group => {
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
              {activityGroups.map(g => (
                <td key={g} className="p-1 border border-black text-center text-[7px]">
                   {(processedData.reduce((a,b)=>a + (b.groupAverages[g] || 0), 0) / (processedData.length || 1)).toFixed(0)}%
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
            <h4 className="text-xs font-black uppercase text-[#0f3460] tracking-widest border-b-2 border-[#cca43b] w-fit pb-1">Calculation Hierarchy</h4>
            <p className="text-[9px] text-gray-400 leading-relaxed italic">
               The Master Index is a composite of Academic weighted scores (50%) and Developmental Indicator performance (50%). 
               Ratings are mapped against the institutional NRT curve for Term {settings.currentTerm}.
            </p>
         </div>
      </div>

      <div className="hidden print:flex justify-end mt-20">
        <div className="text-center w-80">
          <div className="h-16 flex items-end justify-center pb-2 italic font-serif text-3xl border-b-2 border-black text-[#0f3460]">
             <EditableField 
                value={settings.headteacherName} 
                onSave={v => onSettingsChange({...settings, headteacherName: v})} 
                className="text-center"
             />
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
