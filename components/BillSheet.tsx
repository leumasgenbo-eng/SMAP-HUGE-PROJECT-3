
import React, { useState, useMemo } from 'react';
import { GlobalSettings, Student } from '../types';
import EditableField from './EditableField';

interface Props {
  students: Student[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  notify: any;
  activeClass: string;
}

const BillSheet: React.FC<Props> = ({ students, settings, onSettingsChange, notify, activeClass }) => {
  const [isNewTermMode, setIsNewTermMode] = useState(false);
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);

  const classBills = settings.financeConfig.classBills[activeClass] || {};
  const categories = settings.financeConfig.categories;
  const taxConfig = settings.financeConfig.taxConfig;

  const calculateStudentBill = (student: Student) => {
    const arrears = student.ledger?.[student.ledger.length - 1]?.currentBalance || 0;
    let newBillTotal = 0;
    const items: Record<string, number> = {};

    if (isNewTermMode) {
      categories.forEach(cat => {
        const val = classBills[cat] || 0;
        newBillTotal += val;
        items[cat] = val;
      });
    }

    let taxAmount = 0;
    if (taxConfig.isTaxEnabled && newBillTotal > 0) {
      const totalTaxRate = taxConfig.vatRate + taxConfig.nhilRate + taxConfig.getLevyRate + taxConfig.covidLevyRate;
      taxAmount = (newBillTotal * totalTaxRate) / 100;
    }

    const total = arrears + newBillTotal + taxAmount;

    return { arrears, items, taxAmount, total };
  };

