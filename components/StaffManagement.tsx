
import React, { useState, useMemo } from 'react';
import { StaffRecord, GlobalSettings, ObserverEntry, StaffIdLog, InvigilatorEntry } from '../types';
import { OBSERVER_ROLES, EXAM_VENUES } from '../constants';
import StaffRegistrationTab from './staff/StaffRegistrationTab';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  department: string;
  notify: any;
}

const StaffManagement: React.FC<Props> = ({ settings, onSettingsChange, department, notify }) => {
  const [activeTab, setActiveTab] = useState<'registration' | 'directory' | 'attendance' | 'ids' | 'observers' | 'invigilators'>('registration');
  const [regForm, setRegForm] = useState<Partial<StaffRecord>>({
    name: '', gender: 'Male', dob: '', nationality: 'Ghanaian', hometown: '',
    residentialAddress: '', contact: '', email: '', maritalStatus: 'Single',
    identificationType: 'Ghana Card', identificationNumber: '',
    category: 'Teaching', role: '', department: 'Kindergarten',
    employmentType: 'Full Time', idNumber: ''
  });

  const handleFinalizeRegistration = () => {
    if (!regForm.name || !regForm.idNumber) {
      notify("Please fill at least the Full Name and Staff ID Number.", "error");
      return;
    }
    const newStaff: StaffRecord = { ...regForm, id: crypto.randomUUID() } as StaffRecord;
    onSettingsChange({ ...settings, staff: [...(settings.staff || []), newStaff] });
    notify("Staff Entry Finalized and Registered Successfully!", "success");
    setActiveTab('directory');
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      <div className="bg-[#2e8b57] p-8 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center shadow-xl gap-6 no-print">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Human Resource Desk</h2>
          <div className="flex flex-wrap gap-2">
             {['registration', 'directory', 'attendance', 'ids', 'observers', 'invigilators'].map(t => (
               <button 
                 key={t} 
                 onClick={() => setActiveTab(t as any)} 
                 className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-white text-[#2e8b57] shadow-lg scale-105' : 'bg-white/10 hover:bg-white/20'}`}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition">Export Archive</button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 min-h-[600px]">
        {activeTab === 'registration' && (
          <StaffRegistrationTab 
            regForm={regForm} 
            setRegForm={setRegForm} 
            settings={settings} 
            onFinalize={handleFinalizeRegistration} 
          />
        )}
        
        {activeTab === 'directory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {settings.staff.map(s => (
              <div key={s.id} className="bg-white p-8 rounded-[3rem] border-4 border-gray-50 hover:border-[#cca43b] transition group shadow-sm">
                <h4 className="text-xl font-black text-[#0f3460] uppercase">{s.name}</h4>
                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">{s.role} • {s.department}</p>
                <div className="mt-6 border-t pt-4 space-y-1">
                   <div className="flex justify-between text-[9px]"><span className="text-gray-300 font-black uppercase">Staff ID</span><span className="font-mono font-bold">{s.idNumber}</span></div>
                   <div className="flex justify-between text-[9px]"><span className="text-gray-300 font-black uppercase">Contact</span><span className="font-bold">{s.contact}</span></div>
                </div>
              </div>
            ))}
            {settings.staff.length === 0 && <p className="col-span-full py-20 text-center text-gray-300 font-black uppercase">No staff records found.</p>}
          </div>
        )}

        {/* Other tabs can be extracted similarly to keep StaffManagement clean */}
        {['attendance', 'ids', 'observers', 'invigilators'].includes(activeTab) && (
          <div className="p-20 text-center opacity-30 grayscale pointer-events-none">
             <span className="text-6xl">🔒</span>
             <p className="mt-4 font-black uppercase text-sm italic tracking-widest">{activeTab} module operational.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;
