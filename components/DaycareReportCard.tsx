
import React from 'react';
import { Pupil, GlobalSettings, Student } from '../types';
import { getDaycareGrade } from '../utils';
import EditableField from './EditableField';

interface Props {
  pupil: Pupil;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  onStudentUpdate: (id: string, field: string, value: any) => void;
}

const DaycareReportCard: React.FC<Props> = ({ pupil, settings, onSettingsChange, onStudentUpdate }) => {
  // We need the raw student data for specific fields like age, skills, etc.
  // Since pupil is processed, we look it up or rely on what's in Pupil.
  
  const skillIndicators = settings.activeIndicators || [];

  return (
    <div className="bg-white p-10 border-[10px] border-double border-[#0f3460] w-[210mm] h-[296mm] mx-auto shadow-2xl flex flex-col font-sans relative">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter mb-1">{settings.schoolName}</h1>
        <p className="text-sm font-bold text-gray-600 mb-4">{settings.telephone} | {settings.email}</p>
        <div className="bg-[#0f3460] text-white py-2 px-8 inline-block font-black text-sm rounded-lg uppercase tracking-widest">
          STANDARD BASED CURRICULUM: LEARNER’S PERFORMANCE REPORT
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-[11px] font-bold border-b pb-4">
        <div className="flex gap-2 items-baseline">
          <span className="text-gray-400 uppercase">Name:</span>
          <span className="flex-1 border-b border-black uppercase text-sm font-black">{pupil.name}</span>
        </div>
        <div className="flex gap-2 items-baseline">
          <span className="text-gray-400 uppercase">Term:</span>
          <span className="w-16 border-b border-black text-center">{settings.currentTerm}</span>
        </div>
        <div className="flex gap-2 items-baseline">
          <span className="text-gray-400 uppercase">Attendance:</span>
          <span className="w-24 border-b border-black text-center">{pupil.attendance} / {settings.totalAttendance}</span>
        </div>
        <div className="flex gap-2 items-baseline">
          <span className="text-gray-400 uppercase">Vacation Date:</span>
          <span className="flex-1 border-b border-black text-center">{settings.examEnd}</span>
        </div>
        <div className="flex gap-2 items-baseline">
          <span className="text-gray-400 uppercase">Next Term Begins:</span>
          <span className="flex-1 border-b border-black text-center">...</span>
        </div>
      </div>

      {/* Skills Achievement Table */}
      <div className="mb-6">
        <h3 className="text-[10px] font-black uppercase text-[#cca43b] mb-2 tracking-widest">Skill Achievement(s)</h3>
        <table className="w-full text-xs border-2 border-black">
          <thead className="bg-gray-100 text-[#0f3460] uppercase font-black text-[10px]">
            <tr>
              <th className="p-2 border border-black text-left">Subject Area</th>
              <th className="p-2 border border-black text-center">Grade</th>
              <th className="p-2 border border-black text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {pupil.computedScores.map(subj => {
              const g = getDaycareGrade(subj.score);
              return (
                <tr key={subj.name}>
                  <td className="p-2 border border-black font-black uppercase bg-gray-50">{subj.name}</td>
                  <td className="p-2 border border-black text-center font-black text-lg" style={{ color: g.color }}>{g.grade}</td>
                  <td className="p-2 border border-black italic text-[10px]">{subj.remark}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Development Checklist */}
      <div className="mb-6 flex-1">
        <h3 className="text-[10px] font-black uppercase text-[#cca43b] mb-2 tracking-widest">Social, Physical and Cultural Development</h3>
        <table className="w-full text-[10px] border-2 border-black">
          <thead className="bg-[#0f3460] text-white uppercase text-[8px] font-black">
            <tr>
              <th className="p-2 border border-white text-left">Skills / Activities Indicators</th>
              <th className="p-2 border border-white text-center w-12">D</th>
              <th className="p-2 border border-white text-center w-12">A</th>
              <th className="p-2 border border-white text-center w-12">A+</th>
            </tr>
          </thead>
          <tbody>
            {skillIndicators.map((indicator, idx) => {
              // We'd look up the actual student rating here. For now, mock or use local student data
              // Fixed: explicitly declared rating as string to prevent literal narrowing that causes errors in comparisons on lines 102 and 104
              const rating: string = 'A'; // Placeholder
              return (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-1 px-2 border border-black font-bold uppercase text-[9px]">{indicator}</td>
                  <td className="p-1 border border-black text-center font-black">{rating === 'D' ? '✓' : ''}</td>
                  <td className="p-1 border border-black text-center font-black">{rating === 'A' ? '✓' : ''}</td>
                  <td className="p-1 border border-black text-center font-black">{rating === 'A+' ? '✓' : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="space-y-4 text-[10px]">
        <div className="grid grid-cols-2 gap-8">
          <div className="flex gap-2">
            <span className="font-black uppercase text-gray-400">Promoted To:</span>
            <span className="flex-1 border-b border-black">...</span>
          </div>
          <div className="flex gap-2">
            <span className="font-black uppercase text-gray-400">Talent & Interest:</span>
            <span className="flex-1 border-b border-black">...</span>
          </div>
        </div>

        <div className="flex gap-2">
          <span className="font-black uppercase text-gray-400">Conduct:</span>
          <span className="flex-1 border-b border-black">...</span>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Overall Remark</span>
          <p className="italic font-serif leading-relaxed">{pupil.overallRemark}</p>
        </div>

        {/* Scoring Key */}
        <div className="flex justify-between items-center bg-[#0f3460] text-white p-3 rounded-xl">
           <div className="flex gap-6 items-center">
             <span className="text-[10px] font-black border-r border-white/20 pr-6">SCORING PROCEDURE</span>
             <div className="flex gap-4">
               <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#ffd700] rounded-full"></span> <span className="text-[9px] font-bold">G: GOLD (70-100%)</span></div>
               <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#c0c0c0] rounded-full"></span> <span className="text-[9px] font-bold">S: SILVER (40-69%)</span></div>
               <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#cd7f32] rounded-full"></span> <span className="text-[9px] font-bold">B: BRONZE (1-39%)</span></div>
             </div>
           </div>
        </div>

        {/* Auth */}
        <div className="flex justify-between items-end mt-4 pt-4 border-t-2 border-dashed border-gray-200">
          <div className="text-center w-40">
            <div className="h-8 border-b border-black"></div>
            <span className="text-[8px] font-black uppercase text-gray-400">Class Facilitator</span>
          </div>
          <div className="text-center w-60">
             <div className="italic font-serif text-lg mb-1">H. Baylor</div>
             <div className="border-t-2 border-black pt-1">
              <p className="text-[9px] font-black uppercase tracking-widest leading-none">Headteacher's Authorization</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaycareReportCard;
