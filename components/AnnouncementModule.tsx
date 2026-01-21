
import React, { useState, useMemo } from 'react';
import { GlobalSettings, Announcement, Student, StaffRecord } from '../types';
import EditableField from './EditableField';
import { CLASS_MAPPING } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  notify: any;
  students: Student[];
}

const AnnouncementModule: React.FC<Props> = ({ settings, onSettingsChange, notify, students }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'archive'>('create');
  const [showRecipients, setShowRecipients] = useState(false);
  const [form, setForm] = useState<Partial<Announcement>>({
    title: '',
    category: 'General',
    content: '',
    targetAudience: 'All',
    platforms: ['System']
  });

  const announcements = useMemo(() => settings.announcements || [], [settings.announcements]);
  const allClasses = useMemo(() => Object.values(CLASS_MAPPING).flat(), []);

  const recipients = useMemo(() => {
    const list: { name: string, contact: string, type: string }[] = [];
    
    if (form.targetAudience === 'Staff' || form.targetAudience === 'All') {
      settings.staff.forEach(s => list.push({ name: s.name, contact: s.contact, type: 'Staff' }));
    }
    
    if (form.targetAudience === 'Parents' || form.targetAudience === 'All' || form.targetAudience === 'Specific Class') {
      const parentPool = form.targetAudience === 'Specific Class' 
        ? students?.filter((s: Student) => s.currentClass === form.targetClass && s.status === 'Admitted')
        : students?.filter((s: Student) => s.status === 'Admitted');
      
      parentPool?.forEach((s: Student) => {
        list.push({ 
          name: s.father?.name || s.mother?.name || 'Parent', 
          contact: s.father?.contact || s.mother?.contact || 'N/A', 
          type: `Parent (${s.currentClass})` 
        });
      });
    }

    return list;
  }, [form.targetAudience, form.targetClass, settings, students]);

  const handleCreate = () => {
    if (!form.title || !form.content) {
      notify("Please provide both a title and content for the announcement.", "error");
      return;
    }

    const newAnnouncement: Announcement = {
      ...form as Announcement,
      id: crypto.randomUUID(),
      dateCreated: new Date().toISOString(),
      authorName: settings.headteacherName,
      status: 'Sent'
    };

    onSettingsChange({
      ...settings,
      announcements: [newAnnouncement, ...announcements]
    });

    notify(`Broadcast authorized! Sending to ${recipients.length} verified contacts via ${form.platforms?.join(', ')}.`, "success");
    setForm({ title: '', category: 'General', content: '', targetAudience: 'All', platforms: ['System'] });
    setActiveTab('archive');
    setShowRecipients(false);
  };

  const togglePlatform = (p: Announcement['platforms'][number]) => {
    const current = form.platforms || [];
    const updated = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
    setForm({ ...form, platforms: updated });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f3460] p-8 rounded-[2rem] text-white flex justify-between items-center shadow-xl no-print">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Communications Desk</h2>
          <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1 italic">Contact Registry Synchronized Broadcast Tool</p>
        </div>
        <div className="flex bg-white/10 p-1.5 rounded-2xl gap-2">
          <button onClick={() => setActiveTab('create')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'create' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/60 hover:text-white'}`}>Broadcast Center</button>
          <button onClick={() => setActiveTab('archive')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'archive' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/60 hover:text-white'}`}>Message Archive</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 min-h-[600px]">
        {activeTab === 'create' ? (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fadeIn">
             <div className="lg:col-span-2 space-y-8">
                <div className="space-y-4">
                   <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4">Draft Communication</h3>
                   <div className="space-y-6">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-gray-400 px-2">Announcement Heading</label>
                         <input 
                           className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-lg text-[#0f3460] outline-none focus:ring-2 focus:ring-[#cca43b] shadow-inner"
                           placeholder="e.g. Mid-Term Vacation Notice"
                           value={form.title}
                           onChange={e => setForm({...form, title: e.target.value})}
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-gray-400 px-2">Message Body</label>
                         <textarea 
                           className="w-full h-64 p-6 bg-gray-50 rounded-[2.5rem] border-none font-medium text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#cca43b] shadow-inner resize-none"
                           placeholder="Type your official communication here..."
                           value={form.content}
                           onChange={e => setForm({...form, content: e.target.value})}
                         />
                      </div>
                   </div>
                </div>

                {showRecipients && (
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-200 animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-black uppercase text-[#0f3460]">Verified Recipient Pool ({recipients.length})</h4>
                      <button onClick={() => setShowRecipients(false)} className="text-red-400 text-[10px] font-black">Hide List</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {recipients.map((r, i) => (
                        <div key={i} className="bg-white p-2 rounded-lg border border-gray-100 flex justify-between text-[9px]">
                          <span className="font-bold text-gray-600 truncate mr-2">{r.name}</span>
                          <span className="font-mono text-[#cca43b]">{r.contact}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={handleCreate} className="w-full bg-[#2e8b57] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">Authorize & Send to {recipients.length} Contacts</button>
             </div>

             <div className="space-y-8">
                <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 space-y-6 shadow-inner">
                   <h4 className="text-xs font-black text-[#cca43b] uppercase tracking-widest border-b pb-2">Broadcast Intelligence</h4>
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-gray-400">Target Audience</label>
                         <select className="w-full p-3 bg-white rounded-xl font-bold text-xs border-none" value={form.targetAudience} onChange={e => setForm({...form, targetAudience: e.target.value as any})}>
                            <option>All</option><option>Parents</option><option>Staff</option><option>Specific Class</option>
                         </select>
                      </div>
                      {form.targetAudience === 'Specific Class' && (
                        <div className="space-y-1 animate-fadeIn">
                           <label className="text-[9px] font-black uppercase text-gray-400">Select Class</label>
                           <select className="w-full p-3 bg-white rounded-xl font-bold text-xs border-none" value={form.targetClass} onChange={e => setForm({...form, targetClass: e.target.value})}>
                              {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                      )}
                      <div className="pt-2">
                        <button 
                          onClick={() => setShowRecipients(!showRecipients)}
                          className="w-full bg-blue-50 text-blue-700 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-blue-100 transition"
                        >
                          View {recipients.length} Targeted Contacts
                        </button>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border-2 border-dashed border-gray-100 space-y-6">
                   <h4 className="text-xs font-black text-[#0f3460] uppercase tracking-widest border-b pb-2">Multi-Platform Inflow</h4>
                   <div className="grid grid-cols-2 gap-3">
                      {(['System', 'WhatsApp', 'Email', 'SMS'] as const).map(p => (
                        <button 
                          key={p} 
                          onClick={() => togglePlatform(p)}
                          className={`p-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${form.platforms?.includes(p) ? 'bg-[#0f3460] text-white shadow-lg' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
                        >
                          {p === 'System' ? '🌐' : p === 'WhatsApp' ? '💬' : p === 'Email' ? '📧' : '📱'} {p}
                        </button>
                      ))}
                   </div>
                   <p className="text-[8px] text-gray-400 font-bold uppercase italic leading-relaxed text-center">Messaging data pulled directly from HR and Pupil Registry.</p>
                </div>
             </div>
          </div>
        ) : (
          <div className="space-y-10 animate-fadeIn">
             <p className="p-20 text-center text-gray-300 font-black uppercase italic tracking-widest leading-relaxed">No historic broadcasts detected in current cycle.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementModule;
