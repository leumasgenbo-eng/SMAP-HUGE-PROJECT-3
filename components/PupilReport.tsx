import React from 'react';
import { Pupil, GlobalSettings } from '../types';
import EditableField from './EditableField';

interface Props {
  pupil: Pupil;
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  pupilRemarks: { [pupilNo: number]: { [subject: string]: string } };
  setPupilRemarks: React.Dispatch<React.SetStateAction<{ [pupilNo: number]: { [subject: string]: string } }>>;
  generalRemarks: { [pupilNo: number]: string };
  setGeneralRemarks: React.Dispatch<React.SetStateAction<{ [pupilNo: number]: string }>>;
}

const PupilReport: React.FC<Props> = ({ 
  pupil, settings, onSettingsChange, 
  pupilRemarks, setPupilRemarks, 
  generalRemarks, setGeneralRemarks 
}) => {

  const handleSubjectRemark = (subj: string, val: string) => {
    setPupilRemarks(prev => ({
      ...prev,
      [pupil.no]: { ...prev[pupil.no], [subj]: val }
    }));
  };

  const bestCore = pupil.computedScores
    .filter(s => s.isCore)
    .slice(0, 2)
    .map(s => s.name)
    .join(" & ");

  const bestElective = pupil.computedScores
    .filter(s => !s.isCore)
    .slice(0, 2)
    .map(s => s.name)
    .join(" & ");

  const performanceStatus = pupil.aggregate <= 15 ? 'EXCEPTIONAL' : pupil.aggregate <= 30 ? 'SATISFACTORY' : 'REQUIRES INTERVENTION';

  return (
    <div className="bg-white p-12 border-[12px] border-double border-[#0f3460] max-w-5xl mx-auto shadow-2xl relative page-break animate-fadeIn">
      {/* Header */}
      <div className="text-center border-b-4 border-black pb-8 mb-8 flex flex-col items-center">
        <EditableField 
          value={settings.schoolName} 
          onSave={v => onSettingsChange({...settings, schoolName: v})} 
          placeholder="School Name"
          className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter mb-2" 
        />
        <EditableField 
          value={settings.motto} 
          onSave={v => onSettingsChange({...settings, motto: v})} 
          placeholder="Motto"
          className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b] mb-4" 
        />
        <div className="flex justify-center gap-6 text-[11px] font-black text-gray-400 uppercase tracking-widest pt-2 w-full max-w-2xl no-print">
          <EditableField value={settings.address} onSave={v => onSettingsChange({...settings, address: v})} placeholder="Address" />
          <EditableField value={settings.telephone} onSave={v => onSettingsChange({...settings, telephone: v})} placeholder="Telephone" />
          <EditableField value={settings.email} onSave={v => onSettingsChange({...settings, email: v})} placeholder="Email" className="lowercase" />
        </div>
        <div className="bg-black text-white py-2 px-10 inline-block font-black text-sm rounded-sm uppercase tracking-[0.3em] mt-6">
          {settings.mockSeries || 'TERMINAL'} INDIVIDUAL REPORT CARD
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div className="space-y-4 border-r-2 border-dashed border-gray-200 pr-12">
          <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Pupil Name</span>
            <span className="font-black text-2xl text-[#0f3460] uppercase">{pupil.name}</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Student Serial</span>
            <span className="font-bold text-gray-600 font-mono uppercase">ID-{pupil.no.toString().padStart(3, '0')}</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Academic Year</span>
            <EditableField value={settings.academicYear} onSave={v => onSettingsChange({...settings, academicYear: v})} className="font-bold text-gray-800" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[#0f3460] text-white p-3 rounded-lg shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-widest">Classification</span>
            <span className="font-black text-lg">{pupil.categoryCode} - {pupil.category}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 pb-1">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cumulative Attendance</span>
            <div className="flex items-center gap-2 font-bold text-gray-700">
               <span>{pupil.attendance}</span>
               <span className="text-gray-300">/</span>
               <span>{settings.totalAttendance}</span>
               <span className="text-[8px] font-black text-gray-400 uppercase ml-1">Days</span>
            </div>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 pb-1">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Best 6 Aggregate</span>
            <span className="font-black text-4xl text-red-700">{pupil.aggregate}</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="mb-10">
        <h3 className="text-[9px] font-black uppercase text-gray-400 mb-2 tracking-[0.2em]">Subject Performance Matrix (Ranked Analysis)</h3>
        <table className="w-full text-xs border-2 border-black border-collapse">
          <thead className="bg-[#f4f6f7]">
            <tr className="uppercase text-[9px] font-black">
              <th className="p-4 border border-black text-left">Academic Pillar / Subject</th>
              <th className="p-4 border border-black text-center w-16">Score</th>
              <th className="p-4 border border-black text-center w-16">Grade</th>
              <th className="p-4 border border-black text-center w-24">Class Avg</th>
              <th className="p-4 border border-black text-left">Facilitator's Narrative Remark</th>
            </tr>
          </thead>
          <tbody>
            {pupil.computedScores.map((s) => (
              <tr key={s.name} className="hover:bg-gray-50 transition border-b border-black">
                <td className="p-4 border border-black font-black uppercase bg-gray-50/50">{s.name}</td>
                <td className={`p-4 border border-black text-center font-black text-lg ${s.score >= 50 ? 'text-green-700' : 'text-red-600'}`}>
                  {s.score}
                </td>
                <td className="p-4 border border-black text-center font-black text-xl bg-[#0f3460] text-white shadow-inner">{s.grade}</td>
                <td className="p-4 border border-black text-center text-gray-400 font-bold italic">{s.classAverage.toFixed(0)}%</td>
                <td className="p-4 border border-black">
                  <textarea 
                    className="w-full bg-transparent border-none text-[10px] focus:ring-0 italic font-medium leading-relaxed resize-none h-10 outline-none" 
                    placeholder="Subject observation..."
                    value={pupilRemarks[pupil.no]?.[s.name] || s.remark}
                    onChange={(e) => handleSubjectRemark(s.name, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Analysis & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
        <div className="md:col-span-2 bg-gray-50 p-6 border-l-8 border-[#cca43b] space-y-4">
          <div>
            <span className="text-[9px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Strength Assessment</span>
            <p className="text-xs font-bold uppercase text-gray-600"><strong>Core Focal Point:</strong><br/>{bestCore}</p>
            <p className="text-xs font-bold uppercase text-gray-600 mt-2"><strong>Elective Merit:</strong><br/>{bestElective}</p>
          </div>
          <div className="pt-6 border-t border-gray-200">
            <span className="text-[9px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Institutional Status</span>
            <div className={`text-xl font-black italic tracking-tighter ${pupil.aggregate <= 15 ? 'text-green-700' : 'text-red-700'}`}>
              {performanceStatus}
            </div>
          </div>
        </div>
        <div className="md:col-span-3 space-y-6">
          <div className="relative">
            <label className="text-[9px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Holistic Performance Summary</label>
            <textarea 
              className="w-full h-32 p-5 text-xs border-2 border-gray-100 rounded-2xl focus:border-[#cca43b] outline-none italic leading-relaxed font-serif bg-yellow-50/10 shadow-inner"
              value={generalRemarks[pupil.no] || pupil.overallRemark}
              onChange={(e) => setGeneralRemarks(prev => ({ ...prev, [pupil.no]: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Critical Recommendation</label>
            <div className="w-full p-4 bg-[#0f3460]/5 rounded-2xl border border-[#0f3460]/10 text-xs font-bold text-[#0f3460] leading-tight uppercase">
               {pupil.recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between items-end mt-16 pb-4 no-print">
        <div className="text-center w-64">
          <div className="h-10 border-b-2 border-black w-full mb-1"></div>
          <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Subject Facilitator</p>
        </div>
        <div className="text-center w-80">
           <div className="italic font-serif text-3xl mb-1 text-[#0f3460]">
             <EditableField value={settings.headteacherName} onSave={v => onSettingsChange({...settings, headteacherName: v})} placeholder="Headteacher" className="text-center" />
           </div>
           <div className="border-t-4 border-black pt-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0f3460]">Headteacher Certification</p>
            <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Official Institutional Document</p>
           </div>
        </div>
      </div>

      <div className="absolute top-6 right-8 text-[10px] text-gray-200 font-mono no-print">
        VERIFYID-REP-{pupil.no.toString().padStart(4, '0')}
      </div>
    </div>
  );
};

export default PupilReport;