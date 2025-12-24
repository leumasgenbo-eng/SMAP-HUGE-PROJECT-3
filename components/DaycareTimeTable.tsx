
import React, { useState } from 'react';
import { GlobalSettings, DaycareTimeTableSlot } from '../types';
import { DAYCARE_SLOTS, DAYCARE_PERIODS, DAYCARE_VENUES } from '../constants';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  activeClass: string;
  notify: any;
}

const DaycareTimeTable: React.FC<Props> = ({ settings, onSettingsChange, activeClass, notify }) => {
  const [activeDay, setActiveDay] = useState('Monday');
  const [activeTab, setActiveTab] = useState<'schedule' | 'indicators' | 'observers' | 'analysis'>('schedule');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Standard Institutional Header */}
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

      <div className="bg-[#cca43b] p-8 rounded-[3rem] text-[#0f3460] shadow-2xl flex flex-col gap-6 no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">UNITED BAYLOR ACADEMY</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-70">Observation and Development Desk • Creche;N1;N2;kindergarten</p>
          </div>
          <div className="flex bg-white/20 p-1 rounded-2xl">
            <button onClick={() => setActiveTab('schedule')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'schedule' ? 'bg-[#0f3460] text-white shadow-md' : ''}`}>Schedule</button>
            <button onClick={() => setActiveTab('indicators')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'indicators' ? 'bg-[#0f3460] text-white shadow-md' : ''}`}>Indicators</button>
            <button onClick={() => setActiveTab('observers')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'observers' ? 'bg-[#0f3460] text-white shadow-md' : ''}`}>Observers</button>
            <button onClick={() => setActiveTab('analysis')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'analysis' ? 'bg-[#0f3460] text-white shadow-md' : ''}`}>Analysis Compliance</button>
          </div>
        </div>
        
        <div className="flex gap-2">
          {days.map(d => (
            <button key={d} onClick={() => setActiveDay(d)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border transition ${activeDay === d ? 'bg-[#0f3460] border-[#0f3460] text-white shadow-lg' : 'border-[#0f3460]/20 text-[#0f3460]'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[500px]">
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
               <h3 className="text-xl font-black text-[#0f3460] uppercase">Observation Schedule</h3>
               <div className="flex gap-2 no-print">
                  <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">Print Schedule</button>
                  <button className="bg-[#cca43b] text-[#0f3460] px-6 py-2 rounded-xl font-black uppercase text-[10px] shadow-lg">+ Add Slot</button>
               </div>
            </div>
            <div className="overflow-x-auto rounded-3xl border border-gray-100">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                  <tr>
                    <th className="p-4 border-b">Date</th>
                    <th className="p-4 border-b">Period</th>
                    <th className="p-4 border-b">Location</th>
                    <th className="p-4 border-b">Activity / Learning Area</th>
                    <th className="p-4 border-b">Observer</th>
                    <th className="p-4 border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2].map(i => (
                    <tr key={i} className="border-b hover:bg-yellow-50 transition">
                      <td className="p-4 font-mono text-gray-400">mm/dd/yyyy</td>
                      <td className="p-4 font-bold text-[#0f3460]">L1 (Lesson 1)</td>
                      <td className="p-4 text-gray-500 uppercase font-black text-[10px]">Main Playroom</td>
                      <td className="p-4 font-bold italic text-[#0f3460]">Vocabulary building</td>
                      <td className="p-4">
                        <select className="bg-transparent border-b border-gray-200 outline-none text-[10px] font-bold">
                          <option>Select Observer</option>
                          {settings.observers.map(o => <option key={o.id}>{o.name}</option>)}
                        </select>
                      </td>
                      <td className="p-4">
                         <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Pending</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'indicators' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-4">
                 <h3 className="text-xl font-black text-[#0f3460] uppercase">Active Development Registry</h3>
                 <span className="bg-[#cca43b] text-[#0f3460] px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm">Total Indicators: 25</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {[
                   { group: 'Language & Literacy', items: ['Vocabulary building', 'Listening to stories', 'Pre-writing skills', 'Phonics awareness', 'Letter recognition'] },
                   { group: 'Numeracy', items: ['Counting 1-20', 'Shape recognition', 'Color sorting', 'Pattern making', 'Basic measurement'] },
                   { group: 'Physical Development', items: ['Gross motor skills', 'Fine motor skills', 'Hand-eye coordination', 'Balance and posture', 'Personal hygiene'] },
                   { group: 'Socio-Emotional', items: ['Sharing toys', 'Following instructions', 'Self-expression', 'Empathy for others', 'Cooperation in groups'] },
                   { group: 'Creative Arts', items: ['Painting and drawing', 'Music and movement', 'Role play', 'Molding with clay', 'Rhymes and songs'] }
                 ].map(cat => (
                   <div key={cat.group} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                      <h4 className="font-black text-[#cca43b] uppercase text-xs mb-4 border-b pb-2 border-gray-200">{cat.group}</h4>
                      <div className="space-y-2">
                         {cat.items.map(item => (
                           <div key={item} className="flex items-center gap-3 p-2 bg-white rounded-xl shadow-sm">
                              <div className="w-1.5 h-1.5 bg-[#cca43b] rounded-full"></div>
                              <span className="text-[10px] font-bold text-gray-600 uppercase">{item}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                 ))}
                 <div className="bg-[#0f3460] p-8 rounded-[2rem] text-white flex flex-col justify-between shadow-xl">
                    <div>
                       <h4 className="text-sm font-black uppercase text-[#cca43b]">Add Custom Indicators</h4>
                       <textarea className="w-full mt-4 bg-white/10 p-4 rounded-xl border-none outline-none text-xs italic text-white/70" placeholder="e.g. Can name 5 primary colors..." rows={3} />
                    </div>
                    <button className="bg-[#cca43b] text-[#0f3460] w-full py-4 rounded-xl font-black uppercase text-[10px] shadow-lg mt-4 hover:scale-[1.02] transition">Save to Registry</button>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'observers' && (
           <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                 <h3 className="text-xl font-black text-[#0f3460] uppercase">Observers Deployment List</h3>
                 <button className="bg-[#0f3460] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">+ New Entry</button>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
                 <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                       <tr>
                          <th className="p-4 border-b">Name (Select from Staff)</th>
                          <th className="p-4 border-b">Institutional Role</th>
                          <th className="p-4 border-b text-center">Status</th>
                          <th className="p-4 border-b text-center">Action</th>
                       </tr>
                    </thead>
                    <tbody>
                       {[1, 2].map(i => (
                         <tr key={i} className="border-b hover:bg-gray-50 transition">
                            <td className="p-4">
                               <select className="w-full bg-transparent border-b border-gray-200 font-black uppercase outline-none focus:border-[#cca43b]">
                                  <option>-- Choose Staff --</option>
                                  {settings.staff.map(s => <option key={s.id}>{s.name}</option>)}
                               </select>
                            </td>
                            <td className="p-4 font-bold text-gray-500 uppercase">Facilitator</td>
                            <td className="p-4 text-center">
                               <span className="bg-green-50 text-green-600 px-4 py-1 rounded-lg text-[9px] font-black uppercase">Active</span>
                            </td>
                            <td className="p-4 text-center">
                               <button className="text-red-500 font-black text-lg hover:scale-125 transition">✕</button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'analysis' && (
           <div className="flex flex-col items-center justify-center py-32 opacity-20 grayscale pointer-events-none">
              <span className="text-8xl mb-6">📊</span>
              <p className="font-black uppercase italic text-gray-400 tracking-widest text-lg">Statistical Compliance Engine Initializing...</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default DaycareTimeTable;
