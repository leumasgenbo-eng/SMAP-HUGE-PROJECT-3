
import React from 'react';
import { StaffRecord, GlobalSettings } from '../../types';
import { DEPARTMENTS } from '../../constants';

interface Props {
  regForm: Partial<StaffRecord>;
  setRegForm: (form: Partial<StaffRecord>) => void;
  settings: GlobalSettings;
  onFinalize: () => void;
}

const StaffRegistrationTab: React.FC<Props> = ({ regForm, setRegForm, settings, onFinalize }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn no-print">
      <div className="text-center border-b-2 border-gray-100 pb-8">
        <h3 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter leading-none">{settings.schoolName}</h3>
        <p className="text-lg font-bold text-gray-500 uppercase mt-2">School Staff Registration Questionnaire</p>
        <p className="text-[10px] font-black text-[#cca43b] uppercase tracking-widest mt-1">(Human Resource Department)</p>
      </div>

      <div className="space-y-8">
        <div className="bg-gray-50 px-6 py-2 rounded-xl text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Section A: Personal Information</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1 md:col-span-2">
            <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Full Name (Surname first)</label>
            <input value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} placeholder="e.g. OBENG, Samuel" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none shadow-inner" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Gender</label>
            <div className="flex gap-4 p-2">
              {['Male', 'Female'].map(g => (
                <label key={g} className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input type="radio" name="gender" value={g} checked={regForm.gender === g} onChange={e => setRegForm({...regForm, gender: e.target.value as any})} className="accent-[#0f3460]" />
                  {g}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Date of Birth</label>
            <input type="date" value={regForm.dob} onChange={e => setRegForm({...regForm, dob: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Age</label>
            <input type="number" placeholder="Years" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold" value={regForm.age} onChange={e => setRegForm({...regForm, age: parseInt(e.target.value)})} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Nationality</label>
            <input value={regForm.nationality} onChange={e => setRegForm({...regForm, nationality: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold" />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-gray-50 px-6 py-2 rounded-xl text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Section B: Identification & Employment</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 block px-1">National ID Type</label>
            <select className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase" value={regForm.identificationType} onChange={e => setRegForm({...regForm, identificationType: e.target.value as any})}>
               <option>Ghana Card</option><option>Passport</option><option>Voter ID</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 block px-1">ID Number</label>
            <input value={regForm.identificationNumber} onChange={e => setRegForm({...regForm, identificationNumber: e.target.value})} placeholder="GHA-1234567-0" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold shadow-inner" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Department</label>
            <select className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-black uppercase" value={regForm.department} onChange={e => setRegForm({...regForm, department: e.target.value})}>
              {DEPARTMENTS.map(d => <option key={d.id} value={d.label}>{d.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500 block px-1">Institutional Staff ID</label>
            <input value={regForm.idNumber} onChange={e => setRegForm({...regForm, idNumber: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-2 border-dashed border-[#0f3460]/30" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-10 border-t gap-4">
         <button onClick={() => setRegForm({})} className="px-10 py-5 rounded-3xl font-black uppercase text-xs text-gray-400 hover:bg-gray-100 transition">Clear Form</button>
         <button onClick={onFinalize} className="bg-[#0f3460] text-white px-12 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Finalize Registration</button>
      </div>
    </div>
  );
};

export default StaffRegistrationTab;
