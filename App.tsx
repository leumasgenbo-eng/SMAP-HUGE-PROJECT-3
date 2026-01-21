import React, { useState, useEffect, useMemo } from 'react';
import { ROLES, DEPARTMENTS, CLASS_MAPPING, CALENDAR_ACTIVITIES, LEAD_TEAM, EXTRA_CURRICULAR, TLMS, REMARKS_LIST, DAYCARE_ACTIVITY_GROUPS, EC_DEFAULT_GRADES, STANDARD_CLASS_RULES, getSubjectsForDepartment } from './constants';
import AdminDashboard from './components/AdminDashboard';
import AdministratorPanel from './components/AdministratorPanel';
import ManagersDesk from './components/ManagersDesk';
import FinanceAccountingDesk from './components/FinanceAccountingDesk';
import AcademicDesk from './components/AcademicDesk';
import { GlobalSettings, Student, CloudSyncLog } from './types';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState('Academic Desk');
  const [activeTab, setActiveTab] = useState('Lower');
  const [activeClass, setActiveClass] = useState('Basic 1A');
  const [isSyncing, setIsSyncing] = useState(false);

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('uba_students');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem('uba_settings');
    const defaultSettings: GlobalSettings = {
      schoolName: '',
      address: '',
      motto: '',
      email: '',
      telephone: '',
      logo: '', currentTerm: 1, academicYear: '2024/2025',
      mockSeries: 'MOCK TWO', examStart: '2025-06-01', examEnd: '2025-06-15',
      reopeningDate: '2025-09-08', headteacherName: '', totalAttendance: 85,
      punctualityThreshold: '08:00', modulePermissions: {}, academicCalendar: {},
      daycareTimeTable: {}, examTimeTables: {}, classTimeTables: {}, timeTableStructures: {},
      invigilators: [], observers: [], staff: [], staffIdLogs: [], transactionAuditLogs: [],
      facilitatorComplianceLogs: [], lessonAssessments: [], announcements: [], staffAttendance: {},
      observationSchedule: {}, subjectProfiles: {}, activeDevelopmentIndicators: [],
      customSubjects: [], disabledSubjects: [], questionBank: {}, teacherConstraints: {},
      subjectDemands: {}, promotionConfig: { passCutOffGrade: 45, exceptionalCutOffGrade: 12, expectedAttendanceRate: 80, averageClassSize: 35 },
      earlyChildhoodGrading: {
        core: { type: 3, ranges: EC_DEFAULT_GRADES.core3 },
        indicators: { type: 3, ranges: EC_DEFAULT_GRADES.ind3 }
      },
      popoutLists: {
        activities: CALENDAR_ACTIVITIES, leadTeam: LEAD_TEAM, extraCurricular: EXTRA_CURRICULAR,
        daycareDetails: {}, tlms: TLMS, remarks: REMARKS_LIST, observationNotes: ["Participated fully"],
        facilitatorRemarks: ["Shows keen interest"], generalRemarks: ["Promoted"],
        punctualityRemarks: ["Always early"], nonTeachingAreas: ["Accounts"],
        classRules: [...STANDARD_CLASS_RULES]
      },
      gradingSystemRemarks: { "A1": "Excellent", "F9": "Fail" },
      gradingScale: [
        { grade: "A1", value: 1, zScore: 1.645, remark: "Excellent", color: "#2e8b57" },
        { grade: "B2", value: 2, zScore: 1.036, remark: "Very Good", color: "#3a9d6a" },
        { grade: "B3", value: 3, zScore: 0.524, remark: "Good", color: "#45b07d" },
        { grade: "C4", value: 4, zScore: 0.0, remark: "Credit", color: "#0f3460" },
        { grade: "C5", value: 5, zScore: -0.524, remark: "Credit", color: "#cca43b" },
        { grade: "C6", value: 6, zScore: -1.036, remark: "Credit", color: "#b38f32" },
        { grade: "D7", value: 7, zScore: -1.645, remark: "Pass", color: "#e67e22" },
        { grade: "E8", value: 8, zScore: -2.326, remark: "Pass", color: "#d35400" },
        { grade: "F9", value: 9, zScore: -999, remark: "Fail", color: "#e74c3c" },
      ],
      assessmentWeights: { exercises: 20, cats: 30, terminal: 50 }, terminalConfigs: {},
      facilitatorMapping: {}, submittedSubjects: [],
      activeIndicators: Object.values(DAYCARE_ACTIVITY_GROUPS).flat(),
      sbaConfigs: {}, sbaMarksLocked: false, globalConfigsLocked: false, materialRequests: [],
      classroomInventories: [], staffInvitations: [], staffQueries: [],
      financeConfig: {
        categories: ['School Fees', 'Lunch Fee', 'Tuition', 'Uniform/Wear', 'Books/Stationery'],
        classBills: {}, receiptMessage: '"Thanks for using our services"',
        taxConfig: { vatRate: 15, nhilRate: 2.5, getLevyRate: 2.5, covidLevyRate: 1, isTaxEnabled: false }
      },
      scienceThreshold: 140, distributionModel: 'Auto',
      syncEndpoint: '',
      cloudSyncLogs: []
    };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('uba_students', JSON.stringify(students));
    localStorage.setItem('uba_settings', JSON.stringify(settings));
  }, [students, settings]);

  const handleSync = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      const log: CloudSyncLog = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), type: 'PUSH', status: 'Success', recordsProcessed: students.length, details: "Full Ecosystem Synced" };
      setSettings(prev => ({ ...prev, lastCloudSync: new Date().toISOString(), cloudSyncLogs: [log, ...(prev.cloudSyncLogs || [])].slice(0, 10) }));
      setIsSyncing(false);
    }, 1200);
  };

  const handleStudentUpdate = (id: string, field: string, value: any) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const needsDepartment = !['Administrator', 'Admin Dashboard', 'Managers Desk', 'Finance Desk'].includes(activeModule);
  const needsClass = !['Administrator', 'Admin Dashboard', 'Managers Desk', 'Finance Desk'].includes(activeModule);

  return (
    <div className="flex flex-col h-screen bg-[#f4f6f7] overflow-hidden font-sans">
      <header className="no-print bg-[#0f3460] text-white p-3 md:p-4 shadow-xl flex justify-between items-center z-50 border-b-4 border-[#cca43b]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center border-2 border-[#cca43b] shadow-lg overflow-hidden flex-shrink-0">
             {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <span className="text-xl md:text-2xl opacity-20">⚓</span>}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm md:text-xl tracking-tighter uppercase">{settings.schoolName || 'UBA ECOSYSTEM'}</span>
            <div className="flex items-center gap-2">
               <span className="text-[7px] md:text-[9px] uppercase font-bold text-[#cca43b] tracking-[0.2em]">{settings.motto || 'SYSTEM TERMINAL'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button onClick={() => setActiveModule('Administrator')} className={`px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase shadow-lg transition-all ${activeModule === 'Administrator' ? 'bg-white text-[#0f3460] scale-105' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'}`}>Administrator</button>
          <button onClick={() => setActiveModule('Admin Dashboard')} className={`px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase shadow-lg transition-all ${activeModule === 'Admin Dashboard' ? 'bg-[#cca43b] text-[#0f3460] scale-105' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'}`}>System Admin</button>
          <button onClick={() => setActiveModule('Managers Desk')} className={`px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase shadow-lg transition-all ${activeModule === 'Managers Desk' ? 'bg-[#cca43b] text-[#0f3460] scale-105' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'}`}>Managers Desk</button>
          <button onClick={() => setActiveModule('Finance Desk')} className={`px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase shadow-lg transition-all ${activeModule === 'Finance Desk' ? 'bg-[#cca43b] text-[#0f3460] scale-105' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'}`}>Finance Desk</button>
          <button onClick={() => setActiveModule('Academic Desk')} className={`px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase shadow-lg transition-all ${activeModule === 'Academic Desk' ? 'bg-[#cca43b] text-[#0f3460] scale-105' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'}`}>Academic Desk</button>
          <button disabled={isSyncing} onClick={handleSync} className={`px-4 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase shadow-lg transition-all ${isSyncing ? 'bg-orange-50 animate-pulse' : 'bg-[#2e8b57] hover:scale-105'} text-white`}>{isSyncing ? 'Transmitting' : 'Sync Ledger'}</button>
        </div>
      </header>

      <nav className="no-print bg-white border-b-2 border-gray-200 shadow-sm z-40">
        <div className="max-w-screen-2xl mx-auto flex flex-col">
          {needsDepartment && (
            <div className="flex items-center px-4 py-1.5 bg-gray-100/50 overflow-x-auto border-b border-gray-100 scrollbar-hide animate-fadeIn">
              <div className="flex gap-1.5">
                {DEPARTMENTS.map(dept => (
                  <button 
                    key={dept.id} 
                    onClick={() => { setActiveTab(dept.id); setActiveClass(CLASS_MAPPING[dept.id][0]); }} 
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeTab === dept.id ? 'bg-[#0f3460] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200'}`}
                  >
                    {dept.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {needsClass && (
            <div className="flex items-center px-4 py-1.5 bg-white overflow-x-auto border-b border-gray-100 scrollbar-hide animate-fadeIn">
               <div className="flex gap-1.5">
                  {CLASS_MAPPING[activeTab].map(cls => (
                    <button 
                      key={cls} 
                      onClick={() => setActiveClass(cls)} 
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeClass === cls ? 'bg-[#cca43b] text-[#0f3460] shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                      {cls}
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <div className="max-w-screen-2xl mx-auto pb-20">
          {activeModule === 'Administrator' ? (
            <AdministratorPanel settings={settings} onSettingsChange={setSettings} notify={console.log} students={students} onStudentsUpdate={setSettings} activeTabGlobal={activeTab} activeClassGlobal={activeClass} />
          ) : activeModule === 'Admin Dashboard' ? (
            <AdminDashboard section="Main" dept={activeTab} notify={console.log} settings={settings} onSettingsChange={setSettings} students={students} onStudentsUpdate={setStudents} />
          ) : activeModule === 'Managers Desk' ? (
            <ManagersDesk settings={settings} onSettingsChange={setSettings} students={students} onStudentsUpdate={setStudents} notify={console.log} activeTabGlobal={activeTab} activeClassGlobal={activeClass} />
          ) : activeModule === 'Finance Desk' ? (
            <FinanceAccountingDesk settings={settings} onSettingsChange={setSettings} students={students} onStudentsUpdate={setStudents} activeClass={activeClass} notify={console.log} />
          ) : activeModule === 'Academic Desk' ? (
            <AcademicDesk settings={settings} onSettingsChange={setSettings} students={students} onStudentsUpdate={setStudents} activeClass={activeClass} department={activeTab} notify={console.log} onStudentUpdate={handleStudentUpdate} />
          ) : (
            <div className="p-20 text-center opacity-40">
                <span className="text-4xl">⚓</span>
                <p className="mt-4 font-black uppercase text-xs">Module Operational: {activeModule}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;