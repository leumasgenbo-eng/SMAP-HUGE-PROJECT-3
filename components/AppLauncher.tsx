
import React from 'react';
import { GlobalSettings } from '../types';

interface Props {
  settings: GlobalSettings;
  onLaunch: (app: 'management' | 'mock' | 'assessment') => void;
}

const AppLauncher: React.FC<Props> = ({ settings, onLaunch }) => {
  return (
    <div className="min-h-screen bg-[#f4f6f7] flex flex-col items-center justify-center p-6 md:p-12 animate-fadeIn font-sans">
      <div className="max-w-6xl w-full space-y-16">
        
        {/* Institutional Branding */}
        <div className="text-center space-y-4">
           <div className="w-24 h-24 bg-white rounded-[2rem] mx-auto shadow-2xl flex items-center justify-center border-4 border-[#cca43b] overflow-hidden mb-6 group cursor-pointer transition-transform hover:scale-110">
              {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <span className="text-5xl">🎓</span>}
           </div>
           <h1 className="text-4xl md:text-6xl font-black text-[#0f3460] uppercase tracking-tighter leading-none">
             {settings.schoolName}
           </h1>
           <p className="text-xs md:text-sm font-black text-[#cca43b] uppercase tracking-[0.4em]">
             {settings.motto}
           </p>
           <div className="h-1.5 w-24 bg-[#cca43b] mx-auto rounded-full mt-8 opacity-50"></div>
        </div>

        {/* Apps Switchboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           
           {/* Management App Card */}
           <div 
             onClick={() => onLaunch('management')}
             className="group bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all cursor-pointer border-4 border-transparent hover:border-[#0f3460] flex flex-col items-center text-center space-y-6"
           >
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shadow-inner">📋</div>
              <div>
                <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Management Hub</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">CORE S-MAP SYSTEM</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Comprehensive portal for attendance, HR, finance, and generic class reports.
              </p>
              <div className="pt-4">
                 <span className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase group-hover:bg-[#cca43b] group-hover:text-[#0f3460] transition-all shadow-lg">Launch Hub</span>
              </div>
           </div>

           {/* BECE Mock App Card */}
           <div 
             onClick={() => onLaunch('mock')}
             className="group bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all cursor-pointer border-4 border-transparent hover:border-[#cca43b] flex flex-col items-center text-center space-y-6"
           >
              <div className="w-20 h-20 bg-yellow-50 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shadow-inner">📝</div>
              <div>
                <h3 className="text-xl font-black text-[#cca43b] uppercase tracking-tighter">Mock Exam Desk</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">BECE SIMULATION ENGINE</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Specialized Basic 9 graduation workspace for MOCK series entry and reporting.
              </p>
              <div className="pt-4">
                 <span className="bg-[#cca43b] text-[#0f3460] px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg transition-all">Open Desk</span>
              </div>
           </div>

           {/* Assessment App Card */}
           <div 
             onClick={() => onLaunch('assessment')}
             className="group bg-white p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all cursor-pointer border-4 border-transparent hover:border-[#2e8b57] flex flex-col items-center text-center space-y-6"
           >
              <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shadow-inner">📊</div>
              <div>
                <h3 className="text-xl font-black text-[#2e8b57] uppercase tracking-tighter">Assessment Lab</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">ANALYTICAL GRADING HUB</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Deep performance tracking, weekly exercises, and developmental indicators.
              </p>
              <div className="pt-4">
                 <span className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg transition-all">Enter Lab</span>
              </div>
           </div>

        </div>

        {/* Footer Info */}
        <div className="pt-12 text-center border-t border-gray-200">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">United Baylor Academy Digital Ecosystem • Managed by S-MAP v3.0.4</p>
           <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-10 mt-6 text-[10px] font-bold text-gray-500 uppercase">
              <span className="flex items-center justify-center gap-1"><span className="text-[#cca43b]">📍</span> {settings.address}</span>
              <span className="flex items-center justify-center gap-1"><span className="text-[#cca43b]">📞</span> {settings.telephone}</span>
              <span className="flex items-center justify-center gap-1"><span className="text-[#cca43b]">✉️</span> {settings.email}</span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AppLauncher;
