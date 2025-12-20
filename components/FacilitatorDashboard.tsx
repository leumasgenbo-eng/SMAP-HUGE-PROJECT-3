
import React from 'react';
import { Student, GlobalSettings } from '../types';
import { calculateFacilitatorStats, NRT_SCALE } from '../utils';
import EditableField from './EditableField';

interface Props {
  students: Student[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  subjectList: string[];
}

const FacilitatorDashboard: React.FC<Props> = ({ students, settings, onSettingsChange, subjectList }) => {
  const stats = subjectList.map(subj => calculateFacilitatorStats(students, settings, subj));

  const handleSharePDF = () => {
    // Logic similar to ReportCard for sharing analysis as PDF
    alert("Generating Performance Analysis PDF...");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <EditableField 
                value={settings.schoolName} 
                onSave={(val) => onSettingsChange({...settings, schoolName: val})}
                className="text-4xl font-black uppercase tracking-tighter"
              />
            </div>
            <h2 className="text-xl font-bold text-[#cca43b] uppercase tracking-widest italic flex items-center gap-3">
               Facilitator Performance Analysis
               <EditableField 
                value={`TERM ${settings.currentTerm}`} 
                onSave={(val) => onSettingsChange({...settings, currentTerm: (parseInt(val.replace('TERM ', '')) || 1) as any})}
                className="bg-white/10 px-4 py-1 rounded-full text-[10px] font-black not-italic"
              />
            </h2>
          </div>
          <button 
            onClick={handleSharePDF}
            className="bg-[#2e8b57] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition active:scale-95"
          >
            Share Analysis PDF
          </button>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f4f6f7] text-[#0f3460] text-[10px] font-black uppercase tracking-widest border-b">
            <tr>
              <th className="p-6 text-left border-r">Subject Area</th>
              <th className="p-6 text-left border-r">Facilitator Name</th>
              <th className="p-6 text-center border-r" colSpan={9}>Grade Distribution (A1 - F9)</th>
              <th className="p-6 text-center bg-blue-50">Efficiency %</th>
              <th className="p-6 text-center bg-blue-100">Grade</th>
            </tr>
          </thead>
          <tbody>
            {stats.map(s => (
              <tr key={s.subject} className="border-b hover:bg-gray-50 transition">
                <td className="p-6 font-black text-[#0f3460] border-r bg-gray-50/50">{s.subject}</td>
                <td className="p-6 border-r">
                   <EditableField 
                    value={s.facilitator} 
                    onSave={(val) => {
                      const updated = { ...(settings.facilitatorMapping || {}) };
                      updated[s.subject] = val;
                      onSettingsChange({ ...settings, facilitatorMapping: updated });
                    }}
                    className="font-bold text-gray-600 italic"
                  />
                </td>
                {NRT_SCALE.map(g => (
                  <td key={g.grade} className="p-2 text-center border-r">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-gray-300 mb-1">{g.grade}</span>
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs ${s.distribution[g.grade] > 0 ? 'bg-[#0f3460] text-white' : 'bg-gray-100 text-gray-300'}`}>
                        {s.distribution[g.grade]}
                      </span>
                    </div>
                  </td>
                ))}
                <td className="p-6 text-center bg-blue-50 font-black text-blue-900 text-lg">
                  {s.performancePercentage.toFixed(1)}%
                </td>
                <td className="p-6 text-center bg-blue-100">
                  <span className="inline-block px-4 py-2 rounded-xl bg-white font-black text-[#0f3460] shadow-sm">
                    {s.grade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Performance Grading Key</h4>
         <div className="flex flex-wrap gap-8">
            <div className="flex-1 space-y-2">
               <p className="text-xs font-bold text-gray-600 leading-relaxed italic">
                 The Efficiency Index is calculated using the reverse weighted aggregate formula:
                 <br/>
                 <span className="text-[#0f3460] font-black">Efficiency % = [1 - (TotalValue / (Pupils * 9))] * 100</span>
                 <br/>
                 Where <span className="text-[#cca43b]">TotalValue</span> is the sum of (number of pupils * grade value). A higher percentage indicates more pupils achieving top grades.
               </p>
            </div>
            <div className="flex gap-2">
               {NRT_SCALE.map(g => (
                 <div key={g.grade} className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-gray-300">{g.grade}</span>
                    <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[8px] font-black">{g.value}</div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default FacilitatorDashboard;
