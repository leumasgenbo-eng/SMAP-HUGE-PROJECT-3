
import React from 'react';
import { GlobalSettings } from '../types';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  title: string;
  variant?: 'standard' | 'double' | 'simple' | 'minimal';
}

const InstitutionalHeader: React.FC<Props> = ({ settings, onSettingsChange, title, variant = 'standard' }) => {
  return (
    <div className="text-center mb-8 flex flex-col items-center w-full animate-fadeIn">
      {/* BRANDING CORE: Updates here propagate to Management, Mock, and Assessment broad sheets */}
      <div className={`flex flex-col md:flex-row items-center gap-6 mb-6 ${variant === 'simple' ? 'justify-center' : ''}`}>
        <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2.5rem] border-4 border-gray-100 flex items-center justify-center overflow-hidden group relative flex-shrink-0 shadow-2xl transition-transform hover:scale-105">
          {settings.logo ? (
            <img src={settings.logo} className="w-full h-full object-contain" alt="Institution Logo" />
          ) : (
            <span className="text-6xl font-black text-gray-200">UBA</span>
          )}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center no-print p-4">
            <span className="text-[10px] text-white font-black uppercase mb-2">Update Logo</span>
            <EditableField 
              value={settings.logo} 
              onSave={v => onSettingsChange({...settings, logo: v})} 
              placeholder="Paste Logo URL..."
              className="text-[10px] text-white bg-white/10 border-white text-center w-full rounded-lg"
            />
          </div>
        </div>
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <EditableField 
            value={settings.schoolName} 
            onSave={v => onSettingsChange({...settings, schoolName: v})} 
            className="text-5xl md:text-7xl font-black text-[#0f3460] uppercase tracking-tighter leading-none" 
          />
          <EditableField 
            value={settings.motto} 
            onSave={v => onSettingsChange({...settings, motto: v})} 
            className="text-[12px] md:text-[16px] font-black uppercase tracking-[0.5em] text-[#cca43b] mt-3" 
          />
        </div>
      </div>

      {/* ECOSYSTEM PARTICULARS BAR */}
      <div className="space-y-2 mb-10 border-b-4 border-double border-gray-200 pb-10 w-full max-w-6xl">
        <EditableField 
          value={settings.address} 
          onSave={v => onSettingsChange({...settings, address: v})} 
          className="text-sm md:text-base font-black text-gray-400 w-full text-center uppercase tracking-[0.2em]"
        />
        <div className="flex justify-center flex-wrap gap-8 text-[12px] font-black text-gray-500 mt-6 bg-gray-50 px-10 py-4 rounded-full border-2 border-gray-100 shadow-inner no-print">
           <div className="flex items-center gap-3">
             <span className="text-[#cca43b] text-lg">📞</span>
             <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
           </div>
           <span className="text-gray-300 font-normal">|</span>
           <div className="flex items-center gap-3">
             <span className="text-[#cca43b] text-lg">✉️</span>
             <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className="lowercase" />
           </div>
        </div>
      </div>

      {/* DYNAMIC DOCUMENT TITLE */}
      <div className={`bg-[#0f3460] text-white py-4 px-20 inline-block font-black text-base md:text-lg rounded-2xl uppercase tracking-[0.3em] shadow-2xl border-b-8 border-[#cca43b] ${variant === 'double' ? 'scale-110 mb-8' : ''}`}>
        {title}
      </div>
    </div>
  );
};

export default InstitutionalHeader;
