import React, { useState } from 'react';
import { GlobalSettings, Student } from '../types';
import AdminGlobalSettingsTab from './admin/AdminGlobalSettingsTab';
import AdminSystemControlsTab from './admin/AdminSystemControlsTab';
import StaffManagement from './StaffManagement';
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

type AdminTab = 'global' | 'hr registry' | 'cloud connector' | '4. school registry' | 'finance config' | 'system controls';

const AdminDashboard: React.FC<Props> = ({ notify, settings, onSettingsChange, students, onStudentsUpdate, dept }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('global');

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col min-h-[750px]">
        
        <div className="bg-[#0f3460] p-6 text-white flex justify-center border-b border-white/5 no-print">
          <div className="flex flex-wrap bg-white/5 p-2 rounded-[2.5rem] gap-2 border border-white/10 shadow-inner">
             {(['global', 'hr registry', 'cloud connector', '4. school registry', 'finance config', 'system controls'] as AdminTab[]).map(t => (
               <button 
                 key={t} 
                 onClick={() => setActiveTab(t)} 
                 className={`px-8 py-3 rounded-[1.8rem] text-[9px] font-black uppercase transition-all whitespace-nowrap tracking-widest ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460] shadow-xl scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 bg-gray-50/30 p-8 md:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'global' && <AdminGlobalSettingsTab settings={settings} onSettingsChange={onSettingsChange} />}
            
            {activeTab === 'system controls' && <AdminSystemControlsTab settings={settings} onSettingsChange={onSettingsChange} students={students} onStudentsUpdate={onStudentsUpdate} notify={notify} />}
            
            {activeTab === 'hr registry' && (
              <div className="animate-fadeIn rounded-[3rem] overflow-hidden bg-white">
                <StaffManagement settings={settings} onSettingsChange={onSettingsChange} department={dept} notify={notify} />
              </div>
            )}
            
            {activeTab === '4. school registry' && (
              <div className="animate-fadeIn space-y-6">
                <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
                   <div>
                     <h3 className="text-2xl font-black text-[#0f3460] uppercase">Master Pupil Database</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Total Enrolled Registry: {students.filter(s => s.status === 'Admitted').length}</p>
                   </div>
                   <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">Export Full Registry</button>
                </div>

                <div className="overflow-x-auto rounded-[3rem] border border-gray-100 shadow-2xl bg-white">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                      <tr>
                        <th className="p-6 border-b">Serial ID</th>
                        <th className="p-6 border-b">Learner Full Name</th>
                        <th className="p-6 border-b">Current Class</th>
                        <th className="p-6 border-b">Gender</th>
                        <th className="p-6 border-b">Guardian Contact</th>
                        <th className="p-6 border-b">Receipt ID</th>
                        <th className="p-6 border-b text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.filter(s => s.status === 'Admitted').map(s => (
                        <tr key={s.id} className="border-b hover:bg-blue-50/30 transition border-gray-100 bg-white">
                          <td className="p-5 font-black text-blue-600 font-mono">{s.serialId}</td>
                          <td className="p-5 font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</td>
                          <td className="p-5 font-bold text-gray-500 uppercase">{s.currentClass}</td>
                          <td className="p-5 font-bold uppercase">{s.sex}</td>
                          <td className="p-5 font-mono text-gray-400 font-bold">{s.father.contact}</td>
                          <td className="p-5 font-mono text-[9px]">{s.admissionFeeReceipt}</td>
                          <td className="p-5 text-center">
                             <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-tighter">OFFICIAL ENROLLED</span>
                          </td>
                        </tr>
                      ))}
                      {students.filter(s => s.status === 'Admitted').length === 0 && (
                        <tr><td colSpan={7} className="p-32 text-center text-gray-300 font-black uppercase italic tracking-widest">No enrolled records in primary registry.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'cloud connector' && <AdminCloudConnectorTab settings={settings} onSettingsChange={onSettingsChange} notify={notify} />}
            
            {activeTab === 'finance config' && (
                <div className="p-32 text-center flex flex-col items-center justify-center space-y-8 animate-fadeIn bg-white rounded-[4rem]">
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-5xl shadow-inner grayscale opacity-20">💸</div>
                  <div className="space-y-2">
                    <p className="text-gray-400 font-black uppercase text-2xl tracking-[0.2em]">Fiscal Engineering</p>
                    <p className="text-gray-300 font-bold uppercase text-[10px] italic tracking-widest leading-relaxed max-w-md mx-auto">
                      Restricted financial protocol area. Configure billing categories and tax ratios.
                    </p>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;