import React, { useState, useMemo } from 'react';
import { Pupil, GlobalSettings } from '../types';
import { calculateStats, getNRTGrade } from '../utils';
import EditableField from './EditableField';
import UniversalReportHeader from './reports/UniversalReportHeader';

interface Props {
  pupils: Pupil[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  subjectList: string[];
  department: string;
  activeClass: string;
}

const MasterSheet: React.FC<Props> = ({ pupils, settings, onSettingsChange, subjectList, activeClass }) => {
  const [activeView, setActiveView] = useState<'Full' | 'SectionA' | 'SectionB'>('Full');
  const scale = settings.gradingScale || [];

  const stats = useMemo(() => {
    return subjectList.map(subj => {
      const scores = pupils.map(p => {
        const computedSubj = p.computedScores.find((cs: any) => cs.name === subj);
        if (activeView === 'SectionA') return computedSubj?.sectionA || 0;
        if (activeView === 'SectionB') return computedSubj?.sectionB || 0;
        return p.scores[subj] || 0;
      });
      return { name: subj, ...calculateStats(scores) };
    });
  }, [pupils, subjectList, activeView]);

  const aggStats = calculateStats(pupils.map(p => p.aggregate));

  const displayExamTitle = useMemo(() => {
    const base = settings.reportTitle || (settings.mockSeries ? `${settings.mockSeries} MASTER SHEET` : "EXAMINATION MASTER BROAD SHEET");
    return base;
  }, [settings.mockSeries, settings.reportTitle]);

  return (
    <div className="bg-white p-4 md:p-12 shadow-2xl border border-gray-100 min-w-max animate-fadeIn">
      <div className="flex justify-center mb-10 no-print">
         <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-2 shadow-inner">
            {(['Full', 'SectionA', 'SectionB'] as const).map(v => (
              <button key={v} onClick={() => setActiveView(v)} className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === v ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400 hover:text-[#0f3460]'}`}>
                {v === 'Full' ? 'Full Analysis' : v === 'SectionA' ? 'Sec A' : 'Sec B'}
              </button>
            ))}
         </div>
      </div>

      <UniversalReportHeader 
        settings={settings} 
        onSettingsChange={onSettingsChange} 
        title={`${displayExamTitle} - CLASS: ${activeClass}`} 
      />

      <table className="w-full text-[10px] border-2 border-black border-collapse">
        <thead className="bg-[#f4f6f7]">
          <tr className="font-black text-[#0f3460]">
            <th className="p-3 border border-black text-center" rowSpan={2}>RANK</th>
            <th className="p-3 border border-black text-left min-w-[180px]" rowSpan={2}>PUPIL NAME</th>
            {subjectList.map(subj => (
              <th key={subj} className="p-1 border border-black text-[8px] uppercase font-black text-center" colSpan={activeView === 'Full' ? 2 : 1}>{subj}</th>
            ))}
            {activeView === 'Full' && (
              <>
                <th className="p-3 border border-black text-center" rowSpan={2}>AGG.</th>
                <th className="p-3 border border-black text-center" rowSpan={2}>CAT.</th>
              </>
            )}
          </tr>
          {activeView === 'Full' && (
            <tr className="bg-white">
              {subjectList.map(subj => (
                <React.Fragment key={subj + '-sub'}>
                  <th className="p-1 border border-black text-center font-bold">SCR</th>
                  <th className="p-1 border border-black text-center font-bold">GRD</th>
                </React.Fragment>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {pupils.map((pupil, rank) => (
            <tr key={pupil.no} className={`${rank % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-yellow-50 transition`}>
              <td className="p-2 border border-black font-black text-center text-sm">{rank + 1}</td>
              <td className="p-2 border border-black text-left font-black uppercase px-3 truncate">{pupil.name}</td>
              {subjectList.map(subj => {
                const s = pupil.scores[subj] || 0;
                const stat = stats.find(st => st.name === subj)!;
                const gradeData = getNRTGrade(s, stat.mean, stat.stdDev, scale, settings, pupils.length);

                if (activeView === 'SectionA') {
                   const cs = pupil.computedScores.find((x: any) => x.name === subj);
                   return <td key={subj} className="p-2 border border-black text-center font-bold text-blue-800">{cs?.sectionA || 0}</td>;
                }
                if (activeView === 'SectionB') {
                   const cs = pupil.computedScores.find((x: any) => x.name === subj);
                   return <td key={subj} className="p-2 border border-black text-center font-bold text-purple-800">{cs?.sectionB || 0}</td>;
                }

                return (
                  <React.Fragment key={subj}>
                    <td className={`p-1 border border-black text-center font-bold ${s < 50 ? 'text-red-600' : 'text-green-700'}`}>{s}</td>
                    <td className={`p-1 border border-black text-center font-black ${gradeData.grade === 'F9' ? 'text-red-700 bg-red-50' : ''}`}>{gradeData.grade}</td>
                  </React.Fragment>
                );
              })}
              {activeView === 'Full' && (
                <>
                  <td className="p-2 border border-black font-black text-center bg-blue-100 text-blue-900 text-lg">{pupil.aggregate}</td>
                  <td className="p-2 border border-black text-center font-black bg-[#f4f6f7]">{pupil.categoryCode}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="hidden print:flex justify-end mt-20">
        <div className="text-center w-80">
          <div className="h-16 flex items-end justify-center pb-2 italic font-serif text-3xl border-b-2 border-black text-[#0f3460]">
             <EditableField value={settings.headteacherName} onSave={v => onSettingsChange({...settings, headteacherName: v})} className="text-center" />
          </div>
          <p className="font-black uppercase text-sm mt-4 text-[#0f3460]">Official Audit Record</p>
        </div>
      </div>
    </div>
  );
};

export default MasterSheet;