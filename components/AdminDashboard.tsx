
import React, { useState } from 'react';
import { GlobalSettings, Student } from '../types';
import AdminGlobalSettingsTab from './admin/AdminGlobalSettingsTab';
import AdminSystemControlsTab from './admin/AdminSystemControlsTab';
import AdminHRRegistryTab from './admin/AdminHRRegistryTab';
import AdminCloudConnectorTab from './admin/AdminCloudConnectorTab';

interface Props {
  section: string;
  dept: string;
  notify: any;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
}

type AdminTab = 'global' | 'hr' | 'cloud connector' | 'pupil registry' | 'finance config' | 'system controls';

const AdminDashboard: React.FC<Props> = ({ notify, settings, onSettingsChange, students, onStudentsUpdate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('global');

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="bg-[#0f3460] p-4 text-white flex justify-center border-b-4 border-[#cca43b] no-print">
          <div className="flex flex-wrap bg-white/10 p-1.5 rounded-2xl gap-1">
             {(['global', 'hr', 'cloud connector', 'pupil registry', 'finance config', 'system controls'] as AdminTab[]).map(t => (
               <button 
                 key={t} 
                 onClick={() => setActiveTab(t)} 
                 className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/40 hover:text-white'}`}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 bg-gray-50/50 p-6 md:p-10 min-h-[650px] overflow-y-auto">
          {activeTab === 'global' && <AdminGlobalSettingsTab settings={settings} onSettingsChange={onSettingsChange} />}
          {activeTab === 'system controls' && <AdminSystemControlsTab settings={settings} onSettingsChange={onSettingsChange} students={students} onStudentsUpdate={onStudentsUpdate} notify={notify} />}
          {activeTab === 'hr' && <AdminHRRegistryTab settings={settings} onSettingsChange={onSettingsChange} notify={notify} />}
          {activeTab === 'cloud connector' && <AdminCloudConnectorTab settings={settings} onSettingsChange={onSettingsChange} notify={notify} />}
          
          {['pupil registry', 'finance config'].includes(activeTab) && (
              <div className="p-20 text-center flex flex-col items-center justify-center space-y-6">
                <span className="text-8xl opacity-10">⚙️</span>
                <p className="text-gray-300 font-black uppercase text-xl italic tracking-widest leading-relaxed max-w-lg">Module Operational.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
