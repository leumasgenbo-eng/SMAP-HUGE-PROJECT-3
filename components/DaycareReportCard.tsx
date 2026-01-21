import React, { useMemo } from 'react';
import { Pupil, GlobalSettings, Student } from '../types';
import { getDaycareGrade, getObservationRating, getNextClass } from '../utils';
import { DAYCARE_ACTIVITY_GROUPS } from '../constants';
import EditableField from './EditableField';
import UniversalReportHeader from './reports/UniversalReportHeader';

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
  
  const CORE_PILLARS = ["LANGUAGE AND LITERACY", "NUMERACY", "CREATIVE ACTIVITIES", "OUR WORLD OUR PEOPLE"];
  
  const coreScores = useMemo(() => {
    return pupil.computedScores.filter(s => CORE_PILLARS.includes(s.name.toUpperCase()));
  }, [pupil.computedScores]);

  // Aggregation Logic: Group sub-activities into Activity Groups for grading
  const developmentalGroupRatings = useMemo(() => {
    return Object.entries(DAYCARE_ACTIVITY_GROUPS).map(([groupName, indicators]) => {
      let totalPoints = 0;
      let count = 0;
      
      indicators.forEach(ind => {
        const points = pupil.scores[ind] || 0;
        if (points > 0) {
          totalPoints += points;
          count++;
        }
      });

      const avgPoints = count > 0 ? totalPoints / count : 0;
      const scaledPoints = (avgPoints / 3) * 100;
      const rating = getObservationRating(scaledPoints, indConfig);

      return {
        groupName,
        avgPoints,
        rating,
        isActive: count > 0
      };
    }).filter(g => g.isActive);
  }, [pupil.scores, indConfig]);

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

  return (
    <div className="flex justify-center p-4">
      <div 
        id={`daycare-report-${pupil.no}`}
        className="bg-white p-6 md:p-10 border-[10px] border-double border-[#0f3460] w-[210mm] min-h-[296mm] shadow-2xl flex flex-col font-sans relative"
      >
        <div className="absolute top-4 right-4 no-print flex gap-2" data-html2canvas-ignore>
          <button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition">Share PDF</button>
        </div>

        <UniversalReportHeader 
          settings={settings} 
          onSettingsChange={onSettingsChange} 
          title={settings.reportTitle || "EARLY CHILDHOOD PERFORMANCE REPORT"} 
        />

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 text-[11px] font-bold border-b pb-6">
          <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase w-24">Name:</span><span className="flex-1 border-b border-black uppercase text-sm font-black">{pupil.name}</span></div>
          <div className="flex gap-2 items-baseline font-black"><span className="text-gray-400 uppercase w-24">Cycle:</span><span className="flex-1 border-b border-black text-center">{settings.academicYear} • Term {settings.currentTerm}</span></div>
          <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase w-24">Class:</span><span className="flex-1 border-b border-black text-center">{activeClass}</span></div>
          <div className="flex gap-2 items-baseline"><span className="text-gray-400 uppercase w-24">Attendance:</span><span className="flex-1 border-b border-black text-center">{pupil.attendance} / {settings.totalAttendance}</span></div>
          <div className="col-span-2 flex gap-2 items-baseline bg-[#cca43b]/5 p-2 rounded-lg">
            <span className="text-[#cca43b] uppercase w-48 font-black">Next Term Reopening:</span>
            <span className="flex-1 border-b border-[#cca43b]/30 text-center font-black text-[#0f3460]">
              <EditableField value={settings.reopeningDate} onSave={v => onSettingsChange({...settings, reopeningDate: v})} />
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase text-[#cca43b] mb-2 tracking-widest">Learning Areas / Skills (Core Pillars)</h3>
          {isWithheld ? (
             <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center bg-gray-50">
               <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Achievement Data Withheld (Outstanding Fees)</p>
             </div>
          ) : (
            <table className="w-full text-xs border-2 border-black border-collapse">
              <thead className="bg-gray-100 text-[#0f3460] uppercase font-black text-[9px]">
                <tr>
                  <th className="p-2 border border-black text-left">Learning Area Pillar</th>
                  {coreConfig.ranges.map(r => <th key={r.label} className="p-2 border border-black text-center w-10">{r.label}</th>)}
                  <th className="p-2 border border-black text-left">Facilitator Remark</th>
                </tr>
              </thead>
              <tbody>
                {coreScores.map(subj => {
                  const gradeObj = getDaycareGrade(subj.score, coreConfig);
                  return (
                    <tr key={subj.name} className="hover:bg-gray-50 transition">
                      <td className="p-2 border border-black font-black uppercase bg-gray-50">{subj.name}</td>
                      {coreConfig.ranges.map(r => (
                        <td key={r.label} className="p-2 border border-black text-center font-black text-lg">
                           {gradeObj.label === r.label ? '✓' : ''}
                        </td>
                      ))}
                      <td className="p-2 border border-black italic text-[9px] text-gray-500 leading-tight">{subj.remark}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="mb-6 flex-1 overflow-y-auto">
          <h3 className="text-[10px] font-black uppercase text-[#cca43b] mb-2 tracking-widest">Social, Physical and Behavioral Development Groups</h3>
          {isWithheld ? (
             <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Assessment Details Locked</p>
             </div>
          ) : (
            <table className="w-full text-[10px] border-2 border-black border-collapse">
              <thead className="bg-[#0f3460] text-white uppercase text-[8px] font-black">
                <tr>
                  <th className="p-2 border border-white text-left">Activity Group (Derived from Sub-Activities)</th>
                  {indConfig.ranges.map(r => <th key={r.label} className="p-2 border border-white text-center w-12">{r.label}</th>)}
                  <th className="p-2 border border-white text-center w-24">Developmental Rank</th>
                </tr>
              </thead>
              <tbody>
                {developmentalGroupRatings.map((group, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition border-b border-black">
                      <td className="p-2 px-3 border border-black font-black uppercase text-[9px] bg-gray-50">
                        {group.groupName}
                        <p className="text-[7px] text-gray-400 font-bold mt-0.5 normal-case italic">Avg: {group.avgPoints.toFixed(1)} pts</p>
                      </td>
                      {indConfig.ranges.map(r => (
                        <td key={r.label} className="p-1 border border-black text-center font-black text-lg">
                           {group.rating.label === r.label ? '✓' : ''}
                        </td>
                      ))}
                      <td className="p-1 border border-black text-center font-black text-[7px] uppercase">
                         {group.avgPoints >= 2.5 ? 'EXCEPTIONAL' : group.avgPoints >= 2.0 ? 'SATISFACTORY' : 'DEVELOPING'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!isWithheld && (
          <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
             <h5 className="text-[8px] font-black uppercase text-gray-400 mb-1 tracking-widest">NRT Group Grading Legend</h5>
             <div className="flex gap-6">
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-600"></span><span className="text-[7px] font-bold">A+: ADVANCED (Exceeds milestones)</span></div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#cca43b]"></span><span className="text-[7px] font-bold">A: ACHIEVING (At level)</span></div>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span><span className="text-[7px] font-bold">D: DEVELOPING (Area for focus)</span></div>
             </div>
          </div>
        )}

        <div className="space-y-4 text-[10px] mt-auto">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <span className="text-[8px] font-black uppercase text-gray-400 block mb-1">Overall Assessment Summary (Holistic View)</span>
            <EditableField 
              value={isWithheld ? "RECORDS WITHHELD" : pupil.overallRemark} 
              onSave={v => onStudentUpdate(pupil.no.toString(), 'finalRemark', v)} 
              multiline 
              className="italic font-serif leading-relaxed" 
            />
          </div>

          <div className="grid grid-cols-2 gap-10 mt-6 pt-4 border-t-2 border-dashed border-gray-200">
            <div className="text-center">
               <div className="h-8 border-b border-black"></div>
               <span className="text-[8px] font-black uppercase text-gray-400 mt-1 block">Class Facilitator Signature</span>
            </div>
            <div className="text-center">
               <div className="italic font-serif text-xl mb-1 text-[#0f3460]">
                 <EditableField value={settings.headteacherName} onSave={v => onSettingsChange({...settings, headteacherName: v})} className="text-center" />
               </div>
               <div className="border-t-2 border-black pt-1">
                 <p className="text-[9px] font-black uppercase tracking-widest leading-none text-center">Headteacher Authorization</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaycareReportCard;