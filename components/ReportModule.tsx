
import React, { useState, useMemo } from 'react';
import { GlobalSettings, Student, Pupil } from '../types';
import { processStudentData } from '../utils';
import { getSubjectsForDepartment } from '../constants';
import ReportCard from './ReportCard';
import DaycareReportCard from './DaycareReportCard';
import MasterSheet from './MasterSheet';
import DaycareMasterSheet from './DaycareMasterSheet';
import SchoolFeesCard from './SchoolFeesCard';
import EditableField from './EditableField';

interface Props {
  students: Student[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  activeClass: string;
  department: string;
  onStudentUpdate: (id: string, field: string, value: any) => void;
  notify: any;
}

const ReportModule: React.FC<Props> = ({ students, settings, onSettingsChange, activeClass, department, onStudentUpdate, notify }) => {
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'mastersheet' | 'fees'>('individual');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);

  const subjectList = useMemo(() => getSubjectsForDepartment(department), [department]);
  const pupils = useMemo(() => processStudentData(students, settings, subjectList), [students, settings, subjectList]);
  const isEarlyChildhood = department === 'D&N' || department === 'KG';

  const currentPupil = useMemo(() => {
    if (!selectedStudentId) return null;
    return pupils.find(p => {
      const student = students.find(s => s.id === selectedStudentId);
      return student && p.name === `${student.firstName} ${student.surname}`;
    });
  }, [selectedStudentId, pupils, students]);

