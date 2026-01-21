
import React from 'react';
import { GlobalSettings } from '../types';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onLaunch: (app: 'management' | 'mock' | 'assessment') => void;
}

const AppLauncher: React.FC<Props> = ({ settings, onLaunch }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 md:p-12 animate-fadeIn font-sans">
      <div className="max-w-6xl w-full space-y-20">
        
        {/* INSTITUTIONAL ANCHOR */}
        <div className="text-center space-y-8">
           <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[3rem] mx-auto shadow-2xl flex items-center justify-center border-4 border-[#cca43b] overflow-hidden mb-10 group cursor-pointer transition-all hover:scale-110 active:scale-95">
              {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <span className="text-7xl">🎓</span>}
           </div>
           <h1 className="text-5xl md:text-8xl font-black text-[#0f3460] uppercase tracking-tighter leading-none">
             {settings.schoolName}
           </h1>
           <p className="text-sm md:text-lg font-black text-[#cca43b] uppercase tracking-[0.6em] italic">
             {settings.motto}
           </p>
           <div className="h-2 w-48 bg-[#cca43b] mx-auto rounded-full mt-12 opacity-30"></div>
        </div>

        {/* UNIFIED CONNECTORS - State based, no external redirects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
           
           <LauncherCard 
             icon="🏛️"
             title="Management Hub"
             subtitle="PRIMARY S-MAP ENGINE"
             desc="Authorized portal for staff deployment, financial audits, and primary class registers."
             color="blue"
             onClick={() => onLaunch('management')}
           />

           <LauncherCard 
             icon="📝"
             title="Mock Exam Desk"
             subtitle="BECE SIMULATION ENGINE"
             desc="Graduation workspace for Mock Series entry, NRT curve grading, and JHS broadsheets."
             color="yellow"
             onClick={() => onLaunch('mock')}
           />

           <LauncherCard 
             icon="📊"
             title="Assessment Lab"
             subtitle="ANALYTICAL GRADING HUB"
             desc="Deep developmental tracking, taxonomy auditing, and indicator performance logs."
             color="green"
             onClick={() => onLaunch('assessment')}
           />

        </div>

        {/* ECOSYSTEM FOOTER */}
        <div className="pt-20 text-center border-t border-gray-200">
           <p className="text-[12px] font-black text-gray-300 uppercase tracking-[0.5em] mb-10 uppercase">
             United Baylor Academy Unified Ecosystem • Project zokbowglwohpfqmjnemc Active
           </p>
           <div className="flex flex-col md:flex-row justify-center gap-10 md:gap-16 text-[12px] font-black text-gray-500 uppercase">
              <span className="flex items-center justify-center gap-3"><span className="text-[#cca43b]">📍</span> {settings.address}</span>
              <span className="flex items-center justify-center gap-3"><span className="text-[#cca43b]">📞</span> {settings.telephone}</span>
              <span className="flex items-center justify-center gap-3"><span className="text-[#cca43b]">✉️</span> {settings.email}</span>
           </div>
        </div>

      </div>
    </div>
  );
};

const LauncherCard = ({ icon, title, subtitle, desc, color, onClick }: any) => {
  const colors = {
    blue: 'hover:border-[#0f3460] text-[#0f3460] bg-blue-50',
    yellow: 'hover:border-[#cca43b] text-[#cca43b] bg-yellow-50',
    green: 'hover:border-[#2e8b57] text-[#2e8b57] bg-green-50'
  };
  
  return (
    <div 
      onClick={onClick}
      className={`group bg-white p-12 rounded-[4rem] shadow-2xl transition-all cursor-pointer border-4 border-transparent flex flex-col items-center text-center space-y-10 ${colors[color as keyof typeof colors]}`}
    >
      <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center text-6xl group-hover:scale-110 transition-transform shadow-inner ${color === 'blue' ? 'bg-blue-100' : color === 'yellow' ? 'bg-yellow-100' : 'bg-green-100'}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-3xl font-black uppercase tracking-tighter">{title}</h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 italic">{subtitle}</p>
      </div>
      <p className="text-[13px] text-gray-500 leading-relaxed font-semibold px-2">
        {desc}
      </p>
      <div className="pt-4">
         <span className={`${color === 'blue' ? 'bg-[#0f3460]' : color === 'yellow' ? 'bg-[#cca43b]' : 'bg-[#2e8b57]'} text-white px-12 py-5 rounded-[2rem] text-[11px] font-black uppercase shadow-2xl transition-all group-hover:scale-105`}>
            Launch Ecosystem Module
         </span>
      </div>
    </div>
  );
};

export default AppLauncher;
