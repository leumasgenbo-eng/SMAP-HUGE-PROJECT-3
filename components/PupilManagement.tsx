import React, { useState } from 'react';
import { Student, GlobalSettings } from '../types';

interface Props {
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  notify: any;
}

const PupilManagement: React.FC<Props> = ({ students, onStudentsUpdate, settings, notify }) => {
  const [activeClass, setActiveClass] = useState('Basic 1A');
  const [registerType, setRegisterType] = useState<'Attendance' | 'Lunch' | 'General'>('Attendance');

  const enrolled = students.filter(s => s.status === 'Admitted');
  const classList = enrolled.filter(s => s.currentClass === activeClass);

  const updateRegisterValue = (studentId: string, type: string, value: string) => {
    const today = new Date().toISOString().split('T')[0];
    onStudentsUpdate(students.map(s => {
      if (s.id === studentId) {
        if (type === 'Attendance') return { ...s, attendance: { ...s.attendance, [settings.currentTerm]: { ...s.attendance[settings.currentTerm], [today]: value } } };
        if (type === 'Lunch') return { ...s, lunchRegister: { ...s.lunchRegister, [today]: value } };
        return { ...s, generalRegister: { ...s.generalRegister, [today]: value } };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f3460] p-10 rounded-[3rem] shadow-xl border border-gray-100 min-h-[600px] flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100 pb-8 mb-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📔</div>
                <div>
                  <h3 className="text-2xl font-black text-[#cca43b] uppercase tracking-tighter">{registerType} Register</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Facilitator Daily Log Terminal</p>
                </div>
            </div>
            <div className="flex bg-white/10 p-1.5 rounded-2xl shadow-inner border border-white/5">
              {['Attendance', 'Lunch', 'General'].map(t => (
                <button key={t} onClick={() => setRegisterType(t as any)} className={`px-10 py-2.5 rounded-xl text-[10px] font-black uppercase transition ${registerType === t ? 'bg-white text-[#0f3460] shadow-sm scale-105' : 'text-white/40 hover:text-white'}`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center no-print bg-gray-50/5 p-4 rounded-2xl border border-white/5">
               <div className="flex items-center gap-4">
                 <span className="text-[10px] font-black text-white/50 uppercase">Active Target:</span>
                 <p className="font-black text-white uppercase text-xl">{activeClass}</p>
               </div>
               <button onClick={() => window.print()} className="bg-white text-[#0f3460] px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:scale-105 transition">Execute Print Flow</button>
            </div>

            <div className="overflow-x-auto rounded-[3rem] border border-white/10 shadow-2xl bg-white">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                  <tr>
                    <th className="p-8 border-b">Serial ID</th>
                    <th className="p-8 border-b">Learner Full Name</th>
                    <th className="p-8 border-b text-center">Mark Status ({new Date().toLocaleDateString()})</th>
                  </tr>
                </thead>
                <tbody>
                  {classList.map(s => (
                    <tr key={s.id} className="border-b hover:bg-yellow-50/30 transition bg-white group">
                      <td className="p-6 font-mono font-bold text-gray-400 px-8 border-r border-gray-50">{s.serialId}</td>
                      <td className="p-6 font-black uppercase text-[#0f3460] px-8">{s.firstName} {s.surname}</td>
                      <td className="p-6 text-center px-8">
                        <select 
                          className="bg-gray-50 border-2 border-gray-100 p-3 rounded-2xl font-black text-[10px] uppercase min-w-[220px] outline-none group-hover:border-[#cca43b] transition-all shadow-sm"
                          onChange={(e) => updateRegisterValue(s.id, registerType, e.target.value)}
                        >
                          {registerType === 'Attendance' ? (
                            <>
                              <option value="P">Present (P)</option>
                              <option value="AWP">Absent w/ Permission</option>
                              <option value="AWOP">Absent w/o Permission</option>
                              <option value="M">Mid Term (M)</option>
                              <option value="H">Holiday (H)</option>
                            </>
                          ) : registerType === 'Lunch' ? (
                            <>
                              <option value="P">Paid (P)</option>
                              <option value="O">Post Pay (O)</option>
                              <option value="PRE">Pre-paid (P)</option>
                            </>
                          ) : (
                            <>
                              <option value="Paid">Paid</option>
                              <option value="Partly Paid">Partly Paid</option>
                              <option value="Fully Paid">Fully Paid</option>
                              <option value="Include">Include</option>
                              <option value="Exclude">Exclude</option>
                              <option value="Supplied">Supplied</option>
                              <option value="Not Supplied">Not Supplied</option>
                            </>
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {classList.length === 0 && (
                    <tr><td colSpan={3} className="p-32 text-center text-gray-300 font-black uppercase italic tracking-widest">No pupils in current class roll.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
};

export default PupilManagement;