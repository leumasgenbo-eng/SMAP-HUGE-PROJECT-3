
import React, { useState, useMemo } from 'react';
import { Student, GlobalSettings } from '../types';
import EditableField from './EditableField';
import { getSubjectsForDepartment } from '../constants';

interface Props {
  module: string;
  department: string;
  activeClass: string;
  students: Student[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  onStudentUpdate?: (id: string, field: string, value: any) => void;
  notify: any;
}

const GenericModule: React.FC<Props> = ({ module, department, activeClass, students, settings, onSettingsChange, onStudentUpdate, notify }) => {
  const subjects = useMemo(() => getSubjectsForDepartment(department), [department]);
  const [isBroadSheetMode, setIsBroadSheetMode] = useState(false);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dynamic Institutional Particulars Header */}
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

      {module === 'Time Table' ? (
        <div className="space-y-8">
           <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden no-print">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Academic Timetable Hub</h2>
                <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1 italic">{activeClass} • Full Week Schedule</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsBroadSheetMode(!isBroadSheetMode)} className="bg-white/10 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">
                  {isBroadSheetMode ? 'Detailed Daily View' : 'Weekly Grid View'}
                </button>
                <button onClick={() => window.print()} className="bg-[#cca43b] text-[#0f3460] px-8 py-3 rounded-2xl font-black uppercase text-xs hover:scale-105 transition">Print Official Copy</button>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 min-h-[400px]">
             <div className="grid grid-cols-6 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl font-black text-[10px] uppercase text-gray-400">Period</div>
                {days.map(d => <div key={d} className="bg-gray-100 p-4 rounded-2xl font-black text-[10px] uppercase text-[#0f3460] text-center">{d}</div>)}
                
                {[1,2,3,4,5,6,7,8].map(p => (
                   <React.Fragment key={p}>
                      <div className="p-4 flex items-center justify-center font-black text-xs text-gray-300">P{p}</div>
                      {days.map(d => (
                         <div key={`${d}-${p}`} className="p-4 border border-gray-50 rounded-2xl min-h-[60px] flex items-center justify-center text-center font-bold text-[9px] uppercase text-gray-500 hover:bg-yellow-50 transition cursor-pointer">
                            -- UNASSIGNED --
                         </div>
                      ))}
                   </React.Fragment>
                ))}
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 animate-fadeIn text-center">
           <p className="text-gray-300 font-black uppercase italic tracking-widest text-lg">Module: {module}</p>
           <p className="text-xs text-gray-400 mt-2 font-bold">United Baylor Academy Integrated Management Platform</p>
        </div>
      )}
    </div>
  );
};

export default GenericModule;
