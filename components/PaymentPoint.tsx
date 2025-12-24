
import React, { useState, useMemo, useEffect } from 'react';
import { Student, GlobalSettings, LedgerRecord, StaffRecord, TransactionAuditLog } from '../types';
import { CLASS_MAPPING } from '../constants';
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
  const [historyScope, setHistoryScope] = useState<'Individual' | 'Class' | 'School'>('Individual');
  
  // Terminal Logic
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedClass, setSelectedClass] = useState('Basic 1');
  const [paymentType, setPaymentType] = useState(settings.financeConfig.categories[0] || 'School Fees');
  const [amount, setAmount] = useState<string>('');
  const [newBill, setNewBill] = useState<string>('0');
  const [receiptMode, setReceiptMode] = useState(false);
  const [lastProcessedRecord, setLastProcessedRecord] = useState<LedgerRecord | null>(null);
  
  // Security Layer
  const [authorizedStaffId, setAuthorizedStaffId] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Audit States
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All Classes');

  const categories = settings.financeConfig.categories;
  const allClasses = Object.values(CLASS_MAPPING).flat();
  const authorizedStaffList = useMemo(() => settings.staff.filter(s => s.authorizedForFinance), [settings.staff]);

  // --- Derived Data ---
  const allAdmittedStudents = useMemo(() => students.filter(s => s.status === 'Admitted'), [students]);

  const filteredStudents = useMemo(() => {
    return allAdmittedStudents.filter(s => {
      const nameMatch = `${s.firstName} ${s.surname}`.toLowerCase().includes(searchQuery.toLowerCase());
      const serialMatch = s.serialId.toLowerCase().includes(searchQuery.toLowerCase());
      const classMatch = classFilter === 'All Classes' || s.currentClass === classFilter;
      return (nameMatch || serialMatch) && classMatch;
    });
  }, [allAdmittedStudents, searchQuery, classFilter]);

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const selectedStaff = authorizedStaffList.find(s => s.id === authorizedStaffId);

  // Auto-set default bill amount when selection changes
  useEffect(() => {
    if (currentStudent && paymentType) {
      const defaultAmt = settings.financeConfig.classBills[currentStudent.currentClass]?.[paymentType] || 0;
      setNewBill(defaultAmt.toString());
      setAmount(defaultAmt.toString());
    }
  }, [selectedStudentId, paymentType, currentStudent, settings.financeConfig.classBills]);

  // Deep History Aggregator
  const masterLedger = useMemo(() => {
    return students.flatMap(s => (s.ledger || []).map(l => ({ 
      ...l, 
      studentName: `${s.firstName} ${s.surname}`, 
      studentClass: s.currentClass,
      studentSerial: s.serialId
    }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [students]);

  const classHistory = useMemo(() => {
    return masterLedger.filter(l => l.studentClass === selectedClass);
  }, [masterLedger, selectedClass]);

  const individualHistory = useMemo(() => {
    return masterLedger.filter(l => l.studentSerial === currentStudent?.serialId);
  }, [masterLedger, currentStudent]);

  // Audit Logic
  const auditData = useMemo(() => {
    const selected = new Date(auditDate);
    const dayStr = auditDate;
    
    // Week Logic (Sun-Sat)
    const firstDayOfWeek = new Date(selected);
    firstDayOfWeek.setDate(selected.getDate() - selected.getDay());
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    
    const monthPrefix = auditDate.slice(0, 7); // YYYY-MM

    const dayTransactions = masterLedger.filter(l => l.date === dayStr);
    const weekTransactions = masterLedger.filter(l => {
      const d = new Date(l.date);
      return d >= firstDayOfWeek && d <= lastDayOfWeek;
    });
    const monthTransactions = masterLedger.filter(l => l.date.startsWith(monthPrefix));
    
    return {
      day: dayTransactions,
      dayTotal: dayTransactions.reduce((a, b) => a + b.amountPaid, 0),
      weekTotal: weekTransactions.reduce((a, b) => a + b.amountPaid, 0),
      monthTotal: monthTransactions.reduce((a, b) => a + b.amountPaid, 0),
      termTotal: masterLedger.reduce((a, b) => a + b.amountPaid, 0),
      dayClosingArrears: allAdmittedStudents.reduce((acc, s) => acc + (s.ledger?.[s.ledger.length-1]?.currentBalance || 0), 0)
    };
  }, [masterLedger, auditDate, allAdmittedStudents]);

  const defaultersList = useMemo(() => {
    return allAdmittedStudents.filter(s => {
      const lastRec = s.ledger?.[s.ledger.length - 1];
      return (lastRec && lastRec.currentBalance > 0) || (!s.isFeesCleared && s.ledger?.length === 0);
    }).map(s => {
      const lastRec = s.ledger?.[s.ledger.length - 1];
      return {
        id: s.id,
        name: `${s.firstName} ${s.surname}`,
        class: s.currentClass,
        serial: s.serialId,
        balance: lastRec ? lastRec.currentBalance : 0,
        lastCategory: lastRec ? lastRec.category : 'N/A'
      };
    }).sort((a, b) => b.balance - a.balance);
  }, [allAdmittedStudents]);

  // --- Security Handlers ---
  const requestOTP = () => {
    if (!authorizedStaffId) {
      notify("Please select an authorized staff member.", "error");
      return;
    }
    setOtpRequested(true);
    notify(`OTP shared to ${selectedStaff?.contact || 'WhatsApp/Email'}.`, "info");
  };

  const verifyOTP = () => {
    if (otpValue === '1234') { // Mock verification
      setIsAuthenticated(true);
      setOtpRequested(false);
      notify("Staff Authentication Successful!", "success");
    } else {
      notify("Invalid OTP code. Please re-enter.", "error");
    }
  };

  const handleProcessPayment = () => {
    if (!isAuthenticated) {
      notify("Authorized staff verification required.", "error");
      return;
    }

    if (!currentStudent || !amount || parseFloat(amount) < 0) {
      notify("Please select pupil and valid amount", "error");
      return;
    }

    const payValue = parseFloat(amount);
    const billValue = parseFloat(newBill);
    const taxConfig = settings.financeConfig.taxConfig;
    
    let taxAmount = 0;
    if (taxConfig.isTaxEnabled && billValue > 0) {
      const totalTaxRate = taxConfig.vatRate + taxConfig.nhilRate + taxConfig.getLevyRate + taxConfig.covidLevyRate;
      taxAmount = (billValue * totalTaxRate) / 100;
    }

    const lastBalance = currentStudent.ledger?.[currentStudent.ledger.length - 1]?.currentBalance || 0;
    const amountDue = lastBalance + billValue + taxAmount;
    const currentBal = amountDue - payValue;

    const txCode = `UBA-PY-${Date.now().toString().slice(-4)}`;

    const newRecord: LedgerRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      transactionCode: txCode,
      balanceBF: lastBalance,
      newBill: billValue,
      taxAmount: taxAmount,
      totalBill: amountDue,
      amountPaid: payValue,
      currentBalance: currentBal,
      status: currentBal <= 0 ? 'Full' : 'Partial',
      category: paymentType,
      processedBy: {
        staffId: selectedStaff!.idNumber,
        staffName: selectedStaff!.name,
        time: new Date().toLocaleTimeString()
      }
    };

    const newAuditLog: TransactionAuditLog = {
      id: crypto.randomUUID(),
      date: newRecord.date,
      time: newRecord.processedBy!.time,
      staffId: selectedStaff!.idNumber,
      staffName: selectedStaff!.name,
      learnerId: currentStudent.serialId,
      learnerName: `${currentStudent.firstName} ${currentStudent.surname}`,
      amount: payValue,
      category: paymentType,
      transactionCode: txCode
    };

    // Reflect everywhere: Update students AND global audit logs
    onStudentsUpdate(students.map(s => {
      if (s.id === selectedStudentId) {
        return {
          ...s,
          ledger: [...(s.ledger || []), newRecord],
          isFeesCleared: currentBal <= 0
        };
      }
      return s;
    }));

    onSettingsChange({
      ...settings,
      transactionAuditLogs: [...(settings.transactionAuditLogs || []), newAuditLog]
    });

    setLastProcessedRecord(newRecord);
    notify(`Transaction ${txCode} finalized and logged!`, "success");
    setReceiptMode(true);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Branding Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter" />
        <EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b]" />
        
        <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-2 mt-4">
          <button onClick={() => setActiveView('terminal')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'terminal' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400'}`}>Transaction Terminal</button>
          <button onClick={() => setActiveView('history')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'history' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400'}`}>History & Statements</button>
          <button onClick={() => setActiveView('defaulters')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'defaulters' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400'}`}>Defaulter Hub</button>
          <button onClick={() => setActiveView('audit')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeView === 'audit' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-gray-400'}`}>Audit Broad Sheet</button>
        </div>
      </div>

      {activeView === 'terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Security & Transaction Form */}
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8 no-print">
             {!isAuthenticated ? (
               <div className="space-y-8 animate-fadeIn">
                  <div className="text-center space-y-2">
                     <span className="text-4xl">🔐</span>
                     <h3 className="text-2xl font-black text-[#0f3460] uppercase">Secure Access Terminal</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorized Financial Staff Entry Only</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 px-2">1. Select Staff Identity</label>
                      <select 
                        disabled={otpRequested}
                        className="w-full p-5 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460] text-sm shadow-inner outline-none disabled:opacity-50"
                        value={authorizedStaffId}
                        onChange={e => setAuthorizedStaffId(e.target.value)}
                      >
                        <option value="">-- Choose Account --</option>
                        {authorizedStaffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.idNumber})</option>)}
                      </select>
                    </div>

                    {otpRequested ? (
                      <div className="space-y-4 animate-fadeIn">
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-[#cca43b] px-2">2. Verification Code (OTP)</label>
                            <input 
                              type="password"
                              placeholder="Enter 4-digit code"
                              className="w-full p-5 bg-yellow-50 rounded-2xl border-2 border-[#cca43b] text-center text-2xl font-black tracking-[1em] outline-none"
                              value={otpValue}
                              onChange={e => setOtpValue(e.target.value)}
                            />
                         </div>
                         <button onClick={verifyOTP} className="w-full bg-[#0f3460] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl">Verify & Unblock Terminal</button>
                         <button onClick={() => setOtpRequested(false)} className="w-full text-gray-400 font-black text-[9px] uppercase">Re-select Staff Member</button>
                      </div>
                    ) : (
                      <button onClick={requestOTP} className="w-full bg-[#0f3460] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition">Request Access PIN</button>
                    )}
                  </div>
                  
                  <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100 text-center">
                     <p className="text-[9px] font-bold text-red-900 leading-relaxed italic">
                       Unauthorised access to the payment terminal is strictly prohibited. <br/>All attempts are logged at the Administration Desk.
                     </p>
                  </div>
               </div>
             ) : (
               <div className="space-y-8 animate-fadeIn">
                  <div className="flex justify-between items-start">
                    <div>
                       <h3 className="text-2xl font-black text-[#0f3460] uppercase">Authorized Terminal</h3>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active: {selectedStaff?.name}</p>
                       </div>
                    </div>
                    <button onClick={() => setIsAuthenticated(false)} className="text-[8px] font-black bg-red-50 text-red-600 px-3 py-1 rounded-lg uppercase border border-red-100">Lock Session</button>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">1. Learner Identification</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" placeholder="Search Name/ID..." className="w-full p-4 bg-white rounded-2xl border-2 border-gray-100 font-bold text-xs outline-none focus:border-[#cca43b] transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        <select className="w-full p-4 bg-white rounded-2xl border-2 border-gray-100 font-black text-[10px] uppercase outline-none focus:border-[#cca43b]" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                          <option>All Classes</option>
                          {allClasses.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <select className="w-full p-5 bg-white rounded-2xl border-2 border-[#0f3460]/10 font-black text-sm text-[#0f3460] shadow-sm outline-none focus:border-[#0f3460]" value={selectedStudentId} onChange={e => {setSelectedStudentId(e.target.value); setReceiptMode(false);}}>
                        <option value="">-- Select Matching Learner ({filteredStudents.length}) --</option>
                        {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.surname} ({s.serialId})</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-400 block px-2">2. Ledger Category</label>
                          <select className="w-full p-5 bg-gray-50 rounded-2xl border-none font-black text-xs" value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                             {categories.map(c => <option key={c}>{c}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-gray-400 block px-2">3. Additional Bill (Optional)</label>
                          <input type="number" placeholder="0.00" className="w-full p-5 bg-gray-50 rounded-2xl border-none font-black text-sm text-red-600" value={newBill} onChange={e => setNewBill(e.target.value)} />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-400 block px-2">4. Amount to be Paid (GH₵)</label>
                       <input type="number" placeholder="0.00" className="w-full p-6 bg-blue-50 rounded-[2rem] border-none font-black text-2xl text-[#0f3460] shadow-inner" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>

                    <button onClick={handleProcessPayment} className="w-full bg-[#0f3460] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">Authorize Transaction</button>
                  </div>
               </div>
             )}
          </div>

          {/* Real-time Context / Receipt */}
          <div className="flex flex-col gap-6">
             {currentStudent ? (
               <div className="bg-[#f4f6f7] p-8 rounded-[3rem] border border-gray-200 flex-1">
                  {!receiptMode ? (
                    <div className="space-y-6 animate-fadeIn no-print">
                       <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Learner Position</h4>
                            <p className="text-xl font-black text-[#0f3460] uppercase">{currentStudent.firstName} {currentStudent.surname}</p>
                            <p className="text-[10px] font-mono text-gray-500">{currentStudent.serialId}</p>
                          </div>
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${currentStudent.isFeesCleared ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {currentStudent.isFeesCleared ? 'Status: Cleared' : 'Status: Owing'}
                          </span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <ContextRow label="Ledger Arrears" value={`GH₵ ${(currentStudent.ledger?.[currentStudent.ledger.length-1]?.currentBalance || 0).toFixed(2)}`} />
                          <ContextRow label="Annual Total Paid" value={`GH₵ ${(currentStudent.ledger?.reduce((a,b)=>a+b.amountPaid, 0) || 0).toFixed(2)}`} color="text-green-600" />
                       </div>

                       <div className="bg-white p-10 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center space-y-3">
                          <span className="text-3xl grayscale opacity-30">📋</span>
                          <p className="text-xs font-bold text-gray-400 italic">Complete authorization for immediate synchronization across institutional reports.</p>
                       </div>
                    </div>
                  ) : lastProcessedRecord && (
                    <div id="thermal-receipt" className="bg-white p-8 rounded-3xl shadow-2xl border-t-8 border-[#cca43b] animate-fadeIn flex flex-col font-mono">
                       <div className="text-center border-b pb-4 mb-4">
                          <p className="font-black text-[#0f3460] uppercase text-sm">{settings.schoolName}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase">{settings.motto}</p>
                          <p className="text-[10px] font-black mt-2">OFFICIAL AUTHORIZED RECEIPT</p>
                          <p className="text-[9px] font-bold text-gray-400">{new Date().toLocaleString()}</p>
                       </div>
                       
                       <div className="space-y-3 py-4 text-[11px] font-bold">
                          <div className="flex justify-between uppercase"><span>Learner:</span> <span className="text-right">{currentStudent.firstName} {currentStudent.surname}</span></div>
                          <div className="flex justify-between uppercase"><span>Serial ID:</span> <span className="text-right">{currentStudent.serialId}</span></div>
                          <div className="flex justify-between uppercase"><span>Category:</span> <span className="text-right">{lastProcessedRecord.category}</span></div>
                          <div className="flex justify-between uppercase"><span>TX Serial:</span> <span className="text-right">{lastProcessedRecord.transactionCode}</span></div>
                          
                          <div className="border-t-2 border-dashed my-3"></div>
                          
                          <div className="flex justify-between text-gray-500"><span>Arrears B/F:</span> <span>GH₵ {lastProcessedRecord.balanceBF.toFixed(2)}</span></div>
                          <div className="flex justify-between text-gray-500"><span>New Bill Item:</span> <span>GH₵ {lastProcessedRecord.newBill.toFixed(2)}</span></div>
                          {lastProcessedRecord.taxAmount > 0 && (
                            <div className="flex justify-between text-red-400 italic"><span>Statutory Taxes:</span> <span>GH₵ {lastProcessedRecord.taxAmount.toFixed(2)}</span></div>
                          )}
                          <div className="flex justify-between text-lg font-black text-[#0f3460] py-1 border-y border-gray-100 my-1"><span>AMOUNT DUE:</span> <span>GH₵ {lastProcessedRecord.totalBill.toFixed(2)}</span></div>
                          
                          <div className="flex justify-between text-xl font-black text-green-700 bg-green-50 p-2 rounded-lg my-1"><span>AMOUNT PAID:</span> <span>GH₵ {lastProcessedRecord.amountPaid.toFixed(2)}</span></div>
                          
                          <div className="flex justify-between text-lg font-black text-red-600 py-1"><span>BALANCE REMAINING:</span> <span>GH₵ {lastProcessedRecord.currentBalance.toFixed(2)}</span></div>

                          <div className="mt-4 pt-4 border-t border-gray-100">
                             <div className="flex justify-between items-center text-[9px] font-black uppercase text-gray-400">
                                <span>Authorized By:</span>
                                <span>{lastProcessedRecord.processedBy?.staffName}</span>
                             </div>
                             <div className="flex justify-between items-center text-[9px] font-black uppercase text-gray-400">
                                <span>Staff Auth ID:</span>
                                <span>{lastProcessedRecord.processedBy?.staffId}</span>
                             </div>
                          </div>
                       </div>

                       <div className="mt-6 text-center border-t pt-4">
                          <p className="text-[10px] font-black uppercase text-[#0f3460] italic">{settings.financeConfig.receiptMessage}</p>
                          <p className="text-[8px] text-gray-400 mt-1 uppercase">United Baylor Academy Integrated Ledger</p>
                       </div>
                       
                       <button onClick={() => window.print()} className="mt-8 w-full bg-[#0f3460] text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg no-print">Generate Receipt Copy</button>
                       <button onClick={() => setReceiptMode(false)} className="mt-2 w-full text-gray-400 py-2 text-[9px] font-black uppercase no-print">Next Entry</button>
                    </div>
                  )}
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border-4 border-dashed border-gray-100 rounded-[3rem] p-10 text-center no-print">
                  <span className="text-4xl mb-4 opacity-20">💰</span>
                  <p className="text-gray-400 font-black uppercase text-xs italic tracking-widest">Select a learner to access financial context</p>
               </div>
             )}
          </div>
        </div>
      )}

      {activeView === 'history' && (
        <div className="space-y-8 animate-fadeIn">
          {/* History Navigation */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 no-print">
             <div className="flex bg-white p-1.5 rounded-2xl shadow-md border border-gray-100">
                {['Individual', 'Class', 'School'].map((s: any) => (
                   <button key={s} onClick={() => setHistoryScope(s)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${historyScope === s ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-gray-400'}`}>{s} Statement</button>
                ))}
             </div>

             <div className="flex gap-3">
                {historyScope === 'Individual' && (
                   <select className="bg-white p-3 rounded-xl border border-gray-100 font-black text-[10px] uppercase shadow-sm w-64" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                      <option value="">-- Select Individual --</option>
                      {allAdmittedStudents.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.surname} ({s.serialId})</option>)}
                   </select>
                )}
                {historyScope === 'Class' && (
                   <select className="bg-white p-3 rounded-xl border border-gray-100 font-black text-[10px] uppercase shadow-sm w-64" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                      {allClasses.map(c => <option key={c}>{c}</option>)}
                   </select>
                )}
                <button onClick={() => window.print()} className="bg-[#2e8b57] text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg">Print Formal Ledger</button>
             </div>
          </div>

          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 min-h-[600px] relative">
             {/* Printable Branding */}
             <div className="hidden print:block text-center border-b-4 border-double border-[#0f3460] pb-8 mb-10">
                <h1 className="text-4xl font-black text-[#0f3460] uppercase">{settings.schoolName}</h1>
                <p className="text-xs font-bold text-[#cca43b] uppercase tracking-[0.3em]">{settings.motto}</p>
                <h2 className="mt-6 text-xl font-black uppercase tracking-widest">{historyScope} Account Statement</h2>
                <div className="flex justify-center gap-10 mt-2 text-[10px] font-bold text-gray-500">
                   <span>Year: {settings.academicYear}</span>
                   <span>Context: {historyScope === 'Individual' ? currentStudent?.firstName + ' ' + currentStudent?.surname : historyScope === 'Class' ? selectedClass : 'Institutional Master'}</span>
                   <span>Audit Date: {new Date().toLocaleDateString()}</span>
                </div>
             </div>

             {/* Dynamic Content */}
             {historyScope === 'Individual' ? (
                currentStudent ? (
                  <div className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                        <FinancialSummaryCard label="Total Revenue Contributions" value={`GH₵ ${individualHistory.reduce((a, b) => a + b.amountPaid, 0).toFixed(2)}`} icon="🏦" color="text-green-600" />
                        <FinancialSummaryCard label="Current Outstanding" value={`GH₵ ${(currentStudent.ledger?.[currentStudent.ledger.length-1]?.currentBalance || 0).toFixed(2)}`} icon="⏳" color="text-red-600" />
                        <FinancialSummaryCard label="Transaction Frequency" value={`${individualHistory.length} Cycles`} icon="🧾" />
                     </div>

                     <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
                        <table className="w-full text-left text-[11px] border-collapse">
                           <thead className="bg-[#0f3460] text-white font-black uppercase sticky top-0">
                              <tr>
                                 <th className="p-5">Date</th>
                                 <th className="p-5">TX Serial</th>
                                 <th className="p-5">Ledger Category</th>
                                 <th className="p-5 text-right">Debit (Bill)</th>
                                 <th className="p-5 text-right">Tax Appended</th>
                                 <th className="p-5 text-right">Credit (Paid)</th>
                                 <th className="p-5 text-right">Balance</th>
                                 <th className="p-5">Authorized By</th>
                              </tr>
                           </thead>
                           <tbody>
                              {individualHistory.map(log => (
                                 <tr key={log.id} className="border-b hover:bg-gray-50">
                                    <td className="p-5 font-mono text-gray-500">{log.date}</td>
                                    <td className="p-5 font-black text-blue-600">{log.transactionCode}</td>
                                    <td className="p-5 font-bold text-gray-400 uppercase italic">{log.category}</td>
                                    <td className="p-5 text-right font-bold text-red-400">GH₵ {log.newBill.toFixed(2)}</td>
                                    <td className="p-5 text-right font-bold text-red-300">GH₵ {log.taxAmount.toFixed(2)}</td>
                                    <td className="p-5 text-right font-black text-green-600">GH₵ {log.amountPaid.toFixed(2)}</td>
                                    <td className="p-5 text-right font-black text-[#0f3460]">GH₵ {log.currentBalance.toFixed(2)}</td>
                                    <td className="p-5">
                                       <p className="text-[10px] font-black uppercase text-gray-500">{log.processedBy?.staffName || 'Legacy System'}</p>
                                       <p className="text-[8px] text-gray-400">{log.processedBy?.staffId}</p>
                                    </td>
                                 </tr>
                              ))}
                              {individualHistory.length === 0 && (
                                 <tr><td colSpan={8} className="p-24 text-center text-gray-300 font-black uppercase italic tracking-widest">No financial history found for this learner account.</td></tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
                ) : <HistoryPlaceholder msg="Select a learner to view individual account history" />
             ) : historyScope === 'Class' ? (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
                      <FinancialSummaryCard label={`Class Revenue (${selectedClass})`} value={`GH₵ ${classHistory.reduce((a, b) => a + b.amountPaid, 0).toFixed(2)}`} icon="🏫" color="text-[#0f3460]" />
                      <FinancialSummaryCard label="Average Monthly Collection" value={`GH₵ ${(classHistory.reduce((a,b)=>a+b.amountPaid, 0) / 10).toFixed(2)}`} icon="📊" />
                   </div>

                   <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
                      <table className="w-full text-left text-[11px] border-collapse">
                         <thead className="bg-[#cca43b] text-[#0f3460] font-black uppercase sticky top-0">
                            <tr>
                               <th className="p-5">Date</th>
                               <th className="p-5">Learner (Name & Serial ID)</th>
                               <th className="p-5">TX Serial</th>
                               <th className="p-5">Category</th>
                               <th className="p-5 text-right">Amount (Paid)</th>
                               <th className="p-5 text-right">Current Bal</th>
                            </tr>
                         </thead>
                         <tbody>
                            {classHistory.map(log => (
                               <tr key={log.id} className="border-b hover:bg-gray-50 transition">
                                  <td className="p-5 font-mono text-gray-500">{log.date}</td>
                                  <td className="p-5">
                                     <p className="font-black text-[#0f3460] uppercase">{log.studentName}</p>
                                     <p className="text-[8px] text-gray-400 font-black font-mono">{log.studentSerial}</p>
                                  </td>
                                  <td className="p-5 font-bold text-blue-500">{log.transactionCode}</td>
                                  <td className="p-5 font-bold text-gray-400 uppercase text-[9px]">{log.category}</td>
                                  <td className="p-5 text-right font-black text-green-600">GH₵ {log.amountPaid.toFixed(2)}</td>
                                  <td className="p-5 text-right font-black text-red-500">GH₵ {log.currentBalance.toFixed(2)}</td>
                               </tr>
                            ))}
                            {classHistory.length === 0 && (
                               <tr><td colSpan={6} className="p-24 text-center text-gray-300 font-black uppercase italic tracking-widest">No transaction logs for {selectedClass} in current cycle.</td></tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
             ) : (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
                      <FinancialSummaryCard label="Annual Revenue" value={`GH₵ ${masterLedger.reduce((a,b)=>a+b.amountPaid, 0).toFixed(2)}`} icon="💰" color="text-green-600" />
                      <FinancialSummaryCard label="Institutional Arrears" value={`GH₵ ${allAdmittedStudents.reduce((a,b)=>a+(b.ledger?.[b.ledger.length-1]?.currentBalance || 0), 0).toFixed(2)}`} icon="📉" color="text-red-600" />
                      <FinancialSummaryCard label="Audit Footprint" value={`${masterLedger.length} Transactions`} icon="📑" />
                      <FinancialSummaryCard label="Payment Efficiency" value="92.4%" icon="✅" />
                   </div>

                   <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
                      <table className="w-full text-left text-[11px] border-collapse">
                         <thead className="bg-[#0f3460] text-white font-black uppercase sticky top-0">
                            <tr>
                               <th className="p-5">Date</th>
                               <th className="p-5">Learner & Class</th>
                               <th className="p-5">TX Serial</th>
                               <th className="p-5">Category</th>
                               <th className="p-5 text-right">Inflow (Paid)</th>
                               <th className="p-5 text-right">Audit Bal</th>
                            </tr>
                         </thead>
                         <tbody>
                            {masterLedger.map(log => (
                               <tr key={log.id} className="border-b hover:bg-gray-50 transition">
                                  <td className="p-5 font-mono text-gray-400">{log.date}</td>
                                  <td className="p-5">
                                     <p className="font-black text-[#0f3460] uppercase">{log.studentName}</p>
                                     <p className="text-[8px] text-[#cca43b] font-black uppercase">{log.studentClass} • {log.studentSerial}</p>
                                  </td>
                                  <td className="p-5 font-bold text-blue-400">{log.transactionCode}</td>
                                  <td className="p-5 font-bold text-gray-400 uppercase text-[9px]">{log.category}</td>
                                  <td className="p-5 text-right font-black text-green-700">GH₵ {log.amountPaid.toFixed(2)}</td>
                                  <td className="p-5 text-right font-black text-gray-300">GH₵ {log.currentBalance.toFixed(2)}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             )}

             {/* Professional Footer for Print */}
             <div className="hidden print:flex justify-between items-end mt-20">
                <div className="text-center w-64 border-t-2 border-black pt-2">
                   <p className="text-[10px] font-black uppercase">Accounts Officer Signature</p>
                </div>
                <div className="text-center w-80">
                   <p className="italic font-serif text-3xl mb-2 text-[#0f3460]">H. Baylor</p>
                   <div className="border-t-2 border-black pt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest">School Head Approval / Official Stamp</p>
                      <p className="text-[8px] text-gray-400 uppercase mt-1">United Baylor Academy Certified Financial Document</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeView === 'defaulters' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="bg-red-50 p-8 rounded-[3rem] border border-red-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-2xl font-black text-red-700 uppercase">Defaulter Audit Hub</h3>
                <p className="text-xs text-red-900 leading-relaxed font-bold italic mt-1 tracking-wider">Tracking outstanding liabilities across all departments.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-200 text-center min-w-[250px]">
                 <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Total Outstanding Debt</span>
                 <span className="text-3xl font-black text-red-600">GH₵ {defaultersList.reduce((acc, curr) => acc + curr.balance, 0).toFixed(2)}</span>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
              <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
                 <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-[#0f3460] text-white font-black uppercase">
                       <tr>
                          <th className="p-5 border-b">Learner Name</th>
                          <th className="p-5 border-b">Class & Serial ID</th>
                          <th className="p-5 border-b">Owed Category</th>
                          <th className="p-5 border-b text-right">Outstanding (GH₵)</th>
                          <th className="p-5 border-b text-center">Status</th>
                       </tr>
                    </thead>
                    <tbody>
                       {defaultersList.map(def => (
                         <tr key={def.id} className="border-b hover:bg-red-50/30 transition">
                            <td className="p-5 font-black text-[#0f3460] uppercase">{def.name}</td>
                            <td className="p-5">
                               <p className="font-bold uppercase text-gray-500">{def.class}</p>
                               <p className="text-[9px] font-mono text-gray-400">{def.serial}</p>
                            </td>
                            <td className="p-5 font-bold text-gray-400 italic uppercase">{def.lastCategory}</td>
                            <td className="p-5 text-right font-black text-red-600">GH₵ {def.balance.toFixed(2)}</td>
                            <td className="p-5 text-center">
                               <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">DEBTOR</span>
                            </td>
                         </tr>
                       ))}
                       {defaultersList.length === 0 && (
                         <tr><td colSpan={5} className="p-24 text-center text-gray-300 font-black uppercase italic tracking-widest">Institutional accounts are fully reconciled. No defaulters found.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {activeView === 'audit' && (
        <div className="space-y-8 animate-fadeIn">
           <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
              <div>
                 <h3 className="text-2xl font-black text-[#0f3460] uppercase">Audit Broad Sheet</h3>
                 <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Periodic Reconciliation & Closing Balances</p>
              </div>
              <div className="flex gap-4">
                 <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase px-2">Select Audit Date</span>
                    <input type="date" className="p-3 rounded-xl bg-gray-50 border-none font-black text-xs outline-none focus:ring-2 focus:ring-[#cca43b]" value={auditDate} onChange={e => setAuditDate(e.target.value)} />
                 </div>
                 <button onClick={() => window.print()} className="bg-[#0f3460] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-105 transition self-end">Export Periodic Audit</button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
              <FinancialSummaryCard label="Day Collection" value={`GH₵ ${auditData.dayTotal.toFixed(2)}`} icon="📅" color="text-blue-600" trend={`As of ${auditDate}`} />
              <FinancialSummaryCard label="Weekly Running" value={`GH₵ ${auditData.weekTotal.toFixed(2)}`} icon="🗓️" color="text-[#cca43b]" trend="Current Week" />
              <FinancialSummaryCard label="Monthly Summary" value={`GH₵ ${auditData.monthTotal.toFixed(2)}`} icon="📊" color="text-[#2e8b57]" trend="Current Month" />
              <FinancialSummaryCard label="Terminal Total" value={`GH₵ ${auditData.termTotal.toFixed(2)}`} icon="🏦" color="text-[#0f3460]" trend="Entire Term" />
           </div>

           <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100">
              {/* Branding for Audit Broad Sheet */}
              <div className="text-center border-b-4 border-double border-[#0f3460] pb-8 mb-10">
                <EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter mb-2" />
                <EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b]" />
                <h2 className="mt-8 text-2xl font-black uppercase tracking-widest text-[#0f3460]">Daily Transaction Broad Sheet</h2>
                <div className="flex justify-center gap-10 mt-2 text-[10px] font-bold text-gray-500 uppercase">
                   <span>Report Date: {auditDate}</span>
                   <span>Audit Year: {settings.academicYear}</span>
                   <span>Terminal: Finance Desk 01</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm mb-10">
                 <table className="w-full text-left text-[10px] border-collapse">
                    <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                       <tr>
                          <th className="p-4 border-b">TX Serial</th>
                          <th className="p-4 border-b">Learner Detail (ID & Name)</th>
                          <th className="p-4 border-b">Category</th>
                          <th className="p-4 border-b text-right">Amount Paid (Inflow)</th>
                          <th className="p-4 border-b text-right">Closing Balance</th>
                       </tr>
                    </thead>
                    <tbody>
                       {auditData.day.map(log => (
                         <tr key={log.id} className="border-b hover:bg-gray-50 transition">
                            <td className="p-4 font-black font-mono text-blue-600">{log.transactionCode}</td>
                            <td className="p-4">
                               <p className="font-black uppercase text-[#0f3460]">{log.studentName}</p>
                               <p className="text-[8px] text-gray-400 font-bold uppercase">{log.studentSerial} • {log.studentClass}</p>
                            </td>
                            <td className="p-4 font-bold text-gray-500 uppercase italic">{log.category}</td>
                            <td className="p-4 text-right font-black text-green-600">GH₵ {log.amountPaid.toFixed(2)}</td>
                            <td className="p-4 text-right font-black text-[#0f3460]">GH₵ {log.currentBalance.toFixed(2)}</td>
                         </tr>
                       ))}
                       {auditData.day.length === 0 && (
                         <tr><td colSpan={5} className="p-24 text-center text-gray-300 font-black uppercase italic tracking-widest">No transaction records detected for chosen date.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Daily Reconciliation</h4>
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold"><span>Total Cash Inflow:</span> <span className="font-black text-green-700">GH₵ {auditData.dayTotal.toFixed(2)}</span></div>
                       <div className="flex justify-between text-xs font-bold"><span>Expected Outflow (Bills):</span> <span className="font-black text-red-400">GH₵ {auditData.day.reduce((a, b) => a + b.newBill, 0).toFixed(2)}</span></div>
                       {auditData.day.reduce((a,b) => a + b.taxAmount, 0) > 0 && (
                         <div className="flex justify-between text-xs font-bold italic text-red-400"><span>Tax Component:</span> <span>GH₵ {auditData.day.reduce((a,b) => a + b.taxAmount, 0).toFixed(2)}</span></div>
                       )}
                       <div className="border-t border-gray-200 my-2 pt-2"></div>
                       <div className="flex justify-between text-sm font-black text-[#0f3460]"><span>Closing Day Balance:</span> <span>GH₵ {(auditData.day.reduce((a, b) => a + b.balanceBF, 0) + auditData.day.reduce((a, b) => a + (b.newBill + b.taxAmount), 0) - auditData.dayTotal).toFixed(2)}</span></div>
                    </div>
                 </div>
                 <div className="bg-[#0f3460] p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
                    <h4 className="text-xs font-black text-[#cca43b] uppercase tracking-widest">Institutional Closing Position</h4>
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs"><span>Total Institutional Revenue:</span> <span className="font-black">GH₵ {auditData.termTotal.toFixed(2)}</span></div>
                       <div className="flex justify-between text-xs"><span>Total Outstanding Arrears:</span> <span className="font-black text-red-400">GH₵ {auditData.dayClosingArrears.toFixed(2)}</span></div>
                       <div className="border-t border-white/10 my-2 pt-2"></div>
                       <p className="text-[8px] font-bold text-[#cca43b] uppercase italic text-center">Certified reconciliation of all payment points.</p>
                    </div>
                 </div>
              </div>

              <div className="hidden print:flex justify-between items-end mt-20">
                 <div className="text-center w-64 border-t-2 border-black pt-2">
                    <p className="text-[10px] font-black uppercase">Auditor's Signature</p>
                 </div>
                 <div className="text-center w-80">
                    <p className="italic font-serif text-3xl mb-2 text-[#0f3460]">H. Baylor</p>
                    <div className="border-t-2 border-black pt-2">
                       <p className="text-[10px] font-black uppercase tracking-widest">Institutional Approval Stamp</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const ContextRow = ({ label, value, color = "text-[#0f3460]" }: any) => (
  <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    <span className={`text-lg font-black ${color}`}>{value}</span>
  </div>
);

const FinancialSummaryCard = ({ label, value, icon, trend, color = "text-[#0f3460]" }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col items-center text-center">
    <span className="text-3xl mb-3">{icon}</span>
    <span className="text-[9px] font-black uppercase text-gray-400 mb-1">{label}</span>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
    {trend && <span className="text-[8px] font-black text-gray-300 mt-2 uppercase">{trend}</span>}
  </div>
);

const HistoryPlaceholder = ({ msg }: { msg: string }) => (
   <div className="p-40 text-center flex flex-col items-center justify-center space-y-6">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-4xl grayscale opacity-20">📜</div>
      <p className="text-gray-300 font-black uppercase text-sm tracking-[0.2em] italic max-w-md leading-relaxed">{msg}</p>
   </div>
);

export default PaymentPoint;
