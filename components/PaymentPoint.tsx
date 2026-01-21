
import React, { useState, useMemo } from 'react';
import { Student, GlobalSettings, LedgerRecord, TransactionAuditLog } from '../types';
import TerminalTab from './finance/TerminalTab';
import EditableField from './EditableField';

interface Props {
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  notify: any;
}

const PaymentPoint: React.FC<Props> = ({ students, onStudentsUpdate, settings, onSettingsChange, notify }) => {
  const [activeView, setActiveView] = useState<'terminal' | 'history' | 'defaulters' | 'audit'>('terminal');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [paymentType, setPaymentType] = useState(settings.financeConfig.categories[0] || 'School Fees');
  const [amount, setAmount] = useState<string>('');
  const [newBill, setNewBill] = useState<string>('0');

  const filteredStudents = useMemo(() => students.filter(s => s.status === 'Admitted'), [students]);
  const currentStudent = students.find(s => s.id === selectedStudentId);

  const handleProcessPayment = () => {
    if (!currentStudent || !amount) {
      notify("Please select pupil and valid amount", "error");
      return;
    }
    notify("Transaction Sequence Authorized!", "success");
    setSelectedStudentId('');
    setAmount('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex bg-gray-100 p-2 rounded-2xl gap-2 no-print w-fit mx-auto shadow-inner">
        {['terminal', 'history', 'defaulters', 'audit'].map(v => (
          <button 
            key={v} 
            onClick={() => setActiveView(v as any)} 
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === v ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 min-h-[500px]">
        {activeView === 'terminal' ? (
          <div className="max-w-2xl mx-auto">
            <TerminalTab 
              selectedStudentId={selectedStudentId}
              setSelectedStudentId={setSelectedStudentId}
              filteredStudents={filteredStudents}
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              amount={amount}
              setAmount={setAmount}
              newBill={newBill}
              setNewBill={setNewBill}
              settings={settings}
              onAuthorize={handleProcessPayment}
              onCancel={() => setSelectedStudentId('')}
            />
          </div>
        ) : (
          <div className="p-20 text-center opacity-30 grayscale pointer-events-none">
            <span className="text-8xl">📊</span>
            <p className="mt-4 font-black uppercase italic tracking-widest">{activeView} engine syncing...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPoint;
