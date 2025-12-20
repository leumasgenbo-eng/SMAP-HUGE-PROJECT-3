
import React from 'react';
import { Pupil, GlobalSettings } from '../types';
import { NRT_SCALE, calculateStats, getNRTGrade } from '../utils';
import EditableField from './EditableField';

interface Props {
  pupils: Pupil[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  subjectList: string[];
  department: string;
}

const MasterSheet: React.FC<Props> = ({ pupils, settings, onSettingsChange, subjectList, department }) => {
  const stats = subjectList.map(subj => {
    const scores = pupils.map(p => p.scores[subj] || 0);
    return { name: subj, ...calculateStats(scores) };
  });

  const handleRemarkChange = (grade: string, remark: string) => {
    const updated = { ...(settings.gradingSystemRemarks || {}) };
    updated[grade] = remark;
    onSettingsChange({ ...settings, gradingSystemRemarks: updated });
  };

  const isJHS = department === 'JHS';
  const displayExamTitle = settings.examStart ? `${isJHS ? 'MOCK' : 'END OF TERM'} EXAMINATION SHEET` : "EXAMINATION BROAD SHEET";

  return (
    <div className="bg-white p-4 md:p-12 shadow-2xl border border-gray-100 min-w-max animate-fadeIn">
      {/* Institution Particulars */}
      <div className="text-center mb-12 border-b-4 border-double border-[#0f3460] pb-8">
        <h1 className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter mb-2">{settings.schoolName}</h1>
        <p className="text-xl font-bold text-gray-600 uppercase mb-4">{displayExamTitle}</p>
        <div className="flex justify-center gap-10 text-[10px] font-black uppercase tracking-widest text-[#cca43b]">
          <span>Academic Year: {settings.academicYear}</span>
          <span>{isJHS ? `Mock Series: ${settings.mockSeries}` : `Term: ${settings.currentTerm}`}</span>
          <span>Prepared: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10 no-print bg-[#f4f6f7] p-8 rounded-[2rem] border border-gray-200">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam Commencement Date</label>
          <input type="date" className="block w-full bg-white border-none rounded-xl p-4 font-black text-[#0f3460] focus:ring-2 focus:ring-[#cca43b]" value={settings.examStart} onChange={e => onSettingsChange({...settings, examStart: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam Conclusion Date</label>
          <input type="date" className="block w-full bg-white border-none rounded-xl p-4 font-black text-[#0f3460] focus:ring-2 focus:ring-[#cca43b]" value={settings.examEnd} onChange={e => onSettingsChange({...settings, examEnd: e.target.value})} />
        </div>
      </div>

      <table className="w-full text-[10px] border-2 border-black">
        <thead className="bg-[#f4f6f7]">
          <tr className="font-black">
            <th className="p-3 border border-black text-center" rowSpan={2}>RANK</th>
            <th className="p-3 border border-black text-left min-w-[180px]" rowSpan={2}>PUPIL NAME</th>
            {subjectList.map(subj => (
              <th key={subj} className="p-1 border border-black text-[8px] uppercase font-black text-center" colSpan={2}>{subj}</th>
            ))}
            <th className="p-3 border border-black text-center" rowSpan={2}>BEST 6<br/>AGG.</th>
            <th className="p-3 border border-black text-center" rowSpan={2}>CAT.</th>
          </tr>
          <tr className="bg-white">
            {subjectList.map(subj => (
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
              <td className="p-2 border border-black font-black text-center text-sm">{rank + 1}</td>
              <td className="p-2 border border-black text-left font-black uppercase px-3 truncate">{pupil.name}</td>
              {subjectList.map(subj => {
                const s = pupil.scores[subj] || 0;
                const stat = stats.find(st => st.name === subj)!;
                const gradeData = getNRTGrade(s, stat.mean, stat.stdDev);
                return (
                  <React.Fragment key={subj}>
                    <td className={`p-1 border border-black text-center font-bold ${s < 50 ? 'text-red-600' : 'text-green-700'}`}>{s}</td>
                    <td className={`p-1 border border-black text-center font-black ${gradeData.grade === 'F9' ? 'text-red-700 bg-red-50' : ''}`}>{gradeData.grade}</td>
                  </React.Fragment>
                );
              })}
              <td className="p-2 border border-black font-black text-center bg-blue-100 text-blue-900 text-lg">{pupil.aggregate}</td>
              <td className="p-2 border border-black text-center font-black bg-[#f4f6f7]">{pupil.categoryCode}</td>
            </tr>
          ))}
          
          <tr className="bg-yellow-50 font-black border-t-2 border-black">
            <td className="p-3 border border-black text-right uppercase" colSpan={2}>Class Average Score</td>
            {stats.map(s => (
              <td key={s.name + '-mean'} className="p-1 border border-black text-center text-blue-800" colSpan={2}>{s.mean.toFixed(1)}</td>
            ))}
            <td className="p-1 border border-black bg-yellow-100" colSpan={2}></td>
          </tr>
          <tr className="bg-yellow-50 font-black">
            <td className="p-3 border border-black text-right uppercase" colSpan={2}>Class Standard Deviation (σ)</td>
            {stats.map(s => (
              <td key={s.name + '-sd'} className="p-1 border border-black text-center text-purple-800" colSpan={2}>{s.stdDev.toFixed(2)}</td>
            ))}
            <td className="p-1 border border-black bg-yellow-100" colSpan={2}></td>
          </tr>
        </tbody>
      </table>

      {/* Category Reference & Grading Remarks Table */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">NRT Grading System & Custom Remarks (Editable)</h4>
          <table className="w-full text-[9px] border border-black">
            <thead className="bg-gray-800 text-white font-black uppercase">
              <tr>
                <th className="p-2 border border-black">Grade</th>
                <th className="p-2 border border-black">Z-Score Cutoff</th>
                <th className="p-2 border border-black text-left">Remark / Description</th>
              </tr>
            </thead>
            <tbody>
              {NRT_SCALE.map(s => (
                <tr key={s.grade}>
                  <td className="p-2 border border-black font-black text-center bg-gray-50">{s.grade}</td>
                  <td className="p-2 border border-black text-center text-gray-500 font-mono">{s.zScore > -900 ? `≥ Mean + ${s.zScore}σ` : '< Min'}</td>
                  <td className="p-2 border border-black font-bold">
                    <EditableField 
                      value={settings.gradingSystemRemarks?.[s.grade] || s.remark} 
                      onSave={(val) => handleRemarkChange(s.grade, val)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pupil Performance Categories</h4>
          <table className="w-full text-[10px] border border-black">
            <thead className="bg-[#0f3460] text-white font-black uppercase">
              <tr>
                <th className="p-2 border border-black">Code</th>
                <th className="p-2 border border-black text-left">Category Grouping</th>
                <th className="p-2 border border-black text-center">Aggregate Range</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-50">
                <td className="p-2 border border-black font-black text-center">P1</td>
                <td className="p-2 border border-black font-black text-blue-900 uppercase">Platinum Elite</td>
                <td className="p-2 border border-black text-center font-black">6 - 10</td>
              </tr>
              <tr>
                <td className="p-2 border border-black font-black text-center">G1</td>
                <td className="p-2 border border-black font-bold text-yellow-700 uppercase">Gold Scholar</td>
                <td className="p-2 border border-black text-center font-black">11 - 18</td>
              </tr>
              <tr>
                <td className="p-2 border border-black font-black text-center">S1</td>
                <td className="p-2 border border-black font-bold text-gray-500 uppercase">Silver Achiever</td>
                <td className="p-2 border border-black text-center font-black">19 - 30</td>
              </tr>
              <tr>
                <td className="p-2 border border-black font-black text-center">B1</td>
                <td className="p-2 border border-black font-bold text-amber-800 uppercase">Bronze Competent</td>
                <td className="p-2 border border-black text-center font-black">31 - 45</td>
              </tr>
              <tr className="bg-red-50">
                <td className="p-2 border border-black font-black text-center">W1</td>
                <td className="p-2 border border-black font-bold text-red-700 uppercase">Needs Improvement</td>
                <td className="p-2 border border-black text-center font-black">46+</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature Section */}
      <div className="mt-20 flex justify-end">
        <div className="text-center w-80">
          <div className="h-20 flex items-end justify-center pb-2 italic font-serif text-3xl border-b-2 border-black">
             H. Baylor
          </div>
          <div className="pt-3">
            <p className="font-black uppercase text-base tracking-tighter">HEADTEACHER'S AUTHORIZATION</p>
            <p className="text-[10px] text-gray-500 italic uppercase font-bold tracking-widest">Official Seal & Institutional Certification</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterSheet;
