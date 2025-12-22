
import React from 'react';
import { Pupil, GlobalSettings } from '../types';
import { getDaycareGrade, getObservationRating } from '../utils';
import EditableField from './EditableField';

interface Props {
  pupil: Pupil;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  onStudentUpdate: (id: string, field: string, value: any) => void;
  activeClass: string;
}

const DaycareReportCard: React.FC<Props> = ({ pupil, settings, onSettingsChange, onStudentUpdate, activeClass }) => {
  const coreConfig = settings.earlyChildhoodGrading.core;
  const indConfig = settings.earlyChildhoodGrading.indicators;
  
  const skillIndicators = settings.activeIndicators || [];

  return (
    <div className="bg-white p-10 border-[10px] border-double border-[#0f3460] w-[210mm] h-[296mm] mx-auto shadow-2xl flex flex-col font-sans relative">
      <div className="text-center mb-6">
        <EditableField 
          value={settings.schoolName} 
          onSave={v => onSettingsChange({...settings, schoolName: v})} 
          className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter mb-1" 
        />
        <EditableField 
          value={settings.motto} 
          onSave={v => onSettingsChange({...settings, motto: v})} 
          className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b] mb-2" 
        />
        <div className="space-y-1 mb-4">
          <EditableField 
            value={settings.address} 
            onSave={v => onSettingsChange({...settings, address: v})} 
            className="text-xs font-bold text-gray-600 w-full text-center uppercase"
          />
          <div className="flex justify-center gap-4 text-xs font-bold text-gray-400 italic">
            <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
            <span>|</span>
            <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
          </div>
        </div>
        <div className="bg-[#0f3460] text-white py-2 px-8 inline-block font-black text-sm rounded-lg uppercase tracking-widest">
          STANDARD BASED CURRICULUM: LEARNER’S PERFORMANCE REPORT
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-[11px] font-bold border-b pb-4">
        <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase">Name:</span><span className="flex-1 border-b border-black uppercase text-sm font-black">{pupil.name}</span></div>
        <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase">Term:</span><span className="w-16 border-b border-black text-center">{settings.currentTerm}</span></div>
        <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase">Class:</span><span className="w-24 border-b border-black text-center">{activeClass}</span></div>
        <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase">Attendance:</span><span className="w-24 border-b border-black text-center">{pupil.attendance} / {settings.totalAttendance}</span></div>
        <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase">Vacation:</span><span className="flex-1 border-b border-black text-center">{settings.examEnd}</span></div>
      </div>

      {/* Core Learning Areas Table */}
      <div className="mb-6">
        <h3 className="text-[10px] font-black uppercase text-[#cca43b] mb-2 tracking-widest">Learning Area Achievement(s)</h3>
        <table className="w-full text-xs border-2 border-black">
          <thead className="bg-gray-100 text-[#0f3460] uppercase font-black text-[9px]">
            <tr>
              <th className="p-2 border border-black text-left">Subject Area</th>
              {coreConfig.ranges.map(r => <th key={r.label} className="p-2 border border-black text-center w-12">{r.label}</th>)}
              <th className="p-2 border border-black text-left">Internal Remark</th>
            </tr>
          </thead>
          <tbody>
            {pupil.computedScores.map(subj => {
              const gradeObj = getDaycareGrade(subj.score, coreConfig);
              return (
                <tr key={subj.name} className="hover:bg-gray-50 transition">
                  <td className="p-2 border border-black font-black uppercase bg-gray-50">{subj.name}</td>
                  {coreConfig.ranges.map(r => (
                    <td key={r.label} className="p-2 border border-black text-center font-black text-lg">
                      {gradeObj.label === r.label ? '✓' : ''}
                    </td>
                  ))}
                  <td className="p-2 border border-black italic text-[10px] text-gray-500 leading-tight">{subj.remark}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Developmental Skills Table */}
      <div className="mb-6 flex-1">
        <h3 className="text-[10px] font-black uppercase text-[#cca43b] mb-2 tracking-widest">Social, Physical and Cultural Development</h3>
        <table className="w-full text-[10px] border-2 border-black">
          <thead className="bg-[#0f3460] text-white uppercase text-[8px] font-black">
            <tr>
              <th className="p-2 border border-white text-left">Skills / Activities Indicators</th>
              {indConfig.ranges.map(r => <th key={r.label} className="p-2 border border-white text-center w-12">{r.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {skillIndicators.map((indicator, idx) => {
              const points = 75; 
              const rating = getObservationRating(points, indConfig);
              return (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="p-1 px-2 border border-black font-bold uppercase text-[9px]">{indicator}</td>
                  {indConfig.ranges.map(r => (
                    <td key={r.label} className="p-1 border border-black text-center font-black">
                       {rating.label === r.label ? '✓' : ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 text-[10px]">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Overall Assessment Summary</span>
          <EditableField 
            value={pupil.overallRemark} 
            onSave={v => onStudentUpdate(pupil.no.toString(), 'finalRemark', v)} 
            multiline 
            className="italic font-serif leading-relaxed" 
          />
        </div>

        <div className="flex justify-between items-center bg-[#0f3460] text-white p-3 rounded-xl">
           <div className="flex gap-4 items-center overflow-x-auto scrollbar-hide">
             <span className="text-[10px] font-black border-r border-white/20 pr-4 whitespace-nowrap uppercase">Scoring Criteria</span>
             {coreConfig.ranges.map(r => (
               <div key={r.label} className="flex items-center gap-1 whitespace-nowrap">
                 <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }}></span>
                 <span className="text-[8px] font-bold">{r.label}: {r.min}-{r.max}% ({r.remark})</span>
               </div>
             ))}
           </div>
        </div>

        <div className="flex justify-between items-end mt-4 pt-4 border-t-2 border-dashed border-gray-200">
          <div className="text-center w-40"><div className="h-8 border-b border-black"></div><span className="text-[8px] font-black uppercase text-gray-400">Class Facilitator</span></div>
          <div className="text-center w-60">
             <div className="italic font-serif text-xl mb-1 text-[#0f3460]">H. Baylor</div>
             <div className="border-t-2 border-black pt-1"><p className="text-[9px] font-black uppercase tracking-widest leading-none">Institutional Authorization</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaycareReportCard;
