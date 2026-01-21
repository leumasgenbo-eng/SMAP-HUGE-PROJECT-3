import React, { useState } from 'react';
import { GlobalSettings } from '../types';
import EditableField from './EditableField';
import UniversalReportHeader from './reports/UniversalReportHeader';

interface Props {
  role: string;
  notify: any;
  dept: string;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
}

const ReportCenter: React.FC<Props> = ({ role, notify, dept, settings, onSettingsChange }) => {
  const [mockId, setMockId] = useState('');
  
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-200">
        <h2 className="text-3xl font-black text-[#0f3460] mb-6 uppercase tracking-tighter">Academic Report Repository ({dept})</h2>
        <div className="flex flex-wrap gap-4 items-end">
           <div className="space-y-1">
             <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Select Academic Cycle</label>
             <select className="block w-64 border-none bg-gray-50 p-4 rounded-2xl font-bold mt-1 shadow-inner outline-none" onChange={e => setMockId(e.target.value)}>
                <option value="">Choose Exam Type...</option>
                <option>Terminal Examination</option>
                <option>Mock Series 1 (Internal)</option>
                <option>Mock Series 2 (External)</option>
             </select>
           </div>
           <button className="bg-[#0f3460] text-white px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-[1.02] transition">Generate Broad Sheet</button>
        </div>
      </div>

      {!mockId ? (
        <div className="bg-white p-20 text-center rounded-[3rem] border-4 border-dashed border-gray-100">
           <p className="text-gray-300 font-black uppercase italic tracking-widest">No Selection Active. Select an academic cycle above.</p>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl print:shadow-none animate-fadeIn overflow-x-auto">
          <div className="border-[10px] border-double border-[#0f3460] p-6 md:p-12 relative flex flex-col items-center min-w-[210mm]">
             <UniversalReportHeader 
               settings={settings} 
               onSettingsChange={onSettingsChange} 
               title={`${mockId.toUpperCase()} PERFORMANCE RECORD`} 
             />

             <div className="w-full grid grid-cols-2 gap-10 mb-8 border-b-2 border-black pb-8 font-black">
                <div className="space-y-1">
                   <p className="text-xs text-gray-400 uppercase">Learner Identity</p>
                   <p className="text-2xl text-[#0f3460] uppercase">SAMPLE PUPIL NAME</p>
                   <p className="text-[10px] text-gray-400 uppercase font-bold">Mock Type: {mockId}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-gray-400 uppercase">Academic Position</p>
                   <p className="text-4xl text-[#e74c3c]">AGGREGATE: 12</p>
                   <p className="text-[10px] font-black uppercase text-[#cca43b] mt-1">Category: Scholar ({dept})</p>
                </div>
             </div>

             <table className="w-full text-xs border-2 border-black mb-8 border-collapse">
                <thead className="bg-[#0f3460] text-white">
                   <tr className="uppercase text-[9px] font-black">
                      <th className="p-4 border border-black text-left">Learning Area / Subject</th>
                      <th className="p-4 border border-black text-center w-20">Score</th>
                      <th className="p-4 border border-black text-center w-20">Grade</th>
                      <th className="p-4 border border-black text-left">Observations</th>
                      <th className="p-4 border border-black text-center w-20">Rank</th>
                   </tr>
                </thead>
                <tbody>
                   <tr className="border-b">
                      <td className="p-4 border border-black font-black uppercase">Mathematics</td>
                      <td className="p-4 border border-black text-center font-black text-lg">85</td>
                      <td className="p-4 border border-black text-center font-black text-lg bg-gray-50">A1</td>
                      <td className="p-4 border border-black italic text-[10px] text-gray-400">Maintains consistent logical aptitude</td>
                      <td className="p-4 border border-black text-center font-bold">1st</td>
                   </tr>
                </tbody>
             </table>

             <div className="w-full grid grid-cols-3 gap-8 mt-20 text-center text-[9px] font-black uppercase tracking-widest text-gray-500">
                <div>
                   <div className="h-10 border-b-2 border-black w-3/4 mx-auto mb-2"></div>
                   Class Facilitator
                </div>
                <div>
                   <div className="h-10 border-b-2 border-black w-3/4 mx-auto mb-2"></div>
                   Subject Teacher
                </div>
                <div>
                   <div className="h-10 border-b-2 border-black w-3/4 mx-auto mb-2 italic flex items-end justify-center text-xl text-[#0f3460] font-serif">
                      <EditableField value={settings.headteacherName} onSave={v => onSettingsChange({...settings, headteacherName: v})} placeholder="Headteacher" className="text-center" />
                   </div>
                   Headteacher
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCenter;