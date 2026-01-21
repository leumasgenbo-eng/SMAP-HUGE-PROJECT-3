
import React from 'react';
import { GlobalSettings } from '../../types';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  notify: any;
}

const AdminHRRegistryTab: React.FC<Props> = ({ settings }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
      <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-inner bg-white">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
            <tr>
              <th className="p-5">Name / ID</th>
              <th className="p-5">Category</th>
              <th className="p-5">Dept / Work Area</th>
              <th className="p-5">Contact</th>
              <th className="p-5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {settings.staff.map(s => (
              <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-5">
                  <p className="font-black text-[#0f3460] uppercase">{s.name}</p>
                  <p className="text-[9px] font-bold text-[#cca43b]">{s.idNumber}</p>
                </td>
                <td className="p-5 font-bold uppercase text-gray-400">{s.category}</td>
                <td className="p-5 font-black uppercase text-gray-600">{s.category === 'Teaching' ? s.department : s.workArea}</td>
                <td className="p-5 font-mono text-blue-600">{s.contact}</td>
                <td className="p-5 text-center">
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase">ACTIVE</span>
                </td>
              </tr>
            ))}
            {settings.staff.length === 0 && (
              <tr><td colSpan={5} className="p-20 text-center text-gray-300 font-black uppercase italic tracking-widest">Registry Empty.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminHRRegistryTab;
