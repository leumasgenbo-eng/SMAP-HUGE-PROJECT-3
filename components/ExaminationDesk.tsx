
import React, { useState, useMemo } from 'react';
import { GlobalSettings, ExamTimeTableSlot, InvigilatorEntry, Student } from '../types';
import { BASIC_ROOMS, getSubjectsForDepartment } from '../constants';
import ScoreEntry from './ScoreEntry';
import MasterSheet from './MasterSheet';
import { processStudentData } from '../utils';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  department: string;
  activeClass: string;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  onSave: () => void;
  subjectList: string[];
  notify: any;
}

const ExaminationDesk: React.FC<Props> = ({ settings, onSettingsChange, department, activeClass, students, onStudentsUpdate, onSave, subjectList, notify }) => {
  const [activeSubTab, setActiveSubTab] = useState<'timetable' | 'invigilators' | 'hub' | 'mastersheet' | 'management'>('timetable');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const subjects = getSubjectsForDepartment(department);

  const pupils = useMemo(() => processStudentData(students, settings, subjectList), [students, settings, subjectList]);

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

  const manageList = (listKey: keyof GlobalSettings['popoutLists'], item: string, action: 'add' | 'remove') => {
    const updatedLists = { ...settings.popoutLists };
    const currentList = updatedLists[listKey] as string[];

    if (action === 'add') {
      if (!item.trim()) return;
      (updatedLists as any)[listKey] = [...currentList, item.trim()];
      setNewItemTexts(prev => ({ ...prev, [listKey]: '' }));
      notify(`Added to ${listKey.replace(/([A-Z])/g, ' $1')}`, "success");
    } else {
      (updatedLists as any)[listKey] = currentList.filter(i => i !== item);
      notify(`Removed from ${listKey.replace(/([A-Z])/g, ' $1')}`, "info");
    }

    onSettingsChange({ ...settings, popoutLists: updatedLists });
  };

  const shareInvitation = (inv: InvigilatorEntry) => {
    const msg = `Dear ${inv.facilitatorName || 'Facilitator'}, you are invited to invigilate ${inv.subject} as ${inv.role} at ${inv.venue} on ${inv.date} @ ${inv.time}.`;
    navigator.clipboard.writeText(msg);
    notify("Invitation Message Copied!", "success");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Branding Header */}
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

      <div className="bg-[#0f3460] p-8 rounded-[3rem] text-white shadow-2xl flex justify-between items-center no-print">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Examination Desk</h2>
          <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">{department} • {activeClass}</p>
        </div>
        <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl">
          <button onClick={() => setActiveSubTab('timetable')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'timetable' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/60'}`}>Exams Time Table</button>
          <button onClick={() => setActiveSubTab('invigilators')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'invigilators' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/60'}`}>Invigilators</button>
          <button onClick={() => setActiveSubTab('hub')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'hub' ? 'bg-[#2e8b57] text-white shadow-lg' : 'text-white/60'}`}>Result Entry Hub</button>
          <button onClick={() => setActiveSubTab('mastersheet')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'mastersheet' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/60'}`}>Master Broad Sheet</button>
          <button onClick={() => setActiveSubTab('management')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'management' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/60'}`}>Settings</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 min-h-[500px]">
        {activeSubTab === 'timetable' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b pb-4 no-print">
              <h3 className="text-xl font-black text-[#0f3460] uppercase">Class Examination Schedule</h3>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="bg-[#2e8b57] text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">Print Schedule</button>
                <button onClick={handleAddSlot} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">+ Add Exam Slot</button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f4f6f7] text-[#0f3460] uppercase font-black text-[10px]">
                  <tr>
                    <th className="p-5">Date</th>
                    <th className="p-5">Time</th>
                    <th className="p-5">Subject</th>
                    <th className="p-5">Venue</th>
                    <th className="p-5">Duration</th>
                    <th className="p-5">Break?</th>
                    <th className="p-5 text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(settings.examTimeTables[activeClass] || []).map((slot, idx) => (
                    <tr key={slot.id} className={`border-b ${slot.isBreak ? 'bg-blue-50/50' : 'bg-white'}`}>
                      <td className="p-4"><input type="date" className="bg-transparent" value={slot.date} onChange={e => {
                        const tbl = [...settings.examTimeTables[activeClass]];
                        tbl[idx].date = e.target.value;
                        onSettingsChange({...settings, examTimeTables: {...settings.examTimeTables, [activeClass]: tbl}});
                      }} /></td>
                      <td className="p-4"><input type="time" className="bg-transparent" value={slot.time} onChange={e => {
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
                        <select className="bg-transparent" value={slot.venue} onChange={e => {
                          const tbl = [...settings.examTimeTables[activeClass]];
                          tbl[idx].venue = e.target.value;
                          onSettingsChange({...settings, examTimeTables: {...settings.examTimeTables, [activeClass]: tbl}});
                        }}>
                          {BASIC_ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="p-4"><input className="bg-transparent w-20" value={slot.duration} onChange={e => {
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
                        }} className="text-red-500">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'invigilators' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black text-[#0f3460] uppercase">Invigilator Deployment</h3>
              <button onClick={handleAddInvigilator} className="bg-[#cca43b] text-[#0f3460] px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">+ New Entry</button>
            </div>
            <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
               <table className="w-full text-xs text-left">
                  <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-5">Date</th>
                      <th className="p-5">Name</th>
                      <th className="p-5">Role</th>
                      <th className="p-5">Subject</th>
                      <th className="p-5">Venue</th>
                      <th className="p-5 text-center no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.invigilators.map((inv, idx) => (
                      <tr key={inv.id} className="border-b hover:bg-gray-50">
                        <td className="p-4"><input type="date" value={inv.date} onChange={e => {
                          const list = [...settings.invigilators];
                          list[idx].date = e.target.value;
                          onSettingsChange({...settings, invigilators: list});
                        }} /></td>
                        <td className="p-4">
                          <select 
                            value={inv.facilitatorName} 
                            className="bg-transparent border-b w-full font-black uppercase"
                            onChange={e => {
                              const list = [...settings.invigilators];
                              list[idx].facilitatorName = e.target.value;
                              onSettingsChange({...settings, invigilators: list});
                            }}
                          >
                            <option value="">-- Choose --</option>
                            {settings.staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                        </td>
                        <td className="p-4">
                          <select className="bg-transparent" value={inv.role} onChange={e => {
                             const list = [...settings.invigilators];
                             list[idx].role = e.target.value;
                             onSettingsChange({...settings, invigilators: list});
                          }}>
                            <option>Chief Invigilator</option><option>Invigilator</option><option>Assistant</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <select className="bg-transparent font-bold" value={inv.subject} onChange={e => {
                             const list = [...settings.invigilators];
                             list[idx].subject = e.target.value;
                             onSettingsChange({...settings, invigilators: list});
                          }}>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-4">
                          <select className="bg-transparent" value={inv.venue} onChange={e => {
                             const list = [...settings.invigilators];
                             list[idx].venue = e.target.value;
                             onSettingsChange({...settings, invigilators: list});
                          }}>
                            {BASIC_ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="p-4 text-center no-print">
                          <button onClick={() => shareInvitation(inv)} className="text-blue-500 font-black text-[10px] uppercase">Invite</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeSubTab === 'hub' && (
          <ScoreEntry 
            students={students} 
            onUpdate={onStudentsUpdate} 
            onSave={onSave} 
            settings={settings} 
            onSettingsChange={onSettingsChange} 
            subjectList={subjectList} 
            department={department} 
            activeClass={activeClass} 
            notify={notify}
          />
        )}

        {activeSubTab === 'mastersheet' && (
          <div className="animate-fadeIn">
            <MasterSheet 
              pupils={pupils} 
              settings={settings} 
              onSettingsChange={onSettingsChange} 
              subjectList={subjectList} 
              department={department} 
              activeClass={activeClass} 
            />
          </div>
        )}

        {activeSubTab === 'management' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[
                { key: 'facilitatorRemarks', label: 'Facilitator Remarks', desc: 'Pre-set comments for score ledger' },
                { key: 'observationNotes', label: 'Observation Notes', desc: 'Presets for behavioral assessment' },
                { key: 'generalRemarks', label: 'General Remarks', desc: 'Report card terminal feedback' }
              ].map(list => (
                <div key={list.key} className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 flex flex-col h-[400px]">
                   <h4 className="font-black text-[#0f3460] uppercase text-sm mb-4">{list.label}</h4>
                   <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2">
                      {(settings.popoutLists[list.key as keyof GlobalSettings['popoutLists']] as string[] || []).map((item, i) => (
                         <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between group">
                            <span className="text-[10px] font-bold text-gray-500 uppercase italic">{item}</span>
                            <button onClick={() => manageList(list.key as any, item, 'remove')} className="text-red-300 opacity-0 group-hover:opacity-100">✕</button>
                         </div>
                      ))}
                   </div>
                   <div className="space-y-3 pt-4 border-t">
                      <textarea 
                         className="w-full p-4 bg-white rounded-2xl text-[10px] font-bold shadow-inner resize-none h-20 outline-none"
                         placeholder="Type new..."
                         value={newItemTexts[list.key] || ''}
                         onChange={e => setNewItemTexts({ ...newItemTexts, [list.key]: e.target.value })}
                      />
                      <button onClick={() => manageList(list.key as any, newItemTexts[list.key], 'add')} className="w-full bg-[#0f3460] text-white py-3 rounded-xl font-black uppercase text-[10px]">Add to List</button>
                   </div>
                </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default ExaminationDesk;
