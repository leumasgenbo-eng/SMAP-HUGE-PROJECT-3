
import React, { useMemo } from 'react';
import { Pupil, GlobalSettings } from '../types';
import { getDaycareGrade, getObservationRating, getNextClass } from '../utils';
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
  
  // Filter skill indicators: Only show if the specific student has recorded data (> 0)
  const evaluatedSkills = useMemo(() => {
    return (settings.activeIndicators || []).filter(indicator => {
      const score = pupil.scores[indicator] || 0;
      return score > 0;
    });
  }, [settings.activeIndicators, pupil.scores]);

  const handleSharePDF = async () => {
    const element = document.getElementById(`daycare-report-${pupil.no}`);
    if (!element) return;

    try {
      // @ts-ignore
      const html2pdf = window.html2pdf;
      if (!html2pdf) return;

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.transform = 'none';
      clone.style.margin = '0 auto';
      clone.style.width = '210mm';
      clone.style.minHeight = '296mm';
      clone.style.padding = '10mm';

      const opt = {
        margin: 0,
        filename: `${pupil.name.replace(/\s+/g, '_')}_DaycareReport.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(clone).save();
    } catch (err) {
      console.error(err);
    }
  };

  const isWithheld = !pupil.isFeesCleared;
  const promotionLabel = pupil.promotionStatus || (parseInt(pupil.attendance) >= 95 ? 'PROMOTED' : 'CONDITIONALLY PROMOTED');

  return (
    <div className="flex justify-center p-4">
      <div 
        id={`daycare-report-${pupil.no}`}
        className="bg-white p-6 md:p-10 border-[10px] border-double border-[#0f3460] w-[210mm] min-h-[296mm] shadow-2xl flex flex-col font-sans relative"
      >
        <div className="absolute top-4 right-4 no-print flex gap-2" data-html2canvas-ignore>
          <button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition">Share PDF</button>
        </div>

        <div className="text-center mb-6">
          <div className="w-full flex justify-between items-center mb-2">
            {/* Logo Area */}
            <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
               {settings.logo ? (
                 <img src={settings.logo} className="w-full h-full object-contain" alt="Logo" />
               ) : (
                 <span className="text-3xl">👶</span>
               )}
            </div>

            <div className="flex-1 px-4">
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
            </div>

            <div className="w-20 opacity-0">Spacing</div>
          </div>

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
            EARLY CHILDHOOD PERFORMANCE REPORT
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-[11px] font-bold border-b pb-4">
          <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase w-24">Name:</span><span className="flex-1 border-b border-black uppercase text-sm font-black">{pupil.name}</span></div>
          <div className="flex gap-2 items-baseline font-black">
            <span className="text-gray-400 uppercase w-24">Term:</span>
            <span className="flex-1 border-b border-black text-center">
              <EditableField 
                value={settings.currentTerm.toString()} 
                onSave={v => onSettingsChange({...settings, currentTerm: parseInt(v) as any || 1})}
              />
            </span>
          </div>
          <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase w-24">Class:</span><span className="flex-1 border-b border-black text-center">{activeClass}</span></div>
          <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase w-24">No. on Roll:</span><span className="flex-1 border-b border-black text-center">{pupil.classSize || '--'}</span></div>
          <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase w-24">Attendance:</span><span className="flex-1 border-b border-black text-center">{pupil.attendance} / {settings.totalAttendance}</span></div>
          <div className="flex gap-2 items-baseline font-black"><span className="text-[#cca43b] uppercase w-24">Reopening:</span><span className="flex-1 border-b border-black text-center">{settings.reopeningDate}</span></div>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase text-[#cca43b] mb-2 tracking-widest">Learning Area Achievement(s)</h3>
          {isWithheld ? (
             <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center bg-gray-50">
               <span className="text-2xl opacity-40">🔐</span>
               <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Achievement Data Withheld (Outstanding Fees)</p>
             </div>
          ) : (
            <table className="w-full text-xs border-2 border-black border-collapse">
              <thead className="bg-gray-100 text-[#0f3460] uppercase font-black text-[9px]">
                <tr>
                  <th className="p-2 border border-black text-left">Learning Area Pillar</th>
                  <th className="p-2 border border-black text-center w-12">Grade</th>
                  <th className="p-2 border border-black text-center w-24">Interpretation</th>
                  <th className="p-2 border border-black text-center w-24">Interest</th>
                  <th className="p-2 border border-black text-left">Facilitator Remark</th>
                </tr>
              </thead>
              <tbody>
                {pupil.computedScores.map(subj => {
                  const gradeObj = getDaycareGrade(subj.score, coreConfig);
                  const showsInterest = subj.score >= subj.classAverage;
                  return (
                    <tr key={subj.name} className="hover:bg-gray-50 transition">
                      <td className="p-2 border border-black font-black uppercase bg-gray-50">{subj.name}</td>
                      <td className="p-2 border border-black text-center font-black text-lg" style={{ color: gradeObj.color }}>{gradeObj.label}</td>
                      <td className="p-2 border border-black text-center text-[7px] font-bold uppercase text-gray-500">{gradeObj.remark}</td>
                      <td className={`p-2 border border-black text-center text-[7px] font-black uppercase ${showsInterest ? 'text-green-600' : 'text-orange-500'}`}>
                        {showsInterest ? 'HIGH INTEREST' : 'DEVELOPING INTEREST'}
                      </td>
                      <td className="p-2 border border-black italic text-[10px] text-gray-500 leading-tight">{subj.remark}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="mb-6 flex-1 overflow-y-auto">
          <h3 className="text-[10px] font-black uppercase text-[#cca43b] mb-2 tracking-widest">Developmental Indicators</h3>
          {isWithheld ? (
             <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center bg-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase">Assessment Details Locked</p>
             </div>
          ) : evaluatedSkills.length > 0 ? (
            <table className="w-full text-[10px] border-2 border-black border-collapse">
              <thead className="bg-[#0f3460] text-white uppercase text-[8px] font-black">
                <tr>
                  <th className="p-2 border border-white text-left">Skills / Activities Indicators</th>
                  <th className="p-2 border border-white text-center w-12">Rating</th>
                  <th className="p-2 border border-white text-center w-24">Class Variance</th>
                </tr>
              </thead>
              <tbody>
                {evaluatedSkills.map((indicator, idx) => {
                  const points = pupil.scores[indicator] || 0; 
                  const avgPoints = pupil.scores[`AVG_${indicator}`] || 0;
                  const scaledPoints = (points / 3) * 100;
                  const rating = getObservationRating(scaledPoints, indConfig);
                  const hasAptitude = points >= avgPoints;
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="p-1 px-2 border border-black font-bold uppercase text-[9px]">{indicator}</td>
                      <td className="p-1 border border-black text-center font-black" style={{ color: rating.color }}>{rating.label}</td>
                      <td className={`p-1 border border-black text-center font-black text-[7px] uppercase ${hasAptitude ? 'text-green-600' : 'text-orange-500'}`}>
                         {hasAptitude ? 'ABOVE CLASS AVG' : 'BELOW CLASS AVG'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400 italic text-[10px] uppercase font-black">
              No specific indicators assessed for this reporting cycle.
            </div>
          )}
        </div>

        {/* Promotion Logic for Term 3 */}
        {settings.currentTerm === 3 && (
          <div className={`mb-4 p-4 rounded-xl flex justify-between items-center border-4 ${isWithheld ? 'bg-red-50 border-red-200' : 'bg-[#0f3460] border-[#cca43b]'}`}>
             <div className={isWithheld ? 'text-red-900' : 'text-white'}>
                <span className={`text-[9px] font-black uppercase ${isWithheld ? 'text-red-500' : 'text-[#cca43b]'}`}>Curriculum Status</span>
                <h4 className="text-sm font-black uppercase leading-none">{promotionLabel}</h4>
             </div>
             <div className={`px-8 py-2 rounded-lg font-black text-2xl uppercase tracking-tighter ${isWithheld ? 'bg-white text-red-600 border border-red-100' : 'bg-white text-[#0f3460]'}`}>
               {(!isWithheld) ? getNextClass(activeClass) : '--'}
             </div>
          </div>
        )}

        <div className="space-y-4 text-[10px]">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Overall Assessment Summary (Holistic View)</span>
            <EditableField 
              value={isWithheld ? "RECORDS WITHHELD DUE TO NON-PAYMENT" : pupil.overallRemark} 
              onSave={v => onStudentUpdate(pupil.no.toString(), 'finalRemark', v)} 
              multiline 
              className="italic font-serif leading-relaxed" 
            />
          </div>

          <div className="flex justify-between items-end mt-4 pt-4 border-t-2 border-dashed border-gray-200">
            <div className="text-center w-40"><div className="h-8 border-b border-black"></div><span className="text-[8px] font-black uppercase text-gray-400">Class Facilitator</span></div>
            <div className="text-center w-60">
               <div className="italic font-serif text-xl mb-1 text-[#0f3460]">
                 <EditableField 
                    value={settings.headteacherName} 
                    onSave={(v) => onSettingsChange({...settings, headteacherName: v})}
                    className="text-center"
                 />
               </div>
               <div className="border-t-2 border-black pt-1">
                 <p className="text-[9px] font-black uppercase tracking-widest leading-none">Headteacher Signature / Stamp</p>
                 <p className="text-[7px] text-gray-400 font-bold uppercase mt-1">Official United Baylor Academy Seal</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaycareReportCard;
