
import React, { useRef } from 'react';
import { GlobalSettings, Student } from '../../types';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  notify: any;
}

const AdminSystemControlsTab: React.FC<Props> = ({ settings, onSettingsChange, students, onStudentsUpdate, notify }) => {
  const backupFileRef = useRef<HTMLInputElement>(null);

  const handleFullBackup = () => {
    const fullState = { settings, students, timestamp: new Date().toISOString(), version: "3.0.0" };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `UBA_FULL_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    notify("Full system backup generated.", "success");
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.settings && json.students) {
          if (window.confirm("Overwrite all current data? This is irreversible.")) {
            onSettingsChange(json.settings);
            onStudentsUpdate(json.students);
            notify("System data restored.", "success");
          }
        }
      } catch (err) { notify("Failed to parse backup.", "error"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 space-y-8">
        <div className="border-b pb-4">
          <h3 className="text-2xl font-black text-red-600 uppercase tracking-tighter">System Maintenance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={handleFullBackup} className="p-6 bg-green-600 text-white rounded-[2rem] font-black uppercase text-[10px] shadow-lg hover:scale-105 transition">Generate Full Backup</button>
          <div className="relative">
            <input type="file" accept=".json" className="hidden" ref={backupFileRef} onChange={handleImportBackup} />
            <button onClick={() => backupFileRef.current?.click()} className="w-full p-6 bg-white text-blue-600 border-2 border-blue-600 rounded-[2rem] font-black uppercase text-[10px] shadow-sm hover:scale-105 transition">Restore from JSON</button>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
        <div className="border-b pb-4">
          <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Security Safeguards</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className={`flex items-center justify-between p-6 rounded-[2rem] border-4 transition-all cursor-pointer ${settings.globalConfigsLocked ? 'bg-black border-red-600' : 'bg-gray-50 border-gray-100'}`}>
            <div className="space-y-1">
              <span className={`text-sm font-black uppercase ${settings.globalConfigsLocked ? 'text-white' : 'text-[#0f3460]'}`}>Global Configuration Lock</span>
              <p className={`text-[8px] font-bold uppercase ${settings.globalConfigsLocked ? 'text-red-400' : 'text-gray-400'}`}>Prevent edits to branding and contact particulars</p>
            </div>
            <input type="checkbox" className="w-10 h-10 accent-red-600" checked={settings.globalConfigsLocked} onChange={e => onSettingsChange({ ...settings, globalConfigsLocked: e.target.checked })} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemControlsTab;
