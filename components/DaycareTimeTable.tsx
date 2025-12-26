
import React, { useState, useMemo } from 'react';
import { GlobalSettings, DaycareTimeTableSlot, ObservationScheduleSlot } from '../types';
import { DAYCARE_PERIODS } from '../constants';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  activeClass: string;
  notify: any;
}

const DaycareTimeTable: React.FC<Props> = ({ settings, onSettingsChange, activeClass, notify }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'indicators' | 'observers'>('schedule');
  
  // KG Specific Dropdown Data
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
  const LOCATIONS = ['In', 'Out', 'Both'] as const;
  const PERIODS_KG = ['L0', 'L1', 'L2', 'L3', 'B1', 'L4', 'L5', 'B2', 'L6', 'L7'] as const;
  const ACTIVITIES_KG = [
    'Circle time', 'Group activity', 'Individual activity', 'Arrival & settling', 
    'Phonics Time', 'Closing', 'Snack Break', 'Lunch Break', 'Learning Centre', 
    'Story Time', 'Worship', 'Physical Education', 'Assembly'
  ] as const;
  const LEARNING_AREAS_KG = [
    'Numeracy', 'Language & Literacy', 'Our World Our People (OWOP)', 'Creative Activity'
  ] as const;

  const schedule = useMemo(() => {
    return settings.observationSchedule[activeClass] || [];
  }, [settings.observationSchedule, activeClass]);

  // Logic: Prioritize high-intensity activities and appropriate locations
  const handleAutoGenerate = () => {
    if (schedule.length > 0 && !confirm("This will overwrite the current class schedule. Proceed?")) return;

    const newMatrix: ObservationScheduleSlot[] = [];
    const observerId = settings.staff.find(s => s.category === 'Teaching')?.id || '';
    const profiles = settings.subjectProfiles || {};

    DAYS.forEach(day => {
      PERIODS_KG.forEach(period => {
        let startTime = '08:00';
        let endTime = '08:30';
        let activity = 'Circle time';
        let location: 'In' | 'Out' | 'Both' = 'In';
        let area = 'Language & Literacy';

        // Pedagogical Sequence Logic
        switch(period) {
          case 'L0': startTime = '07:30'; endTime = '08:00'; activity = 'Arrival & settling'; location = 'In'; area = 'Our World Our People (OWOP)'; break;
          case 'L1': startTime = '08:00'; endTime = '08:40'; activity = 'Circle time'; location = 'In'; area = 'Language & Literacy'; break;
          case 'L2': startTime = '08:40'; endTime = '09:20'; activity = 'Phonics Time'; location = 'In'; area = 'Language & Literacy'; break;
          case 'L3': startTime = '09:20'; endTime = '10:00'; activity = 'Learning Centre'; location = 'In'; area = 'Numeracy'; break;
          case 'B1': startTime = '10:00'; endTime = '10:30'; activity = 'Snack Break'; location = 'Both'; area = 'Creative Activity'; break;
          case 'L4': startTime = '10:30'; endTime = '11:10'; activity = 'Individual activity'; location = 'In'; area = 'Creative Activity'; break;
          case 'L5': startTime = '11:10'; endTime = '11:50'; activity = 'Story Time'; location = 'In'; area = 'Language & Literacy'; break;
          case 'B2': startTime = '11:50'; endTime = '12:30'; activity = 'Lunch Break'; location = 'In'; area = 'Our World Our People (OWOP)'; break;
          case 'L6': 
            startTime = '12:30'; endTime = '13:10'; 
            activity = day === 'Wednesday' || day === 'Friday' ? 'Physical Education' : 'Group activity';
            location = activity === 'Physical Education' ? 'Out' : 'In';
            area = day === 'Tuesday' || day === 'Thursday' ? 'Numeracy' : 'Creative Activity';
            break;
          case 'L7': startTime = '13:10'; endTime = '14:00'; activity = 'Closing'; location = 'In'; area = 'Our World Our People (OWOP)'; break;
        }

        // Apply Global Pulse Overrides (Admin Settings)
        if (profiles[activity]) {
          location = profiles[activity].location as any;
        }

        newMatrix.push({
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          day,
          startTime,
          endTime,
          period,
          duration: '40 mins',
          venue: location === 'Out' ? 'Outdoor Playground' : 'Main Classroom',
          locationType: location,
          activityType: activity,
          learningArea: area,
          observerId,
          pupilGroup: [],
          activityIndicator: `Observation: ${activity}`,
          status: 'Pending'
        });
      });
    });

    onSettingsChange({
      ...settings,
      observationSchedule: {
        ...settings.observationSchedule,
        [activeClass]: newMatrix
      }
    });
    notify(`Development Intelligence: Weekly Matrix for ${activeClass} Generated Successfully!`, "success");
  };

  const handleAddSlot = () => {
    const newSlot: ObservationScheduleSlot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      day: 'Monday',
      startTime: '08:00',
      endTime: '08:30',
      period: 'L1',
      duration: '30 mins',
      venue: 'Main Playroom',
      locationType: 'In',
      activityType: 'Circle time',
      learningArea: 'Language & Literacy',
      observerId: settings.staff[0]?.id || '',
      pupilGroup: [],
      activityIndicator: 'General Development',
      status: 'Pending'
    };
    
    onSettingsChange({
      ...settings,
      observationSchedule: {
        ...settings.observationSchedule,
        [activeClass]: [newSlot, ...schedule]
      }
    });
    notify("Development Observation Slot Initialized", "success");
  };

  const updateSlot = (id: string, field: keyof ObservationScheduleSlot, val: any) => {
    const updated = schedule.map(s => s.id === id ? { ...s, [field]: val } : s);
    onSettingsChange({
      ...settings,
      observationSchedule: {
        ...settings.observationSchedule,
        [activeClass]: updated
      }
    });
  };

  const removeSlot = (id: string) => {
    const updated = schedule.filter(s => s.id !== id);
    onSettingsChange({
      ...settings,
      observationSchedule: {
        ...settings.observationSchedule,
        [activeClass]: updated
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Institutional Particulars Header */}
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
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-50 w-full max-w-2xl">
          <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          <span>•</span>
          <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          <span>•</span>
          <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
        </div>
      </div>

      <div className="bg-[#cca43b] p-8 rounded-[3rem] text-[#0f3460] shadow-2xl flex flex-col gap-6 no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Development Observation Desk</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-70">Integrated Weekly Schedule • {activeClass}</p>
          </div>
          <div className="flex bg-white/20 p-1 rounded-2xl">
            <button onClick={() => setActiveTab('schedule')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'schedule' ? 'bg-[#0f3460] text-white shadow-md' : 'hover:bg-white/10'}`}>1. Observation Schedule</button>
            <button onClick={() => setActiveTab('indicators')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'indicators' ? 'bg-[#0f3460] text-white shadow-md' : 'hover:bg-white/10'}`}>2. Learning Milestones</button>
            <button onClick={() => setActiveTab('observers')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'observers' ? 'bg-[#0f3460] text-white shadow-md' : 'hover:bg-white/10'}`}>3. Deployment</button>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[600px] relative">
        {activeTab === 'schedule' && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-center border-b pb-6 no-print gap-4">
               <div>
                  <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Class Observation Desk</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live weekly tracking of development indicators</p>
               </div>
               <div className="flex flex-wrap gap-4 justify-center">
                  <button onClick={handleAutoGenerate} className="bg-[#cca43b] text-[#0f3460] px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition flex items-center gap-2">
                    <span>🤖</span> Auto-Generate Matrix
                  </button>
                  <button onClick={() => window.print()} className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition flex items-center gap-2">
                    <span>🖨️</span> Print Schedule
                  </button>
                  <button onClick={handleAddSlot} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition flex items-center gap-2">
                    <span>+</span> Add Slot
                  </button>
               </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm">
              <table className="w-full text-left text-[11px] border-collapse min-w-[1400px]">
                <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                  <tr>
                    <th className="p-5 border-b">Day</th>
                    <th className="p-5 border-b w-48 text-center">Time selection (start-end)</th>
                    <th className="p-5 border-b text-center">Period</th>
                    <th className="p-5 border-b text-center">Location</th>
                    <th className="p-5 border-b">Activity</th>
                    <th className="p-5 border-b">Learning Area</th>
                    <th className="p-5 border-b text-center">Current Status</th>
                    <th className="p-5 border-b text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.sort((a, b) => {
                    const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5 };
                    const dayDiff = (dayOrder[a.day || 'Monday'] || 0) - (dayOrder[b.day || 'Monday'] || 0);
                    if (dayDiff !== 0) return dayDiff;
                    return (a.startTime || '').localeCompare(b.startTime || '');
                  }).map((slot) => {
                    const profile = settings.subjectProfiles?.[slot.activityType || ''];
                    return (
                      <tr key={slot.id} className="border-b hover:bg-yellow-50/30 transition group">
                        <td className="p-4 border-r border-gray-50">
                          <select 
                            className="bg-transparent font-black text-[#0f3460] outline-none w-full uppercase text-[10px]"
                            value={slot.day}
                            onChange={e => updateSlot(slot.id, 'day', e.target.value)}
                          >
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </td>
                        <td className="p-4 border-r border-gray-50">
                          <div className="flex items-center gap-1">
                            <input 
                              type="time" 
                              className="bg-transparent font-bold text-gray-600 text-[10px] w-full"
                              value={slot.startTime}
                              onChange={e => updateSlot(slot.id, 'startTime', e.target.value)}
                            />
                            <span className="text-gray-300">-</span>
                            <input 
                              type="time" 
                              className="bg-transparent font-bold text-gray-600 text-[10px] w-full"
                              value={slot.endTime}
                              onChange={e => updateSlot(slot.id, 'endTime', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="p-4 border-r border-gray-50 text-center">
                          <select 
                            className="bg-transparent font-black text-blue-600 outline-none w-full uppercase text-[10px] text-center"
                            value={slot.period}
                            onChange={e => updateSlot(slot.id, 'period', e.target.value)}
                          >
                            {PERIODS_KG.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="p-4 border-r border-gray-50 text-center">
                           <select 
                            className="bg-transparent font-bold text-gray-600 outline-none w-full uppercase text-[10px] text-center"
                            value={slot.locationType}
                            onChange={e => updateSlot(slot.id, 'locationType', e.target.value)}
                          >
                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </td>
                        <td className="p-4 border-r border-gray-50">
                          <div className="flex flex-col gap-1">
                            <select 
                              className="bg-transparent font-black text-[#0f3460] outline-none w-full uppercase text-[10px] max-w-[200px]"
                              value={slot.activityType}
                              onChange={e => updateSlot(slot.id, 'activityType', e.target.value)}
                            >
                              {ACTIVITIES_KG.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            {profile && (
                               <span className={`px-2 py-0.5 rounded text-[6px] font-black uppercase w-fit ${profile.intensity === 'High' ? 'bg-red-50 text-red-600' : profile.intensity === 'Low' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                  {profile.intensity} Intensity
                               </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 border-r border-gray-50">
                          <select 
                            className="bg-transparent font-bold text-gray-500 outline-none w-full text-[10px] uppercase max-w-[200px]"
                            value={slot.learningArea}
                            onChange={e => updateSlot(slot.id, 'learningArea', e.target.value)}
                          >
                            {LEARNING_AREAS_KG.map(la => <option key={la} value={la}>{la}</option>)}
                          </select>
                        </td>
                        <td className="p-4 text-center">
                           <select 
                              className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase border-none shadow-inner outline-none transition-colors ${
                                slot.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                slot.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-50 text-orange-600'
                              }`}
                              value={slot.status}
                              onChange={e => updateSlot(slot.id, 'status', e.target.value)}
                           >
                              <option>Pending</option>
                              <option>In Progress</option>
                              <option>Completed</option>
                              <option>Lapsed</option>
                           </select>
                        </td>
                        <td className="p-4 text-center no-print">
                           <button onClick={() => removeSlot(slot.id)} className="text-red-300 hover:text-red-600 transition p-2">✕</button>
                        </td>
                      </tr>
                    );
                  })}
                  {schedule.length === 0 && (
                    <tr><td colSpan={8} className="p-32 text-center text-gray-300 font-black uppercase italic tracking-widest">No active observation slots in ledger. Click "Auto-Generate" or "+ Add Slot" to begin.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Verification Footer for Print Only */}
            <div className="hidden print:flex justify-between items-end mt-32">
               <div className="text-center w-64 border-t-2 border-black pt-4">
                  <p className="text-[10px] font-black uppercase">Registry Officer</p>
               </div>
               <div className="text-center w-80">
                  <p className="italic font-serif text-3xl mb-1 text-[#0f3460]">{settings.headteacherName}</p>
                  <div className="border-t-2 border-black pt-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-center">Headteacher Certified Approval</p>
                     <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold italic tracking-tighter">Official United Baylor Academy Audit Log</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'indicators' && (
          <div className="space-y-10 animate-fadeIn">
             <div className="flex justify-between items-center border-b pb-6">
                <div>
                   <h3 className="text-2xl font-black text-[#0f3460] uppercase">Learning Milestone Registry</h3>
                   <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 italic">Active Development Indicators Mapping</p>
                </div>
                <div className="bg-[#cca43b]/10 text-[#cca43b] px-6 py-2 rounded-2xl border border-[#cca43b]/20 text-center">
                   <p className="text-[8px] font-black uppercase">Core Indicators</p>
                   <p className="text-xl font-black">{LEARNING_AREAS_KG.length}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {LEARNING_AREAS_KG.map(area => (
                  <div key={area} className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 hover:border-[#cca43b] transition group shadow-sm">
                    <h4 className="text-[#cca43b] font-black uppercase text-xs mb-6 border-b-2 border-white pb-2">{area}</h4>
                    <div className="space-y-3 italic text-[9px] text-gray-400 font-bold uppercase">
                       Mapping planned observation targets for current term...
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'observers' && (
           <div className="space-y-10 animate-fadeIn">
              <div className="border-b pb-6">
                 <h3 className="text-2xl font-black text-[#0f3460] uppercase">Personnel Allocation</h3>
                 <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Teaching staff assigned to developmental observation</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {settings.staff.filter(s => s.category === 'Teaching').map(staff => (
                   <div key={staff.id} className="bg-white p-8 rounded-[3rem] border-4 border-gray-50 hover:border-blue-100 transition flex flex-col items-center text-center shadow-sm">
                      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner grayscale opacity-40 mb-4">👤</div>
                      <h4 className="font-black text-[#0f3460] uppercase text-lg leading-tight">{staff.name}</h4>
                      <p className="text-[9px] font-black text-[#cca43b] uppercase tracking-widest mt-1">{staff.role}</p>
                      <div className="mt-6 pt-6 border-t border-gray-50 w-full flex justify-between px-4">
                         <div className="text-left">
                            <p className="text-[7px] font-black text-gray-300 uppercase">Staff ID</p>
                            <p className="text-[10px] font-mono text-gray-400">{staff.idNumber}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[7px] font-black text-gray-300 uppercase">Class Auth</p>
                            <p className="text-[10px] font-bold text-blue-600 uppercase">{staff.department}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default DaycareTimeTable;