  const handlePrint = () => {
    setIsBatchPrinting(true);
    notify("Formatting bill sheets for export...", "info");
    setTimeout(() => {
      window.print();
      setIsBatchPrinting(false);
    }, 500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dynamic Branding Header */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-gray-100 flex items-center justify-center overflow-hidden group relative">
            {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <span className="text-4xl">🧾</span>}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center no-print">
              <EditableField value={settings.logo} onSave={v => onSettingsChange({...settings, logo: v})} placeholder="Logo URL" className="text-[8px] text-white bg-transparent border-white" />
            </div>
          </div>
          <div className="flex flex-col items-start text-left">
            <EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" />
            <EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className="text-[11px] font-black uppercase tracking-[0.4em] text-[#cca43b]" />
          </div>
        </div>
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-50 w-full max-w-4xl">
          <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          <span>•</span>
          <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          <span>•</span>
          <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className="lowercase" />
        </div>
      </div>

      <div className="bg-[#0f3460] p-8 rounded-[3rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Bill Generation Hub</h2>
          <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Class: {activeClass} • Fiscal Terminal</p>
        </div>
        <div className="flex items-center gap-4">
           <label className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl cursor-pointer border border-white/20 transition hover:bg-white/20">
              <span className="text-[10px] font-black uppercase">End of Term (Add New Bills)</span>
              <input type="checkbox" className="w-5 h-5 accent-[#cca43b]" checked={isNewTermMode} onChange={e => setIsNewTermMode(e.target.checked)} />
           </label>
           <button onClick={handlePrint} className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Export Batch Bills</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 overflow-x-auto min-h-[500px]">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
            <tr>
              <th className="p-5 border-b">Learner Full Name</th>
              <th className="p-5 border-b">Serial ID</th>
              <th className="p-5 border-b text-right">Arrears B/F</th>
              {isNewTermMode && <th className="p-5 border-b text-right">New Term Bill</th>}
              {isNewTermMode && taxConfig.isTaxEnabled && <th className="p-5 border-b text-right">Tax Component</th>}
              <th className="p-5 border-b text-right text-[#0f3460] bg-yellow-50">Total Payable (GH₵)</th>
              <th className="p-5 border-b text-center no-print">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => {
              const { arrears, total, items, taxAmount } = calculateStudentBill(s);
              const newBillTotal = Object.values(items).reduce((a, b) => a + b, 0);
              return (
                <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-5 font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</td>
                  <td className="p-5 font-mono text-gray-400 font-bold">{s.serialId}</td>
                  <td className="p-5 text-right font-bold text-red-500">GH₵ {arrears.toFixed(2)}</td>
                  {isNewTermMode && <td className="p-5 text-right font-black text-[#0f3460]">GH₵ {newBillTotal.toFixed(2)}</td>}
                  {isNewTermMode && taxConfig.isTaxEnabled && <td className="p-5 text-right italic text-red-400">GH₵ {taxAmount.toFixed(2)}</td>}
                  <td className="p-5 text-right font-black text-lg text-[#0f3460] bg-yellow-50/50">GH₵ {total.toFixed(2)}</td>
                  <td className="p-5 text-center no-print">
                    <button onClick={() => notify(`Individual bill export for ${s.firstName} initializing...`, 'info')} className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-[#0f3460] hover:text-white transition">Print Individual</button>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr><td colSpan={7} className="p-20 text-center text-gray-300 font-black uppercase italic tracking-widest">No admitted learners found in {activeClass} registry.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Hidden Print Section for Batch Generation */}
      <div className="hidden print:block space-y-12">
        {students.map(s => {
           const { arrears, total, items, taxAmount } = calculateStudentBill(s);
           const newBillTotal = Object.values(items).reduce((a, b) => a + b, 0);
           return (
             <div key={s.id} className="page-break bg-white p-12 border-[12px] border-double border-[#0f3460] max-w-[210mm] mx-auto min-h-[296mm] flex flex-col font-sans">
                <div className="text-center border-b-4 border-black pb-8 mb-8 flex flex-col items-center">
                  <h1 className="text-5xl font-black uppercase tracking-tighter text-[#0f3460]">{settings.schoolName}</h1>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#cca43b] mt-2">{settings.motto}</p>
                  <p className="text-sm font-black text-gray-500 uppercase tracking-widest mt-2">{settings.address}</p>
                  <div className="bg-black text-white py-2 px-12 inline-block font-black text-sm rounded-sm uppercase tracking-[0.3em] mt-6 shadow-lg">
                     OFFICIAL {isNewTermMode ? 'NEXT TERM' : 'CURRENT'} BILL SHEET
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10 mb-8 font-black">
                   <div className="space-y-3 border-r-2 border-dashed border-gray-200 pr-10">
                      <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
                         <span className="text-[10px] text-gray-400 uppercase">Learner Name</span>
                         <span className="text-xl text-[#0f3460] uppercase">{s.firstName} {s.surname}</span>
                      </div>
                      <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
                         <span className="text-[10px] text-gray-400 uppercase">Serial ID</span>
                         <span className="text-gray-600 font-mono">{s.serialId}</span>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
                         <span className="text-[10px] text-gray-400 uppercase">Class/Level</span>
                         <span className="text-gray-600 uppercase">{activeClass}</span>
                      </div>
                      <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
                         <span className="text-[10px] text-gray-400 uppercase">Academic Year</span>
                         <span className="text-gray-600">{settings.academicYear}</span>
                      </div>
                   </div>
                </div>

                <div className="flex-1">
                   <h3 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Bill Breakdown Details</h3>
                   <table className="w-full text-xs border-collapse">
                      <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                         <tr>
                            <th className="p-4 border-b-2 border-black text-left">Description of Item</th>
                            <th className="p-4 border-b-2 border-black text-right">Amount (GH₵)</th>
                         </tr>
                      </thead>
                      <tbody className="font-bold text-gray-600">
                         <tr><td className="p-4 border-b">Arrears / Balance Brought Forward (B/F)</td><td className="p-4 border-b text-right text-red-500">{arrears.toFixed(2)}</td></tr>
                         {isNewTermMode && Object.entries(items).map(([name, val]) => (
                            <tr key={name}><td className="p-4 border-b">{name} (New Term)</td><td className="p-4 border-b text-right">{val.toFixed(2)}</td></tr>
                         ))}
                         {isNewTermMode && taxConfig.isTaxEnabled && taxAmount > 0 && (
                            <tr><td className="p-4 border-b italic text-red-400">Statutory Tax Contribution</td><td className="p-4 border-b text-right text-red-400">{taxAmount.toFixed(2)}</td></tr>
                         )}
                      </tbody>
                      <tfoot className="bg-yellow-50 text-[#0f3460] font-black text-xl">
                         <tr>
                            <td className="p-6 uppercase">Total Amount Payable</td>
                            <td className="p-6 text-right">GH₵ {total.toFixed(2)}</td>
                         </tr>
                      </tfoot>
                   </table>
                </div>

                <div className="mt-12 bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
                   <p className="text-[10px] font-black text-[#cca43b] uppercase tracking-[0.2em] mb-2">Instructions</p>
                   <p className="text-[9px] font-bold text-gray-400 italic leading-relaxed">
                      Please ensure all payments are made through authorized bank channels or at the school's finance point. 
                      Official receipts are generated for every transaction and synchronized to the learner's digital ledger.
                   </p>
                </div>

                <div className="mt-12 pt-8 border-t-4 border-black flex justify-between items-end">
                   <div className="text-center w-64">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Generated: {new Date().toLocaleDateString()}</p>
                      <div className="h-10 border-b-2 border-black w-full mb-2"></div>
                      <p className="text-[9px] font-black uppercase text-gray-400">Accounts Department</p>
                   </div>
                   <div className="text-center w-80">
                      <p className="italic font-serif text-3xl mb-1 text-[#0f3460]">{settings.headteacherName}</p>
                      <div className="border-t-2 border-black pt-2">
                         <p className="text-[10px] font-black uppercase tracking-widest text-[#0f3460]">Official Authorization</p>
                      </div>
                   </div>
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default BillSheet;
