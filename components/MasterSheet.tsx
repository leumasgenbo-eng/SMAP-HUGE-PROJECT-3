
import React from 'react';
import { Pupil, GlobalSettings, EarlyChildhoodGradingConfig, EarlyChildhoodGradeRange } from '../types';
import { NRT_SCALE, calculateStats, getNRTGrade } from '../utils';
import EditableField from './EditableField';
import { EC_DEFAULT_GRADES } from '../constants';

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

  const isEarlyChildhood = department === 'Daycare' || department === 'Nursery' || department === 'KG' || department === 'D&N';

  const handleRemarkChange = (grade: string, remark: string) => {
    const updated = { ...(settings.gradingSystemRemarks || {}) };
    updated[grade] = remark;
    onSettingsChange({ ...settings, gradingSystemRemarks: updated });
  };

  const updateECScale = (target: 'core' | 'indicators', type: 3 | 5 | 9) => {
    const config: EarlyChildhoodGradingConfig = { type, ranges: [] };
    if (type === 3) config.ranges = target === 'core' ? EC_DEFAULT_GRADES.core3 : EC_DEFAULT_GRADES.ind3;
    else if (type === 5) config.ranges = EC_DEFAULT_GRADES.core5;
    else {
      // 9-Point default mapping
      config.ranges = NRT_SCALE.map(n => ({ label: n.grade, min: 0, max: 0, color: n.color, remark: n.remark }));
    }
    const updated = { ...settings.earlyChildhoodGrading, [target]: config };
    onSettingsChange({ ...settings, earlyChildhoodGrading: updated });
  };

  const updateECRange = (target: 'core' | 'indicators', idx: number, field: keyof EarlyChildhoodGradeRange, val: any) => {
    const config = { ...settings.earlyChildhoodGrading[target] };
    config.ranges[idx] = { ...config.ranges[idx], [field]: val };
    onSettingsChange({ ...settings, earlyChildhoodGrading: { ...settings.earlyChildhoodGrading, [target]: config } });
  };

  const isJHS = department === 'JHS';
  const displayExamTitle = settings.examStart ? `${isJHS ? 'MOCK' : 'END OF TERM'} EXAMINATION SHEET` : "EXAMINATION BROAD SHEET";

  return (
    <div className="bg-white p-4 md:p-12 shadow-2xl border border-gray-100 min-w-max animate-fadeIn">
      <div className="text-center mb-12 border-b-4 border-double border-[#0f3460] pb-8">
        <EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter mb-2" />
        
        <div className="flex justify-center gap-4 text-sm font-bold text-gray-500 mb-4">
          <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          <span>|</span>
          <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
        </div>

        <p className="text-xl font-bold text-gray-600 uppercase mb-4">{displayExamTitle}</p>
        <div className="flex justify-center gap-10 text-[10px] font-black uppercase tracking-widest text-[#cca43b]">
          <span>Academic Year: {settings.academicYear}</span>
          <span>{isJHS ? `Mock Series: ${settings.mockSeries}` : `Term: ${settings.currentTerm}`}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {!isEarlyChildhood ? (
        <>
          <div className="grid grid-cols-2 gap-8 mb-10 no-print bg-[#f4f6f7] p-8 rounded-[2rem] border border-gray-200">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam Start Date</label>
              <input type="date" className="block w-full bg-white border-none rounded-xl p-4 font-black text-[#0f3460]" value={settings.examStart} onChange={e => onSettingsChange({...settings, examStart: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam End Date</label>
              <input type="date" className="block w-full bg-white border-none rounded-xl p-4 font-black text-[#0f3460]" value={settings.examEnd} onChange={e => onSettingsChange({...settings, examEnd: e.target.value})} />
            </div>
          </div>

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
            </tbody>
          </table>
        </>
      ) : (
        <div className="space-y-12">
          <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 no-print">
            <h3 className="text-xl font-black text-[#0f3460] uppercase mb-8">Early Childhood Grading Scales (Adjustable)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Core Configuration */}
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Core Subjects Scale</h4>
                    <div className="flex bg-white p-1 rounded-xl shadow-inner gap-1">
                      {[3, 5, 9].map(t => <button key={t} onClick={() => updateECScale('core', t as any)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition ${settings.earlyChildhoodGrading.core.type === t ? 'bg-[#0f3460] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{t} PT</button>)}
                    </div>
                  </div>
                  <table className="w-full text-[9px] border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-[#0f3460] text-white font-black uppercase">
                      <tr><th className="p-2 text-left">Label</th><th className="p-2 text-center">Min %</th><th className="p-2 text-center">Max %</th><th className="p-2 text-left">Remark</th></tr>
                    </thead>
                    <tbody>
                      {settings.earlyChildhoodGrading.core.ranges.map((r, i) => (
                        <tr key={i} className="border-b bg-white">
                          <td className="p-2"><EditableField value={r.label} onSave={v => updateECRange('core', i, 'label', v)} className="font-black text-[#0f3460]" /></td>
                          <td className="p-2 text-center"><EditableField value={r.min.toString()} onSave={v => updateECRange('core', i, 'min', parseInt(v))} className="font-bold text-gray-400" /></td>
                          <td className="p-2 text-center"><EditableField value={r.max.toString()} onSave={v => updateECRange('core', i, 'max', parseInt(v))} className="font-bold text-gray-400" /></td>
                          <td className="p-2"><EditableField value={r.remark} onSave={v => updateECRange('core', i, 'remark', v)} className="italic" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>

               {/* Indicator Configuration */}
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Indicator Scale</h4>
                    <div className="flex bg-white p-1 rounded-xl shadow-inner gap-1">
                      {[3, 5].map(t => <button key={t} onClick={() => updateECScale('indicators', t as any)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition ${settings.earlyChildhoodGrading.indicators.type === t ? 'bg-[#cca43b] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{t} PT</button>)}
                    </div>
                  </div>
                  <table className="w-full text-[9px] border border-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-[#cca43b] text-white font-black uppercase">
                      <tr><th className="p-2 text-left">Label</th><th className="p-2 text-center">Min %</th><th className="p-2 text-center">Max %</th><th className="p-2 text-left">Remark</th></tr>
                    </thead>
                    <tbody>
                      {settings.earlyChildhoodGrading.indicators.ranges.map((r, i) => (
                        <tr key={i} className="border-b bg-white">
                          <td className="p-2"><EditableField value={r.label} onSave={v => updateECRange('indicators', i, 'label', v)} className="font-black text-[#cca43b]" /></td>
                          <td className="p-2 text-center"><EditableField value={r.min.toString()} onSave={v => updateECRange('indicators', i, 'min', parseInt(v))} className="font-bold text-gray-400" /></td>
                          <td className="p-2 text-center"><EditableField value={r.max.toString()} onSave={v => updateECRange('indicators', i, 'max', parseInt(v))} className="font-bold text-gray-400" /></td>
                          <td className="p-2"><EditableField value={r.remark} onSave={v => updateECRange('indicators', i, 'remark', v)} className="italic" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
          <div className="text-center py-20 text-gray-300 font-black uppercase italic">Master sheet table follows active EC configuration...</div>
        </div>
      )}

      <div className="mt-20 flex justify-end">
        <div className="text-center w-80">
          <div className="h-20 flex items-end justify-center pb-2 italic font-serif text-3xl border-b-2 border-black">H. Baylor</div>
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
