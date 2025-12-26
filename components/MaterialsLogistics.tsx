
import React, { useState, useMemo } from 'react';
import { GlobalSettings, MaterialRequest, ClassroomInventory, StaffRecord } from '../types';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  activeClass: string;
  staffList: StaffRecord[];
  notify: any;
}

const MaterialsLogistics: React.FC<Props> = ({ settings, onSettingsChange, activeClass, staffList, notify }) => {
  const [activeSubTab, setActiveSubTab] = useState<'Requests' | 'Inventory' | 'Audit'>('Requests');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [newRequest, setNewRequest] = useState<Partial<MaterialRequest>>({
    itemName: '', category: 'Teaching Aid', purpose: 'Teaching', quantityRequested: 1,
    dateRequested: new Date().toISOString().split('T')[0], dateRequired: new Date().toISOString().split('T')[0],
    usageDuration: 'Temporary', priority: 'Medium', remarks: '', staffId: staffList[0]?.id || '', status: 'Pending'
  });

  const materialRequests = settings.materialRequests || [];
  const classroomInventories = settings.classroomInventories || [];

  const handleAddRequest = () => {
    if (!newRequest.itemName || !newRequest.quantityRequested) {
      notify("Item Name and Quantity are required.", "error");
      return;
    }
    const staff = staffList.find(s => s.id === newRequest.staffId);
    const request: MaterialRequest = {
      ...newRequest as MaterialRequest,
      id: crypto.randomUUID(),
      staffName: staff?.name || 'Unknown Staff'
    };
    onSettingsChange({ ...settings, materialRequests: [request, ...materialRequests] });
    setNewRequest(prev => ({ ...prev, itemName: '', quantityRequested: 1, remarks: '' }));
    notify("Logistics Request Authorized!", "success");
  };

  const updateRequestStatus = (id: string, updates: Partial<MaterialRequest>) => {
    const updated = materialRequests.map(r => r.id === id ? { ...r, ...updates } : r);
    onSettingsChange({ ...settings, materialRequests: updated });
    notify(`Request updated: ${updates.status}`, "info");
    setSelectedRequestId(null);
  };

  const inventoryItems = [
    "Desks & Chairs (Pupils)", "Teacher's Desk", "Chalkboard / Whiteboard",
    "Markers / Chalk Set", "Lighting Fixtures", "Ventilation / Windows",
    "Doors & Institutional Locks", "Power Sockets", "Digital Aid / Projector", "Wall Charts"
  ];

  const currentInventory = useMemo(() => {
    const existing = classroomInventories.find(i => i.schoolClass === activeClass);
    if (existing) return existing;
    return {
      id: crypto.randomUUID(), block: 'Main Wing', roomNumber: '001', schoolClass: activeClass,
      inspectionDate: new Date().toISOString().split('T')[0],
      items: inventoryItems.reduce((acc, item) => ({ ...acc, [item]: { status: 'Available', condition: 'Good' } }), {}),
      damagedMissingNotes: '', priority: 'Low', comments: ''
    } as ClassroomInventory;
  }, [classroomInventories, activeClass]);

  const updateInventory = (updates: Partial<ClassroomInventory>) => {
    const exists = classroomInventories.find(i => i.schoolClass === activeClass);
    const updatedList = exists 
      ? classroomInventories.map(i => i.schoolClass === activeClass ? { ...i, ...updates } : i) 
      : [...classroomInventories, { ...currentInventory, ...updates }];
    onSettingsChange({ ...settings, classroomInventories: updatedList });
    notify("Classroom Inventory Synced!", "success");
  };

  const selectedRequest = materialRequests.find(r => r.id === selectedRequestId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Institutional Branding Header */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <EditableField 
          value={settings.schoolName} 
          onSave={v => onSettingsChange({...settings, schoolName: v})} 
          className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" 
        />
        <EditableField 
          value={settings.motto} 
          onSave={v => onSettingsChange({...settings, motto: v})} 
          className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b]" 
        />
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 border-t border-gray-50 w-full max-w-2xl">
          <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} />
          <span>•</span>
          <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} />
          <span>•</span>
          <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} />
        </div>
      </div>

      <div className="bg-[#0f3460] p-8 rounded-[3rem] text-white flex justify-between items-center shadow-xl no-print">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Logistics & Materials Desk</h2>
          <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Resource Distribution • Class: {activeClass}</p>
        </div>
        <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl">
          {(['Requests', 'Inventory', 'Audit'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => setActiveSubTab(t)} 
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === t ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              {t === 'Requests' ? 'Facilitator Materials' : t === 'Inventory' ? 'Classroom Inventory' : 'Logistics Reports'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 min-h-[500px]">
        {activeSubTab === 'Requests' && (
          <div className="space-y-10">
            <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 px-2">Facilitator</label>
                <select 
                  value={newRequest.staffId} 
                  onChange={e => setNewRequest({...newRequest, staffId: e.target.value})} 
                  className="w-full p-4 bg-white rounded-2xl border-none font-black text-xs shadow-sm"
                >
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 px-2">Item Requested</label>
                <input 
                  value={newRequest.itemName} 
                  onChange={e => setNewRequest({...newRequest, itemName: e.target.value})} 
                  placeholder="e.g. A4 Paper Rim"
                  className="w-full p-4 bg-white rounded-2xl border-none font-bold text-xs shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 px-2">Quantity</label>
                <input 
                  type="number" 
                  value={newRequest.quantityRequested} 
                  onChange={e => setNewRequest({...newRequest, quantityRequested: parseInt(e.target.value)})} 
                  className="w-full p-4 bg-white rounded-2xl border-none font-black text-xs shadow-sm"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleAddRequest} 
                  className="w-full bg-[#cca43b] text-[#0f3460] py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-[1.02] transition"
                >
                  Submit Request
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                  <tr>
                    <th className="p-5">Date</th>
                    <th className="p-5">Staff Member</th>
                    <th className="p-5">Resource Item</th>
                    <th className="p-5 text-center">Status</th>
                    <th className="p-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materialRequests.map(req => (
                    <tr key={req.id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-5 font-mono text-gray-400">{req.dateRequested}</td>
                      <td className="p-5 font-black uppercase text-[#0f3460]">{req.staffName}</td>
                      <td className="p-5 font-bold uppercase text-gray-500">{req.itemName} (x{req.quantityRequested})</td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                          req.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 
                          req.status === 'Approved' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <button 
                          onClick={() => setSelectedRequestId(req.id)} 
                          className="text-[#cca43b] font-black text-[9px] uppercase hover:underline"
                        >
                          Process Flow
                        </button>
                      </td>
                    </tr>
                  ))}
                  {materialRequests.length === 0 && (
                    <tr><td colSpan={5} className="p-20 text-center text-gray-300 italic font-black uppercase tracking-widest">No material requests in current session.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'Inventory' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-6">
              <h3 className="text-2xl font-black text-[#0f3460] uppercase">Classroom Resource Inventory</h3>
              <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl">
                <span className="text-[10px] font-black text-gray-400 uppercase">Last Inspected:</span>
                <input 
                  type="date" 
                  value={currentInventory.inspectionDate} 
                  onChange={e => updateInventory({ inspectionDate: e.target.value })}
                  className="bg-transparent text-xs font-black text-[#0f3460]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {inventoryItems.map(item => (
                <div key={item} className="flex flex-col md:flex-row items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:bg-white hover:border-[#cca43b] transition">
                  <span className="font-black text-[#0f3460] uppercase text-xs w-64">{item}</span>
                  <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
                    <div className="flex gap-1 bg-white p-1 rounded-xl shadow-inner">
                      {(['Available', 'Missing', 'Damaged'] as const).map(status => (
                        <button 
                          key={status} 
                          onClick={() => updateInventory({ items: { ...currentInventory.items, [item]: { ...currentInventory.items[item], status } } })}
                          className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition ${currentInventory.items[item]?.status === status ? 'bg-[#0f3460] text-white' : 'text-gray-300'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 bg-white p-1 rounded-xl shadow-inner">
                      {(['Good', 'Fair', 'Poor'] as const).map(condition => (
                        <button 
                          key={condition} 
                          onClick={() => updateInventory({ items: { ...currentInventory.items, [item]: { ...currentInventory.items[item], condition } } })}
                          className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition ${currentInventory.items[item]?.condition === condition ? 'bg-[#2e8b57] text-white' : 'text-gray-300'}`}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'Audit' && (
          <div className="p-20 text-center flex flex-col items-center justify-center space-y-6 opacity-30 grayscale pointer-events-none">
            <span className="text-8xl">📊</span>
            <p className="text-gray-400 font-black uppercase text-xl italic tracking-widest leading-relaxed max-w-lg">
              Logistics Reconciliation Engine Initializing... Automated audit broad sheet will be generated upon session close.
            </p>
          </div>
        )}
      </div>

      {/* Processing Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#0f3460]/90 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8 border-t-8 border-[#cca43b]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black uppercase text-[#0f3460]">Authorization Flow</h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Item: {selectedRequest.itemName}</p>
              </div>
              <button onClick={() => setSelectedRequestId(null)} className="text-gray-300 hover:text-[#0f3460] text-2xl font-black">✕</button>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase"><span>Requester:</span> <span className="text-[#cca43b]">{selectedRequest.staffName}</span></div>
              <div className="flex justify-between text-[10px] font-black uppercase"><span>Quantity:</span> <span>{selectedRequest.quantityRequested}</span></div>
              <div className="flex justify-between text-[10px] font-black uppercase"><span>Priority:</span> <span className="text-red-500">{selectedRequest.priority}</span></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => updateRequestStatus(selectedRequest.id, { status: 'Approved' })} className="w-full bg-[#0f3460] text-white py-4 rounded-2xl font-black uppercase text-xs">Approve Request</button>
              <button onClick={() => updateRequestStatus(selectedRequest.id, { status: 'Issued', dateIssued: new Date().toLocaleDateString() })} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs">Authorize Issuance</button>
              <button onClick={() => updateRequestStatus(selectedRequest.id, { status: 'Declined' })} className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black uppercase text-xs">Decline</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsLogistics;
