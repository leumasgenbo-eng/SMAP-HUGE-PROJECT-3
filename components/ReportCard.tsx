import React from 'react';
import { Pupil, GlobalSettings } from '../types';
import EditableField from './EditableField';

interface Props {
  pupil: Pupil;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  onStudentUpdate: (id: string, field: string, value: any) => void;
  department: string;
}

const ReportCard: React.FC<Props> = ({ pupil, settings, onSettingsChange, onStudentUpdate, department }) => {

  const handleSharePDF = async () => {
    const element = document.getElementById(`report-card-${pupil.no}`);
    if (!element) return;
    try {
      // @ts-ignore
      const html2pdf = window.html2pdf;
      if (!html2pdf) return;
      const opt = {
        margin: 0,
        filename: `${pupil.name.replace(/\s+/g, '_')}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) { console.error(err); }
  };

  const isWithheld = !pupil.isFeesCleared;

  return (
    <div className="flex justify-center p-4">
      <div id={`report-card-${pupil.no}`} className="bg-white p-6 md:p-10 border-[10px] border-double border-[#0f3460] w-[210mm] min-h-[296mm] shadow-2xl relative flex flex-col font-sans text-gray-800">
        <div className="absolute top-4 right-4 no-print"><button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">PDF</button></div>

        <div className="text-center border-b-4 border-black pb-6 mb-6">
          <EditableField 
            value={settings.schoolName} 
            onSave={v => onSettingsChange({...settings, schoolName: v})} 
            className="text-4xl md:text-5xl font-black text-[#0f3460] uppercase tracking-tighter leading-none" 
          />
          <EditableField 
            value={settings.motto} 
            onSave={v => onSettingsChange({...settings, motto: v})} 
            className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#cca43b] mt-1" 
          />
          <div className="mt-4 text-[9px] md:text-[10px] font-black uppercase text-gray-500 flex justify-center gap-2 md:gap-4">
             <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
             <span>•</span>
             <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
             <span>•</span>
             <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className="lowercase" />
          </div>
          <div className="bg-black text-white py-1.5 px-8 md:px-12 inline-block font-black text-xs md:text-sm uppercase mt-6 shadow-lg">
             {department} PERFORMANCE REPORT
          </div>
        </div>

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
                  {pupil.computedScores.map((s) => (
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