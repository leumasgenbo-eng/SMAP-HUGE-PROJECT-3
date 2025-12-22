
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
      if (!html2pdf) {
        alert("PDF Library not loaded. Please ensure you are online.");
        return;
      }

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.transform = 'none';
      clone.style.margin = '0';
      clone.style.width = '210mm';
      clone.style.padding = '20mm';

      // Capture input values for the clone
      const originalInputs = element.querySelectorAll('input, textarea');
      const clonedInputs = clone.querySelectorAll('input, textarea');
      
      clonedInputs.forEach((input, index) => {
        const val = (originalInputs[index] as HTMLInputElement | HTMLTextAreaElement).value;
        const parent = input.parentElement;
        if (parent) {
          const textDiv = document.createElement('div');
          textDiv.innerText = val;
          textDiv.className = input.className;
          textDiv.style.minHeight = '1em';
          textDiv.style.whiteSpace = 'pre-wrap';
          textDiv.style.textAlign = window.getComputedStyle(input).textAlign;
          parent.replaceChild(textDiv, input);
        }
      });

      const opt = {
        margin: 0,
        filename: `${pupil.name.replace(/\s+/g, '_')}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(clone).outputPdf('blob');
      const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

      if (navigator.share) {
        await navigator.share({
          title: 'Student Report Card',
          text: `Attached is the report card for ${pupil.name}`,
          files: [file]
        });
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = opt.filename;
        link.click();
      }
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const isJHS = department === 'JHS';
  const performanceStatus = pupil.aggregate <= 15 ? 'EXCEPTIONAL' : pupil.aggregate <= 30 ? 'SATISFACTORY' : 'REQUIRES INTERVENTION';

  return (
    <div 
      id={`report-card-${pupil.no}`} 
      className="bg-white p-4 md:p-10 border-[10px] border-double border-[#0f3460] w-[210mm] h-[296mm] mx-auto shadow-2xl relative flex flex-col overflow-hidden"
    >
      <div className="absolute top-4 right-4 no-print flex gap-2" data-html2canvas-ignore>
        <button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition">Share PDF</button>
      </div>

      {/* Header */}
      <div className="text-center border-b-4 border-black pb-4 mb-2 pt-2 flex flex-col items-center">
        <div className="w-full mb-4">
          <div className="w-full">
            <EditableField 
              value={settings.schoolName} 
              onSave={(val) => onSettingsChange({...settings, schoolName: val})}
              className="text-4xl font-black w-full text-center uppercase tracking-widest text-[#0f3460] drop-shadow-sm leading-tight"
              multiline
            />
            <EditableField 
              value={settings.motto} 
              onSave={(val) => onSettingsChange({...settings, motto: val})}
              className="text-[10px] font-black w-full text-center uppercase tracking-[0.3em] text-[#cca43b] mt-1"
            />
          </div>
          <div className="mt-4 space-y-1">
            <EditableField 
              value={settings.address} 
              onSave={(val) => onSettingsChange({...settings, address: val})}
              className="text-xs font-bold text-gray-600 w-full text-center uppercase"
            />
            <EditableField 
              value={`Tel: ${settings.telephone} | Email: ${settings.email}`}
              onSave={(val) => {
                const parts = val.split('|').map(s => s.trim());
                onSettingsChange({
                  ...settings, 
                  telephone: parts[0]?.replace('Tel:', '').trim() || settings.telephone,
                  email: parts[1]?.replace('Email:', '').trim() || settings.email
                });
              }}
              className="text-xs font-bold text-gray-400 w-full text-center italic"
            />
          </div>
        </div>
        <div className="bg-black text-white py-1 px-8 inline-block font-black text-sm rounded-sm uppercase tracking-widest">
          {isJHS ? settings.mockSeries : `TERM ${settings.currentTerm}`} INDIVIDUAL PERFORMANCE RECORD
        </div>
      </div>

      {/* Particulars Grid */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="col-span-2 bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase text-gray-400 w-24">Pupil Name:</span>
            <span className="font-black text-lg text-[#0f3460] uppercase">{pupil.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-gray-400 w-24">ID No:</span>
            <div className="flex-1 min-w-0">
               <EditableField 
                value={pupil.attendance || `UBA/2025/M2-${pupil.no.toString().padStart(3, '0')}`} 
                onSave={(val) => onStudentUpdate(pupil.no.toString(), 'serialId', val)}
                className="font-bold text-sm w-full"
              />
            </div>
          </div>
        </div>
        <div className="bg-[#0f3460] p-2 rounded-lg text-white text-center flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase opacity-60">Aggregate (Best 6)</span>
          <span className="text-4xl font-black text-[#cca43b]">{pupil.aggregate}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-2">
         <div className="bg-gray-50 p-1 rounded-lg border border-gray-100 flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase">Exam Start</span>
            <EditableField value={settings.examStart} onSave={(v) => onSettingsChange({...settings, examStart: v})} className="font-bold text-[10px]" />
         </div>
         <div className="bg-gray-50 p-1 rounded-lg border border-gray-100 flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase">Exam End</span>
            <EditableField value={settings.examEnd} onSave={(v) => onSettingsChange({...settings, examEnd: v})} className="font-bold text-[10px]" />
         </div>
         <div className="bg-gray-50 p-1 rounded-lg border border-gray-100 flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase">Attendance</span>
            <EditableField value={pupil.attendance} onSave={(v) => onStudentUpdate(pupil.no.toString(), 'attendance', v)} className="font-bold text-[10px]" />
         </div>
         <div className="bg-gray-50 p-1 rounded-lg border border-gray-100 flex flex-col items-center">
            <span className="text-[8px] font-black text-gray-400 uppercase">Total School Days</span>
            <EditableField value={settings.totalAttendance.toString()} onSave={(v) => onSettingsChange({...settings, totalAttendance: parseInt(v) || 0})} className="font-bold text-[10px]" />
         </div>
      </div>

      {/* Main Performance Table */}
      <div className="flex-1">
        <table className="w-full text-[10px] border-2 border-black">
          <thead className="bg-[#f4f6f7]">
            <tr className="font-black uppercase text-[8px]">
              <th className="p-1 border border-black text-left">Subject</th>
              <th className="p-1 border border-black text-center">Ser</th>
              <th className="p-1 border border-black text-center">Score</th>
              <th className="p-1 border border-black text-center">Grade</th>
              <th className="p-1 border border-black text-center">Class Avg</th>
              <th className="p-1 border border-black text-left">Specific Subject Remark</th>
            </tr>
          </thead>
          <tbody>
            {pupil.computedScores.map((s) => (
              <tr key={s.name} className="hover:bg-gray-50">
                <td className="p-1 border border-black font-black uppercase text-[#0f3460] bg-gray-50">{s.name}</td>
                <td className="p-1 border border-black text-center font-bold text-gray-400">{isJHS ? settings.mockSeries.replace('MOCK ', '') : settings.currentTerm}</td>
                <td className={`p-1 border border-black text-center font-black text-xs ${s.score >= 50 ? 'text-green-700' : 'text-red-600'}`}>{s.score}</td>
                <td className="p-1 border border-black text-center font-black text-sm bg-gray-50">{s.grade}</td>
                <td className="p-1 border border-black text-center text-gray-400 italic font-bold">{s.classAverage.toFixed(0)}</td>
                <td className="p-1 border border-black min-w-[200px]">
                   <p className="text-[9px] italic leading-tight text-gray-700">{s.remark}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Grading Key - Compact */}
        <div className="mt-1 flex justify-between items-center bg-gray-50 p-1 px-4 border border-black/10 rounded-lg">
           {settings.gradingSystemRemarks && Object.entries(settings.gradingSystemRemarks).slice(0, 5).map(([grade, remark]) => (
             <div key={grade} className="flex gap-1 text-[8px] font-bold">
               <span className="text-[#0f3460]">{grade}:</span>
               <span className="text-gray-400 uppercase">{remark}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Remarks & Recommendation */}
      <div className="mt-2 space-y-2">
        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
           <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">General Remarks on Performance</label>
           <EditableField 
            value={pupil.overallRemark} 
            onSave={(val) => onStudentUpdate(pupil.no.toString(), 'finalRemark', val)}
            className="text-[10px] italic leading-relaxed font-serif text-gray-700 w-full"
            multiline
          />
        </div>
        <div className="bg-blue-50/50 p-2 rounded-xl border border-blue-100">
           <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Critical Recommendation & Academic Plan</label>
           <EditableField 
            value={pupil.recommendation} 
            onSave={(val) => onStudentUpdate(pupil.no.toString(), 'recommendation', val)}
            className="text-[10px] font-bold text-[#0f3460] leading-tight w-full"
            multiline
          />
        </div>
      </div>

      {/* Footer / Auth */}
      <div className="mt-auto pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
        <div className="text-center w-48">
          <div className="h-10 border-b border-gray-300 w-full mb-1"></div>
          <p className="text-[8px] font-black uppercase text-gray-400">Class Facilitator</p>
        </div>
        <div className="text-center w-64">
           <div className="italic font-serif text-xl mb-1 text-[#0f3460] drop-shadow-sm">H. Baylor</div>
           <div className="border-t-2 border-black pt-2">
            <p className="text-[9px] font-black uppercase tracking-widest leading-none">Headteacher's Authorization</p>
            <p className="text-[7px] text-gray-400 mt-1 uppercase font-bold">United Baylor Academy Official Certification</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
