
import React from 'react';
import { Pupil, GlobalSettings } from '../types';
import EditableField from './EditableField';

interface Props {
  pupil: Pupil;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  onStudentUpdate: (id: string, field: string, value: any) => void;
  activeClass: string;
}

const SchoolFeesCard: React.FC<Props> = ({ pupil, settings, onSettingsChange, onStudentUpdate, activeClass }) => {

  const handleSharePDF = async () => {
    const element = document.getElementById(`fees-card-${pupil.no}`);
    if (!element) return;

    try {
      // @ts-ignore
      const html2pdf = window.html2pdf;
      if (!html2pdf) return;

      const opt = {
        margin: 10,
        filename: `${pupil.name.replace(/\s+/g, '_')}_Fees_Card.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
    }
  };

  // Mock fee data - in a real app, this would come from pupil.payments
  const fees = {
    tuition: 1200,
    books: 450,
    uniform: 300,
    facility: 150,
    total: 2100,
    paid: pupil.isFeesCleared ? 2100 : 850
  };
  const balance = fees.total - fees.paid;
  const isCleared = balance <= 0;

  return (
    <div className="flex justify-center p-4">
      <div 
        id={`fees-card-${pupil.no}`}
        className="bg-white p-10 border-[10px] border-double border-[#0f3460] w-[210mm] min-h-[148mm] shadow-2xl flex flex-col font-sans relative"
      >
        <div className="absolute top-4 right-4 no-print flex gap-2" data-html2canvas-ignore>
          <button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition">Share PDF</button>
        </div>

        {/* Polished Editable Branding Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl border-2 border-gray-100 flex items-center justify-center overflow-hidden group relative">
              {settings.logo ? (
                <img src={settings.logo} className="w-full h-full object-contain" alt="Logo" />
              ) : (
                <span className="text-3xl">💰</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center no-print">
                <EditableField 
                  value={settings.logo} 
                  onSave={v => onSettingsChange({...settings, logo: v})} 
                  placeholder="Logo URL"
                  className="text-[8px] text-white bg-transparent border-white"
                />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <EditableField 
                value={settings.schoolName} 
                onSave={v => onSettingsChange({...settings, schoolName: v})} 
                className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter leading-none" 
              />
              <EditableField 
                value={settings.motto} 
                onSave={v => onSettingsChange({...settings, motto: v})} 
                className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b] mt-1" 
              />
            </div>
          </div>

          <div className="space-y-1 mb-4 border-b border-gray-100 pb-4 w-full">
            <EditableField 
              value={settings.address} 
              onSave={v => onSettingsChange({...settings, address: v})} 
              className="text-xs font-black text-gray-500 w-full text-center uppercase tracking-widest"
            />
            <div className="flex justify-center gap-6 text-[10px] font-black text-gray-400 mt-2 bg-gray-50 px-6 py-1.5 rounded-full border border-gray-100">
               <div className="flex items-center gap-1">
                 <span className="text-[#cca43b]">📞</span>
                 <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
               </div>
               <span className="text-gray-200">|</span>
               <div className="flex items-center gap-1">
                 <span className="text-[#cca43b]">✉️</span>
                 <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} className="lowercase" />
               </div>
            </div>
          </div>
          <div className="bg-[#0f3460] text-white py-2 px-12 inline-block font-black text-xs rounded-lg uppercase tracking-widest shadow-md">
            OFFICIAL SCHOOL FEES STATUS CARD
          </div>
        </div>

        {/* Pupil Info */}
        <div className="grid grid-cols-2 gap-8 mb-6 border-b border-dashed pb-6">
          <div className="space-y-2">
            <div className="flex justify-between border-b"><span className="text-[10px] font-black text-gray-400 uppercase">Learner Name</span><span className="font-black text-[#0f3460] uppercase">{pupil.name}</span></div>
            <div className="flex justify-between border-b"><span className="text-[10px] font-black text-gray-400 uppercase">Class/Level</span><span className="font-bold">{activeClass}</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between border-b"><span className="text-[10px] font-black text-gray-400 uppercase">Academic Cycle</span><span className="font-bold">{settings.academicYear}</span></div>
            <div className="flex justify-between border-b"><span className="text-[10px] font-black text-gray-400 uppercase">Current Term</span><span className="font-bold">TERM {settings.currentTerm}</span></div>
          </div>
        </div>

        {/* Fees Summary */}
        <div className="flex-1 flex flex-col md:flex-row gap-10">
          <div className="flex-1">
             <table className="w-full text-xs">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-[#0f3460]">
                   <tr>
                     <th className="p-3 text-left border-b-2 border-black">Fee Description</th>
                     <th className="p-3 text-right border-b-2 border-black">Amount (GH₵)</th>
                   </tr>
                </thead>
                <tbody className="font-bold text-gray-600">
                   <tr><td className="p-3 border-b">Tuition & Facilities</td><td className="p-3 text-right">{fees.tuition.toFixed(2)}</td></tr>
                   <tr><td className="p-3 border-b">Instructional Materials</td><td className="p-3 text-right">{fees.books.toFixed(2)}</td></tr>
                   <tr><td className="p-3 border-b">Institutional Wear (Uniforms)</td><td className="p-3 text-right">{fees.uniform.toFixed(2)}</td></tr>
                   <tr><td className="p-3 border-b">Admin & Levies</td><td className="p-3 text-right">{fees.facility.toFixed(2)}</td></tr>
                </tbody>
                <tfoot className="font-black text-sm">
                   <tr className="bg-gray-100 text-[#0f3460]"><td className="p-3 uppercase">Total Billable Amount</td><td className="p-3 text-right">GH₵ {fees.total.toFixed(2)}</td></tr>
                   <tr className="text-green-700"><td className="p-3 border-t uppercase">Total Amount Paid</td><td className="p-3 text-right">GH₵ {fees.paid.toFixed(2)}</td></tr>
                </tfoot>
             </table>
          </div>

          <div className="w-64 flex flex-col justify-center items-center gap-6">
             <div className={`w-full p-6 rounded-3xl border-4 text-center ${isCleared ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <span className="text-[10px] font-black uppercase block mb-1 text-gray-400">Balance Due</span>
                <span className={`text-3xl font-black ${isCleared ? 'text-green-600' : 'text-red-600'}`}>
                   {isCleared ? 'CLEARED' : `GH₵ ${balance.toFixed(2)}`}
                </span>
             </div>
             
             <div className="w-32 h-32 border-4 border-dashed border-gray-100 rounded-full flex items-center justify-center opacity-10 rotate-12">
                <span className="font-black text-3xl text-center uppercase tracking-tighter leading-none">UBA<br/>OFFICIAL</span>
             </div>
          </div>
        </div>

        {/* Footer Authorization */}
        <div className="mt-8 pt-6 border-t-2 border-[#0f3460] flex justify-between items-end">
           <div className="text-left">
              <p className="text-[9px] font-black text-gray-400 uppercase">System Generated: {new Date().toLocaleDateString()}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase">Verification ID: UBA-FIN-{pupil.no}-{Date.now().toString().slice(-4)}</p>
           </div>
           <div className="text-center w-60">
              <div className="italic font-serif text-xl mb-1 text-[#0f3460]">
                <EditableField value={settings.headteacherName} onSave={v => onSettingsChange({...settings, headteacherName: v})} className="text-center" />
              </div>
              <div className="border-t border-black pt-1">
                 <p className="text-[9px] font-black uppercase tracking-widest">Headteacher Authorization</p>
                 <EditableField 
                   value={settings.reportFooterText || "Official Certification of United Baylor Academy"} 
                   onSave={v => onSettingsChange({...settings, reportFooterText: v})} 
                   className="text-[7px] text-gray-400 font-bold uppercase mt-1"
                 />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolFeesCard;
