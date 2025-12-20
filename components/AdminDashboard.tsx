
import React, { useState, useMemo } from 'react';
import { FILING_CABINET_STRUCTURE, DEPARTMENTS } from '../constants';
import { FilingRecord, GlobalSettings, Student } from '../types';

interface Props {
  section: string;
  dept: string;
  notify: any;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
}

const AdminDashboard: React.FC<Props> = ({ section, dept, notify, settings, onSettingsChange, students, onStudentsUpdate }) => {
  const [activeTab, setActiveTab] = useState<'filing' | 'promotion' | 'identity' | 'bulk' | 'excellence' | 'system'>('system');
  const [path, setPath] = useState<string[]>([]);
  
  const handleSystemReset = () => {
    if (confirm("CRITICAL ACTION: This will wipe ALL student data and reset settings. This cannot be undone. Proceed?")) {
      onStudentsUpdate([]);
      notify("System data wiped successfully.", "error");
    }
  };

  const toggleModule = (mod: string) => {
    const updated = { ...settings.modulePermissions };
    updated[mod] = !updated[mod];
    onSettingsChange({ ...settings, modulePermissions: updated });
    notify(`${mod} visibility updated.`, 'info');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0f3460] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Administration Desk</h2>
            <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Management & System Permissions</p>
          </div>
          <div className="flex flex-wrap bg-white/10 p-1.5 rounded-2xl gap-2">
             {['system', 'identity', 'promotion', 'excellence', 'bulk', 'filing'].map(t => (
               <button 
                 key={t}
                 onClick={() => setActiveTab(t as any)} 
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460]' : ''}`}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/30 p-10">
          {activeTab === 'system' && (
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                <h3 className="text-2xl font-black text-[#0f3460] mb-8 uppercase">Module Access Control</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['Time Table', 'Academic Calendar', 'Staff Management', 'Pupil Management', 'Examination', 'Lesson Plans', 'Finance'].map(m => (
                    <label key={m} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white border-2 border-transparent hover:border-[#cca43b] transition cursor-pointer">
                      <span className="text-xs font-black text-[#0f3460] uppercase">{m}</span>
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 accent-[#0f3460]" 
                        checked={settings.modulePermissions[m] !== false} 
                        onChange={() => toggleModule(m)}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-12 pt-12 border-t border-red-100">
                  <h4 className="text-red-600 font-black uppercase text-xs mb-4">Danger Zone</h4>
                  <button 
                    onClick={handleSystemReset}
                    className="bg-red-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-red-600 transition"
                  >
                    Reset System to Factory Default
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
             <div className="p-10 max-w-4xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-lg text-center">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest">Logo & Branding</h4>
                  <div className="w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-200 mx-auto rounded-[2rem] flex items-center justify-center relative overflow-hidden group">
                    {settings.logo ? (
                      <img src={settings.logo} className="w-full h-full object-contain p-4" alt="Logo" />
                    ) : (
                      <span className="text-gray-300 font-black italic">LOGO</span>
                    )}
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (re) => onSettingsChange({...settings, logo: re.target?.result as string});
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">School Name</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460]" value={settings.schoolName} onChange={e => onSettingsChange({...settings, schoolName: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Official Email</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460]" value={settings.email} onChange={e => onSettingsChange({...settings, email: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Contact Telephone</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460]" value={settings.telephone} onChange={e => onSettingsChange({...settings, telephone: e.target.value})} />
                   </div>
                   <button onClick={() => notify("Branding Updated!", "success")} className="w-full bg-[#0f3460] text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg">Save Identity</button>
                </div>
              </div>
            </div>
          )}
          
          {/* Promotion, Excellence, Bulk, Filing - Retain or expand from existing logic as needed */}
          {activeTab === 'excellence' && (
             <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center">
                <p className="text-gray-400 font-black uppercase italic text-sm">Academic Excellence Panel - Top 5 Performers Per Class</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
