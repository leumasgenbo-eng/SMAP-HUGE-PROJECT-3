
import React from 'react';
import { Pupil, GlobalSettings } from '../types';
import { getDaycareGrade } from '../utils';
import EditableField from './EditableField';

interface Props {
  pupils: Pupil[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  subjectList: string[];
  // Added activeClass to props
  activeClass: string;
}

const DaycareMasterSheet: React.FC<Props> = ({ pupils, settings, onSettingsChange, subjectList, activeClass }) => {
  const indicators = settings.activeIndicators || [];

  const getShortName = (name: string) => {
    return name.split(' ').slice(0, 3).join(' ');
  };

  const handleSharePDF = () => {
    alert("Generating Early Childhood Master Sheet PDF...");
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
        {/* Updated to show activeClass */}
        <h2 className="text-2xl font-bold text-[#cca43b] uppercase tracking-widest">EARLY CHILDHOOD MASTER BROAD SHEET - {activeClass}</h2>
        
        <div className="flex justify-center gap-4 text-sm font-bold text-gray-500 mt-2 mb-4">
          <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          <span>|</span>
          <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
        </div>

        <div className="mt-4 flex gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400">
           <span>Cycle: {settings.academicYear}</span>
           <span>Term: {settings.currentTerm}</span>
           <button onClick={handleSharePDF} className="no-print bg-[#2e8b57] text-white px-4 py-1 rounded-lg hover:scale-105 transition shadow-lg">Share PDF</button>
        </div>
      </div>

      <table className="w-full text-[10px] border-2 border-black">
        <thead>
          <tr className="bg-[#f4f6f7] font-black text-[#0f3460] uppercase">
            <th className="p-4 border border-black text-center" rowSpan={2}>NO.</th>
            <th className="p-4 border border-black text-left min-w-[200px]" rowSpan={2}>PUPIL NAME</th>
            <th className="p-2 border border-black text-center" colSpan={subjectList.length}>LEARNING AREAS (CORE)</th>
            <th className="p-2 border border-black text-center" colSpan={indicators.length}>DEVELOPMENTAL INDICATORS</th>
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
            {indicators.map(ind => (
              <th key={ind} className="p-1 border border-black h-32 align-bottom bg-yellow-50/30">
                 <div className="flex flex-col items-center justify-end h-full">
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold uppercase pb-2 text-yellow-700">
                      {getShortName(ind)}
                    </span>
                 </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pupils.map((pupil, idx) => (
            <tr key={idx} className="hover:bg-blue-50/50 transition border-b border-gray-100">
              <td className="p-2 border border-black text-center font-black">{idx + 1}</td>
              <td className="p-2 border border-black font-black uppercase">{pupil.name}</td>
              {subjectList.map(subj => {
                const score = pupil.scores[subj] || 0;
                const g = getDaycareGrade(score, settings.earlyChildhoodGrading.core);
                return (
                  <td key={subj} className="p-2 border border-black text-center font-black" style={{ color: g.color }}>
                    {g.label}
                  </td>
                );
              })}
              {indicators.map(ind => (
                <td key={ind} className="p-2 border border-black text-center font-black text-gray-400 bg-yellow-50/10">
                  A
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-8 grid grid-cols-2 gap-10">
         <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
            <h4 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Active Core Scale: {settings.earlyChildhoodGrading.core.type}-Point</h4>
            <div className="flex gap-6 overflow-x-auto">
               {settings.earlyChildhoodGrading.core.ranges.map(r => (
                 <div key={r.label} className="flex items-center gap-2 font-black whitespace-nowrap text-[9px]">
                   <span className="w-3 h-3 rounded-full" style={{ background: r.color }}></span> 
                   {r.label}: {r.remark} ({r.min}-{r.max}%)
                 </div>
               ))}
            </div>
         </div>
         <div className="p-6 bg-yellow-50/50 rounded-2xl border border-yellow-100">
            <h4 className="text-[10px] font-black uppercase text-yellow-600 mb-4 tracking-widest">Skill Indicator Ratings</h4>
            <div className="flex gap-6">
               <div className="flex items-center gap-2 font-black text-[9px]"><span className="text-yellow-700">D:</span> DEVELOPING</div>
               <div className="flex items-center gap-2 font-black text-[9px]"><span className="text-yellow-700">A:</span> ACHIEVING</div>
               <div className="flex items-center gap-2 font-black text-[9px]"><span className="text-yellow-700">A+:</span> ADVANCED</div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DaycareMasterSheet;
