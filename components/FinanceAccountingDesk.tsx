import React, { useState } from 'react';
import { GlobalSettings, Student } from '../types';
import PaymentPoint from './PaymentPoint';
import BillSheet from './BillSheet';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  activeClass: string;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const FinanceAccountingDesk: React.FC<Props> = ({ settings, onSettingsChange, students, onStudentsUpdate, activeClass, notify }) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'billing'>('terminal');

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* High-Radius Finance Header - No Institutional Particulars */}
      <div className="bg-white p-12 rounded-[5rem] shadow-2xl border border-gray-100 no-print flex flex-col items-center">
        <div className="bg-[#0f3460] text-white py-3 px-16 rounded-full font-black text-sm uppercase tracking-[0.3em] shadow-lg mb-8">
           FINANCE & ACCOUNTING DESK
        </div>
        
        <div className="flex bg-gray-100 p-2 rounded-[2.5rem] mt-4 mb-4 shadow-inner">
           <button 
             onClick={() => setActiveTab('terminal')} 
             className={`px-12 py-3 rounded-[2rem] text-[10px] font-black uppercase transition-all ${activeTab === 'terminal' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
           >
             1. Payment Terminal
           </button>
           <button 
             onClick={() => setActiveTab('billing')} 
             className={`px-12 py-3 rounded-[2rem] text-[10px] font-black uppercase transition-all ${activeTab === 'billing' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
           >
             2. Billing Suite
           </button>
        </div>

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
           <FiscalStatCard label="Total Expected" value="GH₵ 45,200" color="text-blue-600" />
           <FiscalStatCard label="Total Received" value="GH₵ 38,150" color="text-green-600" />
           <FiscalStatCard label="Outstanding Arrears" value="GH₵ 7,050" color="text-red-600" />
        </div>
      </div>

      <div className="animate-fadeIn">
        {activeTab === 'terminal' ? (
          <PaymentPoint 
            students={students} 
            onStudentsUpdate={onStudentsUpdate} 
            settings={settings} 
            onSettingsChange={onSettingsChange} 
            notify={notify} 
          />
        ) : (
          <BillSheet 
            students={students.filter(s => s.currentClass === activeClass && s.status === 'Admitted')} 
            settings={settings} 
            onSettingsChange={onSettingsChange} 
            notify={notify} 
            activeClass={activeClass} 
          />
        )}
      </div>
    </div>
  );
};

const FiscalStatCard = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="bg-gray-50/50 p-6 rounded-[3rem] border border-gray-100 flex flex-col items-center text-center shadow-sm">
     <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</span>
     <span className={`text-xl font-black ${color} tracking-tighter`}>{value}</span>
  </div>
);

export default FinanceAccountingDesk;