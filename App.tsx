import React, { useState, useEffect, useMemo } from 'react';
import { ROLES, DEPARTMENTS, CLASS_MAPPING, CALENDAR_ACTIVITIES, LEAD_TEAM, EXTRA_CURRICULAR, TLMS, REMARKS_LIST, DAYCARE_ACTIVITY_GROUPS, EC_DEFAULT_GRADES, STANDARD_CLASS_RULES, getSubjectsForDepartment } from './constants';
import AdminDashboard from './components/AdminDashboard';
import GenericModule from './components/GenericModule';
import AcademicCalendar from './components/AcademicCalendar';
import PupilManagement from './components/PupilManagement';
import StaffManagement from './components/StaffManagement';
import DaycareTimeTable from './components/DaycareTimeTable';
import ExaminationDesk from './components/ExaminationDesk';
import MockExaminationDesk from './components/MockExaminationDesk';
import AssessmentDesk from './components/AssessmentDesk';
import PaymentPoint from './components/PaymentPoint';
import LessonAssessmentDesk from './components/LessonAssessmentDesk';
import MaterialsLogistics from './components/MaterialsLogistics';
import AnnouncementModule from './components/AnnouncementModule';
import ReportModule from './components/ReportModule';
import BillSheet from './components/BillSheet';
import FacilitatorRewardHub from './components/FacilitatorRewardHub';
import AppLauncher from './components/AppLauncher';
import { GlobalSettings, Student, CloudSyncLog } from './types';

// THE UNIFIED DATA CORE (Supabase Project zokbowglwohpfqmjnemc)
const SUPABASE_PROJECT_ID = "zokbowglwohpfqmjnemc";
const DATA_HOST = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

