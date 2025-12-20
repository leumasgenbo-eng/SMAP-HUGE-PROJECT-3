
import React from 'react';
import { Pupil } from '../types';
import { SUBJECT_ORDER } from '../constants';
// Fixed: Updated import name from getGrade to getNRTGrade to match utils.ts
import { calculateStats, getNRTGrade } from '../utils';

interface Props {
  pupils: Pupil[];
  schoolInfo: any;
  setSchoolInfo: (info: any) => void;
}

const MasterBoard: React.FC<Props> = ({ pupils, schoolInfo, setSchoolInfo }) => {
  const stats = SUBJECT_ORDER.map(subj => {
    const scores = pupils.map(p => p.scores[subj]);
    return { name: subj, ...calculateStats(scores) };
  });

  const updateInfo = (key: string, val: string) => {
    setSchoolInfo({ ...schoolInfo, [key]: val });
  };

  return (
    <div className="bg-white p-4 md:p-8 shadow-2xl border border-gray-100 min-w-max">
      <div className="text-center mb-10 border-b-4 border-double border-gray-800 pb-6">
        <input 
          className="text-4xl font-black w-full text-center border-none focus:ring-0 uppercase mb-2"
          value={schoolInfo.name}
          onChange={(e) => updateInfo('name', e.target.value)}
        />
        <input 
          className="text-xl font-bold text-gray-700 w-full text-center border-none focus:ring-0 mb-1"
          value={schoolInfo.examName}
          onChange={(e) => updateInfo('examName', e.target.value)}
        />
        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Master Broad Sheet - {schoolInfo.mockSeries}</p>
        <p className="text-xs text-gray-500 mt-1">Generated on: {schoolInfo.preparedDate}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 no-print bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase">Exam Start</label>
          <input type="date" className="block w-full border-2 border-gray-300 p-2 rounded-lg" value={schoolInfo.examStart} onChange={e => updateInfo('examStart', e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase">Exam End</label>
          <input type="date" className="block w-full border-2 border-gray-300 p-2 rounded-lg" value={schoolInfo.examEnd} onChange={e => updateInfo('examEnd', e.target.value)} />
        </div>
      </div>

      <table className="w-full text-[10px] border-2 border-black">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border border-black" rowSpan={2}>RANK</th>
            <th className="p-2 border border-black" rowSpan={2}>NO.</th>
            <th className="p-2 border border-black min-w-[140px]" rowSpan={2}>PUPIL NAME</th>
            {SUBJECT_ORDER.map(subj => (
              <th key={subj} className="p-1 border border-black text-[9px] uppercase font-black" colSpan={2}>{subj}</th>
            ))}
            <th className="p-2 border border-black" rowSpan={2}>BEST 6<br/>AGG.</th>
            <th className="p-2 border border-black" rowSpan={2}>CODE</th>
          </tr>
          <tr>
            {SUBJECT_ORDER.map(subj => (
              <React.Fragment key={subj + '-sub'}>
                <th className="p-1 border border-black bg-white">SCR</th>
                <th className="p-1 border border-black bg-white">GRD</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {pupils.map((pupil, rank) => (
            <tr key={pupil.no} className={`${rank % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-50`}>
              <td className="p-1 border border-black font-black text-center">{rank + 1}</td>
              <td className="p-1 border border-black text-center">{pupil.no}</td>
              <td className="p-1 border border-black text-left font-bold px-2 truncate">{pupil.name}</td>
              {SUBJECT_ORDER.map(subj => {
                const s = pupil.scores[subj];
                // Fixed: Updated function name from getGrade to getNRTGrade to resolve reference error
                const gradeData = getNRTGrade(s, stats.find(st => st.name === subj)!.mean, stats.find(st => st.name === subj)!.stdDev);
                return (
                  <React.Fragment key={subj}>
                    <td className={`p-1 border border-black text-center font-bold ${s < 50 ? 'text-red-600' : 'text-green-700'}`}>{s}</td>
                    <td className={`p-1 border border-black text-center font-black ${gradeData.grade === 'F9' ? 'text-red-700 bg-red-50' : ''}`}>{gradeData.grade}</td>
                  </React.Fragment>
                );
              })}
              <td className="p-1 border border-black font-black text-center bg-blue-100 text-blue-900">{pupil.aggregate}</td>
              <td className="p-1 border border-black text-center font-bold">{pupil.categoryCode}</td>
            </tr>
          ))}
          
          <tr className="bg-yellow-100 font-bold border-t-4 border-black text-xs">
            <td className="p-2 border border-black text-right" colSpan={3}>CLASS AVERAGE SCORE</td>
            {stats.map(s => (
              <td key={s.name + '-mean'} className="p-1 border border-black text-center" colSpan={2}>{s.mean.toFixed(1)}</td>
            ))}
            <td className="p-1 border border-black text-center bg-yellow-200" colSpan={2}>-</td>
          </tr>
          <tr className="bg-yellow-50 font-bold text-xs">
            <td className="p-2 border border-black text-right" colSpan={3}>STANDARD DEVIATION (σ)</td>
            {stats.map(s => (
              <td key={s.name + '-sd'} className="p-1 border border-black text-center" colSpan={2}>{s.stdDev.toFixed(2)}</td>
            ))}
            <td className="p-1 border border-black text-center" colSpan={2}>-</td>
          </tr>
        </tbody>
      </table>

      {/* Categories Table */}
      <div className="mt-8 flex flex-wrap gap-4 items-start">
        <table className="text-[9px] border border-black w-fit">
          <thead className="bg-gray-800 text-white">
            <tr><th className="p-1 border border-black uppercase" colSpan={3}>Pupil Grouping Codes</th></tr>
            <tr>
              <th className="p-1 border border-black">Code</th>
              <th className="p-1 border border-black">Category</th>
              <th className="p-1 border border-black">Agg. Range</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-1 border border-black font-bold">P1</td><td className="p-1 border border-black">Platinum Elite</td><td className="p-1 border border-black text-center">6 - 10</td></tr>
            <tr><td className="p-1 border border-black font-bold">G1</td><td className="p-1 border border-black">Gold Scholar</td><td className="p-1 border border-black text-center">11 - 18</td></tr>
            <tr><td className="p-1 border border-black font-bold">S1</td><td className="p-1 border border-black">Silver Achiever</td><td className="p-1 border border-black text-center">19 - 30</td></tr>
            <tr><td className="p-1 border border-black font-bold">B1</td><td className="p-1 border border-black">Bronze Competent</td><td className="p-1 border border-black text-center">31 - 45</td></tr>
            <tr><td className="p-1 border border-black font-bold">W1</td><td className="p-1 border border-black">Needs Improvement</td><td className="p-1 border border-black text-center">46+</td></tr>
          </tbody>
        </table>
        <div className="flex-1 italic text-[10px] text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
          Note: This Broad Sheet ranks pupils by "Best 6" aggregate (Cores + Electives). Red scores indicate performance below 50%. Grading follows the Nominal Reference Test (NRT) standard relative to class average.
        </div>
      </div>

      <div className="mt-16 flex justify-end">
        <div className="text-center w-80">
          <div className="h-20 flex items-end justify-center pb-2 italic font-serif text-2xl border-b-2 border-black">
             H. Baylor
          </div>
          <div className="pt-2">
            <p className="font-black uppercase text-sm">HEADTEACHER'S AUTHORIZATION</p>
            <p className="text-xs text-gray-500 italic">Signature & Official Institution Stamp</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterBoard;
