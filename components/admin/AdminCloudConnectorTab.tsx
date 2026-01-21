
import React, { useState } from 'react';
import { GlobalSettings, CloudSyncLog } from '../../types';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  notify: any;
}

const AdminCloudConnectorTab: React.FC<Props> = ({ settings, onSettingsChange, notify }) => {
  const [endpoint, setEndpoint] = useState(settings.syncEndpoint || '');

  const saveEndpoint = () => {
    onSettingsChange({ ...settings, syncEndpoint: endpoint });
    notify("Cloud host endpoint updated!", "success");
  };

  const syncLogs = settings.cloudSyncLogs || [];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
        <div className="border-b pb-4 flex justify-between items-end">
          <div>
            <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">External Cloud Hub</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure Bi-Directional Host Connector</p>
          </div>
          <div className="bg-green-50 px-4 py-1.5 rounded-xl border border-green-100">
             <p className="text-[8px] font-black text-green-600 uppercase">Host Status</p>
             <p className="text-[10px] font-black text-green-800 uppercase">Connected</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-400 px-2">Primary Sync Endpoint (API / Apps Script URL)</label>
            <div className="flex gap-4">
               <input 
                 value={endpoint} 
                 onChange={e => setEndpoint(e.target.value)} 
                 placeholder="https://script.google.com/macros/s/..." 
                 className="flex-1 p-4 bg-gray-50 rounded-2xl font-mono text-xs text-blue-600 outline-none focus:ring-2 focus:ring-[#cca43b] shadow-inner"
               />
               <button onClick={saveEndpoint} className="bg-[#0f3460] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:scale-105 transition">Update Host</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-[#cca43b]">Sync Intelligence</h4>
                <div className="space-y-2">
                   <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 accent-[#0f3460]" defaultChecked />
                      <span className="text-[9px] font-bold text-gray-600 uppercase">Auto-sync on entry authorization</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 accent-[#0f3460]" defaultChecked />
                      <span className="text-[9px] font-bold text-gray-600 uppercase">Conflict Resolution: Client Wins</span>
                   </label>
                </div>
             </div>
             <div className="p-6 bg-[#0f3460] rounded-[2rem] text-white flex flex-col justify-center">
                <p className="text-[8px] font-black text-[#cca43b] uppercase">Last Registry Refresh</p>
                <p className="text-xl font-black">{settings.lastCloudSync ? new Date(settings.lastCloudSync).toLocaleString() : 'Never'}</p>
                <p className="text-[7px] text-white/40 mt-1 uppercase italic">Total Records Managed: {(settings.staff.length + (settings.exerciseEntries?.length || 0))}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8">
        <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter border-b pb-4">Cloud Transaction Audit Log</h3>
        <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
           <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                 <tr>
                    <th className="p-5">Timestamp</th>
                    <th className="p-5">Exchange Type</th>
                    <th className="p-5">Payload Status</th>
                    <th className="p-5">Records</th>
                    <th className="p-5">Details</th>
                 </tr>
              </thead>
              <tbody>
                 {syncLogs.length > 0 ? syncLogs.map(log => (
                   <tr key={log.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-5 font-mono text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="p-5"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${log.type === 'PUSH' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{log.type} OUTFLOW</span></td>
                      <td className="p-5"><span className="text-green-600 font-black uppercase">{log.status}</span></td>
                      <td className="p-5 font-black text-[#0f3460]">{log.recordsProcessed}</td>
                      <td className="p-5 text-gray-400 italic text-[10px]">{log.details}</td>
                   </tr>
                 )) : (
                   <tr><td colSpan={5} className="p-20 text-center text-gray-300 font-black uppercase italic tracking-widest">No cloud transactions logged in current session.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCloudConnectorTab;
