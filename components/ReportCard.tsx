
import React from 'react';
import { Pupil, GlobalSettings } from '../types';
import EditableField from './EditableField';
import { getNextClass } from '../utils';

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
      clone.style.margin = '0 auto';
      clone.style.width = '210mm';
      clone.style.minHeight = '296mm';
      clone.style.padding = '10mm';
      clone.style.boxShadow = 'none';
      clone.style.display = 'flex';
      clone.style.flexDirection = 'column';

      const opt = {
        margin: [0, 0, 0, 0],
        filename: `${pupil.name.replace(/\s+/g, '_')}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(clone).save();
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const isJHS = department === 'JHS';
  const performanceStatus = pupil.aggregate <= 15 ? 'EXCEPTIONAL' : pupil.aggregate <= 30 ? 'SATISFACTORY' : 'REQUIRES INTERVENTION';

  const promotionLabel = pupil.promotionStatus || (performanceStatus !== 'REQUIRES INTERVENTION' ? 'PROMOTED' : 'RETAINED');
  const isWithheld = !pupil.isFeesCleared;

  return (
    <div className="flex justify-center p-4">
      <div 
        id={`report-card-${pupil.no}`} 
        className="bg-white p-6 md:p-10 border-[10px] border-double border-[#0f3460] w-[210mm] min-h-[296mm] shadow-2xl relative flex flex-col font-sans text-gray-800"
      >
        <div className="absolute top-4 right-4 no-print flex gap-2" data-html2canvas-ignore>
          <button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition">Share PDF</button>
        </div>

        {/* Header */}
        <div className="text-center border-b-4 border-black pb-4 mb-4 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-2">
            <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
               {settings.logo ? (
                 <img src={settings.logo} className="w-full h-full object-contain" alt="Logo" />
               ) : (
                 <span className="text-3xl">🏫</span>
               )}
            </div>
            
            <div className="flex-1 px-4">
              <EditableField 
                value={settings.schoolName} 
                onSave={(val) => onSettingsChange({...settings, schoolName: val})}
                className="text-4xl font-black w-full text-center uppercase tracking-widest text-[#0f3460] leading-tight"
              />
              <EditableField 
                value={settings.motto} 
                onSave={(val) => onSettingsChange({...settings, motto: val})}
                className="text-[10px] font-black w-full text-center uppercase tracking-[0.3em] text-[#cca43b] mt-1"
              />
            </div>
            <div className="w-20 opacity-0">Logo Spacing</div>
          </div>
          
          <div className="space-y-1 mb-2">
            <EditableField 
              value={settings.address} 
              onSave={(val) => onSettingsChange({...settings, address: val})}
              className="text-xs font-bold text-gray-600 w-full text-center uppercase"
            />
            <div className="flex justify-center gap-4 text-xs font-bold text-gray-400 italic">
               <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
               <span>|</span>
               <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
            </div>
          </div>
          
          <div className="bg-black text-white py-1 px-8 inline-block font-black text-sm rounded-sm uppercase tracking-widest flex items-center gap-2">
            {isJHS ? (
              <EditableField value={settings.mockSeries} onSave={v => onSettingsChange({...settings, mockSeries: v})} />
            ) : (
              <div className="flex items-center">
                TERM <EditableField 
                  value={settings.currentTerm.toString()} 
                  onSave={v => onSettingsChange({...settings, currentTerm: parseInt(v) as any || 1})} 
                  className="bg-white/20 text-white min-w-[20px] px-1 ml-1" 
                />
              </div>
            )} 
            <EditableField 
              value={settings.reportTitle || "PERFORMANCE REPORT"} 
              onSave={v => onSettingsChange({...settings, reportTitle: v})} 
            />
          </div>
        </div>

        {/* Particulars Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-[11px] font-bold">
          <div className="space-y-2">
            <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase w-20">Name:</span><span className="flex-1 border-b border-black uppercase font-black">{pupil.name}</span></div>
            <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase w-20">No. on Roll:</span><span className="w-16 border-b border-black text-center">{pupil.classSize || '--'}</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase w-20">Year/Cycle:</span><span className="flex-1 border-b border-black text-center">{settings.academicYear}</span></div>
            <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase w-20">Aggregate:</span><span className="w-16 border-b border-black text-center font-black text-red-700">{isWithheld ? '--' : pupil.aggregate}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
           <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col items-center">
              <span className="text-[8px] font-black text-gray-400 uppercase">Exam Start</span>
              <EditableField value={settings.examStart} onSave={(v) => onSettingsChange({...settings, examStart: v})} className="font-bold text-[10px]" />
           </div>
           <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col items-center">
              <span className="text-[8px] font-black text-gray-400 uppercase">Vacation</span>
              <EditableField value={settings.examEnd} onSave={(v) => onSettingsChange({...settings, examEnd: v})} className="font-bold text-[10px]" />
           </div>
           <div className="bg-[#cca43b]/10 p-2 rounded-lg border border-[#cca43b]/20 flex flex-col items-center">
              <span className="text-[8px] font-black text-[#cca43b] uppercase">Reopening</span>
              <EditableField value={settings.reopeningDate} onSave={(v) => onSettingsChange({...settings, reopeningDate: v})} className="font-bold text-[10px] text-[#0f3460]" />
           </div>
           <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col items-center">
              <span className="text-[8px] font-black text-gray-400 uppercase">Attendance</span>
              <span className="font-bold text-[10px]">{pupil.attendance} / {settings.totalAttendance}</span>
           </div>
        </div>

        {/* Performance Table */}
        <div className="flex-1 mb-4">
          {isWithheld ? (
            <div className="h-full w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-gray-50 p-10 text-center">
               <span className="text-4xl mb-4">🔒</span>
               <h3 className="text-xl font-black text-[#0f3460] uppercase">Official Records Withheld</h3>
               <p className="text-xs font-bold text-gray-400 uppercase mt-2 tracking-widest">Please contact the accounts department to clear outstanding school fees for this learner.</p>
            </div>
          ) : (
            <table className="w-full text-[10px] border-2 border-black border-collapse">
              <thead className="bg-[#f4f6f7]">
                <tr className="font-black uppercase text-[8px]">
                  <th className="p-2 border border-black text-left">Learning Area / Subject</th>
                  <th className="p-2 border border-black text-center w-12">Score</th>
                  <th className="p-2 border border-black text-center w-12">Grade</th>
                  <th className="p-2 border border-black text-center w-24">Interpretation</th>
                  <th className="p-2 border border-black text-center w-24">Interest Assessment</th>
                  <th className="p-2 border border-black text-left">Teacher's Remarks</th>
                </tr>
              </thead>
              <tbody>
                {pupil.computedScores.map((s) => {
                  const hasHighInterest = s.score >= s.classAverage;
                  return (
                    <tr key={s.name} className="hover:bg-gray-50">
                      <td className="p-2 border border-black font-black uppercase bg-gray-50">{s.name}</td>
                      <td className={`p-2 border border-black text-center font-black text-sm ${s.score >= 50 ? 'text-green-700' : 'text-red-600'}`}>{s.score}</td>
                      <td className="p-2 border border-black text-center font-black text-sm bg-gray-50">{s.grade}</td>
                      <td className="p-2 border border-black text-center font-bold text-[#0f3460] uppercase text-[7px]">{s.interpretation}</td>
                      <td className={`p-2 border border-black text-center font-black text-[7px] uppercase ${hasHighInterest ? 'text-green-600' : 'text-orange-500'}`}>
                        {hasHighInterest ? 'HIGH INTEREST' : 'AVERAGE INTEREST'}
                      </td>
                      <td className="p-2 border border-black italic text-[9px] text-gray-600 leading-tight">
                        {s.remark}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Grading Key - NEW */}
        {!isWithheld && (
          <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <h5 className="text-[8px] font-black uppercase text-gray-400 mb-2 tracking-widest border-b border-gray-200 pb-1">9-Point NRT Grading & Weighting System Key</h5>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {settings.gradingScale.map(g => (
                <div key={g.grade} className="flex items-center gap-1">
                  <span className="text-[8px] font-black" style={{ color: g.color }}>{g.grade}</span>
                  <span className="text-[7px] text-gray-500">({g.value}pt): {g.remark}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-4 text-[7px] font-black uppercase text-[#0f3460]">
               <span>SBA ({settings.assessmentWeights.exercises + settings.assessmentWeights.cats}%): CW/HW + CAT Series</span>
               <span>EXAM ({settings.assessmentWeights.terminal}%): Section A (Obj) + Section B (Theory)</span>
            </div>
          </div>
        )}

        {/* Conduct, Interest, Punctuality Grid */}
        {!isWithheld && (
          <div className="grid grid-cols-4 gap-2 mb-4">
             <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Conduct</span>
                <EditableField 
                  value={pupil.conduct || "Satisfactory"} 
                  onSave={(val) => onStudentUpdate(pupil.no.toString(), 'conduct', val)}
                  className="text-[9px] font-bold text-[#0f3460] uppercase"
                />
             </div>
             <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Interest</span>
                <EditableField 
                  value={pupil.interest || "General Learning"} 
                  onSave={(val) => onStudentUpdate(pupil.no.toString(), 'interest', val)}
                  className="text-[9px] font-bold text-[#0f3460] uppercase"
                />
             </div>
             <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Attitude</span>
                <EditableField 
                  value={pupil.attitude || "Positive"} 
                  onSave={(val) => onStudentUpdate(pupil.no.toString(), 'attitude', val)}
                  className="text-[9px] font-bold text-[#0f3460] uppercase"
                />
             </div>
             <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Punctuality</span>
                <EditableField 
                  value={pupil.punctuality || "Regular"} 
                  onSave={(val) => onStudentUpdate(pupil.no.toString(), 'punctuality', val)}
                  className="text-[9px] font-bold text-[#0f3460] uppercase"
                />
             </div>
          </div>
        )}

        {/* Promotion and Remarks */}
        <div className="space-y-4">
          {settings.currentTerm === 3 && (
            <div className={`p-4 rounded-xl flex justify-between items-center border-2 ${isWithheld ? 'bg-red-50 border-red-200 text-red-900' : 'bg-[#0f3460] border-[#cca43b] text-white'}`}>
               <div>
                  <span className={`text-[9px] font-black uppercase ${isWithheld ? 'text-red-500' : 'text-[#cca43b]'}`}>C.B.A. Progression Status</span>
                  <h4 className="text-sm font-black uppercase leading-tight">{promotionLabel}</h4>
               </div>
               <div className={`px-8 py-2 rounded-lg font-black text-xl uppercase tracking-tighter shadow-inner ${isWithheld ? 'bg-white text-red-600 border border-red-100' : 'bg-white text-[#0f3460]'}`}>
                 {(performanceStatus !== 'REQUIRES INTERVENTION' && !isWithheld) ? getNextClass(settings.academicCalendar[3]?.[0]?.week || 'Creche') : '--'}
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
               <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Overall Assessment Summary</label>
               <EditableField 
                value={isWithheld ? "WITHHELD PENDING FEE CLEARANCE" : pupil.overallRemark} 
                onSave={(val) => onStudentUpdate(pupil.no.toString(), 'finalRemark', val)}
                className="text-[10px] italic leading-relaxed font-serif"
                multiline
              />
            </div>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
               <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Critical Recommendation</label>
               <EditableField 
                value={isWithheld ? "PAY OUTSTANDING BALANCE" : pupil.recommendation} 
                onSave={(val) => onStudentUpdate(pupil.no.toString(), 'recommendation', val)}
                className="text-[10px] font-bold text-[#0f3460]"
                multiline
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
          <div className="text-center w-40">
            <div className="h-10 border-b border-black mb-1"></div>
            <p className="text-[8px] font-black uppercase text-gray-400">Class Facilitator</p>
          </div>
          <div className="text-center w-64">
             <div className="italic font-serif text-2xl mb-1 text-[#0f3460]">
               <EditableField 
                 value={settings.headteacherName} 
                 onSave={(v) => onSettingsChange({...settings, headteacherName: v})}
                 className="text-center"
               />
             </div>
             <div className="border-t-2 border-black pt-2 text-center">
               <p className="text-[9px] font-black uppercase tracking-widest leading-none">Headteacher Signature / Stamp</p>
               <EditableField 
                 value={settings.reportFooterText || "Certified Document of United Baylor Academy"} 
                 onSave={(v) => onSettingsChange({...settings, reportFooterText: v})} 
                 className="text-[7px] text-gray-400 mt-1 uppercase font-bold tracking-tighter"
               />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
