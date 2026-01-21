
import React from 'react';
import { GlobalSettings } from '../types';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  title: string;
  variant?: 'standard' | 'double' | 'simple';
}

const InstitutionalHeader: React.FC<Props> = ({ settings, onSettingsChange, title, variant = 'standard' }) => {
  return (
    <div className="text-center mb-8 flex flex-col items-center w-full">
      <div className={`flex items-center gap-6 mb-4 ${variant === 'simple' ? 'justify-center' : ''}`}>
        <div className="w-24 h-24 bg-gray-50 rounded-3xl border-2 border-gray-100 flex items-center justify-center overflow-hidden group relative flex-shrink-0 shadow-sm">
          {settings.logo ? (
            <img src={settings.logo} className="w-full h-full object-contain" alt="Logo" />
          ) : (
            <span className="text-4xl font-black text-gray-200">UBA</span>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center no-print">
            <EditableField 
              value={settings.logo} 
              onSave={v => onSettingsChange({...settings, logo: v})} 
              placeholder="Logo URL"
              className="text-[8px] text-white bg-transparent border-white"
            />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <EditableField 
            value={settings.schoolName} 
            onSave={v => onSettingsChange({...settings, schoolName: v})} 
            className="text-4xl md:text-6xl font-black text-[#0f3460] uppercase tracking-tighter leading-none" 
          />
          <EditableField 
            value={settings.motto} 
            onSave={v => onSettingsChange({...settings, motto: v})} 
            className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-[#cca43b] mt-2" 
          />
        </div>
      </div>

      <div className="space-y-1 mb-6 border-b border-gray-100 pb-6 w-full max-w-4xl">
        <EditableField 
          value={settings.address} 
          onSave={v => onSettingsChange({...settings, address: v})} 
          className="text-xs font-black text-gray-500 w-full text-center uppercase tracking-widest"
        />
        <div className="flex justify-center gap-6 text-[10px] font-black text-gray-400 mt-2 bg-gray-50 px-6 py-2 rounded-full border border-gray-100 no-print">
           <div className="flex items-center gap-1">
             <span className="text-[#cca43b]">📞</span>
             <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
           </div>
           <span className="text-gray-200">|</span>
           <div className="flex items-center gap-1">
             <span className="text-[#cca43b]">✉️</span>
             <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className="lowercase" />
           </div>
        </div>
      </div>

      <div className={`bg-[#0f3460] text-white py-2.5 px-12 inline-block font-black text-sm rounded-xl uppercase tracking-widest shadow-xl border-b-4 border-[#cca43b] ${variant === 'double' ? 'scale-110 mb-4' : ''}`}>
        {title}
      </div>
    </div>
  );
};

export default InstitutionalHeader;
