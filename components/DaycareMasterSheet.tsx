
import React, { useMemo } from 'react';
import { Pupil, GlobalSettings } from '../types';
import { getDaycareGrade, calculateStats, getDevelopmentalRating } from '../utils';
import { DAYCARE_ACTIVITY_GROUPS } from '../constants';
import EditableField from './EditableField';

interface Props {
  pupils: Pupil[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  subjectList: string[];
  activeClass: string;
}

const DaycareMasterSheet: React.FC<Props> = ({ pupils, settings, onSettingsChange, subjectList, activeClass }) => {
  const indicators = settings.activeIndicators || [];
  
  // Mapping of subjects to their constituent indicator groups
  const groupMapping = useMemo(() => ({
    "Language & Literacy": ["Language & Literacy"],
    "Numeracy": ["Numeracy"],
    "OWOP": ["Physical Development", "Socio-Emotional"],
    "Creative Activity": ["Creative Arts"]
  }), []);

  // Helper to derive developmental average percentage from a student's indicators
  const getGroupAvg = (pupilName: string, subject: string) => {
    const activityGroups = groupMapping[subject as keyof typeof groupMapping] || [];
    let totalScore = 0;
    let count = 0;
    const maxIndicatorScore = 3; 

    // Find the student in the raw students array (pupils are processed)
    // Note: In a real app we'd pass raw students or structured data, 
    // for this logic we'll assume the pupil object might have some score details or 
    // we use the 'scores' map if we populated it correctly.
    // However, pupils.scores currently holds core subject totals.
    return pupils.find(p => p.name === pupilName)?.scores[subject] || 0;
  };

  // Population stats for the "Observation Points" column and Group Averages
  const obsStats = useMemo(() => {
    const scores = pupils.map(p => p.scores["Observation Points"] || 0);
    return calculateStats(scores);
  }, [pupils]);

  const getShortName = (name: string) => {
    return name.split(' ').slice(0, 3).join(' ');
  };

  const handleSharePDF = () => {
    alert("Generating Early Childhood Master Sheet PDF with Statistical Indices...");
  };

  return (
    <div className="bg-white p-12 shadow-2xl border border-gray-100 min-w-max animate-fadeIn">
      {/* Header */}
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

        <div className="mt-4 flex gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400">
           <span>Cycle: {settings.academicYear}</span>
           <span>Term: {settings.currentTerm}</span>
           <span>Rating System: {settings.earlyChildhoodGrading.indicators.type}-Point Statistical Scale</span>
           <button onClick={handleSharePDF} className="no-print bg-[#2e8b57] text-white px-4 py-1 rounded-lg hover:scale-105 transition shadow-lg">Share PDF</button>
        </div>
      </div>

      <table className="w-full text-[10px] border-2 border-black">
        <thead>
          <tr className="bg-[#f4f6f7] font-black text-[#0f3460] uppercase">
            <th className="p-4 border border-black text-center" rowSpan={2}>NO.</th>
            <th className="p-4 border border-black text-left min-w-[200px]" rowSpan={2}>LEARNER FULL NAME</th>
            <th className="p-2 border border-black text-center bg-blue-50" colSpan={subjectList.length}>SUBJECT SUMMARIES (%)</th>
            <th className="p-2 border border-black text-center bg-green-50" colSpan={2}>OBSERVATION DATA</th>
            <th className="p-2 border border-black text-center bg-yellow-50" rowSpan={2}>DEV. INDEX<br/>(RATING)</th>
          </tr>
          <tr className="bg-gray-50">
            {subjectList.map(subj => (
              <th key={subj} className="p-1 border border-black h-32 align-bottom">
                 <div className="flex flex-col items-center justify-end h-full">
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-black uppercase pb-2">
                      {getShortName(subj)}
                    </span>
                 </div>
              </th>
            ))}
            <th className="p-1 border border-black h-32 align-bottom bg-green-50/30">
               <div className="flex flex-col items-center justify-end h-full">
                  <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-black uppercase pb-2 text-green-700">Observation Points (%)</span>
               </div>
            </th>
            <th className="p-1 border border-black h-32 align-bottom bg-green-50/30">
               <div className="flex flex-col items-center justify-end h-full">
                  <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-black uppercase pb-2 text-green-700">Cumulative SBA (%)</span>
               </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {pupils.map((pupil, idx) => {
            const obsScore = pupil.scores["Observation Points"] || 0;
            // Calculate final developmental rating based on total SBA percentage
            const totalSba = pupil.aggregate; // In EC, aggregate is often the percentage total
            const { mean, stdDev } = calculateStats(pupils.map(p => p.aggregate));
            const rating = getDevelopmentalRating(totalSba, mean, stdDev, settings.earlyChildhoodGrading.indicators.type as any);

            return (
              <tr key={idx} className="hover:bg-blue-50/50 transition border-b border-gray-100">
                <td className="p-2 border border-black text-center font-black">{idx + 1}</td>
                <td className="p-2 border border-black font-black uppercase text-xs">{pupil.name}</td>
                {subjectList.map(subj => {
                  const score = pupil.scores[subj] || 0;
                  return (
                    <td key={subj} className="p-2 border border-black text-center font-black">
                      {score}%
                    </td>
                  );
                })}
                <td className="p-2 border border-black text-center font-black bg-green-50/10 text-green-700">
                  {obsScore}%
                </td>
                <td className="p-2 border border-black text-center font-black bg-green-100/20 text-green-800 text-lg">
                  {totalSba}%
                </td>
                <td className="p-2 border border-black text-center font-black bg-yellow-50/20">
                   <div className="flex flex-col items-center">
                      <span className="px-3 py-1 rounded-lg text-white text-[9px] uppercase tracking-tighter" style={{ background: rating.color }}>
                        {rating.label}
                      </span>
                      <span className="text-[7px] text-gray-400 mt-1 uppercase font-bold">Scale: {rating.value}pts</span>
                   </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend & Statistical Disclosure */}
      <div className="mt-8 grid grid-cols-3 gap-8">
         <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <h4 className="text-[10px] font-black uppercase text-blue-400 mb-4 tracking-widest">Subject Weights</h4>
            <p className="text-[9px] text-blue-700 leading-relaxed italic">
              Percentages are derived from mapped indicator sessions. Core subjects are calculated as the mean achievement across all sub-pillars.
            </p>
         </div>
         
         <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
            <h4 className="text-[10px] font-black uppercase text-green-400 mb-4 tracking-widest">Observation Methodology</h4>
            <p className="text-[9px] text-green-700 leading-relaxed italic">
              Observation Points are manual inputs (0-100%) tracking behavioral milestones and non-academic growth trajectories.
            </p>
         </div>

         <div className="p-6 bg-yellow-50/50 rounded-2xl border border-yellow-100">
            <h4 className="text-[10px] font-black uppercase text-yellow-600 mb-4 tracking-widest">Statistical Scale Logic</h4>
            <div className="space-y-2">
               <p className="text-[8px] font-bold text-yellow-800 uppercase">Current Cut-off: {settings.earlyChildhoodGrading.indicators.type}-Point Population Mean</p>
               <div className="flex flex-wrap gap-2">
                  {settings.earlyChildhoodGrading.indicators.type === 3 ? (
                    <>
                      <span className="text-[8px] font-black px-2 py-0.5 bg-[#e74c3c] text-white rounded">D: Z &lt; -1</span>
                      <span className="text-[8px] font-black px-2 py-0.5 bg-[#cca43b] text-white rounded">A: -1 ≤ Z ≤ 1</span>
                      <span className="text-[8px] font-black px-2 py-0.5 bg-[#2e8b57] text-white rounded">A+: Z &gt; 1</span>
                    </>
                  ) : (
                    <span className="text-[8px] font-bold text-gray-500 italic">Dynamic population normalization active.</span>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DaycareMasterSheet;
