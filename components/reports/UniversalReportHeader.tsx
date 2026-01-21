import React from 'react';
import { GlobalSettings } from '../../types';
import EditableField from '../EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  title?: string;
  className?: string;
}

const UniversalReportHeader: React.FC<Props> = ({ settings, onSettingsChange, title, className = "" }) => {
  return (
    <div className={`text-center border-b-4 border-black pb-8 mb-8 flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-6 mb-4">
        <div className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-gray-100 flex items-center justify-center overflow-hidden group relative no-print">
           {settings.logo ? (
             <img src={settings.logo} className="w-full h-full object-contain" alt="Logo" />
           ) : (
             <span className="text-4xl opacity-10">📷</span>
           )}
           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <EditableField 
              value={settings.logo} 
              onSave={v => onSettingsChange({...settings, logo: v})} 
              placeholder=""
              className="text-[8px] text-white bg-transparent border-white"
            />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <EditableField 
            value={settings.schoolName} 
            onSave={v => onSettingsChange({...settings, schoolName: v})} 
            placeholder="School Name"
            className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter leading-none" 
          />
          <EditableField 
            value={settings.motto} 
            onSave={v => onSettingsChange({...settings, motto: v})} 
            placeholder="Motto"
            className="text-[11px] font-black uppercase tracking-[0.4em] text-[#cca43b] mt-2" 
          />
        </div>
      </div>

      <div className="space-y-1 mb-4 w-full">
        <EditableField 
          value={settings.address} 
          onSave={v => onSettingsChange({...settings, address: v})} 
          placeholder="Postal Address"
          className="text-xs font-black text-gray-500 w-full text-center uppercase tracking-widest"
        />
        <div className="flex justify-center gap-6 text-[10px] font-black text-gray-400 mt-2 bg-gray-50 px-6 py-1.5 rounded-full border border-gray-100 no-print">
           <div className="flex items-center gap-1">
             <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} placeholder="Telephone" />
           </div>
           <div className="flex items-center gap-1">
             <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} placeholder="Email" className="lowercase" />
           </div>
        </div>
      </div>

      {title && (
        <div className="bg-black text-white py-2 px-12 inline-block font-black text-xs rounded-lg uppercase tracking-widest shadow-md mt-4">
           {title}
        </div>
      )}
    </div>
  );
};

export default UniversalReportHeader;