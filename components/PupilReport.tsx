
import React from 'react';
import { Pupil } from '../types';

interface Props {
  pupil: Pupil;
  schoolInfo: any;
  setSchoolInfo: (info: any) => void;
  pupilRemarks: { [pupilNo: number]: { [subject: string]: string } };
  setPupilRemarks: React.Dispatch<React.SetStateAction<{ [pupilNo: number]: { [subject: string]: string } }>>;
  generalRemarks: { [pupilNo: number]: string };
  setGeneralRemarks: React.Dispatch<React.SetStateAction<{ [pupilNo: number]: string }>>;
}

const PupilReport: React.FC<Props> = ({ 
  pupil, schoolInfo, setSchoolInfo, 
  pupilRemarks, setPupilRemarks, 
  generalRemarks, setGeneralRemarks 
}) => {

  const updateInfo = (key: string, val: string) => {
    setSchoolInfo({ ...schoolInfo, [key]: val });
  };

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
    <div className="bg-white p-10 border-[10px] border-double border-gray-900 max-w-5xl mx-auto shadow-2xl relative page-break">
      {/* Header */}
      <div className="text-center border-b-4 border-black pb-8 mb-8">
        <div className="mb-4">
          <input 
            className="text-5xl font-black w-full text-center border-none focus:ring-0 uppercase tracking-tighter"
            value={schoolInfo.name}
            onChange={(e) => updateInfo('name', e.target.value)}
          />
          <input 
            className="text-lg text-gray-600 w-full text-center border-none focus:ring-0 font-bold"
            value={schoolInfo.address}
            onChange={(e) => updateInfo('address', e.target.value)}
          />
        </div>
        <div className="bg-black text-white py-2 px-8 inline-block font-black text-xl rounded-sm uppercase tracking-widest">
          {schoolInfo.mockSeries} INDIVIDUAL REPORT CARD
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div className="space-y-3 border-r-2 border-dashed border-gray-300 pr-12">
          <div className="flex justify-between items-baseline border-b border-gray-200">
            <span className="text-xs font-black uppercase text-gray-500">Pupil Name</span>
            <span className="font-black text-2xl text-gray-900">{pupil.name}</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-gray-200">
            <span className="text-xs font-black uppercase text-gray-500">Student ID</span>
            <span className="font-bold">UBA/2025/M2-{pupil.no.toString().padStart(3, '0')}</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-gray-200">
            <span className="text-xs font-black uppercase text-gray-500">Academic Year</span>
            <span className="font-bold">{schoolInfo.academicYear}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-gray-900 text-white p-2 rounded">
            <span className="text-xs font-black uppercase">Category Rank</span>
            <span className="font-black text-xl">{pupil.categoryCode} - {pupil.category}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200">
            <span className="text-xs font-black uppercase text-gray-500">Attendance</span>
            <div className="flex items-center gap-2">
              <input 
                className="w-16 text-right font-black border-b-2 border-gray-400 focus:outline-none focus:border-blue-600 px-1" 
                value={schoolInfo.totalAttendance} 
                onChange={(e) => updateInfo('totalAttendance', e.target.value)} 
              />
              <span className="font-bold text-gray-400">Days</span>
            </div>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200">
            <span className="text-xs font-black uppercase text-gray-500">Aggregate (Best 6)</span>
            <span className="font-black text-3xl text-red-700">{pupil.aggregate}</span>
          </div>
        </div>
      </div>

      {/* Main Table - Sorted by best performing subject */}
      <div className="mb-10">
        <h3 className="text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Subject Performance Breakdown (Sorted by Best Achievement)</h3>
        <table className="w-full text-sm border-2 border-black">
          <thead className="bg-gray-100">
            <tr className="uppercase text-[10px] font-black">
              <th className="p-3 border-2 border-black text-left">Subject</th>
              <th className="p-3 border-2 border-black">Score</th>
              <th className="p-3 border-2 border-black">Grade</th>
              <th className="p-3 border-2 border-black">Class Avg</th>
              <th className="p-3 border-2 border-black text-left">Remark / Subject Teacher Note</th>
              <th className="p-3 border-2 border-black text-left">Facilitator</th>
            </tr>
          </thead>
          <tbody>
            {pupil.computedScores.map((s) => (
              <tr key={s.name} className="hover:bg-gray-50">
                <td className="p-3 border-2 border-black font-black bg-gray-50">{s.name}</td>
                <td className={`p-3 border-2 border-black text-center font-black text-lg ${s.score >= 50 ? 'text-green-700' : 'text-red-600'}`}>
                  {s.score}
                </td>
                <td className="p-3 border-2 border-black text-center font-black text-xl bg-gray-50">{s.grade}</td>
                <td className="p-3 border-2 border-black text-center text-gray-400 font-bold italic">{s.classAverage.toFixed(0)}</td>
                <td className="p-3 border-2 border-black min-w-[200px]">
                  <textarea 
                    className="w-full bg-transparent border-none text-[11px] focus:ring-0 italic font-medium leading-tight resize-none h-12" 
                    placeholder="Enter specific subject remark..."
                    value={pupilRemarks[pupil.no]?.[s.name] || `Shows ${s.score >= 70 ? 'excellent' : s.score >= 50 ? 'satisfactory' : 'weak'} aptitude in this area.`}
                    onChange={(e) => handleSubjectRemark(s.name, e.target.value)}
                  />
                </td>
                <td className="p-3 border-2 border-black text-[10px] font-black uppercase text-gray-500">{s.facilitator}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Analysis & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
        <div className="md:col-span-2 bg-gray-100 p-6 border-l-8 border-black space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">Top Strength Areas</span>
            <p className="text-sm font-bold"><strong>Core:</strong> {bestCore}</p>
            <p className="text-sm font-bold"><strong>Elective:</strong> {bestElective}</p>
          </div>
          <div className="pt-4 border-t border-gray-300">
            <span className="text-[10px] font-black uppercase text-gray-500 block mb-2">Performance Assessment</span>
            <div className={`text-lg font-black italic ${pupil.aggregate <= 15 ? 'text-green-700' : 'text-red-700'}`}>
              Status: {performanceStatus}
            </div>
          </div>
        </div>
        <div className="md:col-span-3 space-y-4">
          <div className="relative">
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">General Remarks on Performance</label>
            <textarea 
              className="w-full h-32 p-4 text-sm border-2 border-gray-300 rounded focus:border-black outline-none italic leading-relaxed font-serif bg-yellow-50/30"
              value={generalRemarks[pupil.no] || `This ${schoolInfo.mockSeries} is part of the series in partial preparation for the sitting of BECE 2025/2026. Based on BECE 2024/2025 exam standards, the pupil's performance is ${performanceStatus.toLowerCase()}. This is the second of such prep sessions.`}
              onChange={(e) => setGeneralRemarks(prev => ({ ...prev, [pupil.no]: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Recommendation & Future Academic Plan</label>
            <textarea 
              className="w-full h-20 p-4 text-sm border-2 border-gray-300 rounded focus:border-black outline-none font-bold text-blue-900 leading-tight"
              defaultValue={`Continue with intensive review. Focus on weak subject indicators. Attend all prep classes for BECE 2025.`}
            />
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between items-end mt-16 pb-4">
        <div className="text-center w-64">
          <div className="h-12 border-b-2 border-gray-300 w-full mb-2"></div>
          <p className="text-[10px] font-black uppercase">Subject Facilitator</p>
        </div>
        <div className="text-center w-80">
           <div className="italic font-serif text-2xl mb-2 text-gray-800">H. Baylor</div>
           <div className="border-t-4 border-black pt-3">
            <p className="text-xs font-black uppercase tracking-widest">Headteacher's Authorization</p>
            <p className="text-[9px] text-gray-400 mt-1">United Baylor Academy Official Certification</p>
           </div>
        </div>
      </div>

      <div className="absolute top-6 right-8 text-[10px] text-gray-200 font-mono no-print">
        UBA-M2-PR-{pupil.no.toString().padStart(3, '0')}
      </div>
    </div>
  );
};

export default PupilReport;
