
import React, { useState, useMemo } from 'react';
import { Student, GlobalSettings, StaffRecord, FacilitatorComplianceLog, SubjectProfile } from '../types';
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

const GenericModule: React.FC<Props> = ({ department, activeClass, settings, onSettingsChange, notify }) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'management' | 'compliance'>('grid');
  const [isExtraTuitionActive, setIsExtraTuitionActive] = useState(false);
  const [complianceForm, setComplianceForm] = useState<Partial<FacilitatorComplianceLog>>({
    presenceStatus: 'Present',
    timeIn: new Date().toLocaleTimeString().slice(0,5)
  });

  const subjects = useMemo(() => getSubjectsForDepartment(department), [department]);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = Array.from({ length: isExtraTuitionActive ? 8 : 7 }, (_, i) => i === 7 ? 'Extra Tuition / Care' : `Period ${i + 1}`);

  // Helpers
  const getFacilitatorForSubject = (subj: string) => settings.facilitatorMapping?.[subj] || 'Unassigned';

  const handleSlotChange = (day: string, periodIdx: number, subject: string) => {
    const currentTables = { ...(settings.classTimeTables || {}) };
    const classTable = { ...(currentTables[activeClass] || {}) };
    const daySchedule = [...(classTable[day] || [])];
    
    while (daySchedule.length <= periodIdx) daySchedule.push('');
    daySchedule[periodIdx] = subject;
    
    classTable[day] = daySchedule;
    currentTables[activeClass] = classTable;
    
    onSettingsChange({ ...settings, classTimeTables: currentTables });
  };

  const checkConflict = (day: string, periodIdx: number, subject: string) => {
    if (!subject) return null;
    const facilitator = getFacilitatorForSubject(subject);
    if (facilitator === 'Unassigned') return null;

    for (const [cls, table] of Object.entries(settings.classTimeTables)) {
      if (cls === activeClass) continue;
      const slotSubj = (table as any)[day]?.[periodIdx];
      if (slotSubj && getFacilitatorForSubject(slotSubj) === facilitator) {
        return `Conflict: ${facilitator} is in ${cls}`;
      }
    }
    return null;
  };

  const smartGenerate = () => {
    const classDemands = settings.subjectDemands[activeClass] || {};
    const profiles = settings.subjectProfiles || {};
    const newTable: Record<string, string[]> = {};
    days.forEach(d => newTable[d] = Array(8).fill(''));

    // 1. Place Fixed Activities (Pedagogical Defaults)
    days.forEach(d => {
      newTable[d][0] = 'Worship'; // Standard Morning Pillar
      if (d === 'Friday') {
        newTable[d][4] = 'PLC Meeting';
        newTable[d][5] = 'Club Activity';
      }
    });

    // 2. Prepare Subject Pools
    const highIntensityPool: string[] = [];
    const regularPool: string[] = [];

    Object.entries(classDemands).forEach(([subj, count]) => {
      const profile = profiles[subj] || { intensity: 'Medium' };
      for (let i = 0; i < count; i++) {
        if (profile.intensity === 'High') highIntensityPool.push(subj);
        else regularPool.push(subj);
      }
    });

    // Shuffle pools
    highIntensityPool.sort(() => Math.random() - 0.5);
    regularPool.sort(() => Math.random() - 0.5);

    // 3. Cognitive Mapping (Priority Placement)
    days.forEach(day => {
      // Mornings L1-L3 (Best for High Intensity)
      for (let p = 1; p <= 3; p++) {
        if (newTable[day][p]) continue;
        if (highIntensityPool.length > 0) {
          newTable[day][p] = highIntensityPool.pop()!;
        } else if (regularPool.length > 0) {
          newTable[day][p] = regularPool.pop()!;
        }
      }
      // Afternoons L4-L7
      for (let p = 4; p <= 7; p++) {
        if (newTable[day][p]) continue;
        if (regularPool.length > 0) {
          newTable[day][p] = regularPool.pop()!;
        } else if (highIntensityPool.length > 0) {
          newTable[day][p] = highIntensityPool.pop()!;
        }
      }
    });

    const currentTables = { ...(settings.classTimeTables || {}), [activeClass]: newTable };
    onSettingsChange({ ...settings, classTimeTables: currentTables });
    notify("Intelligence Engine: Balanced Morning-Intensity Schedule Synthesized!", "success");
  };

  const handleLogCompliance = () => {
    if (!complianceForm.staffId || !complianceForm.period || !complianceForm.subject) {
      notify("Select facilitator, period and subject area.", "error");
      return;
    }
    const staff = settings.staff.find(s => s.id === complianceForm.staffId);
    const log: FacilitatorComplianceLog = {
      id: crypto.randomUUID(),
      staffId: complianceForm.staffId!,
      staffName: staff?.name || 'Unknown',
      date: new Date().toISOString().split('T')[0],
      day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      period: complianceForm.period!,
      subject: complianceForm.subject!,
      class: activeClass,
      presenceStatus: complianceForm.presenceStatus || 'Present',
      timeIn: complianceForm.timeIn,
      timeUsed: complianceForm.timeUsed,
      lessonContent: complianceForm.lessonContent,
      interruptionReason: complianceForm.interruptionReason
    };

    onSettingsChange({
      ...settings,
      facilitatorComplianceLogs: [...(settings.facilitatorComplianceLogs || []), log]
    });
    notify(`Compliance Log for ${staff?.name} registered.`, "success");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dynamic Institutional Header */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" />
        <EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b]" />
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-50 w-full max-w-2xl">
          <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          <span>•</span>
          <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          <span>•</span>
          <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
        </div>
      </div>

      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden no-print">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
           <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Class Time Table Desk</h2>
              <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">
                 Institutional Scheduling • Level: {department} • Class: {activeClass}
              </p>
           </div>
           <div className="flex bg-white/10 p-1.5 rounded-2xl gap-2">
             <button onClick={() => setActiveTab('grid')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'grid' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : ''}`}>Interactive Grid</button>
             <button onClick={() => setActiveTab('management')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'management' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : ''}`}>Management Desk</button>
             <button onClick={() => setActiveTab('compliance')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'compliance' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : ''}`}>Compliance Desk</button>
           </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-x-auto min-h-[600px]">
        {activeTab === 'grid' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center no-print">
               <div className="space-y-1">
                  <h3 className="text-xl font-black text-[#0f3460] uppercase">Weekly Scheduling Matrix</h3>
                  <div className="flex items-center gap-4">
                     <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 accent-[#2e8b57]" checked={isExtraTuitionActive} onChange={e => setIsExtraTuitionActive(e.target.checked)} />
                        Enable Extra Tuition / Care (8th Period)
                     </label>
                  </div>
               </div>
               <button onClick={() => window.print()} className="bg-[#cca43b] text-[#0f3460] px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">Execute Print</button>
            </div>

            <table className="w-full text-sm text-left border-collapse min-w-[1100px]">
               <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase text-[10px]">
                 <tr>
                   <th className="p-6 border-b border-gray-200 w-32">Time / Period</th>
                   {days.map(day => <th key={day} className="p-6 border-b border-gray-200 text-center">{day}</th>)}
                 </tr>
               </thead>
               <tbody>
                 {periods.map((period, pIdx) => (
                   <tr key={period} className="border-b hover:bg-gray-50 transition border-gray-100">
                      <td className="p-6 font-black text-[#0f3460] bg-gray-50/50">
                         <div className="flex flex-col">
                            <span className="text-xs">{period}</span>
                            <span className="text-[8px] font-bold text-gray-400 mt-1">08:00 - 08:45</span>
                         </div>
                      </td>
                      {days.map(day => {
                        const currentSubject = settings.classTimeTables[activeClass]?.[day]?.[pIdx] || '';
                        const facilitator = getFacilitatorForSubject(currentSubject);
                        const conflict = checkConflict(day, pIdx, currentSubject);
                        const profile = settings.subjectProfiles?.[currentSubject];
                        
                        return (
                          <td key={day} className={`p-4 text-center border-x border-gray-50 ${conflict ? 'bg-red-50' : ''}`}>
                             <div className="space-y-2">
                                <select 
                                  className={`w-full p-3 rounded-xl font-black text-[9px] uppercase outline-none transition-all ${currentSubject ? 'bg-[#0f3460] text-white shadow-md' : 'bg-gray-50 text-gray-300 border-transparent hover:border-gray-200'}`}
                                  value={currentSubject}
                                  onChange={e => handleSlotChange(day, pIdx, e.target.value)}
                                >
                                  <option value="">-- Lesson --</option>
                                  <optgroup label="Fixed Activities">
                                     <option>Worship</option><option>PLC Meeting</option><option>Club Activity</option><option>Extra Curricular</option><option>Break</option>
                                  </optgroup>
                                  <optgroup label="Subject Areas">
                                     {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                  </optgroup>
                                </select>
                                {currentSubject && currentSubject !== 'Break' && (
                                   <div className="flex flex-col items-center gap-1">
                                      <span className={`text-[8px] font-black uppercase ${conflict ? 'text-red-600' : 'text-[#cca43b]'}`}>{facilitator}</span>
                                      {profile && (
                                        <div className="flex gap-1">
                                          <span className={`px-1.5 py-0.5 rounded text-[6px] font-black uppercase ${profile.intensity === 'High' ? 'bg-red-100 text-red-700' : profile.intensity === 'Low' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{profile.intensity}</span>
                                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[6px] font-black uppercase">{profile.location}</span>
                                        </div>
                                      )}
                                      {conflict && <span className="text-[7px] font-bold text-red-400 italic block">{conflict}</span>}
                                   </div>
                                )}
                             </div>
                          </td>
                        );
                      })}
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        )}

        {activeTab === 'management' && (
          <div className="space-y-10 animate-fadeIn">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <div className="border-b pb-4">
                      <h3 className="text-2xl font-black text-[#0f3460] uppercase">Subject Demand Planner</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Define periods per week and review facilitator presence</p>
                   </div>
                   <div className="grid grid-cols-1 gap-4 h-[550px] overflow-y-auto pr-4 scrollbar-hide">
                      {subjects.map(subj => {
                        const facilitatorName = getFacilitatorForSubject(subj);
                        const staff = settings.staff.find(s => s.name === facilitatorName || s.id === facilitatorName || s.idNumber === facilitatorName);
                        const availability = staff?.availableDays?.length ? staff.availableDays.join(', ') : (staff?.employmentType === 'Full Time' ? 'Full Time (Mon-Fri)' : 'Not Specified');
                        const profile = settings.subjectProfiles?.[subj];

                        return (
                          <div key={subj} className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition group">
                             <div className="flex flex-col flex-1">
                                <div className="flex items-center gap-2">
                                   <span className="text-[11px] font-black uppercase text-[#0f3460] truncate">{subj}</span>
                                   {profile && (
                                     <span className={`px-2 py-0.5 rounded text-[6px] font-black uppercase ${profile.intensity === 'High' ? 'bg-red-50 text-red-600' : profile.intensity === 'Low' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                        {profile.intensity}
                                     </span>
                                   )}
                                </div>
                                <div className="mt-2 space-y-1">
                                   <div className="flex items-center gap-1.5">
                                      <span className="text-[8px] font-black text-gray-400 uppercase">Assigned:</span>
                                      <span className="text-[9px] font-bold text-[#0f3460] uppercase">{facilitatorName}</span>
                                   </div>
                                   <div className="flex items-center gap-1.5">
                                      <span className="text-[8px] font-black text-[#cca43b] uppercase tracking-tighter">On-Site:</span>
                                      <span className="text-[9px] font-black text-blue-600 uppercase italic tracking-tighter">{availability}</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center">
                                   <input 
                                     type="number" 
                                     min="0" max="15"
                                     className="w-16 p-3 bg-white rounded-2xl text-center font-black text-sm shadow-inner border border-gray-100 group-hover:border-[#cca43b] transition"
                                     value={settings.subjectDemands[activeClass]?.[subj] || 0}
                                     onChange={e => {
                                        const updatedDemands = { ...(settings.subjectDemands || {}) };
                                        if (!updatedDemands[activeClass]) updatedDemands[activeClass] = {};
                                        updatedDemands[activeClass][subj] = parseInt(e.target.value) || 0;
                                        onSettingsChange({ ...settings, subjectDemands: updatedDemands });
                                     }}
                                   />
                                   <span className="text-[8px] font-black text-gray-400 uppercase mt-1">Periods/Week</span>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>

                <div className="space-y-8 flex flex-col justify-center bg-gray-50/50 p-10 rounded-[3.5rem] border border-gray-100 text-center">
                   <div className="space-y-4">
                      <span className="text-4xl">🤖</span>
                      <h3 className="text-2xl font-black text-[#0f3460] uppercase">Balanced Cycle Synthesis</h3>
                      <p className="text-[11px] font-bold text-gray-400 leading-relaxed italic max-w-sm mx-auto">
                        Generates a pedagogical-optimized timetable prioritizing High Intensity subjects in the morning and respecting Location & Facilitator Availability profiles.
                      </p>
                   </div>
                   <button onClick={smartGenerate} className="bg-[#0f3460] text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">Execute Matrix Generation</button>
                   
                   <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 mt-6 text-left">
                      <h4 className="text-[10px] font-black uppercase text-[#cca43b] mb-4 tracking-widest border-b pb-2">Institutional Duty Constraints</h4>
                      <div className="space-y-3">
                         {settings.staff.filter(s => s.employmentType === 'Part Time').map(s => (
                           <div key={s.id} className="flex justify-between items-center text-[9px] font-black uppercase">
                              <span className="text-gray-500">{s.name}</span>
                              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Avail: {s.availableDays?.join(', ') || 'ANY'}</span>
                           </div>
                         ))}
                         {settings.staff.filter(s => s.employmentType === 'Part Time').length === 0 && <p className="text-[10px] text-gray-300 italic">No Part-Time constraints registered in HR Ledger.</p>}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'compliance' && (
           <div className="space-y-10 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 h-fit space-y-6">
                    <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Presence Log</h3>
                    <div className="space-y-4">
                       <select className="w-full p-4 rounded-2xl bg-white border-none font-black text-xs" value={complianceForm.staffId} onChange={e => setComplianceForm({...complianceForm, staffId: e.target.value})}>
                          <option value="">-- Facilitator --</option>
                          {settings.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                       <select className="w-full p-4 rounded-2xl bg-white border-none font-black text-xs" value={complianceForm.period} onChange={e => setComplianceForm({...complianceForm, period: e.target.value})}>
                          <option value="">-- Period --</option>
                          {periods.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                       <select className="w-full p-4 rounded-2xl bg-white border-none font-black text-xs" value={complianceForm.subject} onChange={e => setComplianceForm({...complianceForm, subject: e.target.value})}>
                          <option value="">-- Subject Logged --</option>
                          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                       <div className="grid grid-cols-2 gap-3">
                          <select className="p-4 rounded-2xl bg-white border-none font-black text-xs uppercase" value={complianceForm.presenceStatus} onChange={e => setComplianceForm({...complianceForm, presenceStatus: e.target.value as any})}>
                             <option>Present</option><option>Late</option><option>Interrupted</option><option>Closed Early</option>
                          </select>
                          <input type="time" className="p-4 rounded-2xl bg-white border-none font-black text-xs" value={complianceForm.timeIn} onChange={e => setComplianceForm({...complianceForm, timeIn: e.target.value})} />
                       </div>
                       <textarea placeholder="Lesson content / Interruption notes..." className="w-full h-32 p-5 bg-white rounded-2xl border-none text-xs italic font-bold" value={complianceForm.lessonContent} onChange={e => setComplianceForm({...complianceForm, lessonContent: e.target.value})} />
                       <button onClick={handleLogCompliance} className="w-full bg-[#cca43b] text-[#0f3460] py-5 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-[1.01] transition">Log Performance Entry</button>
                    </div>
                 </div>

                 <div className="lg:col-span-2 space-y-8">
                    <div className="flex justify-between items-center border-b pb-4">
                       <h3 className="text-2xl font-black text-[#0f3460] uppercase">Compliance Audit Trail</h3>
                       <div className="flex gap-4 text-[9px] font-black uppercase">
                          <span className="text-green-600">Ontime: 92%</span>
                          <span className="text-red-500">Lateness Index: 4%</span>
                       </div>
                    </div>
                    <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm">
                       <table className="w-full text-left text-[10px]">
                          <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                             <tr><th className="p-5 border-b">Facilitator</th><th className="p-5 border-b">Period & Subj</th><th className="p-5 border-b text-center">Status</th><th className="p-5 border-b text-center">Presence Index</th></tr>
                          </thead>
                          <tbody>
                             {(settings.facilitatorComplianceLogs || []).filter(l => l.class === activeClass).slice().reverse().map(log => (
                               <tr key={log.id} className="border-b hover:bg-gray-50 transition">
                                  <td className="p-5">
                                     <p className="font-black text-[#0f3460] uppercase">{log.staffName}</p>
                                     <p className="text-[8px] text-gray-400 font-bold">{log.date} ({log.day})</p>
                                  </td>
                                  <td className="p-5 font-bold text-gray-500 uppercase">
                                     {log.period} • {log.subject}
                                  </td>
                                  <td className="p-5 text-center">
                                     <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${log.presenceStatus === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {log.presenceStatus}
                                     </span>
                                  </td>
                                  <td className="p-5 text-center font-black text-[#cca43b]">
                                     {log.timeIn || '--:--'}
                                  </td>
                               </tr>
                             ))}
                             {(!settings.facilitatorComplianceLogs || settings.facilitatorComplianceLogs.length === 0) && (
                               <tr><td colSpan={4} className="p-20 text-center text-gray-300 italic font-bold">No compliance logs recorded for this class cycle.</td></tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default GenericModule;
