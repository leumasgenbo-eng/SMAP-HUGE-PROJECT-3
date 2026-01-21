
import React from 'react';
import { Pupil, GlobalSettings } from '../types';
import EditableField from './EditableField';
import InstitutionalHeader from './InstitutionalHeader';

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
    <div className="flex justify-center p-4 animate-fadeIn">
      <div id={`report-card-${pupil.no}`} className="bg-white p-6 md:p-12 border-[12px] border-double border-[#0f3460] w-[210mm] min-h-[296mm] shadow-2xl relative flex flex-col font-sans text-gray-800">
        <div className="absolute top-6 right-6 no-print"><button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition border-b-4 border-green-900">Download PDF</button></div>

        <InstitutionalHeader 
          settings={settings} 
          onSettingsChange={onSettingsChange} 
          title={`${settings.mockSeries || 'TERMINAL'} PERFORMANCE REPORT`}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-[12px] font-black border-2 border-black/5 p-6 rounded-3xl bg-gray-50/50">
          <div className="space-y-3">
            <div className="flex justify-between items-baseline border-b border-black/10 pb-1"><span className="text-gray-400 uppercase text-[9px] tracking-widest">Learner Name:</span><span className="flex-1 uppercase font-black text-lg text-[#0f3460] ml-4">{pupil.name}</span></div>
            <div className="flex justify-between items-baseline border-b border-black/10 pb-1"><span className="text-gray-400 uppercase text-[9px] tracking-widest">Aggregate:</span><span className="w-20 text-center font-black text-2xl text-red-700">{isWithheld ? '--' : pupil.aggregate}</span></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-baseline border-b border-black/10 pb-1"><span className="text-gray-400 uppercase text-[9px] tracking-widest">Academic Cycle:</span><span className="flex-1 text-center text-[#cca43b]">{settings.academicYear}</span></div>
            <div className="flex justify-between items-baseline border-b border-black/10 pb-1"><span className="text-gray-400 uppercase text-[9px] tracking-widest">Current Term:</span><span className="w-20 text-center font-black text-lg">TERM {settings.currentTerm}</span></div>
          </div>
        </div>

        <div className="flex-1 mb-8">
          {isWithheld ? (
            <div className="h-full border-8 border-dashed border-red-50 rounded-[4rem] flex flex-col items-center justify-center p-12 md:p-24 text-center bg-red-50/10">
               <span className="text-7xl mb-6 grayscale opacity-20">📜</span>
               <h3 className="text-4xl font-black text-red-700 uppercase tracking-tighter">Records Withheld</h3>
               <p className="text-sm font-bold text-gray-400 mt-4 uppercase tracking-widest italic">Outstanding Fees Reconciliation Required for Data Release.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-4 border-black border-collapse">
                <thead className="bg-[#f4f6f7]">
                  <tr className="font-black uppercase text-[9px] text-[#0f3460]">
                    <th className="p-4 border-2 border-black text-left">Academic Pillar / Learning Area</th>
                    <th className="p-4 border-2 border-black text-center w-20">Score</th>
                    <th className="p-4 border-2 border-black text-center w-20">Grade</th>
                    <th className="p-4 border-2 border-black text-left">Diagnostic Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {pupil.computedScores.map((s) => (
                    <tr key={s.name} className="border-b-2 border-black hover:bg-gray-50/50 transition">
                      <td className="p-4 border-2 border-black font-black uppercase text-xs">{s.name}</td>
                      <td className="p-4 border-2 border-black text-center font-black text-xl text-[#0f3460]">{s.score}</td>
                      <td className="p-4 border-2 border-black text-center font-black text-2xl bg-gray-100 shadow-inner">{s.grade}</td>
                      <td className="p-4 border-2 border-black italic text-[10px] leading-relaxed font-medium text-gray-600">{s.interpretation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-auto pt-8 border-t-4 border-dashed border-gray-200 flex justify-between items-end">
          <div className="text-center w-40 md:w-48">
            <div className="h-12 border-b-2 border-black w-full mb-2"></div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Class Facilitator</p>
          </div>
          <div className="text-center w-64 md:w-80">
             <div className="italic font-serif text-3xl md:text-4xl mb-2 text-[#0f3460]">
               <EditableField value={settings.headteacherName} onSave={v => onSettingsChange({...settings, headteacherName: v})} className="text-center" />
             </div>
             <div className="border-t-4 border-black pt-3">
               <p className="text-[11px] font-black uppercase tracking-[0.3em] leading-none text-[#0f3460]">Headteacher Certification</p>
               <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">Official United Baylor Academy Audit</p>
             </div>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-gray-200 font-mono no-print">
          UID-UBA-AUDIT-{pupil.no.toString().padStart(4, '0')}-{Date.now().toString().slice(-6)}
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
