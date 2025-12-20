
import React, { useState } from 'react';
import { Student, GlobalSettings } from '../types';

interface Props {
  students: Student[];
  onUpdate: (students: Student[]) => void;
  onSave: () => void;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  subjectList: string[];
  department: string;
}

const ScoreEntry: React.FC<Props> = ({ students, onUpdate, onSave, settings, onSettingsChange, subjectList, department }) => {
  const [selectedSubject, setSelectedSubject] = useState(subjectList[0] || '');

  const isEarlyChildhood = department === 'Daycare' || department === 'Nursery' || department === 'KG' || department === 'D&N';
  const isJHS = department === 'JHS';
  
  const handleScoreChange = (id: string, section: 'sectionA' | 'sectionB', val: number) => {
    const updated = students.map(s => {
      if (s.id === id) {
        const details = { ...(s.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, total: 0, grade: '', facilitatorRemark: '' }) };
        if (section === 'sectionA') details.sectionA = Math.min(val, 100);
        if (section === 'sectionB') details.sectionB = Math.min(val, 100);
        
        // Calculation Logic
        if (isEarlyChildhood) {
          // EC: (Average Indicator Point % + Observation Score) / 2
          details.total = Math.round(((details.sectionA || 0) + (details.sectionB || 0)) / 2);
        } else {
          // Basic/JHS: Sum of Section A + B (Max 100)
          details.total = Math.min(details.sectionA + details.sectionB, 100);
        }
        
        return { ...s, scoreDetails: { ...(s.scoreDetails || {}), [selectedSubject]: details } };
      }
      return s;
    });
    onUpdate(updated);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1">
          <h2 className="text-3xl font-black text-[#0f3460] uppercase tracking-tighter leading-none">Score Entry Dashboard</h2>
          <div className="flex items-center gap-3 mt-4">
             <span className="bg-[#cca43b] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm">
               {isEarlyChildhood ? 'Early Childhood Assessment Cycle' : `Active ${isJHS ? 'Mock' : 'Term'} Session: ${isJHS ? settings.mockSeries : settings.currentTerm}`}
             </span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <select 
            className="bg-[#f4f6f7] border-none rounded-2xl p-4 font-black text-[#0f3460] focus:ring-2 focus:ring-[#cca43b] text-sm shadow-inner" 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={onSave} className="bg-[#0f3460] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Finalize Entries</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f4f6f7] text-[#0f3460]">
            <tr className="text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
              <th className="p-6 text-left">ID</th>
              <th className="p-6 text-left">Pupil Name</th>
              {isEarlyChildhood ? (
                <>
                  <th className="p-6 text-center">Average Daily Score <br/><span className="text-[8px] opacity-50">(Average Indicator Point %)</span></th>
                  <th className="p-6 text-center">Exam Score <br/><span className="text-[8px] opacity-50">(Observation Score)</span></th>
                </>
              ) : (
                <>
                  <th className="p-6 text-center">Section A</th>
                  <th className="p-6 text-center">Section B</th>
                </>
              )}
              <th className="p-6 text-center bg-blue-50/50">Total Score</th>
              <th className="p-6 text-left">Internal Note</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => {
              const details = s.scoreDetails?.[selectedSubject] || { sectionA: 0, sectionB: 0, total: 0, grade: '', facilitatorRemark: '' };
              return (
                <tr key={s.id} className="border-b hover:bg-blue-50/20 transition">
                  <td className="p-6 font-mono font-bold text-gray-400">{s.serialId || s.id.substring(0, 6)}</td>
                  <td className="p-6 font-black text-[#0f3460] uppercase">{s.firstName} {s.surname}</td>
                  <td className="p-6 text-center">
                    <input 
                      type="number" 
                      className="w-20 bg-gray-50 p-4 rounded-xl text-center font-black outline-none focus:ring-2 focus:ring-[#cca43b]" 
                      value={details.sectionA} 
                      onChange={e => handleScoreChange(s.id, 'sectionA', parseInt(e.target.value) || 0)} 
                    />
                  </td>
                  <td className="p-6 text-center">
                    <input 
                      type="number" 
                      className="w-20 bg-gray-50 p-4 rounded-xl text-center font-black outline-none focus:ring-2 focus:ring-[#cca43b]" 
                      value={details.sectionB} 
                      onChange={e => handleScoreChange(s.id, 'sectionB', parseInt(e.target.value) || 0)} 
                    />
                  </td>
                  <td className="p-6 text-center font-black text-3xl text-[#2e8b57] bg-blue-50/30">
                    {details.total}
                  </td>
                  <td className="p-6">
                    <input 
                      className="w-full bg-transparent border-b border-gray-100 text-[10px] font-bold italic text-gray-400" 
                      value={details.facilitatorRemark || ''} 
                      placeholder="Add specific aptitude note..." 
                      onChange={e => {
                        const updated = students.map(st => st.id === s.id ? { 
                          ...st, 
                          scoreDetails: { 
                            ...st.scoreDetails, 
                            [selectedSubject]: { ...details, facilitatorRemark: e.target.value } 
                          } 
                        } : st);
                        onUpdate(updated);
                      }} 
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoreEntry;
