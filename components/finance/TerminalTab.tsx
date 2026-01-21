
import React from 'react';
import { Student, GlobalSettings } from '../../types';

interface Props {
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  filteredStudents: Student[];
  paymentType: string;
  setPaymentType: (t: string) => void;
  amount: string;
  setAmount: (a: string) => void;
  newBill: string;
  setNewBill: (b: string) => void;
  settings: GlobalSettings;
  onAuthorize: () => void;
  onCancel: () => void;
}

const TerminalTab: React.FC<Props> = (props) => {
  const { settings, filteredStudents, selectedStudentId, setSelectedStudentId, paymentType, setPaymentType, newBill, setNewBill, amount, setAmount, onAuthorize } = props;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 space-y-6">
        <h4 className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">1. Learner Identification</h4>
        <select 
          className="w-full p-5 bg-white rounded-2xl border-2 border-[#0f3460]/10 font-black text-sm text-[#0f3460] shadow-sm outline-none focus:border-[#0f3460]" 
          value={selectedStudentId} 
          onChange={e => setSelectedStudentId(e.target.value)}
        >
          <option value="">-- Select Matching Learner ({filteredStudents.length}) --</option>
          {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.surname} ({s.serialId})</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-gray-400 block px-2">2. Ledger Category</label>
            <select className="w-full p-5 bg-gray-50 rounded-2xl border-none font-black text-xs" value={paymentType} onChange={e => setPaymentType(e.target.value)}>
               {settings.financeConfig.categories.map(c => <option key={c}>{c}</option>)}
            </select>
         </div>
         <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-gray-400 block px-2">3. Additional Bill</label>
            <input type="number" className="w-full p-5 bg-gray-50 rounded-2xl border-none font-black text-sm text-red-600" value={newBill} onChange={e => setNewBill(e.target.value)} />
         </div>
      </div>

      <div className="space-y-2">
         <label className="text-[9px] font-black uppercase text-gray-400 block px-2">4. Amount to be Paid (GH₵)</label>
         <input type="number" className="w-full p-6 bg-blue-50 rounded-[2rem] border-none font-black text-2xl text-[#0f3460] shadow-inner" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>

      <button onClick={onAuthorize} className="w-full bg-[#0f3460] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">Authorize Transaction</button>
    </div>
  );
};

export default TerminalTab;
