import React, { useState } from 'react';
import { ATTENDANCE_KEYS } from '../constants';

const AttendanceModule: React.FC<any> = ({ dept, notify }) => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [register, setRegister] = useState<any[]>([]);

  const handleStatusChange = (pupilId: string, status: string) => {
    notify(`Updated attendance for ${pupilId} to ${status}`);
    // Logic: If status === 'A', auto-exclude from Lunch Fee register
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-[#2e8b57] p-8 text-white flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Daily Attendance Register</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Automatic Lunch & Tuition Integration</p>
        </div>
        <div className="flex gap-4">
          <input type="date" className="bg-white/10 border-white/20 rounded-xl p-2 font-black uppercase text-xs" />
          <button className="bg-white text-[#2e8b57] px-6 py-2 rounded-xl font-black uppercase text-xs shadow-lg">Save Register</button>
        </div>
      </div>

      <div className="p-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          {/* Fix: Added explicit casting to any[] for Object.values(ATTENDANCE_KEYS) to resolve unknown property access errors */}
          {(Object.values(ATTENDANCE_KEYS) as any[]).map(k => (
            <div key={k.code} className={`px-4 py-2 rounded-full text-[10px] font-black ${k.color} border border-black/5`}>
              {k.code} = {k.label}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-3xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-[#f4f6f7] text-[#0f3460] text-[10px] uppercase font-black">
              <tr>
                <th className="p-4 text-left">Pupil Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Lunch Fee</th>
                <th className="p-4">Extra Tuition</th>
                <th className="p-4">Parent Contact</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map(i => (
                <tr key={i} className="border-b hover:bg-yellow-50/30 transition">
                  <td className="p-4 font-black">Sample Pupil {i}</td>
                  <td className="p-4">
                    <select className="w-full bg-transparent font-black border-b-2 border-gray-200 outline-none">
                      {/* Fix: Added explicit casting to any[] for Object.values(ATTENDANCE_KEYS) to resolve unknown property access errors */}
                      {(Object.values(ATTENDANCE_KEYS) as any[]).map(k => <option key={k.code} value={k.code}>{k.code}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black">EXCLUDED</span>
                  </td>
                  <td className="p-4 text-center">
                    <input type="checkbox" className="accent-[#2e8b57]" />
                  </td>
                  <td className="p-4 font-mono text-gray-400 text-xs">+233243504091</td>
                  <td className="p-4 text-center">
                    <button className="text-red-500 font-black text-xs uppercase hover:underline">Follow Up</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModule;