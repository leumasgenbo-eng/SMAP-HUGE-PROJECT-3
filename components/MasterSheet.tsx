
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
      {/* Standard Institutional Particulars Header */}
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
        
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 no-print mb-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-300">ADDR:</span>
            <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-300">TEL:</span>
            <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-300">EMAIL:</span>
            <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
          </div>
        </div>

        <EditableField 
          value={displayExamTitle} 
          onSave={v => onSettingsChange({...settings, reportTitle: v})}
          className="text-xl font-black text-[#0f3460] uppercase mb-1"
        />
        <p className="text-lg font-black text-[#cca43b] uppercase mb-4 tracking-widest italic">DEPARTMENT: {department} • CLASS: {activeClass}</p>

        <div className="flex justify-center gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <span>Academic Year: <EditableField value={settings.academicYear} onSave={v => onSettingsChange({...settings, academicYear: v})} className="inline-block" /></span>
          <span>{isJHS ? `Mock Series: ${settings.mockSeries}` : `Term: ${settings.currentTerm}`}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {!isEarlyChildhood ? (
        <>
          <table className="w-full text-[10px] border-2 border-black">
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
            </tbody>
            {pupils.length > 0 && (
              <tfoot className="bg-yellow-50 font-black text-xs">
                <tr>
                  <td className="p-3 border border-black text-right uppercase" colSpan={2}>Class Average Score:</td>
                  {stats.map(s => (
                    <td key={s.name + '-mean'} className="p-2 border border-black text-center bg-yellow-100" colSpan={2}>{s.mean.toFixed(1)}</td>
                  ))}
                  <td className="p-2 border border-black text-center" colSpan={2}>-</td>
                </tr>
                <tr>
                  <td className="p-3 border border-black text-right uppercase" colSpan={2}>Standard Deviation (σ):</td>
                  {stats.map(s => (
                    <td key={s.name + '-sd'} className="p-2 border border-black text-center" colSpan={2}>{s.stdDev.toFixed(2)}</td>
                  ))}
                  <td className="p-2 border border-black text-center" colSpan={2}>-</td>
                </tr>
              </tfoot>
            )}
          </table>
        </>
      ) : (
        <div className="space-y-12">
          <p className="text-center italic text-gray-400">Please switch to Daycare Master Sheet for Early Childhood Reporting.</p>
        </div>
      )}
      
      <div className="mt-16 flex justify-end">
        <div className="text-center w-80">
          <div className="h-20 flex items-end justify-center pb-2 italic font-serif text-3xl border-b-2 border-black text-[#0f3460]">
             <EditableField value={settings.headteacherName} onSave={v => onSettingsChange({...settings, headteacherName: v})} className="text-center" />
          </div>
          <div className="pt-3">
            <p className="font-black uppercase text-sm tracking-tighter text-[#0f3460]">HEADTEACHER'S AUTHORIZATION</p>
            <EditableField value={settings.reportFooterText || "Official United Baylor Academy Certification"} onSave={v => onSettingsChange({...settings, reportFooterText: v})} className="text-[10px] text-gray-400 italic uppercase mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterSheet;
