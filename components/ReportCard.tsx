import React from 'react';
import { Pupil, GlobalSettings } from '../types';
import EditableField from './EditableField';
import UniversalReportHeader from './reports/UniversalReportHeader';

interface Props {
  pupil: Pupil;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  onStudentUpdate: (id: string, field: string, value: any) => void;
  department: string;
}

const ReportCard: React.FC<Props> = ({ pupil, settings, onSettingsChange, onStudentUpdate, department }) => {
  const isWithheld = !pupil.isFeesCleared;

  return (
    <div className="flex justify-center p-4">
      <div id={`report-card-${pupil.no}`} className="bg-white p-6 md:p-10 border-[10px] border-double border-[#0f3460] w-[210mm] min-h-[296mm] shadow-2xl relative flex flex-col font-sans text-gray-800">
        
        <UniversalReportHeader 
          settings={settings} 
          onSettingsChange={onSettingsChange} 
          title={`${department} PERFORMANCE REPORT`} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-[11px] font-bold">
          <div className="space-y-2">
            <div className="flex gap-2 border-b"><span className="text-gray-400 uppercase w-20">Name:</span><span className="flex-1 uppercase font-black">{pupil.name}</span></div>
            <div className="flex gap-2 border-b"><span className="text-gray-400 uppercase w-20">Aggregate:</span><span className="w-16 text-center font-black text-red-700">{isWithheld ? '--' : pupil.aggregate}</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2 border-b"><span className="text-gray-400 uppercase w-20">Cycle:</span><span className="flex-1 text-center">{settings.academicYear}</span></div>
            <div className="flex gap-2 border-b"><span className="text-gray-400 uppercase w-20">Term:</span><span className="w-16 text-center font-black">{settings.currentTerm}</span></div>
          </div>
        </div>

        <div className="flex-1 mb-4">
          {isWithheld ? (
            <div className="h-full border-4 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center p-10 md:p-20 text-center">
               <h3 className="text-2xl font-black text-[#0f3460] uppercase">Records Withheld</h3>
               <p className="text-xs font-bold text-gray-400 mt-2">Outstanding Fees Reconciliation Required.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-2 border-black border-collapse">
                <thead className="bg-[#f4f6f7]">
                  <tr className="font-black uppercase text-[8px]">
                    <th className="p-2 border border-black text-left">Academic Pillar</th>
                    <th className="p-2 border border-black text-center w-12">Score</th>
                    <th className="p-2 border border-black text-center w-12">Grade</th>
                    <th className="p-2 border border-black text-left">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {pupil.computedScores.map((s: any) => (
                    <tr key={s.name} className="border-b border-black">
                      <td className="p-2 border border-black font-black uppercase">{s.name}</td>
                      <td className="p-2 border border-black text-center font-black text-sm">{s.score}</td>
                      <td className="p-2 border border-black text-center font-black text-sm bg-gray-50">{s.grade}</td>
                      <td className="p-2 border border-black italic text-[9px] leading-tight">{s.interpretation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
          <div className="text-center w-32 md:w-40"><div className="h-10 border-b border-black"></div><p className="text-[8px] font-black uppercase text-gray-400">Facilitator</p></div>
          <div className="text-center w-48 md:w-64">
             <div className="italic font-serif text-xl md:text-2xl mb-1 text-[#0f3460]">
               <EditableField value={settings.headteacherName} onSave={v => onSettingsChange({...settings, headteacherName: v})} className="text-center" />
             </div>
             <div className="border-t-2 border-black pt-2">
               <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest leading-none">Headteacher</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;