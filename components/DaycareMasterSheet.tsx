
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
  const admittedStudents = useMemo(() => students.filter(s => s.status === 'Admitted' && s.currentClass === activeClass), [students, activeClass]);

  const populationStats = useMemo(() => {
    if (admittedStudents.length === 0) return { mean: 0, stdDev: 0 };
    const masterIndices = admittedStudents.map(s => {
      const obsScores = subjectList.map(subj => s.scoreDetails?.[subj]?.sectionB || 0);
      const obsAvg = obsScores.reduce((a, b) => a + b, 0) / (obsScores.length || 1);
      return obsAvg;
    });
    return calculateStats(masterIndices);
  }, [admittedStudents, subjectList]);

  return (
    <div className="bg-white p-12 shadow-2xl border border-gray-100 min-w-max animate-fadeIn overflow-x-auto">
      {/* Standard Institutional Header */}
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
        
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 no-print mb-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-300">ADDR:</span>
            <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-300">TEL:</span>
            <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-300">EMAIL:</span>
            <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
          </div>
        </div>

        <h2 className="text-2xl font-black text-[#0f3460] uppercase tracking-widest">EARLY CHILDHOOD MASTER BROAD SHEET - {activeClass}</h2>
        
        <div className="mt-4 flex gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400">
           <span>Cycle: <EditableField value={settings.academicYear} onSave={v => onSettingsChange({...settings, academicYear: v})} className="inline-block" /></span>
           <span>Term: {settings.currentTerm}</span>
           <span>Rating System: 3-Point Statistical Scale</span>
           <button onClick={() => window.print()} className="bg-[#2e8b57] text-white px-4 py-1 rounded-lg hover:scale-105 transition shadow-lg no-print">Share PDF</button>
        </div>
      </div>

      <table className="w-full text-[10px] border-2 border-black border-collapse">
        <thead>
          <tr className="bg-[#f4f6f7] font-black text-[#0f3460] uppercase">
            <th className="p-4 border border-black text-center" rowSpan={2}>NO.</th>
            <th className="p-4 border border-black text-left min-w-[200px]" rowSpan={2}>LEARNER FULL NAME</th>
            <th className="p-2 border border-black text-center bg-blue-50" colSpan={subjectList.length}>SUBJECT SUMMARIES (%)</th>
            <th className="p-2 border border-black text-center bg-green-50" colSpan={1}>OBSERVATION DATA</th>
            <th className="p-2 border border-black text-center bg-yellow-50" rowSpan={2}>DEV. INDEX<br/>(RATING)</th>
          </tr>
          <tr className="bg-gray-50">
            {subjectList.map(subj => (
              <th key={subj} className="p-1 border border-black h-40 align-bottom min-w-[50px]">
                 <div className="flex flex-col items-center justify-end h-full">
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-black uppercase pb-2">{subj}</span>
                 </div>
              </th>
            ))}
            <th className="p-1 border border-black h-40 align-bottom min-w-[120px] bg-green-50/30">
               <div className="flex flex-col items-center justify-end h-full font-black uppercase text-[9px] pb-2">
                 Observation Points (%)
               </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {admittedStudents.map((s, idx) => {
            const obsScores = subjectList.map(subj => s.scoreDetails?.[subj]?.sectionB || 0);
            const obsAvg = obsScores.reduce((a, b) => a + b, 0) / (obsScores.length || 1);
            const rating = getDevelopmentalRating(obsAvg, populationStats.mean, populationStats.stdDev, 3);
            return (
              <tr key={s.id} className="hover:bg-blue-50/30 transition border-b border-gray-100">
                <td className="p-2 border border-black text-center font-black">{idx + 1}</td>
                <td className="p-2 border border-black font-black uppercase text-xs truncate max-w-[200px]">{s.firstName} {s.surname}</td>
                {subjectList.map(subj => (
                  <td key={subj} className="p-2 border border-black text-center font-bold text-blue-800 bg-blue-50/5">{s.scoreDetails?.[subj]?.sectionB || 0}%</td>
                ))}
                <td className="p-2 border border-black text-center font-black text-green-700 bg-green-50/10 text-lg">{Math.round(obsAvg)}%</td>
                <td className="p-2 border border-black text-center font-black bg-yellow-50/30">
                   <span className="px-3 py-1 rounded-lg text-white text-[8px] uppercase tracking-tighter shadow-sm" style={{ background: rating.color }}>{rating.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 space-y-3 shadow-sm">
            <h4 className="text-xs font-black uppercase text-blue-900 tracking-widest border-b border-blue-200 pb-2">Subject Weights</h4>
            <p className="text-[10px] text-blue-700 italic leading-relaxed">
              Percentages are derived from mapped indicator sessions. Core subjects are calculated as the mean achievement across all sub-pillars.
            </p>
         </div>
         <div className="p-8 bg-green-50 rounded-[2.5rem] border border-green-100 space-y-3 shadow-sm">
            <h4 className="text-xs font-black uppercase text-green-900 tracking-widest border-b border-green-200 pb-2">Observation Methodology</h4>
            <p className="text-[10px] text-green-700 italic leading-relaxed">
              Observation Points are manual inputs (0-100%) tracking behavioral milestones and non-academic growth trajectories.
            </p>
         </div>
         <div className="p-8 bg-yellow-50 rounded-[2.5rem] border border-yellow-100 space-y-3 shadow-sm">
            <h4 className="text-xs font-black uppercase text-yellow-900 tracking-widest border-b border-yellow-200 pb-2">Statistical Scale Logic</h4>
            <div className="text-[9px] text-yellow-800 font-black space-y-1">
               <p className="uppercase opacity-40">Current Cut-off: 3-Point Population Mean</p>
               <div className="flex justify-between border-b border-yellow-200 py-1"><span>D: Developing</span><span>Z &lt; -1</span></div>
               <div className="flex justify-between border-b border-yellow-200 py-1"><span>A: Achieving</span><span>-1 ≤ Z ≤ 1</span></div>
               <div className="flex justify-between border-b border-yellow-200 py-1"><span>A+: Advanced</span><span>Z &gt; 1</span></div>
            </div>
         </div>
      </div>

      <div className="mt-16 flex justify-end">
        <div className="text-center w-80">
          <div className="h-20 flex items-end justify-center pb-2 italic font-serif text-3xl border-b-2 border-black text-[#0f3460]">
             <EditableField value={settings.headteacherName} onSave={v => onSettingsChange({...settings, headteacherName: v})} className="text-center" />
          </div>
          <div className="pt-3">
            <p className="font-black uppercase text-sm tracking-tighter text-[#0f3460]">HEADTEACHER'S AUTHORIZATION</p>
            <p className="text-[10px] text-gray-400 italic uppercase mt-1">United Baylor Academy Certified Master Document</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaycareMasterSheet;
