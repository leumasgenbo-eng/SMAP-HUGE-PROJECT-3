
import React, { useState } from 'react';

// Added dept to component props to fix type mismatch in App.tsx
const ReportCenter: React.FC<{ role: string, notify: any, dept: string }> = ({ role, notify, dept }) => {
  const [mockId, setMockId] = useState('');
  
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-black text-[#0f3460] mb-6">Academic Report Repository ({dept})</h2>
        <div className="flex flex-wrap gap-4 items-end">
           <div>
             <label className="text-[10px] font-black uppercase text-gray-400">Select Mock Series</label>
             <select className="block w-64 border-2 p-2 rounded-lg font-bold mt-1" onChange={e => setMockId(e.target.value)}>
                <option value="">Choose Mock...</option>
                <option>Mock 1 (Internal)</option>
                <option>Mock 2 (External)</option>
             </select>
           </div>
           <button className="bg-[#0f3460] text-white px-6 py-2 rounded-lg font-bold">Generate Broad Sheet</button>
        </div>
      </div>

      {!mockId ? (
        <div className="bg-white p-20 text-center rounded-2xl border-2 border-dashed border-gray-200">
           <p className="text-gray-400 font-bold">No Data Present Now. Please select a mock series.</p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm print:shadow-none">
          {/* Mockup for printable report card */}
          <div className="border-[6px] border-[#0f3460] p-10 relative">
             <div className="text-center mb-10">
               <h1 className="text-4xl font-black uppercase tracking-tighter">United Baylor Academy</h1>
               <p className="text-xs font-bold text-[#cca43b] tracking-widest uppercase">Academic Performance Record</p>
             </div>

             <div className="grid grid-cols-2 gap-8 mb-8 border-b-2 border-black pb-8">
                <div className="space-y-1">
                   <p className="text-sm font-bold uppercase">Pupil Name: <span className="font-black">SAMPLE PUPIL NAME</span></p>
                   <p className="text-sm font-bold uppercase text-gray-500">Mock Type: <span className="font-bold">Internal Mock #1</span></p>
                </div>
                <div className="text-right">
                   <p className="text-3xl font-black text-[#e74c3c]">AGGREGATE: 12</p>
                   <p className="text-[10px] font-black uppercase text-gray-400">Category: Platinum Elite ({dept})</p>
                </div>
             </div>

             <table className="w-full text-sm border-2 border-black mb-8">
                <thead className="bg-[#0f3460] text-white">
                   <tr className="uppercase text-[10px]">
                      <th className="p-2 border">Subject</th>
                      <th className="p-2 border">Score</th>
                      <th className="p-2 border">Grade</th>
                      <th className="p-2 border">Challenges Highlighted</th>
                      <th className="p-2 border">Rank</th>
                   </tr>
                </thead>
                <tbody>
                   <tr className="border-b">
                      <td className="p-2 border font-black">Mathematics</td>
                      <td className="p-2 border text-center font-bold">85</td>
                      <td className="p-2 border text-center font-black">A1</td>
                      <td className="p-2 border italic text-[10px]">None observed</td>
                      <td className="p-2 border text-center">1st</td>
                   </tr>
                </tbody>
             </table>

             <div className="grid grid-cols-3 gap-4 mt-20 text-center text-[10px] font-black uppercase">
                <div>
                   <div className="h-10 border-b border-black w-3/4 mx-auto mb-2"></div>
                   Class Facilitator
                </div>
                <div>
                   <div className="h-10 border-b border-black w-3/4 mx-auto mb-2"></div>
                   Subject Teacher
                </div>
                <div>
                   <div className="h-10 border-b border-black w-3/4 mx-auto mb-2 italic flex items-end justify-center">H. Baylor</div>
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
