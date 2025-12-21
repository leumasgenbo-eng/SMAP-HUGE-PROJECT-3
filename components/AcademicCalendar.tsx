
import React, { useState } from 'react';
import { GlobalSettings, AcademicCalendarWeek } from '../types';
import { CALENDAR_PERIODS } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  notify: any;
}

const AcademicCalendar: React.FC<Props> = ({ settings, onSettingsChange, notify }) => {
  const [activeTerm, setActiveTerm] = useState<number>(settings.currentTerm);
  const [activeTab, setActiveTab] = useState<'plan' | 'manage'>('plan');
  const [editingCell, setEditingCell] = useState<{ weekIdx: number, field: keyof AcademicCalendarWeek } | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Local state for text area inputs in List Manager
  const [newItemText, setNewItemText] = useState({
    activities: '',
    leadTeam: '',
    extraCurricular: ''
  });

  const termWeeks = settings.academicCalendar[activeTerm] || CALENDAR_PERIODS.map(p => ({
    week: p, dateFrom: '', dateTo: '', mainActivity: '', leadTeam: '', extraCurricular: ''
  }));

  const updateWeek = (idx: number, field: keyof AcademicCalendarWeek, value: string) => {
    const newWeeks = [...termWeeks];
    newWeeks[idx] = { ...newWeeks[idx], [field]: value };
    const updated = { ...settings.academicCalendar, [activeTerm]: newWeeks };
    onSettingsChange({ ...settings, academicCalendar: updated });
    setEditingCell(null);
  };

  const handleLocalSave = () => {
    notify(`Term ${activeTerm} Calendar committed and synced!`, "success");
  };

  const handleSharePDF = async () => {
    const element = document.getElementById(`academic-plan-container`);
    if (!element) return;

    try {
      // @ts-ignore
      const html2pdf = window.html2pdf;
      if (!html2pdf) {
        alert("PDF Library not loaded. Using standard print fallback.");
        window.print();
        return;
      }

      const opt = {
        margin: 10,
        filename: `UBA_Term_${activeTerm}_Academic_Calendar.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

      if (navigator.share) {
        await navigator.share({
          title: 'Academic Calendar',
          text: `Term ${activeTerm} Academic Plan for United Baylor Academy`,
          files: [file]
        });
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = opt.filename;
        link.click();
      }
      setShowExportMenu(false);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      notify("Failed to share PDF. Using Print mode.", "error");
      window.print();
    }
  };

  const handleCopyData = () => {
    let copyText = `TERM ${activeTerm} ACADEMIC CALENDAR - ${settings.schoolName}\n`;
    copyText += `Week\tDates\tMain Activity\tLead Team\tExtra-Curricular\n`;
    
    termWeeks.forEach(w => {
      copyText += `${w.week}\t${w.dateFrom || '---'} to ${w.dateTo || '---'}\t${w.mainActivity || '---'}\t${w.leadTeam || '---'}\t${w.extraCurricular || '---'}\n`;
    });

    navigator.clipboard.writeText(copyText);
    notify("Calendar table copied to clipboard! (Tab-separated format)", "success");
    setShowExportMenu(false);
  };

  const manageList = (listKey: 'activities' | 'leadTeam' | 'extraCurricular', item: string, action: 'add' | 'remove') => {
    if (action === 'add' && !item.trim()) return;

    const updatedLists = { ...settings.popoutLists };
    const currentList = updatedLists[listKey] as string[];
    
    if (action === 'add') {
      updatedLists[listKey] = [...currentList, item.trim()];
      setNewItemText(prev => ({ ...prev, [listKey]: '' }));
      notify(`"${item.trim()}" added to ${listKey}`, "success");
    } else {
      updatedLists[listKey] = currentList.filter(i => i !== item);
      notify(`Item removed from ${listKey}`, "info");
    }
    
    onSettingsChange({ ...settings, popoutLists: updatedLists });
  };

  const getPopoutList = (field: string) => {
    if (field === 'mainActivity') return settings.popoutLists.activities;
    if (field === 'leadTeam') return settings.popoutLists.leadTeam;
    if (field === 'extraCurricular') return settings.popoutLists.extraCurricular;
    return [];
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl no-print">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Academic Calendar Desk</h2>
            <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Configure Term Events & Staffing</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(t => (
              <button key={t} onClick={() => setActiveTerm(t)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${activeTerm === t ? 'bg-[#cca43b] border-[#cca43b] text-[#0f3460] shadow-lg scale-105' : 'border-white/20 hover:bg-white/10'}`}>
                Term {t}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex bg-white/10 p-1 rounded-2xl border border-white/20">
            <button onClick={() => setActiveTab('plan')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'plan' ? 'bg-[#cca43b] text-[#0f3460] shadow-md' : ''}`}>Master Plan</button>
            <button onClick={() => setActiveTab('manage')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'manage' ? 'bg-[#cca43b] text-[#0f3460] shadow-md' : ''}`}>List Manager</button>
          </div>
          <div className="flex gap-2 relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)} 
              className="bg-[#2e8b57] text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition flex items-center gap-2"
            >
              Share / Export <span>▼</span>
            </button>
            {showExportMenu && (
              <div className="absolute top-full mt-2 right-0 w-56 bg-white rounded-2xl shadow-2xl z-[300] border border-gray-100 overflow-hidden flex flex-col p-2">
                <button onClick={handleSharePDF} className="w-full text-left p-4 hover:bg-blue-50 rounded-xl transition flex flex-col">
                  <span className="text-xs font-black text-[#0f3460] uppercase">Share as PDF</span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase">WhatsApp / Email / Print</span>
                </button>
                <button onClick={handleCopyData} className="w-full text-left p-4 hover:bg-yellow-50 rounded-xl transition flex flex-col">
                  <span className="text-xs font-black text-[#cca43b] uppercase">Copy and Paste</span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase">Clipboard for Word/Excel</span>
                </button>
              </div>
            )}
            <button onClick={handleLocalSave} className="bg-white text-[#0f3460] px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Commit Plan</button>
          </div>
        </div>
      </div>

      <div id="academic-plan-container" className="bg-white p-6 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header specifically for printing / PDF */}
        <div className="hidden print:block text-center mb-10 border-b-4 border-[#0f3460] pb-6">
           <h1 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter mb-2">{settings.schoolName}</h1>
           <h2 className="text-2xl font-bold text-[#cca43b] uppercase tracking-widest">TERM {activeTerm} ACADEMIC CALENDAR</h2>
           <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Academic Year: {settings.academicYear}</p>
        </div>

        {activeTab === 'plan' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border-collapse">
              <thead className="bg-gray-50 text-[#0f3460] font-black uppercase">
                <tr>
                  <th className="p-4 border-b text-left w-32">Week</th>
                  <th className="p-4 border-b text-center">Duration (From - To)</th>
                  <th className="p-4 border-b text-left">Main Activity</th>
                  <th className="p-4 border-b text-left">Lead Team</th>
                  <th className="p-4 border-b text-left">Extra-Curricular</th>
                </tr>
              </thead>
              <tbody>
                {termWeeks.map((w, idx) => (
                  <tr key={idx} className="border-b hover:bg-yellow-50/30 transition-colors">
                    <td className="p-4 font-black text-[#0f3460] uppercase">{w.week}</td>
                    <td className="p-4">
                      <div className="flex gap-2 items-center justify-center">
                        <input type="date" value={w.dateFrom} onChange={e => updateWeek(idx, 'dateFrom', e.target.value)} className="bg-transparent border-b outline-none text-[9px] w-24 no-print" />
                        <span className="print:hidden text-gray-300">→</span>
                        <input type="date" value={w.dateTo} onChange={e => updateWeek(idx, 'dateTo', e.target.value)} className="bg-transparent border-b outline-none text-[9px] w-24 no-print" />
                        
                        <div className="hidden print:flex gap-2 font-bold whitespace-nowrap">
                           <span>{w.dateFrom || 'N/A'}</span>
                           <span>-</span>
                           <span>{w.dateTo || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    {['mainActivity', 'leadTeam', 'extraCurricular'].map(field => (
                      <td key={field} className="p-4 relative group cursor-pointer" onClick={() => setEditingCell({ weekIdx: idx, field: field as any })}>
                        <div className={`p-2 rounded-lg border-2 border-transparent group-hover:border-[#cca43b]/20 min-h-[30px] italic ${w[field as keyof AcademicCalendarWeek] ? 'text-gray-800 font-bold' : 'text-gray-300'}`}>
                          {w[field as keyof AcademicCalendarWeek] || "---"}
                        </div>
                        {editingCell?.weekIdx === idx && editingCell.field === field && (
                          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 backdrop-blur-sm no-print" onClick={(e) => { e.stopPropagation(); setEditingCell(null); }}>
                            <div className="bg-white w-96 max-h-[400px] overflow-y-auto rounded-[2.5rem] shadow-2xl p-8 border-t-8 border-[#cca43b]" onClick={e => e.stopPropagation()}>
                               <div className="flex justify-between items-center mb-6 border-b pb-4">
                                  <h4 className="text-sm font-black uppercase text-[#0f3460] tracking-widest">Select {field.replace(/([A-Z])/g, ' $1')}</h4>
                                  <button onClick={() => setEditingCell(null)} className="text-gray-400 font-black">✕</button>
                               </div>
                               <div className="space-y-1">
                                 {getPopoutList(field).map(item => (
                                   <button key={item} onClick={() => updateWeek(idx, field as any, item)} className="w-full text-left p-4 rounded-xl text-[10px] font-black uppercase hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100">{item}</button>
                                 ))}
                                 <button onClick={() => {
                                   const val = prompt("Enter Custom Item:");
                                   if (val) updateWeek(idx, field as any, val);
                                 }} className="w-full text-left p-4 rounded-xl text-[10px] font-black uppercase text-[#cca43b] italic border border-dashed border-[#cca43b]/30 mt-4">+ Add Custom...</button>
                               </div>
                            </div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 no-print">
            {Object.entries(settings.popoutLists).filter(([k]) => ['activities', 'leadTeam', 'extraCurricular'].includes(k)).map(([key, list]) => (
              <div key={key} className="space-y-6 flex flex-col h-full bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100">
                <div className="border-b pb-4">
                  <h4 className="font-black text-[#0f3460] uppercase text-xs tracking-widest">{key.replace(/([A-Z])/g, ' $1')} Registry</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Manage standard dropdown options</p>
                </div>
                
                <div className="space-y-1 max-h-60 overflow-y-auto pr-2 scrollbar-hide flex-1">
                  {(list as string[]).map(item => (
                    <div key={item} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 group">
                      <span className="text-[10px] font-black uppercase text-gray-600">{item}</span>
                      <button onClick={() => manageList(key as any, item, 'remove')} className="text-red-300 hover:text-red-600 font-black p-1 transition-colors">✕</button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase text-gray-400 block px-2">Add New Item(s)</label>
                     <textarea 
                        className="w-full p-4 bg-white rounded-2xl border-2 border-gray-100 outline-none focus:border-[#cca43b] transition-all text-[10px] font-bold shadow-inner resize-none"
                        rows={2}
                        placeholder={`Type ${key.replace(/([A-Z])/g, ' $1')} name...`}
                        value={newItemText[key as keyof typeof newItemText]}
                        onChange={e => setNewItemText(prev => ({ ...prev, [key]: e.target.value }))}
                     />
                  </div>
                  <button 
                    onClick={() => manageList(key as any, newItemText[key as keyof typeof newItemText], 'add')} 
                    className="w-full bg-[#0f3460] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Push to List
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden print:block mt-20 flex justify-end">
        <div className="text-center w-80">
          <div className="h-16 flex items-end justify-center pb-2 italic font-serif text-3xl border-b-2 border-black">H. Baylor</div>
          <div className="pt-4">
            <p className="font-black uppercase text-sm tracking-tighter">Institutional Authorization</p>
            <p className="text-[9px] text-gray-500 italic uppercase tracking-widest mt-1">Headteacher's Certified Approval</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendar;
