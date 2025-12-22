
import React, { useState, useMemo } from 'react';
import { Student, GlobalSettings, SBAConfig } from '../types';
import EditableField from './EditableField';
import { getSubjectsForDepartment, BLOOM_TAXONOMY, CORE_SUBJECTS } from '../constants';

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
  const [selectedSbaSubject, setSelectedSbaSubject] = useState(getSubjectsForDepartment(department)[0]);
  const [activeDay, setActiveDay] = useState('Monday');
  const [showManagementDesk, setShowManagementDesk] = useState(false);

  const subjects = getSubjectsForDepartment(department);
  const isBasicOrJHS = department.includes('Basic') || department === 'JHS';

  // --- Timetable Logic ---
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Customary Blocks
  const customaryItems = ["Worship", "Library", "PLC Meeting", "Club Activity", "Singing & Hymns", "Extra-Curricular"];

  const dailyStructure = [
    { type: 'MANDATORY', label: 'Morning Assembly', time: '07:30 - 07:40' },
    { type: 'MANDATORY', label: 'Worship / Devotion', time: '07:40 - 08:00' },
    { type: 'PERIOD', label: 'Period 1', time: '08:00 - 08:40', slotIndex: 0 },
    { type: 'PERIOD', label: 'Period 2', time: '08:40 - 09:20', slotIndex: 1 },
    { type: 'PERIOD', label: 'Period 3', time: '09:20 - 10:00', slotIndex: 2 },
    { type: 'BREAK', label: 'Snack Break', time: '10:00 - 10:30' },
    { type: 'PERIOD', label: 'Period 4', time: '10:30 - 11:10', slotIndex: 3 },
    { type: 'MANDATORY', label: 'Afternoon Assembly', time: '11:10 - 11:20' },
    { type: 'PERIOD', label: 'Period 5', time: '11:20 - 12:00', slotIndex: 4 },
    { type: 'BREAK', label: 'Lunch Break', time: '12:00 - 12:40' },
    { type: 'PERIOD', label: 'Period 6', time: '12:40 - 13:20', slotIndex: 5 },
    { type: 'PERIOD', label: 'Period 7', time: '13:20 - 14:00', slotIndex: 6 },
    { type: 'MANDATORY', label: 'Closing / PLC / Ext.', time: '14:00 - 14:45' },
  ];

  const classTT = settings.classTimeTables?.[activeClass]?.[activeDay] || Array(7).fill('');

  const updateTTSlot = (slotIdx: number, val: string) => {
    const dayTT = [...classTT];
    dayTT[slotIdx] = val;
    const classConfig = settings.classTimeTables?.[activeClass] || {};
    onSettingsChange({
      ...settings,
      classTimeTables: {
        ...settings.classTimeTables,
        [activeClass]: { ...classConfig, [activeDay]: dayTT }
      }
    });
  };

  const handleAutoGenerate = () => {
    const generated: Record<string, string[]> = {};
    days.forEach(day => {
      const daySlots = Array(7).fill('');
      const shuffled = [...subjects].sort(() => Math.random() - 0.5);
      
      for(let i=0; i<7; i++) {
        // Simple logic: pick subject, ensure not consecutive unless customary
        let pick = shuffled[i % shuffled.length];
        if (i > 0 && daySlots[i-1] === pick) {
          pick = shuffled[(i + 1) % shuffled.length];
        }
        daySlots[i] = pick;
      }
      generated[day] = daySlots;
    });

    onSettingsChange({
      ...settings,
      classTimeTables: {
        ...settings.classTimeTables,
        [activeClass]: generated
      }
    });
    notify(`Class Timetable for ${activeClass} generated based on curriculum demand!`, "success");
  };

  const getSlotStatus = (subj: string, idx: number) => {
    if (!subj) return { color: 'bg-gray-50 text-gray-300 italic', label: 'PASS' };
    
    // Rule 6.1: Consecutive Repetition (Orange)
    if (idx > 0 && classTT[idx - 1] === subj) {
      return { color: 'bg-orange-100 text-orange-800 border-orange-200', label: '🟠 REPETITION RISK' };
    }

    // Teacher Conflict (Red) - Mocked logic for demo
    if (subj === 'Mathematics' && activeClass.includes('Basic 8') && activeDay === 'Monday' && idx === 2) {
       return { color: 'bg-red-100 text-red-800 border-red-200', label: '🔴 TEACHER CLASH' };
    }

    // Fatigue (Yellow)
    if (CORE_SUBJECTS.includes(subj) && idx >= 5) {
      return { color: 'bg-yellow-50 text-yellow-800 border-yellow-200', label: '🟡 FATIGUE WARNING' };
    }

    return { color: 'bg-blue-50 text-blue-800 border-blue-200', label: '✅ VALID' };
  };

  if (module === 'Time Table' && isBasicOrJHS) {
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Header Section */}
        <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <EditableField 
                value={settings.schoolName} 
                onSave={v => onSettingsChange({...settings, schoolName: v})} 
                className="text-4xl font-black uppercase tracking-tighter"
              />
              <h2 className="text-xl font-bold text-[#cca43b] uppercase tracking-widest mt-2">Class Time Table Scheduler</h2>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mt-1">Rule-Based Automation • {activeClass}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleAutoGenerate} className="bg-[#cca43b] text-[#0f3460] px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Auto-Generate Class TT</button>
              <button onClick={() => setShowManagementDesk(!showManagementDesk)} className="bg-white/10 text-white border border-white/20 px-8 py-3 rounded-2xl font-black uppercase text-xs hover:bg-white/20 transition">
                {showManagementDesk ? 'Close Management Desk' : 'Time Table Management Desk'}
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        </div>

        {showManagementDesk && (
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-[#cca43b]/20 grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="col-span-2">
                <h3 className="text-xl font-black text-[#0f3460] uppercase mb-4 tracking-tighter">Conflict & Compliance Inspector</h3>
                <div className="space-y-3">
                   <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                      <span className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-black">!</span>
                      <div className="flex-1">
                        <p className="text-xs font-black text-red-800 uppercase">Clash Detected (Basic 8 / Basic 9)</p>
                        <p className="text-[10px] text-red-600 font-bold">Sir Michael (Math) is assigned to two locations at 9:20am.</p>
                      </div>
                      <button className="bg-red-800 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase">Swap Slot</button>
                   </div>
                   <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <span className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-black">W</span>
                      <div className="flex-1">
                        <p className="text-xs font-black text-orange-800 uppercase">Consecutive Limit Violation</p>
                        <p className="text-[10px] text-orange-600 font-bold">English Language exceeds 2 continuous periods without break.</p>
                      </div>
                   </div>
                </div>
             </div>
             <div className="bg-gray-50 p-6 rounded-[2.5rem]">
                <h4 className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Global Constraints</h4>
                <ul className="space-y-4 text-[10px] font-black text-gray-600 uppercase">
                   <li className="flex justify-between"><span>Morning Assembly:</span> <span className="text-green-600">LOCKED (10m)</span></li>
                   <li className="flex justify-between"><span>Worship / Devotion:</span> <span className="text-green-600">LOCKED (20m)</span></li>
                   <li className="flex justify-between"><span>Snack Break:</span> <span className="text-green-600">LOCKED (30m)</span></li>
                   <li className="flex justify-between"><span>Afternoon Assembly:</span> <span className="text-green-600">LOCKED (10m)</span></li>
                   <li className="flex justify-between"><span>Lunch Break:</span> <span className="text-green-600">LOCKED (40m)</span></li>
                   <li className="flex justify-between"><span>Part-Time Sync:</span> <span className="text-blue-600">ACTIVE</span></li>
                </ul>
             </div>
          </div>
        )}

        {/* Calendar Day Switcher */}
        <div className="flex justify-center gap-2">
          {days.map(d => (
            <button 
              key={d} 
              onClick={() => setActiveDay(d)} 
              className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${activeDay === d ? 'bg-[#0f3460] text-white shadow-xl scale-105' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f4f6f7] text-[#0f3460] uppercase text-[10px] font-black">
              <tr>
                <th className="p-5 border-b">Time Schedule</th>
                <th className="p-5 border-b">Official Block</th>
                <th className="p-5 border-b">Instructional Activity</th>
                <th className="p-5 border-b text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {dailyStructure.map((row, i) => {
                const status = row.type === 'PERIOD' ? getSlotStatus(classTT[row.slotIndex!], row.slotIndex!) : null;
                return (
                  <tr key={i} className={`border-b transition-colors ${row.type === 'BREAK' ? 'bg-yellow-50/50' : row.type === 'MANDATORY' ? 'bg-blue-50/20' : 'bg-white hover:bg-gray-50/50'}`}>
                    <td className="p-5 font-mono text-[11px] text-gray-400 font-black whitespace-nowrap">{row.time}</td>
                    <td className="p-5">
                      <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full shadow-sm ${row.type === 'BREAK' ? 'bg-yellow-100 text-yellow-700' : row.type === 'MANDATORY' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {row.label}
                      </span>
                    </td>
                    <td className="p-2">
                      {row.type === 'PERIOD' && row.slotIndex !== undefined ? (
                        <select 
                          className={`w-full p-4 rounded-2xl border-2 font-black text-xs uppercase outline-none focus:ring-4 focus:ring-[#cca43b]/20 transition shadow-inner ${status?.color}`}
                          value={classTT[row.slotIndex]}
                          onChange={(e) => updateTTSlot(row.slotIndex!, e.target.value)}
                        >
                          <option value="">-- ASSIGN SUBJECT --</option>
                          <optgroup label="Curriculum Subjects">
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </optgroup>
                          <optgroup label="Customary Activities">
                            {customaryItems.map(c => <option key={c} value={c}>{c}</option>)}
                          </optgroup>
                        </select>
                      ) : (
                        <div className="p-4 text-[10px] italic text-gray-300 font-black uppercase tracking-widest text-center">Locked Curricular Block</div>
                      )}
                    </td>
                    <td className="p-5 text-center">
                       {status ? (
                         <span className="text-[8px] font-black uppercase whitespace-nowrap">{status.label}</span>
                       ) : (
                         <span className="text-[15px] opacity-20">🔒</span>
                       )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="mt-10 flex flex-col md:flex-row justify-between items-end gap-6 pt-10 border-t border-dashed border-gray-200">
             <div className="text-left w-64 border-b-2 border-black pb-2">
                <p className="text-[10px] font-black text-gray-400 uppercase">Class Facilitator Signature</p>
             </div>
             <div className="text-center">
                <p className="italic font-serif text-3xl text-[#0f3460]">H. Baylor</p>
                <div className="h-1 bg-[#cca43b] w-full my-2"></div>
                <p className="text-[10px] font-black uppercase tracking-widest">Headteacher's Certified Approval</p>
             </div>
             <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs shadow-2xl hover:scale-105 active:scale-95 transition">Print Official Class TT</button>
          </div>
        </div>
      </div>
    );
  }

  // --- Assessment Desk Section ---
  if (module === 'Class Assessment Test System') {
    const sbaConfig = settings.sbaConfigs?.[activeClass]?.[selectedSbaSubject] || {
      cat1Date: '', cat2Date: '', cat3Date: '', cat1Marks: 30, cat2Marks: 40, cat3Marks: 30, questionType: 'Objective', bloomTaxonomy: []
    };

    const handleSbaUpdate = (field: keyof SBAConfig, val: any) => {
      const classConfigs = settings.sbaConfigs?.[activeClass] || {};
      const updated = { ...settings.sbaConfigs, [activeClass]: { ...classConfigs, [selectedSbaSubject]: { ...sbaConfig, [field]: val } } };
      onSettingsChange({ ...settings, sbaConfigs: updated });
    };

    const toggleBloom = (item: string) => {
      const current = sbaConfig.bloomTaxonomy || [];
      const updated = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item];
      handleSbaUpdate('bloomTaxonomy', updated);
    };

    return (
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl animate-fadeIn space-y-10 border border-gray-100">
        <div className="bg-[#0f3460] p-10 rounded-[2.5rem] text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter">SBA Configuration Desk</h2>
            <div className="flex items-center gap-4 mt-2">
               <select className="bg-white/10 p-2 rounded-xl border-none font-black text-[10px] uppercase min-w-[200px]" value={selectedSbaSubject} onChange={e => setSelectedSbaSubject(e.target.value)}>
                 {getSubjectsForDepartment(department).map(s => <option key={s} className="text-black">{s}</option>)}
               </select>
               <span className="bg-[#cca43b] px-4 py-1 rounded-full text-[9px] font-black">Active Assessment Cycle</span>
            </div>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        </div>

        {settings.sbaMarksLocked && (
          <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex items-center gap-4">
             <span className="text-3xl">🔒</span>
             <div>
                <h4 className="text-sm font-black text-red-900 uppercase">Weightings Locked by Administration</h4>
                <p className="text-[10px] font-bold text-red-700/60 uppercase">Marks allocation cannot be modified at the Subject Level currently.</p>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {[
             { id: 1, label: 'CAT 1 (INDIVIDUAL)', date: sbaConfig.cat1Date, field: 'cat1Date', marks: sbaConfig.cat1Marks, marksField: 'cat1Marks' },
             { id: 2, label: 'CAT 2 (GROUP WORK)', date: sbaConfig.cat2Date, field: 'cat2Date', marks: sbaConfig.cat2Marks, marksField: 'cat2Marks' },
             { id: 3, label: 'CAT 3 (INDIVIDUAL)', date: sbaConfig.cat3Date, field: 'cat3Date', marks: sbaConfig.cat3Marks, marksField: 'cat3Marks' }
           ].map(cat => (
             <div key={cat.id} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-6">
                <h4 className="text-xs font-black text-[#0f3460] uppercase tracking-widest">{cat.label}</h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400">Execution Date</label>
                    <input type="date" className="w-full p-3 rounded-xl bg-white border-none font-bold" value={cat.date} onChange={e => handleSbaUpdate(cat.field as any, e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400">Marks Allocation</label>
                    <input 
                      type="number" 
                      disabled={settings.sbaMarksLocked}
                      className={`w-full p-3 rounded-xl bg-white border-none font-bold ${settings.sbaMarksLocked ? 'opacity-50 cursor-not-allowed text-gray-400' : ''}`} 
                      value={cat.marks} 
                      onChange={e => handleSbaUpdate(cat.marksField as any, parseInt(e.target.value))} 
                    />
                  </div>
                </div>
             </div>
           ))}
        </div>

        <div className="bg-blue-50 p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <h4 className="text-xs font-black text-blue-900 uppercase">Bloom's Taxonomy Balance</h4>
              <div className="flex flex-wrap gap-2">
                 {BLOOM_TAXONOMY.map(b => (
                   <button 
                     key={b} 
                     onClick={() => toggleBloom(b)}
                     className={`px-3 py-1 rounded-full text-[9px] font-black border transition-all ${sbaConfig.bloomTaxonomy?.includes(b) ? 'bg-[#0f3460] text-white border-[#0f3460] shadow-md' : 'bg-white text-blue-800 border-blue-100'}`}
                   >
                     {b}
                   </button>
                 ))}
              </div>
           </div>
           <div className="space-y-4">
              <h4 className="text-xs font-black text-blue-900 uppercase">Paper Standards</h4>
              <select className="w-full p-4 rounded-xl bg-white border-none font-black text-xs" value={sbaConfig.questionType} onChange={e => handleSbaUpdate('questionType', e.target.value)}>
                <option>Objective & Multiple Choice</option>
                <option>Short Answers & Data Analysis</option>
                <option>Long Essay & Critical Thinking</option>
                <option>Practical Project & Lab Work</option>
                <option>Combination</option>
              </select>
           </div>
        </div>

        <div className="flex justify-end gap-4">
           <button onClick={() => notify("SBA Cycle Confirmed", "success")} className="bg-[#2e8b57] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-xl tracking-widest">Confirm Assessment Plan</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 animate-fadeIn">
       <div className="text-center py-20 text-gray-300 font-black uppercase italic">Module Placeholder for {module}</div>
    </div>
  );
};

export default GenericModule;
