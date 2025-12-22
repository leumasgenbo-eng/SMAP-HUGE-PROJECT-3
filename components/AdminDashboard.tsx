
import React, { useState, useMemo, useRef } from 'react';
import { FILING_CABINET_STRUCTURE, DEPARTMENTS } from '../constants';
import { FilingRecord, GlobalSettings, Student } from '../types';

interface Props {
  section: string;
  dept: string;
  notify: any;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
}

const AdminDashboard: React.FC<Props> = ({ section, dept, notify, settings, onSettingsChange, students, onStudentsUpdate }) => {
  const [activeTab, setActiveTab] = useState<'filing' | 'promotion' | 'identity' | 'bulk' | 'excellence' | 'system'>('system');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSystemReset = () => {
    if (confirm("CRITICAL ACTION: This will wipe ALL student data and reset settings. This cannot be undone. Proceed?")) {
      onStudentsUpdate([]);
      notify("System data wiped successfully.", "error");
    }
  };

  const toggleModule = (mod: string) => {
    const updated = { ...settings.modulePermissions };
    updated[mod] = !updated[mod];
    onSettingsChange({ ...settings, modulePermissions: updated });
    notify(`${mod} visibility updated.`, 'info');
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      notify("No student records found to export.", "error");
      return;
    }

    const headers = ["ID", "SerialID", "FirstName", "Surname", "OtherNames", "DOB", "Sex", "Class", "Status", "FatherName", "MotherName"];
    const rows = students.map(s => [
      s.id,
      s.serialId,
      s.firstName,
      s.surname,
      s.others || "",
      s.dob,
      s.sex,
      s.currentClass,
      s.status,
      s.father?.name || "",
      s.mother?.name || ""
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UBA_Students_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("Student ledger exported successfully!", "success");
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      if (lines.length < 2) {
        notify("Invalid CSV format.", "error");
        return;
      }

      // Skip header
      const importedStudents: Student[] = lines.slice(1).map(line => {
        const parts = line.split(",").map(p => p.replace(/^"|"$/g, '').trim());
        return {
          id: parts[0] || crypto.randomUUID(),
          serialId: parts[1] || `UBA-${Date.now().toString().slice(-4)}`,
          firstName: parts[2] || "Unknown",
          surname: parts[3] || "Student",
          others: parts[4] || "",
          dob: parts[5] || "",
          sex: (parts[6] as any) || "Male",
          currentClass: parts[7] || "Creche",
          status: (parts[8] as any) || "Admitted",
          createdAt: new Date().toISOString(),
          father: { name: parts[9] || "", contact: "", occupation: "", education: "", religion: "", isDead: false },
          mother: { name: parts[10] || "", contact: "", occupation: "", education: "", religion: "", isDead: false },
          livesWith: 'Both Parents',
          hasSpecialNeeds: false,
          scoreDetails: {},
          attendance: {},
          payments: {}
        } as Student;
      });

      if (confirm(`Detected ${importedStudents.length} student records. Overwrite existing ledger or append? (OK to Merge, Cancel to Overwrite)`)) {
        onStudentsUpdate([...students, ...importedStudents]);
      } else {
        onStudentsUpdate(importedStudents);
      }
      notify("Data ingestion complete!", "success");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0f3460] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Administration Desk</h2>
            <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Management & System Permissions</p>
          </div>
          <div className="flex flex-wrap bg-white/10 p-1.5 rounded-2xl gap-2">
             {['system', 'identity', 'promotion', 'excellence', 'bulk', 'filing'].map(t => (
               <button 
                 key={t}
                 onClick={() => setActiveTab(t as any)} 
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === t ? 'bg-[#cca43b] text-[#0f3460]' : ''}`}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/30 p-10 min-h-[500px]">
          {activeTab === 'system' && (
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
                <h3 className="text-2xl font-black text-[#0f3460] mb-8 uppercase">Module Access Control</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['Time Table', 'Academic Calendar', 'Staff Management', 'Pupil Management', 'Examination', 'Lesson Plans', 'Finance'].map(m => (
                    <label key={m} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white border-2 border-transparent hover:border-[#cca43b] transition cursor-pointer">
                      <span className="text-xs font-black text-[#0f3460] uppercase">{m}</span>
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 accent-[#0f3460]" 
                        checked={settings.modulePermissions[m] !== false} 
                        onChange={() => toggleModule(m)}
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-12 pt-12 border-t border-gray-100">
                  <h3 className="text-2xl font-black text-[#0f3460] mb-6 uppercase">Assessment Controls</h3>
                  <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-center justify-between">
                     <div className="space-y-1">
                        <h4 className="text-sm font-black text-blue-900 uppercase">Lock SBA Marks Allocation</h4>
                        <p className="text-[10px] font-bold text-blue-700/60 uppercase">Prevents Subject Facilitators from altering mark weightings</p>
                     </div>
                     <button 
                        onClick={() => {
                          onSettingsChange({...settings, sbaMarksLocked: !settings.sbaMarksLocked});
                          notify(settings.sbaMarksLocked ? "SBA Weights UNLOCKED" : "SBA Weights LOCKED", "info");
                        }}
                        className={`w-16 h-8 rounded-full transition-all relative ${settings.sbaMarksLocked ? 'bg-red-500' : 'bg-gray-300'}`}
                     >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md flex items-center justify-center ${settings.sbaMarksLocked ? 'left-9' : 'left-1'}`}>
                           {settings.sbaMarksLocked ? '🔒' : '🔓'}
                        </div>
                     </button>
                  </div>
                </div>

                <div className="mt-12 pt-12 border-t border-red-100">
                  <h4 className="text-red-600 font-black uppercase text-xs mb-4">Danger Zone</h4>
                  <button 
                    onClick={handleSystemReset}
                    className="bg-red-50 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-red-600 transition"
                  >
                    Reset System to Factory Default
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
             <div className="p-10 max-w-4xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-lg text-center">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest">Logo & Branding</h4>
                  <div className="w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-200 mx-auto rounded-[2rem] flex items-center justify-center relative overflow-hidden group">
                    {settings.logo ? (
                      <img src={settings.logo} className="w-full h-full object-contain p-4" alt="Logo" />
                    ) : (
                      <span className="text-gray-300 font-black italic">LOGO</span>
                    )}
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (re) => onSettingsChange({...settings, logo: re.target?.result as string});
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">School Name</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460]" value={settings.schoolName} onChange={e => onSettingsChange({...settings, schoolName: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Official Motto</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460]" value={settings.motto} onChange={e => onSettingsChange({...settings, motto: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Official Address</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460]" value={settings.address} onChange={e => onSettingsChange({...settings, address: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Official Email</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460]" value={settings.email} onChange={e => onSettingsChange({...settings, email: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Contact Telephone</label>
                      <input className="w-full bg-white p-3 rounded-xl border-2 border-gray-100 font-black text-[#0f3460]" value={settings.telephone} onChange={e => onSettingsChange({...settings, telephone: e.target.value})} />
                   </div>
                   <button onClick={() => notify("Branding Updated!", "success")} className="w-full bg-[#0f3460] text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg">Save Identity</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-10">
                <div>
                  <h3 className="text-2xl font-black text-[#0f3460] uppercase">Bulk Data Operations</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Export/Import Student Records via CSV/Excel</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-4">
                    <h4 className="font-black text-[#0f3460] uppercase text-sm">Download Ledger</h4>
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                      Download the entire student database as a CSV file. This file can be opened in Microsoft Excel, Google Sheets, or any spreadsheet software.
                    </p>
                    <button 
                      onClick={handleExportCSV}
                      className="w-full bg-[#0f3460] text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-[1.02] transition"
                    >
                      Export to CSV File
                    </button>
                  </div>

                  <div className="p-8 bg-yellow-50 rounded-[2rem] border border-yellow-100 space-y-4">
                    <h4 className="font-black text-[#cca43b] uppercase text-sm">Upload Ledger</h4>
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                      Import student data from a CSV file. Ensure the headers match the system format (Name, Class, Gender, etc.) for successful ingestion.
                    </p>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".csv" 
                        ref={fileInputRef}
                        onChange={handleImportCSV}
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-[#cca43b] text-[#0f3460] py-4 rounded-2xl font-black uppercase text-xs shadow-lg hover:scale-[1.02] transition"
                      >
                        Choose File & Import
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <h5 className="text-[10px] font-black uppercase text-gray-400 mb-2">CSV Format Guide</h5>
                  <p className="font-mono text-[9px] text-gray-600 break-all bg-white p-3 rounded-lg">
                    ID, SerialID, FirstName, Surname, OtherNames, DOB, Sex, Class, Status, FatherName, MotherName
                  </p>
                  <p className="text-[9px] text-gray-400 mt-2 italic">* Use "Male" or "Female" for Sex. Status should be "Admitted" or "Pending".</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'excellence' && (
             <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center">
                <p className="text-gray-400 font-black uppercase italic text-sm">Academic Excellence Panel - Top 5 Performers Per Class</p>
             </div>
          )}

          {activeTab === 'filing' && (
             <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center">
                <p className="text-gray-400 font-black uppercase italic text-sm">Filing Cabinet - Institutional Record Retrieval</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
