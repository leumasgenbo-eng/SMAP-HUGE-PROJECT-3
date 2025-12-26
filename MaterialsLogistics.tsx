import React, { useState } from 'react';
import { GlobalSettings, MaterialRequest, ClassroomInventory, StaffRecord } from '../types';
import EditableField from './EditableField';

interface MaterialsLogisticsProps {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  onSave?: () => void;
  schoolClass: string;
  staffList: StaffRecord[];
}

const MaterialsLogistics: React.FC<MaterialsLogisticsProps> = ({ 
  settings, 
  onSettingsChange, 
  onSave, 
  schoolClass,
  staffList
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'Facilitator Materials' | 'Classroom Inventory' | 'Safety Checklist' | 'Logistics Reports'>('Facilitator Materials');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // --- TEACHING SUPPORT STATE ---
  const [newRequest, setNewRequest] = useState<Partial<MaterialRequest>>({
      itemName: '', category: 'Teaching Aid', purpose: 'Teaching', quantityRequested: 1,
      dateRequested: new Date().toISOString().split('T')[0], dateRequired: new Date().toISOString().split('T')[0],
      usageDuration: 'Temporary', priority: 'Medium', remarks: '', staffId: staffList[0]?.id || '', status: 'Pending'
  });

  const materialRequests = settings.materialRequests || [];
  
  const handleAddRequest = () => {
      if (!newRequest.itemName || !newRequest.quantityRequested) { alert("Item Name and Quantity are required."); return; }
      const staff = staffList.find(s => s.id === newRequest.staffId);
      const request: MaterialRequest = { ...newRequest as MaterialRequest, id: Date.now().toString(), staffName: staff?.name || 'Unknown Staff' };
      onSettingsChange({ ...settings, materialRequests: [request, ...materialRequests] });
      setNewRequest(prev => ({ ...prev, itemName: '', quantityRequested: 1, remarks: '' }));
      alert("Request Submitted.");
  };

  const updateRequestStatus = (id: string, updates: Partial<MaterialRequest>) => {
      const updated = materialRequests.map(r => r.id === id ? { ...r, ...updates } : r);
      onSettingsChange({ ...settings, materialRequests: updated });
  };

  const selectedRequest = materialRequests.find(r => r.id === selectedRequestId);

  const handleSharePDF = async () => {
      setIsGeneratingPDF(true);
      const element = document.getElementById('logistics-print-area');
      if (!element) return;

      // @ts-ignore
      if (typeof window.html2pdf === 'undefined') {
          alert("PDF library not loaded.");
          setIsGeneratingPDF(false);
          return;
      }

      const opt = {
          margin: 10,
          filename: `Logistics_Report_${schoolClass}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      try {
          // @ts-ignore
          await window.html2pdf().set(opt).from(element).save();
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingPDF(false);
      }
  };

  // --- CLASSROOM INVENTORY ---
  const inventoryItems = [
      "Desks & Chairs (Pupils)", "Teacher's Table & Chair", "Chalkboard / Whiteboard", 
      "Markers / Chalk / Erasers", "Functional Lighting", "Ventilation / Windows", 
      "Doors & Locks", "Power Sockets & Switches", "ICT Equipment", "Teaching Aids"
  ];

  const classroomInventories = settings.classroomInventories || [];
  const currentInventory = classroomInventories.find(i => i.schoolClass === schoolClass) || {
      id: Date.now().toString(), block: 'Main Block', roomNumber: 'Room 01', schoolClass: schoolClass,
      inspectionDate: new Date().toISOString().split('T')[0],
      items: inventoryItems.reduce((acc, item) => ({ ...acc, [item]: { status: 'Available', condition: 'Good' } }), {}),
      damagedMissingNotes: '', priority: 'Low', comments: ''
  } as ClassroomInventory;

  const updateInventory = (updates: Partial<ClassroomInventory>) => {
      const exists = classroomInventories.find(i => i.schoolClass === schoolClass);
      const updatedList = exists ? classroomInventories.map(i => i.schoolClass === schoolClass ? { ...i, ...updates } : i) : [...classroomInventories, { ...currentInventory, ...updates }];
      onSettingsChange({ ...settings, classroomInventories: updatedList });
  };

  return (
      <div className="bg-white p-6 rounded shadow-md h-full flex flex-col font-sans">
          <div className="flex justify-between items-center mb-6 border-b pb-4 no-print">
              <div><h2 className="text-2xl font-black text-blue-900 uppercase">Materials & Logistics Control</h2></div>
              <div className="flex gap-2">
                  <button onClick={handleSharePDF} disabled={isGeneratingPDF} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-xs shadow">{isGeneratingPDF ? 'Working...' : 'Share PDF Report'}</button>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded">
                      {['Facilitator Materials', 'Classroom Inventory', 'Safety Checklist'].map(t => (
                          <button key={t} onClick={() => setActiveSubTab(t as any)} className={`px-4 py-2 rounded text-[10px] uppercase font-black transition-all ${activeSubTab === t ? 'bg-white shadow text-blue-900' : 'text-gray-500 hover:text-blue-700'}`}>{t}</button>
                      ))}
                  </div>
              </div>
          </div>

          <div id="logistics-print-area" className="flex-1 overflow-y-auto pr-2">
               {/* Report Header (Visible in PDF) */}
               <div className="text-center mb-8 border-b-2 border-gray-800 pb-4 hidden print:block">
                  <h1 className="text-2xl font-black uppercase text-blue-900">
                      <EditableField value={settings.schoolName} onChange={(v) => onSettingsChange({...settings, schoolName: v})} className="text-center w-full" />
                  </h1>
                  <div className="flex justify-center gap-4 text-xs font-bold text-gray-600 mb-1">
                      <EditableField value={settings.address || ''} onChange={(v) => onSettingsChange({...settings, address: v})} className="text-center w-full" />
                  </div>
                  <h2 className="text-lg font-bold text-red-700 uppercase">MATERIALS & LOGISTICS AUDIT - {schoolClass}</h2>
                  <p className="text-xs font-bold text-gray-500 uppercase">{settings.currentTerm ? `Term ${settings.currentTerm}` : ''} | {settings.academicYear}</p>
               </div>

               {activeSubTab === 'Facilitator Materials' && (
                   <div className="space-y-6">
                       <div className="no-print bg-blue-50 p-4 rounded border border-blue-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                           <div><label className="text-[9px] font-bold">Facilitator</label><select value={newRequest.staffId} onChange={e => setNewRequest({...newRequest, staffId: e.target.value})} className="w-full border p-1 rounded text-xs bg-white">{staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                           <div><label className="text-[9px] font-bold">Item</label><input value={newRequest.itemName} onChange={e => setNewRequest({...newRequest, itemName: e.target.value})} className="w-full border p-1 rounded text-xs" /></div>
                           <div><label className="text-[9px] font-bold">Qty</label><input type="number" value={newRequest.quantityRequested} onChange={e => setNewRequest({...newRequest, quantityRequested: parseInt(e.target.value)})} className="w-full border p-1 rounded text-xs" /></div>
                           <div className="flex items-end"><button onClick={handleAddRequest} className="w-full bg-blue-600 text-white font-bold py-1 rounded text-xs">Request</button></div>
                       </div>
                       <div className="overflow-x-auto border rounded bg-white">
                           <table className="w-full text-xs text-left border-collapse">
                               <thead className="bg-gray-800 text-white uppercase text-[9px]">
                                   <tr>
                                       <th className="p-2 border-r">Date</th><th className="p-2 border-r">Facilitator</th><th className="p-2 border-r">Item</th><th className="p-2 border-r text-center">Status</th><th className="p-2 text-center no-print">Actions</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {materialRequests.map(req => (
                                       <tr key={req.id} className="border-b">
                                           <td className="p-2 border-r">{req.dateRequested}</td><td className="p-2 border-r font-bold">{req.staffName}</td><td className="p-2 border-r uppercase">{req.itemName} (x{req.quantityRequested})</td>
                                           <td className="p-2 border-r text-center"><span className="px-2 py-0.5 rounded bg-gray-100 font-bold">{req.status}</span></td>
                                           <td className="p-2 text-center no-print"><button onClick={() => setSelectedRequestId(req.id)} className="text-blue-600 underline font-bold">Flow</button></td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   </div>
               )}

               {activeSubTab === 'Classroom Inventory' && (
                   <div className="space-y-4">
                       <table className="w-full text-xs text-left border-collapse border">
                           <thead className="bg-blue-900 text-white uppercase text-[9px]">
                               <tr><th className="p-2 border">Inventory Item</th><th className="p-2 border text-center">Status</th><th className="p-2 border text-center">Condition</th></tr>
                           </thead>
                           <tbody>
                               {inventoryItems.map(item => (
                                   <tr key={item} className="border-b">
                                       <td className="p-2 font-bold uppercase">{item}</td>
                                       <td className="p-2 text-center">
                                           <select value={currentInventory.items[item]?.status} onChange={e => updateInventory({ items: { ...currentInventory.items, [item]: { ...currentInventory.items[item], status: e.target.value as any } } })} className="p-1 border rounded no-print-appearance">{['Available','Missing','Damaged'].map(o => <option key={o}>{o}</option>)}</select>
                                           <span className="hidden print:inline font-bold uppercase">{currentInventory.items[item]?.status}</span>
                                       </td>
                                       <td className="p-2 text-center">
                                           <select value={currentInventory.items[item]?.condition} onChange={e => updateInventory({ items: { ...currentInventory.items, [item]: { ...currentInventory.items[item], condition: e.target.value as any } } })} className="p-1 border rounded no-print-appearance">{['Good','Fair','Poor'].map(o => <option key={o}>{o}</option>)}</select>
                                           <span className="hidden print:inline font-bold uppercase">{currentInventory.items[item]?.condition}</span>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               )}
          </div>
          
          {/* Modal for flow process */}
          {selectedRequest && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 no-print">
                  <div className="bg-white p-6 rounded shadow-xl">
                      <button onClick={() => setSelectedRequestId(null)} className="float-right font-black">X</button>
                      <h3 className="font-bold mb-4">Process: {selectedRequest.itemName}</h3>
                      <div className="flex gap-4">
                          <button onClick={() => updateRequestStatus(selectedRequest.id, { status: 'Approved' })} className="bg-green-600 text-white p-2 rounded">Approve</button>
                          <button onClick={() => updateRequestStatus(selectedRequest.id, { status: 'Issued', dateIssued: new Date().toLocaleDateString() })} className="bg-blue-600 text-white p-2 rounded">Issue</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};

export default MaterialsLogistics;
