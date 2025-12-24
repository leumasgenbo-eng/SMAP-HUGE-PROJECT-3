
import React, { useState } from 'react';
import { Student, GlobalSettings } from '../types';
import EditableField from './EditableField';

interface Props {
  students: Student[];
  onUpdate: (students: Student[]) => void;
  onSave: () => void;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  subjectList: string[];
  department: string;
  activeClass: string;
}

const ScoreEntry: React.FC<Props> = ({ students, onUpdate, onSave, settings, onSettingsChange, subjectList, department, activeClass }) => {
  const [selectedSubject, setSelectedSubject] = useState(subjectList[0] || '');
  const [primaryMode, setPrimaryMode] = useState<'sba' | 'finals'>('sba');
  const isJHS = department === 'JHS';

  const updateScore = (studentId: string, field: string, val: number) => {
    const updated: Student[] = students.map(s => {
      if (s.id === studentId) {
        const details = s.scoreDetails?.[selectedSubject] || { total: 0, grade: '', sectionA: 0, sectionB: 0, examScore: 0, mockObj: 0, mockTheory: 0 };
        const newDetails = { ...details, [field]: val };
        
        let newTotal = 0;
        if (isJHS && primaryMode === 'finals') {
          newTotal = (newDetails.mockObj || 0) + (newDetails.mockTheory || 0);
        } else if (primaryMode === 'finals') {
          newTotal = val; 
        } else {
          newTotal = (newDetails.sectionA || 0) + (newDetails.sectionB || 0);
        }

        return {
          ...s,
          scoreDetails: {
            ...(s.scoreDetails || {}),
            [selectedSubject]: { ...newDetails, total: newTotal, grade: details.grade || '' }
          }
        } as Student;
      }
      return s;
    });
    onUpdate(updated);
  };

  const handleRemarkUpdate = (studentId: string, remark: string) => {
    const updated: Student[] = students.map(s => {
      if (s.id === studentId) {
        const details = s.scoreDetails?.[selectedSubject] || { total: 0, grade: '', sectionA: 0, sectionB: 0, examScore: 0, mockObj: 0, mockTheory: 0 };
        return {
          ...s,
          scoreDetails: {
            ...(s.scoreDetails || {}),
            [selectedSubject]: { ...details, facilitatorRemark: remark }
          }
        } as Student;
      }
      return s;
    });
    onUpdate(updated);
  };

  return (
    <div className="space-y-8 animate-fadeIn no-print relative">
      {/* Standard Institutional Header */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <EditableField 
          value={settings.schoolName} 
          onSave={v => onSettingsChange({...settings, schoolName: v})} 
          className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" 
        />
        <EditableField 
          value={settings.motto} 
          onSave={v => onSettingsChange({...settings, motto: v})} 
          className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b]" 
        />
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2">
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
      </div>

      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
           <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Academic Assessment Ledger</h2>
              <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1 italic">
                 Curriculum Cycle: {settings.academicYear} • Class: {activeClass}
              </p>
           </div>
           <div className="flex flex-wrap gap-3 bg-white/10 p-2 rounded-[2rem] border border-white/5">
              <select className="bg-white p-3 rounded-2xl font-black text-[#0f3460] text-xs uppercase shadow-lg border-none" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                 {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex bg-white/5 p-1 rounded-xl">
                 <button onClick={() => setPrimaryMode('sba')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase transition ${primaryMode === 'sba' ? 'bg-[#cca43b] text-[#0f3460]' : ''}`}>SBA Entries</button>
                 <button onClick={() => setPrimaryMode('finals')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase transition ${primaryMode === 'finals' ? 'bg-[#cca43b] text-[#0f3460]' : ''}`}>{isJHS ? 'Mock Entries' : 'Exam Entries'}</button>
              </div>
              <button onClick={onSave} className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:scale-105 transition">Sync to Master</button>
           </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
           <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase text-[10px]">
             <tr>
               <th className="p-6 border-b">Learner Full Name</th>
               {primaryMode === 'sba' ? (
                 <>
                   <th className="p-6 border-b text-center">Classwork (50%)</th>
                   <th className="p-6 border-b text-center">Homework/Project (50%)</th>
                 </>
               ) : isJHS ? (
                 <>
                   <th className="p-6 border-b text-center">Mock Objective (40)</th>
                   <th className="p-6 border-b text-center">Mock Theory (60)</th>
                 </>
               ) : (
                 <th className="p-6 border-b text-center">Terminal Exam (100)</th>
               )}
               <th className="p-6 border-b text-center bg-blue-50">Grand Total</th>
               <th className="p-6 border-b">Teacher's Pedagogical Remarks</th>
             </tr>
           </thead>
           <tbody>
             {students.map(s => {
               const details = s.scoreDetails?.[selectedSubject] || { total: 0, sectionA: 0, sectionB: 0, examScore: 0, mockObj: 0, mockTheory: 0, facilitatorRemark: '' };
               return (
                 <tr key={s.id} className="border-b hover:bg-gray-50 transition border-gray-50">
                    <td className="p-6 font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</td>
                    {primaryMode === 'sba' ? (
                      <>
                        <td className="p-6 text-center"><input type="number" className="w-20 p-2 bg-gray-50 rounded-lg text-center font-bold" value={details.sectionA} onChange={e => updateScore(s.id, 'sectionA', parseInt(e.target.value) || 0)} /></td>
                        <td className="p-6 text-center"><input type="number" className="w-20 p-2 bg-gray-50 rounded-lg text-center font-bold" value={details.sectionB} onChange={e => updateScore(s.id, 'sectionB', parseInt(e.target.value) || 0)} /></td>
                      </>
                    ) : isJHS ? (
                      <>
                        <td className="p-6 text-center"><input type="number" className="w-20 p-2 bg-gray-50 rounded-lg text-center font-bold" value={details.mockObj} onChange={e => updateScore(s.id, 'mockObj', parseInt(e.target.value) || 0)} /></td>
                        <td className="p-6 text-center"><input type="number" className="w-20 p-2 bg-gray-50 rounded-lg text-center font-bold" value={details.mockTheory} onChange={e => updateScore(s.id, 'mockTheory', parseInt(e.target.value) || 0)} /></td>
                      </>
                    ) : (
                      <td className="p-6 text-center"><input type="number" className="w-20 p-2 bg-gray-50 rounded-lg text-center font-bold" value={details.examScore} onChange={e => updateScore(s.id, 'examScore', parseInt(e.target.value) || 0)} /></td>
                    )}
                    <td className="p-6 text-center bg-blue-50/50">
                       <span className="text-xl font-black text-[#cca43b]">{details.total}</span>
                    </td>
                    <td className="p-6">
                       <select 
                         className="w-full bg-transparent border-b italic text-xs outline-none"
                         value={details.facilitatorRemark || ''}
                         onChange={e => handleRemarkUpdate(s.id, e.target.value)}
                       >
                          <option value="">-- Choose Remark --</option>
                          {settings.popoutLists.facilitatorRemarks.map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </td>
                 </tr>
               );
             })}
           </tbody>
        </table>
        
        <div className="mt-8 p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-between">
           <div className="space-y-1">
              <h4 className="text-xs font-black text-[#0f3460] uppercase">Scoring Methodology Disclosure</h4>
              <p className="text-[10px] text-gray-400 font-medium italic">
                {isJHS ? 'JHS Mock scores are calculated as the raw sum of Objective and Theory papers.' : 'Basic School SBA scores are derived from the mean of Continuous Assessment tasks.'}
              </p>
           </div>
           <div className="flex gap-4">
              <button className="bg-white border-2 border-gray-100 px-6 py-2 rounded-xl text-[9px] font-black uppercase text-gray-400">Export Subject CSV</button>
              <button className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg">Lock Subject Record</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreEntry;
