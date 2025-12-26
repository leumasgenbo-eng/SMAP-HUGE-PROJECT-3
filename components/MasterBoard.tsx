
import React from 'react';
import { Pupil, GlobalSettings } from '../types';
import { SUBJECT_ORDER } from '../constants';
import { calculateStats, getNRTGrade } from '../utils';
import EditableField from './EditableField';

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
      <div className="text-center mb-12 border-b-4 border-double border-[#0f3460] pb-8 flex flex-col items-center">
        <EditableField 
          value={settings.schoolName} 
          onSave={v => onSettingsChange({...settings, schoolName: v})} 
          className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter mb-2" 
        />
        <EditableField 
          value={settings.motto} 
          onSave={v => onSettingsChange({...settings, motto: v})} 
          className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b] mb-4" 
        />
        
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-50 w-full max-w-2xl no-print">
          <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          <span>•</span>
          <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          <span>•</span>
          <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
        </div>

        <h2 className="mt-8 text-2xl font-black text-[#0f3460] uppercase tracking-widest">
           MASTER EXAMINATION BOARD - {settings.mockSeries || 'TERMINAL SESSION'}
        </h2>
        <p className="text-[10px] font-black text-[#cca43b] uppercase mt-1 tracking-widest italic">Institutional Broad Sheet Analysis</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 no-print bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-400 uppercase px-2 tracking-widest">Exam Start Window</label>
          <input type="date" className="block w-full border-none bg-white shadow-inner p-4 rounded-2xl font-bold" value={settings.examStart} onChange={e => onSettingsChange({...settings, examStart: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-400 uppercase px-2 tracking-widest">Grading Finalization</label>
          <input type="date" className="block w-full border-none bg-white shadow-inner p-4 rounded-2xl font-bold" value={settings.examEnd} onChange={e => onSettingsChange({...settings, examEnd: e.target.value})} />
        </div>
      </div>

      <table className="w-full text-[10px] border-2 border-black border-collapse">
        <thead className="bg-[#f4f6f7]">
          <tr className="font-black text-[#0f3460] uppercase">
            <th className="p-3 border border-black text-center" rowSpan={2}>RANK</th>
            <th className="p-3 border border-black text-center" rowSpan={2}>NO.</th>
            <th className="p-3 border border-black text-left min-w-[180px]" rowSpan={2}>LEARNER FULL NAME</th>
            {SUBJECT_ORDER.map(subj => (
              <th key={subj} className="p-1 border border-black text-[8px] uppercase font-black text-center" colSpan={2}>{subj}</th>
            ))}
            <th className="p-3 border border-black text-center" rowSpan={2}>BEST 6<br/>AGG.</th>
            <th className="p-3 border border-black text-center" rowSpan={2}>CODE</th>
          </tr>
          <tr className="bg-white">
            {SUBJECT_ORDER.map(subj => (
              <React.Fragment key={subj + '-sub'}>
                <th className="p-1 border border-black text-center font-bold">SCR</th>
                <th className="p-1 border border-black text-center font-bold">GRD</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {pupils.map((pupil, rank) => (
            <tr key={pupil.no} className={`${rank % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-yellow-50 transition`}>
              <td className="p-1 border border-black font-black text-center text-sm">{rank + 1}</td>
              <td className="p-1 border border-black text-center text-gray-400">{pupil.no}</td>
              <td className="p-1 border border-black text-left font-black uppercase px-3 truncate">{pupil.name}</td>
              {SUBJECT_ORDER.map(subj => {
                const s = pupil.scores[subj] || 0;
                const subjStats = stats.find(st => st.name === subj)!;
                // Pass scale and remarks from settings to resolve argument error and ensure correct grading
                const gradeData = getNRTGrade(s, subjStats.mean, subjStats.stdDev, settings.gradingScale, settings.gradingSystemRemarks);
                return (
                  <React.Fragment key={subj}>
                    <td className={`p-1 border border-black text-center font-bold ${s < 50 ? 'text-red-600' : 'text-green-700'}`}>{s}</td>
                    <td className={`p-1 border border-black text-center font-black ${gradeData.grade === 'F9' ? 'text-red-700 bg-red-50' : ''}`}>{gradeData.grade}</td>
                  </React.Fragment>
                );
              })}
              <td className="p-1 border border-black font-black text-center bg-blue-100 text-blue-900 text-sm">{pupil.aggregate}</td>
              <td className="p-1 border border-black text-center font-bold bg-[#f4f6f7]">{pupil.categoryCode}</td>
            </tr>
          ))}
          
          <tr className="bg-yellow-100 font-black border-t-4 border-black text-xs">
            <td className="p-3 border border-black text-right" colSpan={3}>CLASS PERFORMANCE MEAN</td>
            {stats.map(s => (
              <td key={s.name + '-mean'} className="p-1 border border-black text-center" colSpan={2}>{s.mean.toFixed(1)}%</td>
            ))}
            <td className="p-1 border border-black text-center bg-yellow-200" colSpan={2}>---</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-16 flex justify-end no-print">
        <div className="text-center w-80">
          <div className="h-16 flex items-end justify-center pb-2 italic font-serif text-3xl border-b-2 border-[#0f3460] text-[#0f3460]">
             H. Baylor
          </div>
          <div className="pt-3">
            <p className="font-black uppercase text-sm text-[#0f3460] tracking-tighter">HEADTEACHER'S AUTHORIZATION</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Official United Baylor Academy Audit</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterBoard;
