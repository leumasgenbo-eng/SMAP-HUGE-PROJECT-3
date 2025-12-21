
import React, { useState } from 'react';
import { GlobalSettings, ExamTimeTableSlot } from '../types';
import { EXAM_VENUES, getSubjectsForDepartment } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  activeClass: string;
  department: string;
  notify: any;
}

const ExaminationTimeTable: React.FC<Props> = ({ settings, onSettingsChange, activeClass, department, notify }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'manage'>('schedule');
  const classExamTable = settings.examTimeTables[activeClass] || [];
  const subjectList = getSubjectsForDepartment(department);

  // Fixed: Added missing properties id and isBreak to satisfy ExamTimeTableSlot interface
  const handleAddSlot = () => {
    const newSlot: ExamTimeTableSlot = {
      id: crypto.randomUUID(),
      date: '', 
      time: '', 
      subject: subjectList[0], 
      venue: EXAM_VENUES[0], 
      duration: '2 hours',
      isBreak: false
    };
    const updated = { ...settings.examTimeTables, [activeClass]: [...classExamTable, newSlot] };
    onSettingsChange({ ...settings, examTimeTables: updated });
  };

  const handleUpdateSlot = (idx: number, field: keyof ExamTimeTableSlot, val: any) => {
    const updatedTable = [...classExamTable];
    updatedTable[idx] = { ...updatedTable[idx], [field]: val };
    
    // Check Max 3 papers rule
    const dateCount = updatedTable.filter(s => s.date === updatedTable[idx].date && !s.isBreak).length;
    if (dateCount > 3) {
      notify("Warning: Maximum of 3 papers per day allowed.", "error");
    }

    onSettingsChange({ ...settings, examTimeTables: { ...settings.examTimeTables, [activeClass]: updatedTable } });
  };

  const handleSharePDF = () => {
    alert(`Generating Examination Time Table PDF for ${activeClass}...`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f3460] p-8 rounded-[3rem] text-white flex justify-between items-center shadow-2xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Exam Scheduling Desk</h2>
          <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1 italic">
            Individual Schedule for {activeClass} • Max 3 Papers/Day
          </p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">Share PDF</button>
           <button onClick={handleAddSlot} className="bg-white text-[#0f3460] px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">+ Add Exam Slot</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-[10px] border-collapse">
          <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
            <tr>
              <th className="p-4 border-b text-left">Date</th>
              <th className="p-4 border-b text-left">Time</th>
              <th className="p-4 border-b text-left">Subject / Paper</th>
              <th className="p-4 border-b text-left">Venue</th>
              <th className="p-4 border-b text-left">Duration</th>
              <th className="p-4 border-b text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {classExamTable.length === 0 ? (
              <tr><td colSpan={6} className="p-20 text-center text-gray-300 italic font-bold">No exam slots defined for this class yet.</td></tr>
            ) : classExamTable.map((slot, idx) => (
              <tr key={slot.id} className="border-b hover:bg-yellow-50/30 transition">
                <td className="p-4"><input type="date" value={slot.date} onChange={e => handleUpdateSlot(idx, 'date', e.target.value)} className="bg-transparent border-b border-gray-200" /></td>
                <td className="p-4"><input type="time" value={slot.time} onChange={e => handleUpdateSlot(idx, 'time', e.target.value)} className="bg-transparent border-b border-gray-200" /></td>
                <td className="p-4">
                  <select value={slot.subject} onChange={e => handleUpdateSlot(idx, 'subject', e.target.value)} className="bg-transparent border-b border-gray-200 w-full font-black">
                    {subjectList.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-4">
                   <select value={slot.venue} onChange={e => handleUpdateSlot(idx, 'venue', e.target.value)} className="bg-transparent border-b border-gray-200 w-full font-bold">
                    {EXAM_VENUES.map(v => <option key={v}>{v}</option>)}
                   </select>
                </td>
                <td className="p-4"><input value={slot.duration} onChange={e => handleUpdateSlot(idx, 'duration', e.target.value)} className="bg-transparent border-b border-gray-200" /></td>
                <td className="p-4 text-center">
                  <button onClick={() => onSettingsChange({...settings, examTimeTables: {...settings.examTimeTables, [activeClass]: classExamTable.filter((_, i) => i !== idx)}})} className="text-red-400 font-black">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExaminationTimeTable;