  const handleBatchPrint = () => {
    setIsBatchPrinting(true);
    notify("Formatting institutional records for batch export...", "info");
    setTimeout(() => {
      window.print();
      setIsBatchPrinting(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Branding Header */}
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
          <h2 className="text-3xl font-black uppercase tracking-tighter">Academic Report Hub</h2>
          <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">{department} • {activeClass} Roll</p>
        </div>
        <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl">
          <button onClick={() => { setActiveSubTab('individual'); setSelectedStudentId(null); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'individual' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/60 hover:text-white'}`}>Individual Cards</button>
          <button onClick={() => setActiveSubTab('mastersheet')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'mastersheet' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/60 hover:text-white'}`}>Master Sheet</button>
          <button onClick={() => setActiveSubTab('fees')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeSubTab === 'fees' ? 'bg-[#cca43b] text-[#0f3460] shadow-lg' : 'text-white/60 hover:text-white'}`}>Financial Status</button>
        </div>
      </div>

      <div className="min-h-[600px]">
        {activeSubTab === 'individual' && !selectedStudentId && (
          <div className="space-y-8 no-print">
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black text-[#0f3460] uppercase tracking-tighter">Class Enrolment ({pupils.length})</h3>
               <button onClick={handleBatchPrint} className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Export Batch Reports</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((s, idx) => {
                const pupilData = pupils.find(p => p.name === `${s.firstName} ${s.surname}`);
                const isCleared = s.isFeesCleared;
                return (
                  <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-transparent hover:border-[#cca43b] transition group shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:bg-yellow-50 transition">👤</div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isCleared ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {isCleared ? 'Cleared' : 'Owing'}
                        </span>
                        <p className="text-[9px] font-mono text-gray-400 mt-1 font-bold">{s.serialId}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-[#0f3460] uppercase leading-tight">{s.firstName} {s.surname}</h4>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 p-2 rounded-xl text-center">
                          <p className="text-[8px] font-black text-gray-400 uppercase">Aggregate</p>
                          <p className="text-sm font-black text-red-600">{pupilData?.aggregate || '--'}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl text-center">
                          <p className="text-[8px] font-black text-gray-400 uppercase">Rank</p>
                          <p className="text-sm font-black text-[#0f3460]">{idx + 1}</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedStudentId(s.id)}
                      className="mt-6 w-full bg-[#0f3460] text-white py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg group-hover:bg-[#cca43b] group-hover:text-[#0f3460] transition"
                    >
                      Process Report Card
                    </button>
                  </div>
                );
              })}
              {students.length === 0 && (
                <div className="col-span-full py-40 text-center text-gray-300 font-black uppercase italic tracking-widest">No pupils registered in {activeClass}</div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'individual' && selectedStudentId && currentPupil && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-8 no-print max-w-5xl mx-auto">
               <button onClick={() => setSelectedStudentId(null)} className="text-gray-400 font-black uppercase text-xs hover:text-[#0f3460] transition">← Back to List</button>
               <div className="flex gap-4">
                  <button onClick={() => window.print()} className="bg-white text-[#0f3460] border-2 border-[#0f3460] px-6 py-2 rounded-xl font-black uppercase text-[10px]">Print Preview</button>
               </div>
            </div>
            {isEarlyChildhood ? (
              <DaycareReportCard 
                pupil={currentPupil} 
                settings={settings} 
                onSettingsChange={onSettingsChange} 
                onStudentUpdate={onStudentUpdate} 
                activeClass={activeClass} 
              />
            ) : (
              <ReportCard 
                pupil={currentPupil} 
                settings={settings} 
                onSettingsChange={onSettingsChange} 
                onStudentUpdate={onStudentUpdate} 
                department={department} 
              />
            )}
          </div>
        )}

        {activeSubTab === 'mastersheet' && (
          <div className="animate-fadeIn">
            {isEarlyChildhood ? (
              <DaycareMasterSheet 
                pupils={pupils} 
                students={students} 
                settings={settings} 
                onSettingsChange={onSettingsChange} 
                subjectList={subjectList} 
                activeClass={activeClass} 
                department={department} 
              />
            ) : (
              <MasterSheet 
                pupils={pupils} 
                settings={settings} 
                onSettingsChange={onSettingsChange} 
                subjectList={subjectList} 
                department={department} 
                activeClass={activeClass} 
              />
            )}
          </div>
        )}

        {activeSubTab === 'fees' && (
          <div className="space-y-12 animate-fadeIn no-print">
            <div className="flex justify-between items-center border-b pb-4 max-w-5xl mx-auto">
               <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">Class Financial Standing</h3>
               <div className="flex gap-4 text-[10px] font-black uppercase">
                  <span className="text-green-600">Cleared: {students.filter(s => s.isFeesCleared).length}</span>
                  <span className="text-red-500">Owing: {students.filter(s => !s.isFeesCleared).length}</span>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {students.map(s => {
                const pupilData = pupils.find(p => p.name === `${s.firstName} ${s.surname}`);
                if (!pupilData) return null;
                return (
                  <div key={s.id} className="bg-white p-8 rounded-[3rem] border-2 border-gray-100 shadow-sm hover:shadow-xl transition group flex flex-col justify-between">
                     <div className="flex justify-between items-start border-b pb-4 mb-4">
                        <div>
                           <h4 className="font-black text-[#0f3460] uppercase text-sm leading-tight">{s.firstName} {s.surname}</h4>
                           <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase italic">Serial: {s.serialId}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${s.isFeesCleared ? 'bg-green-500' : 'bg-red-500'}`}></div>
                     </div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                           <span className="text-[9px] font-black text-gray-400 uppercase">Current Ledger</span>
                           <span className={`font-black text-lg ${s.isFeesCleared ? 'text-green-700' : 'text-red-700'}`}>
                             {s.isFeesCleared ? 'CLEARED' : 'OWING'}
                           </span>
                        </div>
                        <button 
                          onClick={() => { setActiveSubTab('fees'); setSelectedStudentId(s.id); }}
                          className="w-full bg-[#f4f6f7] text-gray-500 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-[#0f3460] hover:text-white transition"
                        >
                          Generate Fee Status Card
                        </button>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'fees' && selectedStudentId && currentPupil && (
           <div className="mt-12 animate-fadeIn">
              <div className="flex justify-between items-center mb-8 no-print max-w-5xl mx-auto">
                 <button onClick={() => setSelectedStudentId(null)} className="text-gray-400 font-black uppercase text-xs hover:text-[#0f3460] transition">← Back to Ledger</button>
              </div>
              <SchoolFeesCard 
                pupil={currentPupil} 
                settings={settings} 
                onSettingsChange={onSettingsChange} 
                onStudentUpdate={onStudentUpdate} 
                activeClass={activeClass} 
              />
           </div>
        )}
      </div>

      {/* Batch Print Rendering - Hidden except when printing */}
      {isBatchPrinting && (
        <div className="hidden print:block space-y-20">
          {pupils.map(pupil => (
            <div key={pupil.no} className="page-break">
              {isEarlyChildhood ? (
                <DaycareReportCard 
                  pupil={pupil} 
                  settings={settings} 
                  onSettingsChange={onSettingsChange} 
                  onStudentUpdate={onStudentUpdate} 
                  activeClass={activeClass} 
                />
              ) : (
                <ReportCard 
                  pupil={pupil} 
                  settings={settings} 
                  onSettingsChange={onSettingsChange} 
                  onStudentUpdate={onStudentUpdate} 
                  department={department} 
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportModule;
