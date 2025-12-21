
import React, { useState } from 'react';
import { GlobalSettings, ExamTimeTableSlot, InvigilatorEntry } from '../types';
import { BASIC_ROOMS, getSubjectsForDepartment } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  department: string;
  activeClass: string;
  notify: any;
}

const ExaminationDesk: React.FC<Props> = ({ settings, onSettingsChange, department, activeClass, notify }) => {
  const [activeSubTab, setActiveSubTab] = useState<'timetable' | 'invigilators'>('timetable');
  const subjects = getSubjectsForDepartment(department);

  const handleAddSlot = () => {
    const newSlot: ExamTimeTableSlot = {
      id: crypto.randomUUID(),
      date: '',
      time: '08:00',
      subject: subjects[0],
      venue: BASIC_ROOMS[0],
      duration: '2 Hours',
      isBreak: false
    };
    const currentTable = settings.examTimeTables[activeClass] || [];
    if (currentTable.filter(s => !s.isBreak && s.date === '').length >= 3) {
      notify("Warning: Max 3 papers per day rule. Please select dates.", "info");
    }
    const updated = { ...settings.examTimeTables, [activeClass]: [...currentTable, newSlot] };
    onSettingsChange({ ...settings, examTimeTables: updated });
  };

  const handleAddInvigilator = () => {
    const defaultStaff = settings.staff && settings.staff.length > 0 ? settings.staff[0].name : 'Unassigned';
    const newInv: InvigilatorEntry = {
      id: crypto.randomUUID(),
      date: '',
      time: '08:00',
      facilitatorName: defaultStaff,
      role: 'Invigilator',
      subject: subjects[0],
      venue: BASIC_ROOMS[0],
      confirmed: false
    };
    onSettingsChange({ ...settings, invigilators: [...settings.invigilators, newInv] });
  };

  const shareInvitation = (inv: InvigilatorEntry) => {
    const msg = `Dear ${inv.facilitatorName || 'Facilitator'}, you are invited to invigilate ${inv.subject} as ${inv.role} at ${inv.venue} on ${inv.date} @ ${inv.time}. Click here to confirm: [CONFIRM_LINK]`;
    navigator.clipboard.writeText(msg);
    notify("Invitation Message Copied to Clipboard!", "success");
  };

  const confirmInvigilation = (id: string) => {
    const updated = settings.invigilators.map(i => i.id === id ? { ...i, confirmed: true } : i);
    onSettingsChange({ ...settings, invigilators: updated });
    notify("Invigilation Confirmed!", "success");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f3460] p-8 rounded-[3rem] text-white shadow-2xl flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Examination Management Desk</h2>
          <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">United Baylor Academy • {department} • {activeClass}</p>
        </div>
        <div className="flex gap-2 bg-white/10 p-1 rounded-2xl">
          <button onClick={() => setActiveSubTab('timetable')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'timetable' ? 'bg-[#cca43b] text-[#0f3460]' : ''}`}>Time Table</button>
          <button onClick={() => setActiveSubTab('invigilators')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'invigilators' ? 'bg-[#cca43b] text-[#0f3460]' : ''}`}>Invigilators</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 min-h-[500px]">
        {activeSubTab === 'timetable' ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b pb-4 no-print">
              <h3 className="text-xl font-black text-[#0f3460] uppercase">Class Examination Schedule</h3>
              <div className="flex gap-3">
                <button onClick={handlePrint} className="bg-[#2e8b57] text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">Print Schedule</button>
                <button onClick={handleAddSlot} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">+ Add Exam Slot</button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50/30">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f4f6f7] text-[#0f3460] uppercase font-black text-[10px]">
                  <tr>
                    <th className="p-5">Date</th>
                    <th className="p-5">Time</th>
                    <th className="p-5">Subject / Paper</th>
                    <th className="p-5">Venue</th>
                    <th className="p-5">Duration</th>
                    <th className="p-5">Break?</th>
                    <th className="p-5 text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(settings.examTimeTables[activeClass] || []).map((slot, idx) => (
                    <tr key={slot.id} className={`border-b border-gray-50 ${slot.isBreak ? 'bg-blue-50/50' : 'bg-white'} hover:bg-yellow-50 transition`}>
                      <td className="p-4"><input type="date" className="bg-transparent border-b border-gray-200" value={slot.date} onChange={e => {
                        const tbl = [...settings.examTimeTables[activeClass]];
                        tbl[idx].date = e.target.value;
                        onSettingsChange({...settings, examTimeTables: {...settings.examTimeTables, [activeClass]: tbl}});
                      }} /></td>
                      <td className="p-4"><input type="time" className="bg-transparent border-b border-gray-200" value={slot.time} onChange={e => {
                        const tbl = [...settings.examTimeTables[activeClass]];
                        tbl[idx].time = e.target.value;
                        onSettingsChange({...settings, examTimeTables: {...settings.examTimeTables, [activeClass]: tbl}});
                      }} /></td>
                      <td className="p-4">
                        <select className="w-full bg-transparent font-bold" value={slot.subject} onChange={e => {
                          const tbl = [...settings.examTimeTables[activeClass]];
                          tbl[idx].subject = e.target.value;
                          onSettingsChange({...settings, examTimeTables: {...settings.examTimeTables, [activeClass]: tbl}});
                        }}>
                          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-4">
                        <select className="bg-transparent border-b border-gray-200" value={slot.venue} onChange={e => {
                          const tbl = [...settings.examTimeTables[activeClass]];
                          tbl[idx].venue = e.target.value;
                          onSettingsChange({...settings, examTimeTables: {...settings.examTimeTables, [activeClass]: tbl}});
                        }}>
                          {BASIC_ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="p-4"><input className="bg-transparent border-b border-gray-200 w-20" value={slot.duration} onChange={e => {
                         const tbl = [...settings.examTimeTables[activeClass]];
                         tbl[idx].duration = e.target.value;
                         onSettingsChange({...settings, examTimeTables: {...settings.examTimeTables, [activeClass]: tbl}});
                      }} /></td>
                      <td className="p-4 text-center"><input type="checkbox" checked={slot.isBreak} onChange={e => {
                        const tbl = [...settings.examTimeTables[activeClass]];
                        tbl[idx].isBreak = e.target.checked;
                        onSettingsChange({...settings, examTimeTables: {...settings.examTimeTables, [activeClass]: tbl}});
                      }} /></td>
                      <td className="p-4 text-center no-print">
                        <button onClick={() => {
                          const tbl = settings.examTimeTables[activeClass].filter(s => s.id !== slot.id);
                          onSettingsChange({...settings, examTimeTables: {...settings.examTimeTables, [activeClass]: tbl}});
                        }} className="text-red-500 font-black">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-blue-50 text-[10px] text-blue-800 font-bold italic no-print">
                Rule: Facilitators do not invigilate their own subject. Clash avoidance active based on Date/Time/Venue.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b pb-4 no-print">
              <h3 className="text-xl font-black text-[#0f3460] uppercase">Invigilators Deployment List</h3>
              <button onClick={handleAddInvigilator} className="bg-[#cca43b] text-[#0f3460] px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">+ New Assignment</button>
            </div>
            
            <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
               <table className="w-full text-xs text-left">
                  <thead className="bg-[#f4f6f7] text-[#0f3460] uppercase font-black text-[10px]">
                    <tr>
                      <th className="p-5">Date</th>
                      <th className="p-5">Time</th>
                      <th className="p-5">Name of Facilitator</th>
                      <th className="p-5">Role</th>
                      <th className="p-5">Subject Paper</th>
                      <th className="p-5">Venue</th>
                      <th className="p-5">Confirmation Status</th>
                      <th className="p-5 text-center no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.invigilators.map((inv, idx) => (
                      <tr key={inv.id} className={`border-b transition ${inv.confirmed ? 'bg-green-100' : 'bg-white hover:bg-yellow-50'}`}>
                        <td className="p-4"><input type="date" className="bg-transparent" value={inv.date} onChange={e => {
                          const injs = [...settings.invigilators];
                          injs[idx].date = e.target.value;
                          onSettingsChange({...settings, invigilators: injs});
                        }} /></td>
                        <td className="p-4"><input type="time" className="bg-transparent" value={inv.time} onChange={e => {
                           const injs = [...settings.invigilators];
                           injs[idx].time = e.target.value;
                           onSettingsChange({...settings, invigilators: injs});
                        }} /></td>
                        <td className="p-4">
                          <select 
                            value={inv.facilitatorName} 
                            className="bg-transparent border-b w-full font-black uppercase outline-none"
                            onChange={e => {
                              const injs = [...settings.invigilators];
                              injs[idx].facilitatorName = e.target.value;
                              onSettingsChange({...settings, invigilators: injs});
                            }}
                          >
                            <option value="">-- Select Staff --</option>
                            {settings.staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                        </td>
                        <td className="p-4">
                          <select className="bg-transparent" value={inv.role} onChange={e => {
                             const injs = [...settings.invigilators];
                             injs[idx].role = e.target.value as any;
                             onSettingsChange({...settings, invigilators: injs});
                          }}>
                            <option>Chief Invigilator</option>
                            <option>Invigilator</option>
                            <option>Officer</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <select className="bg-transparent font-bold" value={inv.subject} onChange={e => {
                             const injs = [...settings.invigilators];
                             injs[idx].subject = e.target.value;
                             onSettingsChange({...settings, invigilators: injs});
                          }}>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-4">
                          <select className="bg-transparent" value={inv.venue} onChange={e => {
                             const injs = [...settings.invigilators];
                             injs[idx].venue = e.target.value;
                             onSettingsChange({...settings, invigilators: injs});
                          }}>
                            {BASIC_ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="p-4 text-center">
                          {inv.confirmed ? (
                            <span className="text-green-700 font-black uppercase text-[10px]">Confirmed ✓</span>
                          ) : (
                            <button onClick={() => confirmInvigilation(inv.id)} className="bg-orange-500 text-white px-3 py-1 rounded-lg font-black text-[9px] no-print">Confirm Manually</button>
                          )}
                        </td>
                        <td className="p-4 text-center no-print">
                          <button onClick={() => shareInvitation(inv)} className="text-blue-500 font-black uppercase text-[9px] hover:underline">Share Invitation</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExaminationDesk;
