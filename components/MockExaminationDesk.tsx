import React, { useState, useMemo } from 'react';
import { GlobalSettings, ExamTimeTableSlot, Student, Pupil, StaffRecord, GradingScaleEntry } from '../types';
import { BASIC_ROOMS, getSubjectsForDepartment } from '../constants';
import ScoreEntry from './ScoreEntry';
import MasterSheet from './MasterSheet';
import FacilitatorDashboard from './FacilitatorDashboard';
import { processStudentData, getNRTGrade } from '../utils';
import EditableField from './EditableField';
import UniversalReportHeader from './reports/UniversalReportHeader';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  activeClass: string;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  onSave: () => void;
  subjectList: string[];
  notify: any;
}

const MockExaminationDesk: React.FC<Props> = ({ settings, onSettingsChange, activeClass, students, onStudentsUpdate, onSave, subjectList, notify }) => {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'entry' | 'mastersheet' | 'timetable' | 'ratings' | 'reports'>('entry');
  const [selectedPupilId, setSelectedPupilId] = useState<string | null>(null);
  
  const timetableKey = `MOCK_${activeClass}_${settings.mockSeries}`;
  const mockExamTable = settings.examTimeTables[timetableKey] || [];

  const mockSeriesOptions = Array.from({ length: 10 }, (_, i) => `MOCK ${i + 1}`);

  const mockSettings = useMemo(() => ({
    ...settings,
    reportTitle: `${settings.mockSeries} BROAD SHEET`
  }), [settings]);

  const pupils = useMemo(() => processStudentData(students, mockSettings, subjectList), [students, mockSettings, subjectList]);

  const terminalConfig = settings.terminalConfigs[activeClass] || { sectionAMax: 30, sectionBMax: 70 };
  const scienceMax = settings.scienceThreshold || 140;

  const currentPupil = useMemo(() => {
    if (!selectedPupilId) return null;
    return pupils.find(p => {
      const s = students.find(st => st.id === selectedPupilId);
      return s && p.name === `${s.firstName} ${s.surname}`;
    });
  }, [selectedPupilId, pupils, students]);

  const handleAddSlot = () => {
    const newSlot: ExamTimeTableSlot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '10:00',
      time: '08:00 - 10:00',
      subject: subjectList[0] || 'English Language',
      venue: BASIC_ROOMS[0] || 'Hall A',
      duration: '2 Hours',
      isBreak: false,
      invigilatorName: ''
    };
    
    const existingCount = mockExamTable.filter(s => s.date === newSlot.date).length;
    if (existingCount >= 3) {
      notify("Alert: A maximum of three subjects can be scheduled per day.", "error");
      return;
    }

    const updated = { ...settings.examTimeTables, [timetableKey]: [...mockExamTable, newSlot] };
    onSettingsChange({ ...settings, examTimeTables: updated });
  };

  const updateSlot = (id: string, field: keyof ExamTimeTableSlot, val: any) => {
    if (field === 'date') {
      const existingCount = mockExamTable.filter(s => s.date === val && s.id !== id).length;
      if (existingCount >= 3) {
        notify("Validation Error: Three subjects already scheduled for this date.", "error");
        return;
      }
    }

    const updated = mockExamTable.map(s => {
      if (s.id === id) {
        const newSlot = { ...s, [field]: val };
        if (field === 'startTime' || field === 'endTime') {
          newSlot.time = `${newSlot.startTime} - ${newSlot.endTime}`;
        }
        return newSlot;
      }
      return s;
    });
    onSettingsChange({ ...settings, examTimeTables: { ...settings.examTimeTables, [timetableKey]: updated } });
  };

  const removeSlot = (id: string) => {
    const updated = mockExamTable.filter(s => s.id !== id);
    onSettingsChange({ ...settings, examTimeTables: { ...settings.examTimeTables, [timetableKey]: updated } });
  };

  const updateScaleRow = (index: number, field: keyof GradingScaleEntry, val: any) => {
    const updatedScale = [...settings.gradingScale];
    updatedScale[index] = { ...updatedScale[index], [field]: val };
    onSettingsChange({ ...settings, gradingScale: updatedScale });
  };

  const updateTerminalThreshold = (field: 'sectionAMax' | 'sectionBMax', val: string) => {
    const num = parseInt(val) || 0;
    const updatedConfigs = { ...settings.terminalConfigs };
    updatedConfigs[activeClass] = { ...terminalConfig, [field]: num };
    onSettingsChange({ ...settings, terminalConfigs: updatedConfigs });
  };

  const handleSharePDF = async (pupilName: string) => {
    const element = document.getElementById('mock-report-card');
    if (!element) return;
    try {
      // @ts-ignore
      const html2pdf = window.html2pdf;
      if (!html2pdf) return;
      const opt = {
        margin: 10,
        filename: `${pupilName.replace(/\s+/g, '_')}_${settings.mockSeries}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-[#cca43b] p-8 rounded-[2rem] text-[#0f3460] shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <div className="bg-[#0f3460] text-white p-4 rounded-3xl shadow-inner">
             <p className="text-[9px] font-black uppercase opacity-60">BECE Desk</p>
             <h3 className="text-xl font-black uppercase tracking-tighter">BASIC 9</h3>
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">BECE Mock Desk</h2>
            <p className="text-[10px] font-bold mt-1 opacity-80 uppercase tracking-widest">Active Series: {settings.mockSeries}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-white/30 p-1.5 rounded-2xl">
          <button onClick={() => setActiveSubTab('config')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'config' ? 'bg-[#0f3460] text-white shadow-lg' : 'hover:bg-white/20'}`}>Configuration</button>
          <button onClick={() => setActiveSubTab('entry')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'entry' ? 'bg-[#0f3460] text-white shadow-lg' : 'hover:bg-white/20'}`}>Score Entry</button>
          <button onClick={() => setActiveSubTab('mastersheet')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'mastersheet' ? 'bg-[#0f3460] text-white shadow-lg' : 'hover:bg-white/20'}`}>Master Broad Sheet</button>
          <button onClick={() => { setActiveSubTab('reports'); setSelectedPupilId(null); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'reports' ? 'bg-[#0f3460] text-white shadow-lg' : 'hover:bg-white/20'}`}>Individual Reports</button>
          <button onClick={() => setActiveSubTab('timetable')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'timetable' ? 'bg-[#0f3460] text-white shadow-lg' : 'hover:bg-white/20'}`}>Timetable</button>
          <button onClick={() => setActiveSubTab('ratings')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'ratings' ? 'bg-[#0f3460] text-white shadow-lg' : 'hover:bg-white/20'}`}>Ratings</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 min-h-[500px]">
        {activeSubTab === 'config' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="border-b pb-6">
              <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Mock Examination Configuration</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Select mock cycle, grading standards, and normalization rules</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Active Mock Series Cycle</label>
                 <select 
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460] shadow-inner outline-none focus:ring-2 focus:ring-[#cca43b]"
                    value={settings.mockSeries}
                    onChange={e => onSettingsChange({...settings, mockSeries: e.target.value})}
                 >
                    {mockSeriesOptions.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
               </div>

               <div className="space-y-1">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Authorized Class-Facilitator</label>
                 <select 
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#cca43b] shadow-inner outline-none focus:ring-2 focus:ring-[#0f3460]"
                    value={settings.facilitatorMapping['Basic 9 Head'] || ''}
                    onChange={e => {
                      const updated = { ...(settings.facilitatorMapping || {}) };
                      updated['Basic 9 Head'] = e.target.value;
                      onSettingsChange({ ...settings, facilitatorMapping: updated });
                    }}
                 >
                    <option value="">-- Choose Lead Teacher --</option>
                    {settings.staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                 </select>
               </div>

               <div className="space-y-1">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Authorized Headteacher</label>
                 <input className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold shadow-inner" value={settings.headteacherName} onChange={e => onSettingsChange({...settings, headteacherName: e.target.value})} />
               </div>

               <div className="space-y-1">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Section A Max (Std Subjects)</label>
                 <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460] shadow-inner" value={terminalConfig.sectionAMax} onChange={e => updateTerminalThreshold('sectionAMax', e.target.value)} />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Section B Max (Std Subjects)</label>
                 <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460] shadow-inner" value={terminalConfig.sectionBMax} onChange={e => updateTerminalThreshold('sectionBMax', e.target.value)} />
               </div>
               
               <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col justify-center">
                 <p className="text-[8px] font-black text-blue-400 uppercase">Science Exception Rule</p>
                 <select 
                   className="w-full mt-2 bg-white border-none rounded-xl p-2 text-[10px] font-black text-blue-900 outline-none focus:ring-1 focus:ring-[#cca43b]"
                   value={settings.scienceThreshold || 140}
                   onChange={e => onSettingsChange({...settings, scienceThreshold: parseInt(e.target.value)})}
                 >
                   <option value={100}>Standard Basis (100 Raw)</option>
                   <option value={140}>BECE Basis (140 Raw / Normalized)</option>
                 </select>
               </div>
            </div>

            <div className="pt-10 border-t space-y-6">
               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <h4 className="text-xl font-black text-[#0f3460] uppercase">NRT Grading System</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Define cohort boundaries using Z-scores</p>
                  </div>
               </div>
               <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
                  <table className="w-full text-left text-[11px] border-collapse">
                     <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                        <tr>
                           <th className="p-4 border-b">Grade</th>
                           <th className="p-4 border-b">Point Value</th>
                           <th className="p-4 border-b">Cut-off (Z-Score)</th>
                           <th className="p-4 border-b">Interpretation</th>
                           <th className="p-4 border-b text-center">Color Code</th>
                        </tr>
                     </thead>
                     <tbody>
                        {settings.gradingScale.map((g, idx) => (
                           <tr key={g.grade} className="border-b hover:bg-gray-50 transition">
                              <td className="p-4 font-black text-[#0f3460] uppercase text-sm">{g.grade}</td>
                              <td className="p-4"><input type="number" className="w-16 p-2 bg-white rounded-lg border border-gray-100 font-black text-center" value={g.value} onChange={e => updateScaleRow(idx, 'value', parseInt(e.target.value))} /></td>
                              <td className="p-4"><input type="number" step="0.001" className="w-24 p-2 bg-blue-50 rounded-lg border border-blue-100 font-black text-center text-blue-700" value={g.zScore} onChange={e => updateScaleRow(idx, 'zScore', parseFloat(e.target.value))} /></td>
                              <td className="p-4"><input className="w-full p-2 bg-white rounded-lg border border-gray-100 font-bold text-gray-500 uppercase italic" value={g.remark} onChange={e => updateScaleRow(idx, 'remark', e.target.value)} /></td>
                              <td className="p-4 text-center">
                                 <div className="flex items-center justify-center gap-2">
                                    <div className="w-6 h-6 rounded-full border border-gray-100" style={{ background: g.color }}></div>
                                    <input type="color" className="w-8 h-8 border-none bg-transparent cursor-pointer" value={g.color} onChange={e => updateScaleRow(idx, 'color', e.target.value)} />
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {activeSubTab === 'entry' && (
          <div className="space-y-8 animate-fadeIn">
             <div className="border-b pb-4">
                <h3 className="text-xl font-black text-[#0f3460] uppercase">{settings.mockSeries} Score Entry Hub</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Authorized BECE Simulation Score Entry Point</p>
             </div>
             <ScoreEntry 
               students={students} 
               onUpdate={onStudentsUpdate} 
               onSave={onSave} 
               settings={mockSettings} 
               onSettingsChange={onSettingsChange} 
               subjectList={subjectList} 
               department="JHS" 
               activeClass="Basic 9" 
               notify={notify}
               isMockMode={true}
             />
          </div>
        )}

        {activeSubTab === 'mastersheet' && (
          <div className="animate-fadeIn space-y-8">
            <MasterSheet 
              pupils={pupils} 
              settings={mockSettings} 
              onSettingsChange={onSettingsChange} 
              subjectList={subjectList} 
              department="JHS" 
              activeClass="Basic 9" 
            />
          </div>
        )}

        {activeSubTab === 'reports' && (
          <div className="animate-fadeIn space-y-8">
             {!selectedPupilId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {students.map(s => {
                     const pupilData = pupils.find(p => p.name === `${s.firstName} ${s.surname}`);
                     return (
                       <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-transparent hover:border-[#cca43b] transition group shadow-sm flex flex-col justify-between">
                         <div className="flex justify-between items-start border-b pb-4 mb-4">
                             <div>
                               <h4 className="font-black text-[#0f3460] uppercase text-sm leading-tight">{s.firstName} {s.surname}</h4>
                               <p className="text-[9px] font-bold text-gray-400 mt-1 italic uppercase">Serial: {s.serialId}</p>
                             </div>
                             <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${s.isFeesCleared ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                               {s.isFeesCleared ? 'Cleared' : 'Owing'}
                             </span>
                         </div>
                         <button onClick={() => setSelectedPupilId(s.id)} className="mt-4 w-full bg-[#0f3460] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg group-hover:bg-[#cca43b] group-hover:text-[#0f3460] transition">Authorize Report Card</button>
                       </div>
                     );
                   })}
                </div>
             ) : currentPupil && (
                <div className="animate-fadeIn">
                   <div className="flex justify-between items-center mb-10 no-print max-w-5xl mx-auto">
                      <button onClick={() => setSelectedPupilId(null)} className="text-gray-400 font-black uppercase text-xs hover:text-[#0f3460] transition flex items-gap-2"><span>←</span> Back</button>
                      <button onClick={() => window.print()} className="bg-[#2e8b57] text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">Print Report</button>
                   </div>
                   <div id="mock-report-card" className="bg-white p-12 border-[12px] border-double border-[#0f3460] max-w-[210mm] mx-auto shadow-2xl relative min-h-[296mm] flex flex-col font-sans">
                      <UniversalReportHeader 
                        settings={settings} 
                        onSettingsChange={onSettingsChange} 
                        title={`${settings.mockSeries} PERFORMANCE RECORD`} 
                      />

                      <div className="grid grid-cols-2 gap-10 mb-8 font-black">
                         <div className="space-y-3 border-r-2 border-dashed border-gray-200 pr-10">
                            <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
                               <span className="text-[10px] text-gray-400 uppercase tracking-widest">Learner Full Name</span>
                               <span className="text-2xl text-[#0f3460] uppercase">{currentPupil.name}</span>
                            </div>
                         </div>
                         <div className="space-y-4 text-right">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Best 6 Composite Agg.</span>
                            <span className="text-5xl text-red-700 font-black">{!currentPupil.isFeesCleared ? '--' : currentPupil.aggregate}</span>
                         </div>
                      </div>

                      <div className="flex-1">
                        {!currentPupil.isFeesCleared ? (
                           <div className="p-20 text-center bg-red-50/30 rounded-3xl border-2 border-dashed border-red-100">
                              <h3 className="text-2xl font-black text-red-600 uppercase">Records Withheld</h3>
                              <p className="text-xs font-bold text-gray-400 uppercase mt-4">Ledger Reconciliation Required.</p>
                           </div>
                        ) : (
                           <table className="w-full text-xs border-4 border-black border-collapse">
                             <thead className="bg-[#f4f6f7]">
                               <tr className="uppercase text-[9px] font-black text-[#0f3460]">
                                 <th className="p-4 border-2 border-black text-left">Pillar / Subject</th>
                                 <th className="p-4 border-2 border-black text-center">Score</th>
                                 <th className="p-4 border-2 border-black text-center">Grade</th>
                                 <th className="p-4 border-2 border-black text-left">Facilitator Remark</th>
                               </tr>
                             </thead>
                             <tbody>
                               {currentPupil.computedScores.map(s => (
                                 <tr key={s.name} className="border-b-2 border-black">
                                   <td className="p-4 border-2 border-black font-black uppercase">{s.name}</td>
                                   <td className="p-4 border-2 border-black text-center font-black text-lg">{s.score}</td>
                                   <td className="p-4 border-2 border-black text-center font-black text-xl bg-[#0f3460] text-white">{s.grade}</td>
                                   <td className="p-4 border-2 border-black italic text-[10px]">{s.remark}</td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                        )}
                      </div>

                      <div className="mt-12 pt-8 border-t-4 border-black flex justify-between items-end">
                         <div className="text-center w-64"><div className="h-12 border-b-2 border-black w-full mb-2"></div><p className="text-[10px] font-black uppercase text-gray-400">Class Facilitator</p></div>
                         <div className="text-center w-80">
                            <p className="italic font-serif text-4xl mb-2 text-[#0f3460]">{settings.headteacherName}</p>
                            <div className="border-t-2 border-black pt-2"><p className="text-xs font-black uppercase tracking-widest text-[#0f3460]">Official Authorization</p></div>
                         </div>
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}

        {activeSubTab === 'timetable' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-4 no-print">
              <h3 className="text-xl font-black text-[#0f3460] uppercase">{settings.mockSeries} Time Table</h3>
              <button onClick={handleAddSlot} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">+ Add Exam Slot</button>
            </div>
            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                  <tr>
                    <th className="p-5 border-b">Date Selection</th>
                    <th className="p-5 border-b text-center">Time</th>
                    <th className="p-5 border-b">Subject Area</th>
                    <th className="p-5 border-b text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockExamTable.map((slot) => (
                    <tr key={slot.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4"><input type="date" className="bg-transparent font-bold text-[#0f3460]" value={slot.date} onChange={e => updateSlot(slot.id, 'date', e.target.value)} /></td>
                      <td className="p-4 text-center"><input type="time" className="bg-gray-50 p-2 rounded-lg" value={slot.startTime} onChange={e => updateSlot(slot.id, 'startTime', e.target.value)} /></td>
                      <td className="p-4">
                        <select className="w-full bg-transparent font-black text-[#0f3460] uppercase" value={slot.subject} onChange={e => updateSlot(slot.id, 'subject', e.target.value)}>
                          {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-4 text-center no-print"><button onClick={() => removeSlot(slot.id)} className="text-red-300">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'ratings' && (
          <div className="space-y-8 animate-fadeIn">
            <FacilitatorDashboard students={students} settings={mockSettings} onSettingsChange={onSettingsChange} subjectList={subjectList} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MockExaminationDesk;