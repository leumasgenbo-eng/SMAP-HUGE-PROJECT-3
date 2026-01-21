import React, { useState, useMemo } from 'react';
import { Pupil, GlobalSettings } from '../types';
import { calculateStats, getNRTGrade } from '../utils';
import EditableField from './EditableField';

interface Props {
  pupils: Pupil[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  subjectList: string[];
  department: string;
  activeClass: string;
}

const MasterSheet: React.FC<Props> = ({ pupils, settings, onSettingsChange, subjectList, department, activeClass }) => {
  const [activeView, setActiveView] = useState<'Full' | 'SectionA' | 'SectionB'>('Full');
  const scale = settings.gradingScale || [];

  const stats = useMemo(() => {
    return subjectList.map(subj => {
      const scores = pupils.map(p => {
        const computedSubj = p.computedScores.find(cs => cs.name === subj);
        if (activeView === 'SectionA') return computedSubj?.sectionA || 0;
        if (activeView === 'SectionB') return computedSubj?.sectionB || 0;
        return p.scores[subj] || 0;
      });
      return { name: subj, ...calculateStats(scores) };
    });
  }, [pupils, subjectList, activeView]);

  const aggregateScores = pupils.map(p => p.aggregate);
  const aggStats = calculateStats(aggregateScores);

  const displayExamTitle = useMemo(() => {
    const base = settings.reportTitle || (settings.mockSeries ? `${settings.mockSeries} MASTER SHEET` : "EXAMINATION MASTER BROAD SHEET");
    if (activeView === 'SectionA') return `OBJECTIVES AUDIT - ${base}`;
    if (activeView === 'SectionB') return `THEORY AUDIT - ${base}`;
    return base;
  }, [activeView, settings.mockSeries, settings.reportTitle]);

  return (
    <div className="bg-white p-4 md:p-12 shadow-2xl border border-gray-100 min-w-max animate-fadeIn">
      <div className="flex justify-center mb-10 no-print">
         <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-2 shadow-inner">
            {(['Full', 'SectionA', 'SectionB'] as const).map(v => (
              <button 
                key={v} 
                onClick={() => setActiveView(v)}
                className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === v ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400 hover:text-[#0f3460]'}`}
              >
                {v === 'Full' ? 'Full Analysis' : v === 'SectionA' ? 'Sec A' : 'Sec B'}
              </button>
            ))}
         </div>
      </div>

      <div className="text-center mb-12 border-b-4 border-double border-[#0f3460] pb-8 flex flex-col items-center">
        <EditableField 
          value={settings.schoolName} 
          onSave={v => onSettingsChange({...settings, schoolName: v})} 
          className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter mb-1" 
        />
        <EditableField 
          value={settings.motto} 
          onSave={v => onSettingsChange({...settings, motto: v})} 
          className="text-[11px] font-black uppercase tracking-[0.4em] text-[#cca43b]" 
        />
        
        <div className="mt-8 flex justify-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest no-print">
           <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
           <span>•</span>
           <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
           <span>•</span>
           <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className="lowercase" />
        </div>

        <div className="mt-10 space-y-2">
          <EditableField 
            value={displayExamTitle} 
            onSave={v => onSettingsChange({...settings, reportTitle: v})}
            className="text-2xl font-black text-[#0f3460] uppercase tracking-widest border-b-2 border-black/5 pb-1"
          />
          <p className="text-lg font-black text-[#cca43b] uppercase tracking-[0.2em]">CLASS: {activeClass}</p>
        </div>

        <div className="mt-4 flex justify-center gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400 no-print bg-gray-50 px-6 py-2 rounded-full">
          <span>Academic Year: <EditableField value={settings.academicYear} onSave={v => onSettingsChange({...settings, academicYear: v})} className="inline-block" /></span>
          <span>Term: {settings.currentTerm}</span>
        </div>
      </div>

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
                <th className="p-3 border border-black text-center" rowSpan={2}>BEST 6<br/>AGG.</th>
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
                   const cs = pupil.computedScores.find(x => x.name === subj);
                   return <td key={subj} className="p-2 border border-black text-center font-bold text-blue-800">{cs?.sectionA || 0}</td>;
                }
                if (activeView === 'SectionB') {
                   const cs = pupil.computedScores.find(x => x.name === subj);
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
        <tfoot className="bg-[#f4f6f7] font-black text-[#0f3460]">
           <tr>
              <td className="p-3 border border-black text-right" colSpan={2}>CLASS AVERAGE (MEAN)</td>
              {stats.map(s => (
                <td key={s.name + '-mean'} className="p-2 border border-black text-center text-blue-700" colSpan={activeView === 'Full' ? 2 : 1}>
                  {s.mean.toFixed(1)}
                </td>
              ))}
              {activeView === 'Full' && (
                <td className="p-2 border border-black text-center bg-blue-100 text-blue-900" colSpan={2}>
                  {aggStats.mean.toFixed(1)}
                </td>
              )}
           </tr>
        </tfoot>
      </table>

      <div className="hidden print:flex justify-end mt-20">
        <div className="text-center w-80">
          <div className="h-16 flex items-end justify-center pb-2 italic font-serif text-3xl border-b-2 border-black text-[#0f3460]">
             <EditableField value={settings.headteacherName} onSave={v => onSettingsChange({...settings, headteacherName: v})} className="text-center" />
          </div>
          <div className="pt-4">
            <p className="font-black uppercase text-sm text-[#0f3460] tracking-tighter">Institutional Authorization</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Official Audit Record</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterSheet;