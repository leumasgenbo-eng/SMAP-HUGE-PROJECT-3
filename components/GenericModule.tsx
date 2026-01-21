
import React, { useState, useMemo } from 'react';
import { Student, GlobalSettings, FacilitatorComplianceLog } from '../types';
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

  const handleLogCompliance = () => {
    if (!complianceForm.staffId || !complianceForm.period || !complianceForm.subject) {
      notify("Select facilitator and period.", "error");
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
    };
    onSettingsChange({ ...settings, facilitatorComplianceLogs: [...(settings.facilitatorComplianceLogs || []), log] });
    notify(`Log finalized.`, "success");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden no-print">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
           <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Class Schedule Desk</h2>
              <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">{activeClass} Roll</p>
           </div>
           <div className="flex bg-white/10 p-1.5 rounded-2xl gap-2">
             <button onClick={() => setActiveTab('grid')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'grid' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : ''}`}>Grid View</button>
             <button onClick={() => setActiveTab('management')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'management' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : ''}`}>Planner</button>
             <button onClick={() => setActiveTab('compliance')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'compliance' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : ''}`}>Compliance</button>
           </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-x-auto min-h-[600px]">
        {activeTab === 'grid' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center no-print">
               <h3 className="text-xl font-black text-[#0f3460] uppercase">Scheduling Matrix</h3>
               <button onClick={() => window.print()} className="bg-[#cca43b] text-[#0f3460] px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg transition">Print</button>
            </div>
            <table className="w-full text-sm text-left border-collapse min-w-[1100px]">
               <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase text-[10px]">
                 <tr>
                   <th className="p-6 border-b border-gray-200 w-32">Period</th>
                   {days.map(day => <th key={day} className="p-6 border-b border-gray-200 text-center">{day}</th>)}
                 </tr>
               </thead>
               <tbody>
                 {periods.map((period, pIdx) => (
                   <tr key={period} className="border-b hover:bg-gray-50 transition border-gray-100">
                      <td className="p-6 font-black text-[#0f3460] bg-gray-50/50 text-xs">{period}</td>
                      {days.map(day => {
                        const currentSubject = settings.classTimeTables[activeClass]?.[day]?.[pIdx] || '';
                        return (
                          <td key={day} className="p-4 text-center border-x border-gray-50">
                             <select className="w-full p-3 rounded-xl font-black text-[9px] uppercase outline-none" value={currentSubject} onChange={e => handleSlotChange(day, pIdx, e.target.value)}>
                               <option value="">-- Lesson --</option>
                               {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </td>
                        );
                      })}
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        )}
        {activeTab === 'compliance' && (
           <div className="space-y-10 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 h-fit space-y-6">
                    <h3 className="text-xl font-black text-[#0f3460] uppercase">Presence Log</h3>
                    <div className="space-y-4">
                       <select className="w-full p-4 rounded-2xl bg-white border-none font-black text-xs" value={complianceForm.staffId} onChange={e => setComplianceForm({...complianceForm, staffId: e.target.value})}>
                          <option value="">-- Facilitator --</option>
                          {settings.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                       <select className="w-full p-4 rounded-2xl bg-white border-none font-black text-xs" value={complianceForm.period} onChange={e => setComplianceForm({...complianceForm, period: e.target.value})}>
                          <option value="">-- Period --</option>
                          {periods.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                       <button onClick={handleLogCompliance} className="w-full bg-[#cca43b] text-[#0f3460] py-5 rounded-2xl font-black uppercase text-xs shadow-lg">Finalize Entry</button>
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
