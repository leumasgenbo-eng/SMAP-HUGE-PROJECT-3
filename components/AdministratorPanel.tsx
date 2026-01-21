import React, { useState } from 'react';
import { GlobalSettings, Student } from '../types';
import EditableField from './EditableField';
import { CLASS_MAPPING } from '../constants';
import LessonAssessmentDesk from './LessonAssessmentDesk';
import AcademicCalendar from './AcademicCalendar';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  activeTabGlobal: string;
  activeClassGlobal: string;
}

const AdministratorPanel: React.FC<Props> = ({ settings, onSettingsChange, notify, students, onStudentsUpdate, activeTabGlobal, activeClassGlobal }) => {
  const [activeTab, setActiveTab] = useState<'particulars' | 'admission' | 'academic-calendar' | 'lesson-assessment'>('particulars');
  
  const [form, setForm] = useState<Partial<Student>>({
    firstName: '', surname: '', others: '', dob: '', sex: 'Male', classApplyingFor: 'Basic 1',
    admissionFeeReceipt: '', admissionFeeDate: new Date().toISOString().split('T')[0],
    hasSpecialNeeds: false, disabilityType: '', email: '',
    father: { name: '', contact: '', occupation: '' } as any,
    parent2: { name: '', contact: '' } as any,
    livesWith: 'Both Parents'
  });

  const handleApply = () => {
    if (!form.admissionFeeReceipt || !form.firstName) {
      notify("Please fill all required fields and processing receipt number", "error");
      return;
    }
    const newPupil: Student = {
      ...form,
      id: crypto.randomUUID(),
      serialId: `APP-${Date.now().toString().slice(-4)}`,
      status: 'Pending',
      currentClass: form.classApplyingFor || 'Basic 1',
      createdAt: new Date().toISOString(),
      scoreDetails: {}, attendance: {}, lunchRegister: {}, generalRegister: {},
      ledger: [], isFeesCleared: false,
      testDetails: {
        set: 'A',
        serial: `TX-${Date.now().toString().slice(-4)}`,
        date: '', venue: 'Main Hall', invigilator: 'Admission Officer',
        scores: { script: 0, handwriting: 0, spelling: 0, oral: 0, logic: 0 }
      }
    } as Student;
    onStudentsUpdate([...students, newPupil]);
    notify("Application Logged! Processing fee receipt verified.", "success");
    setForm({
        firstName: '', surname: '', others: '', dob: '', sex: 'Male', classApplyingFor: 'Basic 1',
        admissionFeeReceipt: '', admissionFeeDate: new Date().toISOString().split('T')[0],
        hasSpecialNeeds: false, disabilityType: '', email: '',
        father: { name: '', contact: '', occupation: '' } as any,
        parent2: { name: '', contact: '' } as any,
        livesWith: 'Both Parents'
    });
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* High-Radius Console Header - No Institutional Particulars */}
      <div className="bg-white p-12 rounded-[5rem] shadow-2xl border border-gray-100 no-print flex flex-col items-center">
        <div className="bg-[#0f3460] text-white py-3 px-16 rounded-full font-black text-sm uppercase tracking-[0.3em] shadow-lg mb-8">
           EXECUTIVE ADMINISTRATOR CONSOLE
        </div>
        
        <div className="flex flex-wrap justify-center bg-gray-100 p-2 rounded-[2.5rem] mb-4 shadow-inner gap-1">
           <button onClick={() => setActiveTab('particulars')} className={`px-10 py-3 rounded-[2rem] text-[10px] font-black uppercase transition ${activeTab === 'particulars' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400'}`}>Identity Settings</button>
           <button onClick={() => setActiveTab('admission')} className={`px-10 py-3 rounded-[2rem] text-[10px] font-black uppercase transition ${activeTab === 'admission' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400'}`}>1. Admission Form</button>
           <button onClick={() => setActiveTab('academic-calendar')} className={`px-10 py-3 rounded-[2rem] text-[10px] font-black uppercase transition ${activeTab === 'academic-calendar' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-gray-400'}`}>Academic Calendar</button>
           <button onClick={() => setActiveTab('lesson-assessment')} className={`px-10 py-3 rounded-[2rem] text-[10px] font-black uppercase transition ${activeTab === 'lesson-assessment' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-gray-400'}`}>Lesson Assessment</button>
        </div>

        {activeTab === 'particulars' && (
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 animate-fadeIn">
            <div className="bg-gray-50 p-8 rounded-[3rem] border-2 border-dashed border-gray-200 space-y-4">
                <h4 className="text-xs font-black text-[#cca43b] uppercase tracking-widest border-b pb-2">Global Identity Data</h4>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-1"><span className="text-[9px] font-black text-gray-400 uppercase">Registered Name</span><EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className="text-xs font-bold" /></div>
                  <div className="flex justify-between border-b pb-1"><span className="text-[9px] font-black text-gray-400 uppercase">Current Motto</span><EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className="text-xs font-bold italic" /></div>
                  <div className="flex justify-between border-b pb-1"><span className="text-[9px] font-black text-gray-400 uppercase">Primary Contact</span><EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} className="text-xs font-bold" /></div>
                </div>
                <p className="text-[8px] text-gray-400 font-bold uppercase leading-relaxed text-center pt-2">Edits here will sync to all official printable reports.</p>
            </div>

            <div className="bg-[#0f3460] p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-center space-y-6">
                <div>
                  <h4 className="text-[#cca43b] font-black text-xs uppercase tracking-widest mb-1">Administrative Status</h4>
                  <p className="text-2xl font-black tracking-tighter text-white">AUTHORIZED SESSION</p>
                </div>
                <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase">Global Edit Lock</span>
                  <button 
                    onClick={() => onSettingsChange({...settings, globalConfigsLocked: !settings.globalConfigsLocked})}
                    className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${settings.globalConfigsLocked ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                  >
                    {settings.globalConfigsLocked ? 'Locked' : 'Unlocked'}
                  </button>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'admission' && (
          <div className="w-full max-w-6xl mt-6 animate-fadeIn bg-gray-50/50 p-10 rounded-[4rem] border border-gray-100 shadow-inner">
             <div className="flex justify-between items-end border-b pb-6 mb-8">
               <div>
                 <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">New Learner Enrollment</h3>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Institutional Entry Point & Processing Fee Verification</p>
               </div>
               <div className="bg-white p-4 rounded-[2rem] border border-gray-200 shadow-sm space-y-2">
                 <label className="text-[8px] font-black text-[#cca43b] uppercase px-2">Processing Receipt</label>
                 <div className="flex gap-4">
                   <input placeholder="Receipt #" className="p-2 bg-gray-50 rounded-xl text-xs font-black w-32 border-none" value={form.admissionFeeReceipt} onChange={e => setForm({...form, admissionFeeReceipt: e.target.value})} />
                   <input type="date" className="p-2 bg-gray-50 rounded-xl text-xs font-black border-none" value={form.admissionFeeDate} onChange={e => setForm({...form, admissionFeeDate: e.target.value})} />
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
               <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b pb-1">A. Learner Identity</h4>
                 <input placeholder="First Name" className="w-full p-4 bg-white rounded-2xl font-bold border-none shadow-sm" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                 <input placeholder="Surname" className="w-full p-4 bg-white rounded-2xl font-bold border-none shadow-sm" value={form.surname} onChange={e => setForm({...form, surname: e.target.value})} />
                 <select className="w-full p-4 bg-blue-50 text-blue-900 rounded-2xl font-black text-xs uppercase border-none" value={form.classApplyingFor} onChange={e => setForm({...form, classApplyingFor: e.target.value})}>
                   {Object.values(CLASS_MAPPING).flat().map(c => <option key={c}>{c}</option>)}
                 </select>
               </div>

               <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b pb-1">B. Primary Guardian</h4>
                 <input placeholder="Full Name" className="w-full p-4 bg-white rounded-2xl border-none shadow-sm font-bold" value={form.father?.name} onChange={e => setForm({...form, father: { ...form.father!, name: e.target.value }})} />
                 <input placeholder="Phone Contact" className="w-full p-4 bg-white rounded-2xl border-none shadow-sm font-mono text-blue-600" value={form.father?.contact} onChange={e => setForm({...form, father: { ...form.father!, contact: e.target.value }})} />
                 <input placeholder="Email (Optional)" className="w-full p-4 bg-white rounded-2xl border-none shadow-sm lowercase text-xs" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
               </div>

               <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b pb-1">C. Enrollment Logic</h4>
                 <select className="w-full p-4 bg-white rounded-2xl font-bold text-xs border-none shadow-sm" value={form.livesWith} onChange={e => setForm({...form, livesWith: e.target.value as any})}>
                   <option>Both Parents</option><option>Mother</option><option>Father</option><option>Guardian</option>
                 </select>
                 <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 flex flex-col justify-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                       <input type="checkbox" className="w-6 h-6 accent-red-600" checked={form.hasSpecialNeeds} onChange={e => setForm({...form, hasSpecialNeeds: e.target.checked})} />
                       <span className="text-[10px] font-black uppercase text-red-900">Declare Special Needs</span>
                    </label>
                 </div>
               </div>
             </div>

             <button onClick={handleApply} className="w-full bg-[#0f3460] text-white py-6 mt-12 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.01] transition-all">Generate Enrollment Serial & Authorize</button>
          </div>
        )}

        {activeTab === 'academic-calendar' && (
          <div className="w-full mt-6 animate-fadeIn">
             <AcademicCalendar settings={settings} onSettingsChange={onSettingsChange} notify={notify} />
          </div>
        )}

        {activeTab === 'lesson-assessment' && (
          <div className="w-full mt-6 animate-fadeIn">
             <LessonAssessmentDesk settings={settings} onSettingsChange={onSettingsChange} department={activeTabGlobal} activeClass={activeClassGlobal} notify={notify} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdministratorPanel;