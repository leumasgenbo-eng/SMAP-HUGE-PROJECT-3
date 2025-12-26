
import React from 'react';
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
  const scale = settings.gradingScale || [];
  const stats = subjectList.map(subj => {
    const scores = pupils.map(p => p.scores[subj] || 0);
    return { name: subj, ...calculateStats(scores) };
  });

  const isEarlyChildhood = department === 'Daycare' || department === 'Nursery' || department === 'KG' || department === 'D&N';
  const isJHS = department === 'JHS';
  
  const displayExamTitle = (isJHS || settings.mockSeries) 
    ? (settings.reportTitle || "MOCK EXAMINATION SHEET") 
    : (settings.reportTitle || "EXAMINATION MASTER BROAD SHEET");

  return (
    <div className="bg-white p-4 md:p-12 shadow-2xl border border-gray-100 min-w-max animate-fadeIn">
      {/* Comprehensive Editable Branding Header */}
      <div className="text-center mb-12 border-b-4 border-double border-[#0f3460] pb-8 flex flex-col items-center">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-gray-100 flex items-center justify-center overflow-hidden group relative">
            {settings.logo ? (
              <img src={settings.logo} className="w-full h-full object-contain" alt="Logo" />
            ) : (
              <span className="text-4xl">🏫</span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center no-print">
              <EditableField 
                value={settings.logo} 
                onSave={v => onSettingsChange({...settings, logo: v})} 
                placeholder="Logo URL"
                className="text-[8px] text-white bg-transparent border-white"
              />
            </div>
          </div>
          <div className="flex flex-col items-center">
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
          </div>
        </div>
        
        <div className="flex justify-center gap-8 text-xs font-bold text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-100 w-full max-w-4xl">
          <div className="flex items-center gap-2">
            <span className="text-[#cca43b] text-[10px]">📍</span>
            <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#cca43b] text-[10px]">📞</span>
            <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#cca43b] text-[10px]">✉️</span>
            <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className="lowercase" />
          </div>
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
          <span>{isJHS ? `Mock Series: ${settings.mockSeries}` : `Term: ${settings.currentTerm}`}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {!isEarlyChildhood ? (
        <>
          <table className="w-full text-[10px] border-2 border-black border-collapse">
            <thead className="bg-[#f4f6f7]">
              <tr className="font-black text-[#0f3460]">
                <th className="p-3 border border-black text-center" rowSpan={2}>RANK</th>
                <th className="p-3 border border-black text-left min-w-[180px]" rowSpan={2}>PUPIL NAME</th>
                {subjectList.map(subj => <th key={subj} className="p-1 border border-black text-[8px] uppercase font-black text-center" colSpan={2}>{subj}</th>)}
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
              {pupils.length === 0 ? (
                <tr><td colSpan={subjectList.length * 2 + 4} className="p-20 text-center font-black uppercase text-gray-300 italic">No Assessment Data for {activeClass}</td></tr>
              ) : pupils.map((pupil, rank) => (
                <tr key={pupil.no} className={`${rank % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-yellow-50 transition`}>
                  <td className="p-2 border border-black font-black text-center text-sm">{rank + 1}</td>
                  <td className="p-2 border border-black text-left font-black uppercase px-3 truncate">{pupil.name}</td>
                  {subjectList.map(subj => {
                    const s = pupil.scores[subj] || 0;
                    const stat = stats.find(st => st.name === subj)!;
                    const gradeData = getNRTGrade(s, stat.mean, stat.stdDev, scale);
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
            </tbody>
          </table>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10 border-t pt-8">
             <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-[#0f3460] tracking-widest border-b-2 border-[#cca43b] w-fit pb-1">Assessment Weighting Key</h4>
                <div className="flex gap-6 text-[9px] font-bold text-gray-500 uppercase">
                   <div className="flex flex-col"><span className="text-[#0f3460] font-black">Exercises</span><span>{settings.assessmentWeights.exercises}%</span></div>
                   <div className="flex flex-col"><span className="text-[#0f3460] font-black">CAT Series</span><span>{settings.assessmentWeights.cats}%</span></div>
                   <div className="flex flex-col"><span className="text-[#0f3460] font-black">Final Exams</span><span>{settings.assessmentWeights.terminal}%</span></div>
                   <div className="flex flex-col border-l pl-4"><span className="text-blue-600 font-black">Combined Total</span><span>100%</span></div>
                </div>
             </div>

             <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-[#0f3460] tracking-widest border-b-2 border-[#cca43b] w-fit pb-1">9-Point NRT Grading Key</h4>
                <div className="flex flex-wrap gap-2">
                   {scale.map(g => (
                      <div key={g.grade} className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                         <span className="font-black text-[10px]" style={{ color: g.color }}>{g.grade}</span>
                         <span className="text-[8px] font-bold text-gray-400">({g.value}pt)</span>
                         <span className="text-[8px] uppercase font-black opacity-50">{g.remark}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </>
      ) : (
        <p className="text-center italic text-gray-400">Assessment Data for early childhood levels is formatted in the Developmental Master Sheet.</p>
      )}
    </div>
  );
};

export default MasterSheet;
