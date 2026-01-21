
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
      <div className="bg-[#0f3460] p-8 rounded-[2rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Bill Generation Hub</h2>
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
              <th className="p-5 border-b text-right text-[#0f3460] bg-yellow-50">Total Payable (GH₵)</th>
              <th className="p-5 border-b text-center no-print">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => {
              const { arrears, total, items } = calculateStudentBill(s);
              const newBillTotal = Object.values(items).reduce((a, b) => a + b, 0);
              return (
                <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-5 font-black uppercase text-[#0f3460]">{s.firstName} {s.surname}</td>
                  <td className="p-5 font-mono text-gray-400 font-bold">{s.serialId}</td>
                  <td className="p-5 text-right font-bold text-red-500">GH₵ {arrears.toFixed(2)}</td>
                  {isNewTermMode && <td className="p-5 text-right font-black text-[#0f3460]">GH₵ {newBillTotal.toFixed(2)}</td>}
                  <td className="p-5 text-right font-black text-lg text-[#0f3460] bg-yellow-50/50">GH₵ {total.toFixed(2)}</td>
                  <td className="p-5 text-center no-print">
                    <button onClick={() => notify(`Individual bill export initializing...`, 'info')} className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-[#0f3460] hover:text-white transition">Print</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="hidden print:block space-y-12">
        {students.map(s => {
           const { arrears, total, items, taxAmount } = calculateStudentBill(s);
           return (
             <div key={s.id} className="page-break bg-white p-12 border-[12px] border-double border-[#0f3460] max-w-[210mm] mx-auto min-h-[296mm] flex flex-col font-sans">
                <div className="text-center border-b-4 border-black pb-8 mb-8 flex flex-col items-center">
                  <EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className="text-5xl font-black uppercase tracking-tighter text-[#0f3460]" />
                  <EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className="text-[11px] font-black uppercase tracking-[0.4em] text-[#cca43b] mt-2" />
                  <p className="text-sm font-black text-gray-500 uppercase tracking-widest mt-2">{settings.address}</p>
                  <div className="bg-black text-white py-2 px-12 inline-block font-black text-sm rounded-sm uppercase tracking-[0.3em] mt-6 shadow-lg">
                     OFFICIAL BILL SHEET
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
                   <table className="w-full text-xs border-collapse">
                      <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                         <tr><th className="p-4 border-b-2 border-black text-left">Description</th><th className="p-4 border-b-2 border-black text-right">Amount (GH₵)</th></tr>
                      </thead>
                      <tbody className="font-bold text-gray-600">
                         <tr><td className="p-4 border-b">Arrears B/F</td><td className="p-4 border-b text-right text-red-500">{arrears.toFixed(2)}</td></tr>
                         {isNewTermMode && Object.entries(items).map(([name, val]) => (
                            <tr key={name}><td className="p-4 border-b">{name} (New Term)</td><td className="p-4 border-b text-right">{val.toFixed(2)}</td></tr>
                         ))}
                      </tbody>
                      <tfoot className="bg-yellow-50 text-[#0f3460] font-black text-xl">
                         <tr><td className="p-6 uppercase">Total Amount Payable</td><td className="p-6 text-right">GH₵ {total.toFixed(2)}</td></tr>
                      </tfoot>
                   </table>
                </div>

                <div className="mt-12 pt-8 border-t-4 border-black flex justify-between items-end">
                   <div className="text-center w-64">
                      <div className="h-10 border-b-2 border-black w-full mb-2"></div>
                      <p className="text-[9px] font-black uppercase text-gray-400">Accounts Department</p>
                   </div>
                   <div className="text-center w-80">
                      <p className="italic font-serif text-3xl mb-1 text-[#0f3460]">{settings.headteacherName}</p>
                      <div className="border-t-2 border-black pt-2"><p className="text-[10px] font-black uppercase tracking-widest text-[#0f3460]">Authorization</p></div>
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