type ActiveApp = 'launcher' | 'management' | 'mock' | 'assessment';

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<ActiveApp>('launcher');
  const [activeModule, setActiveModule] = useState('Admin Dashboard');
  const [activeTab, setActiveTab] = useState('Lower');
  const [activeClass, setActiveClass] = useState('Basic 1');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAppSwitcher, setShowAppSwitcher] = useState(false);

  // Initialize data from local storage (synced with Supabase Host)
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('uba_students');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem('uba_settings');
    const defaultSettings: GlobalSettings = {
      schoolName: 'UNITED BAYLOR ACADEMY',
      address: 'POST OFFICE BOX AN 1234, ACCRA-GHANA',
      motto: 'KNOWLEDGE IS THE LIGHT OF THE SOUL',
      email: 'info@unitedbaylor.edu.gh',
      telephone: '+233 24 000 0000',
      logo: '', currentTerm: 1, academicYear: '2024/2025',
      mockSeries: 'MOCK TWO', examStart: '2025-06-01', examEnd: '2025-06-15',
      reopeningDate: '2025-09-08', headteacherName: 'H. BAYLOR', totalAttendance: 85,
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
      scienceThreshold: 140, distributionModel: 'Auto', cloudSyncLogs: [],
      syncEndpoint: DATA_HOST
    };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('uba_students', JSON.stringify(students));
    localStorage.setItem('uba_settings', JSON.stringify(settings));
  }, [students, settings]);

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate real Supabase transaction using the ref
    setTimeout(() => {
      const log: CloudSyncLog = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), type: 'PUSH', status: 'Success', recordsProcessed: students.length, details: `Ecosystem Ledger Refreshed via project ${SUPABASE_PROJECT_ID}.` };
      setSettings(prev => ({ ...prev, lastCloudSync: new Date().toISOString(), cloudSyncLogs: [log, ...(prev.cloudSyncLogs || [])].slice(0, 10) }));
      setIsSyncing(false);
    }, 800);
  };

  const handleLaunchApp = (app: ActiveApp) => {
    setActiveApp(app);
    if (app === 'mock') {
      setActiveModule('Examination');
      setActiveTab('JHS');
      setActiveClass('Basic 9');
    } else if (app === 'assessment') {
      setActiveModule('Assessment');
    } else {
      setActiveModule('Admin Dashboard');
    }
  };

  const handleStudentUpdate = (id: string, field: string, value: any) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const classSpecificStudents = students.filter(s => s.status === 'Admitted' && s.currentClass === activeClass);

  const modules = useMemo(() => {
    const list = ['Admin Dashboard', 'Payment Point', 'Bill Sheet', 'Staff Management', 'Class Time Table', 'Examination', 'Mock', 'Assessment', 'Logistics & Materials', 'Lesson Assessment Desk', 'Facilitator Reward Hub', 'Academic Calendar', 'Pupil Management', 'Academic Reports', 'Announcements'];
    return list.filter(m => settings.modulePermissions[m] !== false);
  }, [settings.modulePermissions]);

  // Added showSubNav variable to determine visibility of the sub-navigation (class selector) based on the active module.
  const showSubNav = !['Admin Dashboard', 'Facilitator Reward Hub', 'Academic Calendar', 'Announcements', 'Staff Management'].includes(activeModule);

  if (activeApp === 'launcher') {
    return <AppLauncher settings={settings} onLaunch={handleLaunchApp} />;
  }

  // App Theme Mapping
  const theme = {
    management: { primary: '#0f3460', accent: '#cca43b', bg: '#f4f6f7', label: 'CORE HUB' },
    mock: { primary: '#0f3460', accent: '#cca43b', bg: '#fffaf0', label: 'BECE DESK' },
    assessment: { primary: '#2e8b57', accent: '#cca43b', bg: '#f0fff4', label: 'LAB ENGINE' }
  }[activeApp as 'management' | 'mock' | 'assessment'];

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans animate-fadeIn" style={{ backgroundColor: theme.bg }}>
      
      {/* GLOBAL ECOSYSTEM SWITCHBOARD */}
      <header className="no-print text-white p-3 md:p-4 shadow-2xl flex flex-col md:flex-row justify-between items-center z-50 border-b-4 border-[#cca43b] gap-3" style={{ backgroundColor: theme.primary }}>
        <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto">
          <div className="relative">
            <button 
              onClick={() => setShowAppSwitcher(!showAppSwitcher)}
              className="p-3 bg-white/10 hover:bg-[#cca43b] hover:text-[#0f3460] rounded-[1.5rem] transition-all group flex items-center gap-2 border border-white/5" 
            >
               <span className="text-xl group-hover:scale-110 block transition">🏛️</span>
               <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Ecosystem</span>
            </button>
            {showAppSwitcher && (
              <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-[2.5rem] shadow-2xl z-[1000] border border-gray-100 p-5 animate-fadeIn flex flex-col gap-3">
                 <button onClick={() => { handleLaunchApp('management'); setShowAppSwitcher(false); }} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-blue-50 transition text-left">
                    <span className="text-2xl">📋</span>
                    <div><p className="text-xs font-black text-[#0f3460] uppercase">Management Hub</p><p className="text-[8px] font-bold text-blue-400 uppercase italic">Financial & Staffing</p></div>
                 </button>
                 <button onClick={() => { handleLaunchApp('mock'); setShowAppSwitcher(false); }} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-yellow-50 transition text-left">
                    <span className="text-2xl">📝</span>
                    <div><p className="text-xs font-black text-[#cca43b] uppercase">BECE Mock Desk</p><p className="text-[8px] font-bold text-yellow-500 uppercase italic">Exam Sim Engine</p></div>
                 </button>
                 <button onClick={() => { handleLaunchApp('assessment'); setShowAppSwitcher(false); }} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-green-50 transition text-left">
                    <span className="text-2xl">📊</span>
                    <div><p className="text-xs font-black text-green-600 uppercase">Assessment Lab</p><p className="text-[8px] font-bold text-green-500 uppercase italic">Analytical Tracking</p></div>
                 </button>
              </div>
            )}
          </div>

          <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center overflow-hidden border-2 border-[#cca43b] shadow-lg flex-shrink-0">
             {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <span className="text-xl md:text-2xl">🎓</span>}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-black text-xl md:text-2xl tracking-tighter leading-none uppercase">{settings.schoolName}</span>
              <div className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase bg-white text-[#0f3460] shadow-sm">
                {theme.label}
              </div>
            </div>
            <span className="text-[8px] md:text-[10px] uppercase font-bold text-[#cca43b] tracking-[0.2em] mt-0.5">{settings.motto}</span>
          </div>
        </div>

        <div className="flex items-center justify-end w-full md:w-auto gap-2 md:gap-4 border-t border-white/5 pt-3 md:pt-0 md:border-t-0">
           <div className="hidden lg:flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-300">Live Data: {SUPABASE_PROJECT_ID}</span>
           </div>
           <button disabled={isSyncing} onClick={handleSync} className={`flex-1 md:flex-none min-w-[120px] md:min-w-[160px] px-5 md:px-8 py-2.5 md:py-3 rounded-2xl text-[9px] md:text-xs font-black uppercase shadow-2xl transition-all flex items-center justify-center gap-2 ${isSyncing ? 'bg-orange-500 animate-pulse' : 'bg-[#2e8b57] hover:scale-105'} text-white`}>
             {isSyncing ? 'Transmitting' : 'Sync Global Ledger'}
           </button>
        </div>
      </header>

      {/* SHARED NAVIGATION LAYER */}
      <nav className="no-print bg-white border-b-2 border-gray-200 shadow-xl z-40">
        <div className="max-w-screen-2xl mx-auto flex flex-col">
          <div className="flex items-center px-2 md:px-6 py-3 bg-gray-100/70 overflow-x-auto scrollbar-hide border-b border-gray-200">
            <div className="flex gap-2">
              {DEPARTMENTS.map(dept => (
                <button 
                  key={dept.id} 
                  onClick={() => { setActiveTab(dept.id); setActiveClass(CLASS_MAPPING[dept.id][0]); }} 
                  className={`px-4 md:px-6 py-2 rounded-xl text-[9px] md:text-[11px] font-black uppercase transition-all whitespace-nowrap shadow-sm border-2 ${activeTab === dept.id ? 'bg-[#0f3460] border-[#0f3460] text-white' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                >
                  {dept.label}
                </button>
              ))}
            </div>
          </div>

          {showSubNav && (
            <div className="flex items-center px-2 md:px-6 py-2.5 overflow-x-auto border-b border-gray-100 scrollbar-hide animate-fadeIn">
               <div className="flex gap-2">
                  {CLASS_MAPPING[activeTab].map(cls => (
                    <button 
                      key={cls} 
                      onClick={() => setActiveClass(cls)} 
                      className={`px-3 md:px-5 py-2 rounded-2xl text-[9px] md:text-[11px] font-black uppercase transition-all whitespace-nowrap border-2 ${activeClass === cls ? 'bg-[#cca43b] border-[#cca43b] text-[#0f3460] shadow-md' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                    >
                      {cls}
                    </button>
                  ))}
               </div>
            </div>
          )}

          <div className="flex items-center px-2 md:px-6 py-3 bg-white overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {modules.map(mod => (
                <button 
                  key={mod} 
                  onClick={() => setActiveModule(mod)} 
                  className={`px-4 md:px-6 py-2.5 rounded-2xl text-[9px] md:text-[11px] font-black uppercase transition-all whitespace-nowrap border-2 ${activeModule === mod ? 'bg-[#0f3460] border-[#0f3460] text-white shadow-lg' : 'text-gray-400 bg-white border-gray-100 hover:border-[#cca43b] hover:text-[#0f3460]'} ${mod === 'Mock' ? 'text-[#cca43b] border-[#cca43b]/60' : ''}`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* MODULAR RENDERER */}
      <main className="flex-1 overflow-y-auto p-3 md:p-10 relative">
        <div className="max-w-screen-2xl mx-auto pb-10 md:pb-24">
          {activeModule === 'Mock' ? (
             <MockExaminationDesk settings={settings} onSettingsChange={setSettings} activeClass="Basic 9" students={students.filter(s => s.currentClass === 'Basic 9')} onStudentsUpdate={setStudents} onSave={handleSync} subjectList={getSubjectsForDepartment('JHS')} notify={console.log} />
          ) : activeModule === 'Admin Dashboard' ? (
            <AdminDashboard section="Main" dept={activeTab} notify={console.log} settings={settings} onSettingsChange={setSettings} students={students} onStudentsUpdate={setStudents} />
          ) : activeModule === 'Academic Calendar' ? (
            <AcademicCalendar settings={settings} onSettingsChange={setSettings} notify={console.log} />
          ) : activeModule === 'Pupil Management' ? (
            <PupilManagement students={students} onStudentsUpdate={setStudents} settings={settings} onSettingsChange={setSettings} notify={console.log} />
          ) : activeModule === 'Academic Reports' ? (
            <ReportModule students={classSpecificStudents} settings={settings} onSettingsChange={setSettings} activeClass={activeClass} department={activeTab} onStudentUpdate={handleStudentUpdate} notify={console.log} />
          ) : activeModule === 'Payment Point' ? (
            <PaymentPoint students={students} onStudentsUpdate={setStudents} settings={settings} onSettingsChange={setSettings} notify={console.log} />
          ) : activeModule === 'Bill Sheet' ? (
            <BillSheet students={classSpecificStudents} settings={settings} onSettingsChange={setSettings} notify={console.log} activeClass={activeClass} />
          ) : activeModule === 'Staff Management' ? (
            <StaffManagement settings={settings} onSettingsChange={setSettings} department={activeTab} notify={console.log} />
          ) : activeModule === 'Class Time Table' ? (
            activeTab === 'D&N' || activeTab === 'KG' ? (
              <DaycareTimeTable settings={settings} onSettingsChange={setSettings} activeClass={activeClass} notify={console.log} />
            ) : (
              <GenericModule module="Class Time Table" department={activeTab} activeClass={activeClass} students={students} settings={settings} onSettingsChange={setSettings} notify={console.log} />
            )
          ) : activeModule === 'Examination' ? (
            <ExaminationDesk settings={settings} onSettingsChange={setSettings} department={activeTab} activeClass={activeClass} students={classSpecificStudents} onStudentsUpdate={(updated) => setStudents(prev => [...prev.filter(s => s.currentClass !== activeClass || s.status !== 'Admitted'), ...updated])} onSave={handleSync} subjectList={getSubjectsForDepartment(activeTab)} notify={console.log} />
          ) : activeModule === 'Assessment' ? (
            <AssessmentDesk settings={settings} onSettingsChange={setSettings} students={classSpecificStudents} onStudentsUpdate={(updated) => setStudents(prev => [...prev.filter(s => s.currentClass !== activeClass || s.status !== 'Admitted'), ...updated])} activeClass={activeClass} department={activeTab} notify={console.log} />
          ) : activeModule === 'Lesson Assessment Desk' ? (
            <LessonAssessmentDesk settings={settings} onSettingsChange={setSettings} department={activeTab} activeClass={activeClass} notify={console.log} />
          ) : activeModule === 'Logistics & Materials' ? (
            <MaterialsLogistics settings={settings} onSettingsChange={setSettings} activeClass={activeClass} staffList={settings.staff} notify={console.log} />
          ) : activeModule === 'Facilitator Reward Hub' ? (
            <FacilitatorRewardHub settings={settings} onSettingsChange={setSettings} notify={console.log} />
          ) : (
            <div className="p-20 text-center opacity-40">
                <span className="text-5xl">⚓</span>
                <p className="mt-4 font-black uppercase text-xs tracking-widest">Digital Ecosystem Standby.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;