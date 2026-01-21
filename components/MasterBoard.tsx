
import React from 'react';
import { Pupil, GlobalSettings } from '../types';
import { SUBJECT_ORDER } from '../constants';
import { calculateStats, getNRTGrade } from '../utils';
import InstitutionalHeader from './InstitutionalHeader';

interface Props {
  pupils: Pupil[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
}

const MasterBoard: React.FC<Props> = ({ pupils, settings, onSettingsChange }) => {
  const stats = SUBJECT_ORDER.map(subj => {
    const scores = pupils.map(p => p.scores[subj] || 0);
    return { name: subj, ...calculateStats(scores) };
  });

  return (
    <div className="bg-white p-4 md:p-12 shadow-2xl border border-gray-100 min-w-max animate-fadeIn">
      <InstitutionalHeader 
        settings={settings} 
        onSettingsChange={onSettingsChange} 
        title={`MASTER EXAMINATION BOARD - ${settings.mockSeries || 'TERMINAL SESSION'}`} 
        variant="double"
      />

      <div className="max-w-xl mx-auto mb-10 no-print bg-gray-50 p-8 rounded-[3rem] border-2 border-dashed border-gray-200 text-center">
        <div className="space-y-3">
          <label className="text-[11px] font-black text-[#cca43b] uppercase px-2 tracking-[0.3em]">Next Term Reopening Sequence</label>
          <input type="date" className="block w-full border-none bg-white shadow-xl p-5 rounded-3xl font-black text-[#0f3460] text-center text-2xl outline-none focus:ring-4 focus:ring-[#cca43b]/20" value={settings.reopeningDate} onChange={e => onSettingsChange({...settings, reopeningDate: e.target.value})} />
        </div>
      </div>

      <table className="w-full text-[10px] border-4 border-black border-collapse">
        <thead className="bg-[#f4f6f7]">
          <tr className="font-black text-[#0f3460] uppercase">
            <th className="p-4 border-2 border-black text-center" rowSpan={2}>RANK</th>
            <th className="p-4 border-2 border-black text-center" rowSpan={2}>NO.</th>
            <th className="p-4 border-2 border-black text-left min-w-[220px]" rowSpan={2}>LEARNER IDENTITY (FULL NAME)</th>
            {SUBJECT_ORDER.map(subj => (
              <th key={subj} className="p-2 border-2 border-black text-[9px] uppercase font-black text-center bg-gray-50/50" colSpan={2}>{subj}</th>
            ))}
            <th className="p-4 border-2 border-black text-center bg-blue-50" rowSpan={2}>BEST 6<br/>AGG.</th>
            <th className="p-4 border-2 border-black text-center" rowSpan={2}>CODE</th>
          </tr>
          <tr className="bg-white">
            {SUBJECT_ORDER.map(subj => (
              <React.Fragment key={subj + '-sub'}>
                <th className="p-2 border border-black text-center font-bold">SCR</th>
                <th className="p-2 border border-black text-center font-black">GRD</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {pupils.map((pupil, rank) => (
            <tr key={pupil.no} className={`${rank % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-yellow-50 transition-colors group`}>
              <td className="p-2 border-2 border-black font-black text-center text-base">{rank + 1}</td>
              <td className="p-2 border-2 border-black text-center text-gray-400 font-mono">{pupil.no.toString().padStart(3, '0')}</td>
              <td className="p-2 border-2 border-black text-left font-black uppercase px-4 truncate text-sm">{pupil.name}</td>
              {SUBJECT_ORDER.map(subj => {
                const s = pupil.scores[subj] || 0;
                const subjStats = stats.find(st => st.name === subj)!;
                const gradeData = getNRTGrade(s, subjStats.mean, subjStats.stdDev, settings.gradingScale, settings, pupils.length);
                return (
                  <React.Fragment key={subj}>
                    <td className={`p-1 border border-black text-center font-black text-xs ${s < 50 ? 'text-red-600 bg-red-50/50' : 'text-green-800'}`}>{s}</td>
                    <td className={`p-1 border border-black text-center font-black text-xs ${gradeData.grade === 'F9' ? 'text-red-700 bg-red-100' : 'bg-gray-50/50'}`}>{gradeData.grade}</td>
                  </React.Fragment>
                );
              })}
              <td className="p-2 border-2 border-black font-black text-center bg-blue-100 text-blue-900 text-lg">{pupil.aggregate}</td>
              <td className="p-2 border-2 border-black text-center font-black bg-gray-50 text-[9px] uppercase">{pupil.categoryCode}</td>
            </tr>
          ))}
          
          <tr className="bg-yellow-100 font-black border-t-8 border-black text-xs uppercase tracking-widest">
            <td className="p-4 border-2 border-black text-right" colSpan={3}>CLASS PERFORMANCE MEAN INDEX</td>
            {stats.map(s => (
              <td key={s.name + '-mean'} className="p-2 border-2 border-black text-center text-blue-900" colSpan={2}>{s.mean.toFixed(1)}%</td>
            ))}
            <td className="p-2 border-2 border-black text-center bg-yellow-200" colSpan={2}>---</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-20 flex justify-end">
        <div className="text-center w-96">
          <div className="h-20 flex items-end justify-center pb-3 italic font-serif text-4xl border-b-4 border-[#0f3460] text-[#0f3460]">
             {settings.headteacherName}
          </div>
          <div className="pt-4">
            <p className="font-black uppercase text-base text-[#0f3460] tracking-tighter">HEADTEACHER'S CERTIFICATION</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1">Official Institutional Audit Seal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterBoard;
