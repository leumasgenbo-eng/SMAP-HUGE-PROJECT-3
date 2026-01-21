
import React, { useState, useMemo } from 'react';
import { GlobalSettings, Student } from '../types';
import StaffManagement from './StaffManagement';
import FacilitatorRewardHub from './FacilitatorRewardHub';
import MaterialsLogistics from './MaterialsLogistics';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  activeTabGlobal: string;
  activeClassGlobal: string;
}

const ManagersDesk: React.FC<Props> = ({ settings, onSettingsChange, students, notify, onStudentsUpdate, activeTabGlobal, activeClassGlobal }) => {
  const [activeTab, setActiveTab] = useState<'kpis' | 'assess' | 'approval' | 'rewards' | 'logistics' | 'staff'>('kpis');

  const goToHub = () => {
    window.dispatchEvent(new CustomEvent('uba-goto-hub'));
  };

  const financialStats = useMemo(() => {
    let totalRevenue = 0;
    let totalArrears = 0;
    students.forEach(s => {
      const balance = s.ledger?.[s.ledger.length - 1]?.currentBalance || 0;
      if (balance > 0) totalArrears += balance;
      s.ledger?.forEach(l => {
        totalRevenue += l.amountPaid || 0;
      });
    });
    return { totalRevenue, totalArrears };
  }, [students]);

  const enrollmentStats = useMemo(() => {
    const total = students.filter(s => s.status === 'Admitted').length;
    const applicants = students.filter(s => ['Pending', 'Scheduled', 'Results Ready'].includes(s.status));
    const approvalPool = students.filter(s => s.status === 'Results Ready');
    return { total, applicants, approvalPool };
  }, [students]);

  const updateTestScore = (id: string, field: string, val: number) => {
    onStudentsUpdate(students.map(s => {
      if (s.id === id) {
        const scores = { ...(s.testDetails?.scores || { script: 0, handwriting: 0, spelling: 0, oral: 0, logic: 0 }), [field]: val };
        return { 
          ...s, 
          status: 'Results Ready',
          testDetails: { ...s.testDetails!, scores } 
        };
      }
      return s;
    }));
  };

  const approvePupil = (id: string) => {
    onStudentsUpdate(students.map(s => {
      if (s.id === id) {
        return { 
          ...s, 
          status: 'Admitted', 
          serialId: `UBA-${String(s.currentClass).replace(/\s/g, '')}-${Date.now().toString().slice(-3)}`
        };
      }
      return s;
    }));
    notify("Learner officially authorized and enrolled.", "success");
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Academy Hub Quick Link */}
      <button 
        onClick={goToHub}
        className="no-print absolute top-8 left-8 bg-[#0f3460] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-2xl hover:scale-105 transition-all z-20 border border-white/10"
      >
        🏢 [1] ACADEMY HUB
      </button>

      <div className="bg-white p-12 rounded-[5rem] shadow-2xl border border-gray-100 no-print flex flex-col items-center">
        <div className="bg-[#cca43b] text-[#0f3460] py-3 px-16 rounded-full font-black text-sm uppercase tracking-[0.3em] shadow-lg mb-8">
           EXECUTIVE MANAGEMENT CONSOLE
        </div>
        
        <div className="flex justify-center mb-8 bg-gray-100 p-2 rounded-[2.5rem] w-fit mx-auto shadow-inner">
           <div className="flex flex-wrap gap-1">
              <button onClick={() => setActiveTab('kpis')} className={`px-8 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'kpis' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400'}`}>KPI Dashboard</button>
              <button onClick={() => setActiveTab('assess')} className={`px-8 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'assess' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-gray-400'}`}>2. Assess</button>
              <button onClick={() => setActiveTab('approval')} className={`px-8 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'approval' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-gray-400'}`}>3. Approval</button>
              <button onClick={() => setActiveTab('rewards')} className={`px-8 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'rewards' ? 'bg-[#2e8b57] text-white shadow-lg' : 'text-gray-400'}`}>Reward Hub</button>
              <button onClick={() => setActiveTab('logistics')} className={`px-8 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'logistics' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-gray-400'}`}>Logistics</button>
              <button onClick={() => setActiveTab('staff')} className={`px-8 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeTab === 'staff' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400'}`}>Personnel</button>
           </div>
        </div>

        {activeTab === 'kpis' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 animate-fadeIn w-full max-w-5xl">
            <StatCard 
              title="Audit Revenue" 
              value={`GH₵ ${financialStats.totalRevenue.toLocaleString()}`} 
              subtitle={`GH₵ ${financialStats.totalArrears.toLocaleString()} in Arrears`}
              icon="💰"
              color="text-green-600"
            />
            <StatCard 
              title="Learner Population" 
              value={enrollmentStats.total.toString()} 
              subtitle={`${enrollmentStats.applicants.length} active applicants`}
              icon="👥"
              color="text-blue-600"
            />
            <StatCard 
              title="Admission Pool" 
              value={enrollmentStats.approvalPool.length.toString()} 
              subtitle="Pending final authorization"
              icon="🛡️"
              color="text-red-500"
            />
          </div>
        )}

        {activeTab === 'assess' && (
          <div className="space-y-8 animate-fadeIn mt-6 w-full">
             <div className="border-b pb-4">
                <h3 className="text-xl font-black text-[#0f3460] uppercase">Admission Assessment Lab</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Score capture for applicants in the current cycle</p>
             </div>
             <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50/20">
                <table className="w-full text-left text-[11px] border-collapse">
                   <thead className="bg-[#0f3460] text-white font-black uppercase">
                      <tr>
                         <th className="p-5">Applicant Name</th>
                         <th className="p-5">Target Class</th>
                         <th className="p-5 text-center">Oral (20)</th>
                         <th className="p-5 text-center">Script (40)</th>
                         <th className="p-5 text-center">Logic (20)</th>
                         <th className="p-5 text-center bg-white/10">Total (100)</th>
                         <th className="p-5 text-center">Workflow</th>
                      </tr>
                   </thead>
                   <tbody>
                     {enrollmentStats.applicants.map(s => {
                       const sc = s.testDetails?.scores || { script: 0, oral: 0, logic: 0, spelling: 0 };
                       const total = (Object.values(sc) as any[]).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                       return (
                         <tr key={s.id} className="border-b hover:bg-white transition bg-white/50">
                           <td className="p-5 font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</td>
                           <td className="p-5 font-bold text-gray-400 uppercase">{s.classApplyingFor}</td>
                           <td className="p-5 text-center"><input type="number" className="w-12 p-1 bg-gray-100 rounded text-center font-bold" value={sc.oral} onChange={e => updateTestScore(s.id, 'oral', parseInt(e.target.value))} /></td>
                           <td className="p-5 text-center"><input type="number" className="w-12 p-1 bg-gray-100 rounded text-center font-bold" value={sc.script} onChange={e => updateTestScore(s.id, 'script', parseInt(e.target.value))} /></td>
                           <td className="p-5 text-center"><input type="number" className="w-12 p-1 bg-gray-100 rounded text-center font-bold" value={sc.logic} onChange={e => updateTestScore(s.id, 'logic', parseInt(e.target.value))} /></td>
                           <td className="p-5 text-center font-black text-lg text-[#2e8b57] bg-green-50">{total}</td>
                           <td className="p-5 text-center">
                             <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${total > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                               {total > 0 ? 'READY' : 'PENDING'}
                             </span>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'approval' && (
          <div className="space-y-10 animate-fadeIn mt-6 w-full">
            <div className="border-b pb-4">
              <h3 className="text-xl font-black text-[#0f3460] uppercase">Admission Authorization Desk</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manager's final certification for institutional enrollment</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {enrollmentStats.approvalPool.map(s => {
                 const sc = s.testDetails?.scores || { script: 0, oral: 0, logic: 0 };
                 const total = (Object.values(sc) as any[]).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                 return (
                   <div key={s.id} className="bg-white p-8 rounded-[3rem] border-4 border-gray-50 shadow-xl space-y-6 hover:border-[#cca43b] transition relative overflow-hidden">
                      <div className="flex justify-between items-start">
                         <div>
                            <h4 className="font-black text-[#0f3460] uppercase text-lg leading-tight">{s.firstName} {s.surname}</h4>
                            <p className="text-[9px] font-black text-[#cca43b] uppercase">Goal: {s.classApplyingFor}</p>
                         </div>
                         <div className="text-right">
                            <span className="text-[10px] font-black text-gray-400 block">SCORE</span>
                            <span className={`text-3xl font-black ${total >= 50 ? 'text-green-600' : 'text-red-600'}`}>{total}/100</span>
                         </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl text-[9px] font-bold space-y-1">
                         <div className="flex justify-between"><span>Receipt ID:</span> <span className="text-blue-600">{s.admissionFeeReceipt}</span></div>
                         <div className="flex justify-between"><span>Parent/G:</span> <span>{s.father.name}</span></div>
                      </div>
                      <div className="flex gap-2 pt-2">
                         <button onClick={() => approvePupil(s.id)} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:scale-105 transition">Authorize Entry</button>
                         <button className="px-4 py-4 rounded-2xl bg-red-50 text-red-600 font-black uppercase text-[10px]">Decline</button>
                      </div>
                   </div>
                 );
               })}
               {enrollmentStats.approvalPool.length === 0 && (
                 <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase italic tracking-widest leading-relaxed">No candidates currently awaiting executive authorization.</div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="animate-fadeIn mt-6 w-full">
             <FacilitatorRewardHub settings={settings} onSettingsChange={onSettingsChange} notify={notify} />
          </div>
        )}

        {activeTab === 'logistics' && (
          <div className="animate-fadeIn mt-6 w-full">
             <MaterialsLogistics settings={settings} onSettingsChange={onSettingsChange} activeClass={activeClassGlobal} staffList={settings.staff} notify={notify} />
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="mt-8 animate-fadeIn w-full">
             <StaffManagement settings={settings} onSettingsChange={onSettingsChange} department="Executive" notify={notify} />
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, color }: any) => (
  <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 hover:border-[#cca43b] transition group shadow-sm flex flex-col items-center text-center">
    <div className="text-4xl mb-4 group-hover:scale-125 transition-transform">{icon}</div>
    <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">{title}</h4>
    <p className={`text-3xl font-black ${color} tracking-tighter`}>{value}</p>
    <p className="text-[8px] font-bold text-gray-400 mt-2 uppercase italic">{subtitle}</p>
  </div>
);

export default ManagersDesk;
