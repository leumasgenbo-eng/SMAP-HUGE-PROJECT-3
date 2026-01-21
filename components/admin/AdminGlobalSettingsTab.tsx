
import React from 'react';
import { GlobalSettings } from '../../types';
import EditableField from '../EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
}

const AdminGlobalSettingsTab: React.FC<Props> = ({ settings, onSettingsChange }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
      {settings.globalConfigsLocked && (
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-700 text-[10px] font-black uppercase text-center">
          🔒 Configurations are currently locked.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
          <div className="border-b pb-4">
            <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Institutional Identity</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Global Branding Particulars</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 px-2">Institutional Name</label>
              <EditableField 
                value={settings.schoolName} 
                onSave={v => onSettingsChange({...settings, schoolName: v})} 
                className={`bg-gray-50 p-4 rounded-2xl font-black text-[#0f3460] text-sm uppercase ${settings.globalConfigsLocked ? 'pointer-events-none opacity-50' : ''}`} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 px-2">Official Motto</label>
              <EditableField 
                value={settings.motto} 
                onSave={v => onSettingsChange({...settings, motto: v})} 
                className={`bg-gray-50 p-4 rounded-2xl font-bold text-[#cca43b] text-xs uppercase ${settings.globalConfigsLocked ? 'pointer-events-none opacity-50' : ''}`} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 px-2">Postal Address</label>
              <EditableField 
                value={settings.address} 
                onSave={v => onSettingsChange({...settings, address: v})} 
                className="bg-gray-50 p-4 rounded-2xl font-bold text-gray-600 text-xs uppercase" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 px-2">Telephone</label>
                <EditableField 
                  value={settings.telephone} 
                  onSave={v => onSettingsChange({...settings, telephone: v})} 
                  className="bg-gray-50 p-4 rounded-2xl font-bold text-gray-600 text-xs" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 px-2">Official Email</label>
                <EditableField 
                  value={settings.email} 
                  onSave={v => onSettingsChange({...settings, email: v})} 
                  className="bg-gray-50 p-4 rounded-2xl font-bold text-gray-600 text-xs lowercase" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 px-2">Institutional Logo URL</label>
              <EditableField 
                value={settings.logo} 
                onSave={v => onSettingsChange({...settings, logo: v})} 
                placeholder="Enter image URL..."
                className="bg-gray-50 p-4 rounded-2xl font-mono text-blue-500 text-[10px]" 
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
          <div className="border-b pb-4">
            <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Academic Parameters</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cycle Defaults & Authorization</p>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 px-2">Academic Year</label>
                <EditableField value={settings.academicYear} onSave={v => onSettingsChange({...settings, academicYear: v})} className="bg-gray-50 p-4 rounded-2xl font-black text-[#0f3460] text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 px-2">Current Term</label>
                <select 
                  className="w-full p-4 bg-gray-50 rounded-2xl font-black text-[#0f3460] text-xs border-none" 
                  value={settings.currentTerm} 
                  onChange={e => onSettingsChange({...settings, currentTerm: parseInt(e.target.value) as any})}
                >
                  <option value={1}>Term One</option>
                  <option value={2}>Term Two</option>
                  <option value={3}>Term Three</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 px-2">Headteacher Name</label>
              <EditableField 
                value={settings.headteacherName} 
                onSave={v => onSettingsChange({...settings, headteacherName: v})} 
                className="bg-gray-50 p-4 rounded-2xl font-black text-[#0f3460] text-xs uppercase" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGlobalSettingsTab;
