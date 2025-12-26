
import React, { useState, useMemo } from 'react';
import { GlobalSettings, ExamTimeTableSlot, Student, Pupil, StaffRecord, GradingScaleEntry } from '../types';
import { BASIC_ROOMS, getSubjectsForDepartment } from '../constants';
import ScoreEntry from './ScoreEntry';
import MasterSheet from './MasterSheet';
import FacilitatorDashboard from './FacilitatorDashboard';
import { processStudentData, getNRTGrade } from '../utils';
import EditableField from './EditableField';

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
  
  // Use a derived key for mock timetable storage to support multiple series
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
    
    // Check constraint: up to three subjects per day
    const existingCount = mockExamTable.filter(s => s.date === newSlot.date).length;
    if (existingCount >= 3) {
      notify("Alert: A maximum of three subjects can be scheduled per day.", "error");
      return;
    }

    const updated = { ...settings.examTimeTables, [timetableKey]: [...mockExamTable, newSlot] };
    onSettingsChange({ ...settings, examTimeTables: updated });
    notify("Exam slot added to " + settings.mockSeries + " schedule.", "success");
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
      {/* UNITED BAYLOR ACADEMY branding on reports */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-50 rounded-[2rem] border-2 border-gray-100 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-inner">
             {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <span className="text-4xl">🎓</span>}
             <div className="absolute inset-0 bg-[#0f3460]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <EditableField value={settings.logo} onSave={v => onSettingsChange({...settings, logo: v})} placeholder="Logo URL" className="text-[10px] text-white bg-transparent border-white" />
             </div>
          </div>
          <div className="flex flex-col items-start text-left">
            <EditableField 
              value={settings.schoolName} 
              onSave={v => onSettingsChange({...settings, schoolName: v})} 
              className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" 
            />
            <EditableField 
              value={settings.motto} 
              onSave={v => onSettingsChange({...settings, motto: v})} 
              className="text-[11px] font-black uppercase tracking-[0.4em] text-[#cca43b]" 
            />
          </div>
        </div>
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-50 w-full max-w-4xl">
          <div className="flex items-center gap-2">
             <span className="text-[#cca43b] text-[10px]">📍</span>
             <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
             <span className="text-[#cca43b] text-[10px]">📞</span>
             <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
             <span className="text-[#cca43b] text-[10px]">✉️</span>
             <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className="lowercase" />
          </div>
        </div>
      </div>

      <div className="bg-[#cca43b] p-8 rounded-[3rem] text-[#0f3460] shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <div className="bg-[#0f3460] text-white p-4 rounded-3xl shadow-inner">
             <p className="text-[9px] font-black uppercase opacity-60">BECE Desk</p>
             <h3 className="text-xl font-black uppercase tracking-tighter">BASIC 9</h3>
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">BECE Mock Desk</h2>
            <p className="text-[10px] font-bold mt-2 opacity-80 uppercase tracking-widest">Active Series: {settings.mockSeries}</p>
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
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Select mock cycle, grading standards, and normalization rules</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Active Mock Series Cycle</label>
                 <select 
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460] shadow-inner outline-none focus:ring-2 focus:ring-[#cca43b]"
                    value={settings.mockSeries}
                    onChange={e => onSettingsChange({...settings, mockSeries: e.target.value})}
                 >
                    {mockSeriesOptions.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
               </div>

               <div className="space-y-2">
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

               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Authorized Headteacher</label>
                 <input className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold shadow-inner" value={settings.headteacherName} onChange={e => onSettingsChange({...settings, headteacherName: e.target.value})} />
               </div>

               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Section A Max (Std Subjects)</label>
                 <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460] shadow-inner" value={terminalConfig.sectionAMax} onChange={e => updateTerminalThreshold('sectionAMax', e.target.value)} />
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Section B Max (Std Subjects)</label>
                 <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460] shadow-inner" value={terminalConfig.sectionBMax} onChange={e => updateTerminalThreshold('sectionBMax', e.target.value)} />
               </div>
               
               <div className="space-y-2">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 h-full flex flex-col justify-center">
                    <p className="text-[8px] font-black text-blue-400 uppercase">Science Exception Rule</p>
                    <select 
                      className="w-full mt-2 bg-white border-none rounded-xl p-2 text-[10px] font-black text-blue-900 outline-none focus:ring-1 focus:ring-[#cca43b]"
                      value={settings.scienceThreshold || 140}
                      onChange={e => onSettingsChange({...settings, scienceThreshold: parseInt(e.target.value)})}
                    >
                      <option value={100}>Standard Basis (100 Raw)</option>
                      <option value={140}>BECE Basis (140 Raw / Normalized)</option>
                    </select>
                    <p className="text-[8px] font-bold text-blue-400 mt-2 italic leading-tight">
                      {settings.scienceThreshold === 140 
                        ? "Currently: Section A (40) + Section B (100) = 140. Normalizing to 100%." 
                        : "Currently: Science follows standard class thresholds (Total 100)."}
                    </p>
                  </div>
               </div>

               <div className="space-y-2">
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 h-full flex flex-col justify-center">
                    <p className="text-[8px] font-black text-purple-400 uppercase">Statistical Distribution Model</p>
                    <select 
                      className="w-full mt-2 bg-white border-none rounded-xl p-2 text-[10px] font-black text-purple-900 outline-none focus:ring-1 focus:ring-[#cca43b]"
                      value={settings.distributionModel || 'Auto'}
                      onChange={e => onSettingsChange({...settings, distributionModel: e.target.value as any})}
                    >
                      <option value="Auto">Auto (T-Dist if N &lt; 30)</option>
                      <option value="Normal">Force Normal (Z-Score)</option>
                      <option value="T-Dist">Force T-Distribution</option>
                    </select>
                    <p className="text-[8px] font-bold text-purple-400 mt-2 italic leading-tight">
                       Currently: {students.length < 30 && (settings.distributionModel === 'Auto' || settings.distributionModel === 'T-Dist') ? 'T-Distribution Active (Wider tails for small class)' : 'Normal Distribution Active (Large class standard)'}
                    </p>
                  </div>
               </div>
               
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Exam Start Date</label>
                 <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold shadow-inner" value={settings.examStart} onChange={e => onSettingsChange({...settings, examStart: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Grading Completion Date</label>
                 <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold shadow-inner" value={settings.examEnd} onChange={e => onSettingsChange({...settings, examEnd: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase px-2">Next Term Reopening</label>
                 <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold shadow-inner" value={settings.reopeningDate} onChange={e => onSettingsChange({...settings, reopeningDate: e.target.value})} />
               </div>
            </div>

            {/* NRT Grading System Section */}
            <div className="pt-10 border-t space-y-6">
               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <h4 className="text-xl font-black text-[#0f3460] uppercase">NRT Grading System (Normal Distribution)</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Define cohort boundaries using Z-scores (standard deviations from mean)</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 max-w-md">
                     <p className="text-[9px] font-bold text-blue-700 leading-relaxed italic">
                       The NRT system automatically calculates the class mean and standard deviation. 
                       <strong> A1</strong> (e.g. Z ≥ 1.64) targets the top ~5% of performers, while <strong>F9</strong> captures outliers below the PASS threshold.
                     </p>
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
                              <td className="p-4">
                                 <input 
                                    type="number" 
                                    className="w-16 p-2 bg-white rounded-lg border border-gray-100 font-black text-center shadow-inner" 
                                    value={g.value} 
                                    onChange={e => updateScaleRow(idx, 'value', parseInt(e.target.value))} 
                                 />
                              </td>
                              <td className="p-4">
                                 <input 
                                    type="number" 
                                    step="0.001"
                                    className="w-24 p-2 bg-blue-50 rounded-lg border border-blue-100 font-black text-center text-blue-700 shadow-inner outline-none focus:ring-1 focus:ring-[#cca43b]" 
                                    value={g.zScore} 
                                    onChange={e => updateScaleRow(idx, 'zScore', parseFloat(e.target.value))} 
                                 />
                              </td>
                              <td className="p-4">
                                 <input 
                                    className="w-full p-2 bg-white rounded-lg border border-gray-100 font-bold text-gray-500 uppercase italic shadow-inner" 
                                    value={g.remark} 
                                    onChange={e => updateScaleRow(idx, 'remark', e.target.value)} 
                                 />
                              </td>
                              <td className="p-4 text-center">
                                 <div className="flex items-center justify-center gap-2">
                                    <div className="w-6 h-6 rounded-full border border-gray-100 shadow-sm" style={{ background: g.color }}></div>
                                    <input 
                                       type="color" 
                                       className="w-8 h-8 border-none bg-transparent cursor-pointer" 
                                       value={g.color} 
                                       onChange={e => updateScaleRow(idx, 'color', e.target.value)} 
                                    />
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
             <div className="border-b pb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-[#0f3460] uppercase">{settings.mockSeries} Score Entry</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Authorized BECE Simulation Score Entry Point</p>
                </div>
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
            <div className="flex justify-between items-center no-print">
               <div>
                 <h3 className="text-2xl font-black text-[#0f3460] uppercase">{settings.mockSeries} Performance Audit</h3>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ranked Broad Sheet (Best 6 Composite Aggregate)</p>
               </div>
               <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl">Export Series Broad Sheet</button>
            </div>
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
                <div className="space-y-8">
                   <div className="flex justify-between items-center border-b pb-4">
                      <h3 className="text-2xl font-black text-[#0f3460] uppercase">Learner Selection Grid</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Series: {settings.mockSeries}</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {students.map(s => {
                        const pupilData = pupils.find(p => p.name === `${s.firstName} ${s.surname}`);
                        return (
                          <div key={s.id} className="bg-white p-8 rounded-[3rem] border-2 border-transparent hover:border-[#cca43b] transition group shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start border-b pb-4 mb-4">
                                <div>
                                  <h4 className="font-black text-[#0f3460] uppercase text-sm leading-tight">{s.firstName} {s.surname}</h4>
                                  <p className="text-[9px] font-bold text-gray-400 mt-1 italic uppercase">Serial: {s.serialId}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${s.isFeesCleared ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                  {s.isFeesCleared ? 'Cleared' : 'Owing'}
                                </span>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                               <div className="bg-gray-50 p-3 rounded-2xl text-center">
                                  <p className="text-[8px] font-black text-gray-400 uppercase">Agg.</p>
                                  <p className="text-xl font-black text-red-600">{pupilData?.aggregate || '--'}</p>
                               </div>
                               <div className="bg-gray-50 p-3 rounded-2xl text-center">
                                  <p className="text-[8px] font-black text-gray-400 uppercase">Cat.</p>
                                  <p className="text-xl font-black text-[#0f3460]">{pupilData?.categoryCode || '--'}</p>
                               </div>
                            </div>
                            <button onClick={() => setSelectedPupilId(s.id)} className="mt-6 w-full bg-[#0f3460] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg group-hover:bg-[#cca43b] group-hover:text-[#0f3460] transition">Authorize Report Card</button>
                          </div>
                        );
                      })}
                   </div>
                </div>
             ) : currentPupil && (
                <div className="animate-fadeIn">
                   <div className="flex justify-between items-center mb-10 no-print max-w-5xl mx-auto">
                      <button onClick={() => setSelectedPupilId(null)} className="text-gray-400 font-black uppercase text-xs hover:text-[#0f3460] transition flex items-center gap-2">
                        <span>←</span> Back to Selection
                      </button>
                      <div className="flex gap-4">
                        <button onClick={() => handleSharePDF(currentPupil.name)} className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl">Share PDF Report</button>
                        <button onClick={() => window.print()} className="bg-white text-[#0f3460] border-2 border-[#0f3460] px-8 py-3 rounded-2xl font-black uppercase text-xs">Execute Print</button>
                      </div>
                   </div>

                   <div id="mock-report-card" className="bg-white p-12 border-[12px] border-double border-[#0f3460] max-w-[210mm] mx-auto shadow-2xl relative min-h-[296mm] flex flex-col font-sans">
                      {/* Institutional Header */}
                      <div className="text-center border-b-4 border-black pb-8 mb-8 flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-4">
                           <div className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-gray-100 flex items-center justify-center overflow-hidden">
                              {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <span className="text-4xl">🏫</span>}
                           </div>
                           <div className="flex-1 px-8">
                              <h1 className="text-5xl font-black uppercase tracking-tighter text-[#0f3460] leading-none">{settings.schoolName}</h1>
                              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#cca43b] mt-2">{settings.motto}</p>
                           </div>
                           <div className="w-24 opacity-0">Logo Space</div>
                        </div>
                        <p className="text-sm font-black text-gray-500 uppercase tracking-widest">{settings.address}</p>
                        <div className="bg-black text-white py-2 px-12 inline-block font-black text-sm rounded-sm uppercase tracking-[0.3em] mt-6 shadow-lg">
                           {settings.mockSeries} INDIVIDUAL PERFORMANCE RECORD
                        </div>
                      </div>

                      {/* Particulars */}
                      <div className="grid grid-cols-2 gap-10 mb-8 font-black">
                         <div className="space-y-3 border-r-2 border-dashed border-gray-200 pr-10">
                            <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
                               <span className="text-[10px] text-gray-400 uppercase tracking-widest">Learner Full Name</span>
                               <span className="text-2xl text-[#0f3460] uppercase truncate max-w-[300px]">{currentPupil.name}</span>
                            </div>
                            <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
                               <span className="text-[10px] text-gray-400 uppercase tracking-widest">Learner Serial ID</span>
                               <span className="text-gray-600 font-mono">UBA/B9/{currentPupil.no.toString().padStart(3, '0')}</span>
                            </div>
                            <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
                               <span className="text-[10px] text-gray-400 uppercase tracking-widest">Current Class</span>
                               <span className="text-gray-600">BASIC 9</span>
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center bg-[#0f3460] text-white p-4 rounded-xl shadow-inner">
                               <span className="text-[10px] uppercase tracking-widest opacity-60">Classification</span>
                               <span className="text-lg">{currentPupil.categoryCode} — {currentPupil.category}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2 px-2">
                               <span className="text-[10px] text-gray-400 uppercase tracking-widest">Best 6 Composite Agg.</span>
                               <span className="text-5xl text-red-700 font-black">{!currentPupil.isFeesCleared ? '--' : currentPupil.aggregate}</span>
                            </div>
                         </div>
                      </div>

                      {/* Performance Table */}
                      <div className="flex-1">
                        {!currentPupil.isFeesCleared ? (
                           <div className="h-full w-full border-4 border-dashed border-red-100 rounded-[3rem] flex flex-col items-center justify-center bg-red-50/30 p-20 text-center">
                              <span className="text-6xl mb-6">🔒</span>
                              <h3 className="text-3xl font-black text-red-600 uppercase tracking-tighter">Mock Records Withheld</h3>
                              <p className="text-sm font-bold text-gray-400 uppercase mt-4 tracking-widest leading-relaxed max-w-md">Access to official simulated BECE results is restricted pending institutional ledger reconciliation. Contact Finance Desk.</p>
                           </div>
                        ) : (
                           <>
                             <table className="w-full text-xs border-4 border-black border-collapse shadow-sm">
                               <thead className="bg-[#f4f6f7]">
                                 <tr className="uppercase text-[9px] font-black text-[#0f3460]">
                                   <th className="p-4 border-2 border-black text-left">Pillar / Subject Area</th>
                                   <th className="p-4 border-2 border-black text-center w-24">Sec A (/{activeClass === 'Basic 9' && selectedPupilId && subjectList.some(s => s.toLowerCase().includes('science')) ? 40 : terminalConfig.sectionAMax})</th>
                                   <th className="p-4 border-2 border-black text-center w-24">Sec B (/{activeClass === 'Basic 9' && selectedPupilId && subjectList.some(s => s.toLowerCase().includes('science')) ? 100 : terminalConfig.sectionBMax})</th>
                                   <th className="p-4 border-2 border-black text-center w-20">Total (/100)</th>
                                   <th className="p-4 border-2 border-black text-center w-20">Grade</th>
                                   <th className="p-4 border-2 border-black text-left">Facilitator Remark</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {currentPupil.computedScores.map(s => (
                                   <tr key={s.name} className="hover:bg-gray-50 border-b-2 border-black">
                                     <td className="p-4 border-2 border-black font-black uppercase bg-gray-50/30">{s.name}</td>
                                     <td className="p-4 border-2 border-black text-center font-bold text-blue-800">{s.sectionA}</td>
                                     <td className="p-4 border-2 border-black text-center font-bold text-purple-800">{s.sectionB}</td>
                                     <td className={`p-4 border-2 border-black text-center font-black text-lg ${s.score >= 50 ? 'text-green-700' : 'text-red-600'}`}>{s.score}</td>
                                     <td className="p-4 border-2 border-black text-center font-black text-xl bg-[#0f3460] text-white shadow-inner">{s.grade}</td>
                                     <td className="p-4 border-2 border-black italic text-[10px] font-medium leading-tight text-gray-600">{s.remark}</td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>

                             <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100 flex justify-between items-center">
                                <div className="space-y-1">
                                   <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">NRT Grading Standard</h4>
                                   <div className="flex gap-4">
                                      {settings.gradingScale.slice(0, 5).map(g => (
                                        <span key={g.grade} className="text-[9px] font-black" style={{ color: g.color }}>{g.grade}: {g.remark}</span>
                                      ))}
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-[#cca43b] uppercase">Institutional Compliance</p>
                                   <p className="text-[8px] font-bold text-gray-400 italic">Audit verification: UBA-MOCK-{settings.mockSeries.replace(/\s/g, '')}-{currentPupil.no}</p>
                                </div>
                             </div>
                           </>
                        )}
                      </div>

                      {/* Signature / Authorization */}
                      <div className="mt-12 pt-8 border-t-4 border-black flex justify-between items-end">
                         <div className="text-center w-64">
                            <div className="h-12 border-b-2 border-black w-full mb-2"></div>
                            <p className="text-[10px] font-black uppercase text-gray-400">Class Facilitator Signature</p>
                         </div>
                         <div className="text-center w-80">
                            <p className="italic font-serif text-4xl mb-2 text-[#0f3460]">{settings.headteacherName}</p>
                            <div className="border-t-2 border-black pt-2">
                               <p className="text-xs font-black uppercase tracking-widest text-[#0f3460]">Official Headteacher Authorization</p>
                               <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">United Baylor Academy Certified Audit</p>
                            </div>
                         </div>
                      </div>

                      <div className="absolute bottom-6 right-8 opacity-[0.05] rotate-[-15deg] pointer-events-none">
                         <span className="text-8xl font-black uppercase tracking-tighter text-[#0f3460]">UBA OFFICIAL</span>
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}

        {activeSubTab === 'timetable' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-4 no-print">
              <div>
                <h3 className="text-2xl font-black text-[#0f3460] uppercase">{settings.mockSeries} Time Table</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 italic">Schedule of Mock Papers (Max 3/Day)</p>
              </div>
              <button onClick={handleAddSlot} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition">+ Add Exam Slot</button>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-white">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                  <tr>
                    <th className="p-5 border-b">Date Selection</th>
                    <th className="p-5 border-b w-64 text-center">Time (Start - End)</th>
                    <th className="p-5 border-b">Subject Area</th>
                    <th className="p-5 border-b">Invigilator Name</th>
                    <th className="p-5 border-b text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockExamTable.sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || '')).map((slot) => (
                    <tr key={slot.id} className="border-b hover:bg-gray-50 transition border-gray-50">
                      <td className="p-4 border-r border-gray-50">
                         <input 
                            type="date" 
                            className="bg-transparent font-bold text-[#0f3460] outline-none" 
                            value={slot.date} 
                            onChange={e => updateSlot(slot.id, 'date', e.target.value)} 
                         />
                      </td>
                      <td className="p-4 border-r border-gray-50">
                         <div className="flex items-center gap-2 justify-center">
                            <input 
                               type="time" 
                               className="bg-gray-50 p-2 rounded-lg font-bold text-[10px] outline-none border border-transparent focus:border-[#cca43b]" 
                               value={slot.startTime} 
                               onChange={e => updateSlot(slot.id, 'startTime', e.target.value)} 
                            />
                            <span className="text-gray-300">-</span>
                            <input 
                               type="time" 
                               className="bg-gray-50 p-2 rounded-lg font-bold text-[10px] outline-none border border-transparent focus:border-[#cca43b]" 
                               value={slot.endTime} 
                               onChange={e => updateSlot(slot.id, 'endTime', e.target.value)} 
                            />
                         </div>
                      </td>
                      <td className="p-4 border-r border-gray-50">
                        <select 
                          className="w-full bg-transparent font-black text-[#0f3460] uppercase outline-none focus:text-[#cca43b]"
                          value={slot.subject}
                          onChange={e => updateSlot(slot.id, 'subject', e.target.value)}
                        >
                          {subjectList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-4 border-r border-gray-50">
                        <select 
                           className="w-full bg-transparent font-bold text-gray-500 uppercase outline-none focus:text-[#cca43b]"
                           value={slot.invigilatorName}
                           onChange={e => updateSlot(slot.id, 'invigilatorName', e.target.value)}
                        >
                           <option value="">-- Choose Staff --</option>
                           {settings.staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="p-4 text-center no-print">
                         <button onClick={() => removeSlot(slot.id)} className="text-red-300 hover:text-red-600 transition">✕</button>
                      </td>
                    </tr>
                  ))}
                  {mockExamTable.length === 0 && (
                    <tr><td colSpan={5} className="p-20 text-center text-gray-300 font-black uppercase italic tracking-widest">No mock examination slots registered in current cycle.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="hidden print:flex justify-between items-end mt-20 px-10">
               <div className="text-center w-64 border-t-2 border-black pt-2">
                  <p className="text-[10px] font-black uppercase text-gray-400">Registry Verification</p>
               </div>
               <div className="text-center w-80">
                  <p className="italic font-serif text-3xl mb-2 text-[#0f3460]">{settings.headteacherName}</p>
                  <div className="border-t-2 border-black pt-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-center">Headteacher Certified Approval</p>
                     <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold italic tracking-tighter">Official BECE Simulation Schedule Audit</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeSubTab === 'ratings' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b pb-4">
              <h3 className="text-2xl font-black text-[#0f3460] uppercase">Facilitator Performance Ratings ({settings.mockSeries})</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 italic">Subject Delivery Quality Audit</p>
            </div>
            <FacilitatorDashboard 
              students={students} 
              settings={mockSettings} 
              onSettingsChange={onSettingsChange} 
              subjectList={subjectList} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MockExaminationDesk;
