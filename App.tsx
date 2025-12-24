
import React, { useState, useEffect } from 'react';
import { ROLES, getSubjectsForDepartment, DEPARTMENTS, CLASS_MAPPING, CALENDAR_ACTIVITIES, EXTRA_CURRICULAR, LEAD_TEAM, TLMS, REMARKS_LIST, DAYCARE_DETAILS, DAYCARE_ACTIVITY_GROUPS, EC_DEFAULT_GRADES } from './constants';
import AdminDashboard from './components/AdminDashboard';
import ReportCenter from './components/ReportCenter';
import ScoreEntry from './components/ScoreEntry';
import MasterSheet from './components/MasterSheet';
import ReportCard from './components/ReportCard';
import DaycareReportCard from './components/DaycareReportCard';
import DaycareMasterSheet from './components/DaycareMasterSheet';
import GenericModule from './components/GenericModule';
import AcademicCalendar from './components/AcademicCalendar';
import PupilManagement from './components/PupilManagement';
import StaffManagement from './components/StaffManagement';
import DaycareTimeTable from './components/DaycareTimeTable';
import ExaminationDesk from './components/ExaminationDesk';
import AssessmentDesk from './components/AssessmentDesk';
import PaymentPoint from './components/PaymentPoint';
import { GlobalSettings, Student } from './types';
import { processStudentData } from './utils';

const App: React.FC = () => {
  const [role, setRole] = useState<typeof ROLES[keyof typeof ROLES]>(ROLES.ADMIN);
  const [activeTab, setActiveTab] = useState('Lower');
  const [activeModule, setActiveModule] = useState('Academic Calendar');
  const [activeClass, setActiveClass] = useState('Basic 1');
  const [status, setStatus] = useState({ message: 'System Ready', type: 'info' });
  const [isSyncing, setIsSyncing] = useState(false);

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('uba_students');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem('uba_settings');
    const defaultSettings: GlobalSettings = {
      schoolName: 'UNITED BAYLOR ACADEMY',
      address: 'P.O. BOX 1234, ACCRA-GHANA',
      motto: 'KNOWLEDGE AND EXCELLENCE',
      email: 'info@unitedbaylor.edu.gh',
      telephone: '+233 24 000 0000',
      logo: '',
      currentTerm: 1,
      academicYear: '2024/2025',
      mockSeries: 'MOCK TWO',
      examStart: '2025-06-01',
      examEnd: '2025-06-15',
      reopeningDate: '2025-09-08',
      headteacherName: 'H. Baylor',
      totalAttendance: 85,
      punctualityThreshold: '08:00',
      modulePermissions: {},
      academicCalendar: {},
      daycareTimeTable: {},
      examTimeTables: {},
      classTimeTables: {},
      timeTableStructures: {},
      invigilators: [],
      observers: [],
      staff: [],
      staffIdLogs: [],
      transactionAuditLogs: [],
      staffAttendance: {},
      observationSchedule: {},
      activeDevelopmentIndicators: [],
      customSubjects: [],
      disabledSubjects: [],
      questionBank: {},
      teacherConstraints: {},
      subjectDemands: {},
      promotionConfig: { passCutOffGrade: 45, exceptionalCutOffGrade: 12, expectedAttendanceRate: 80, averageClassSize: 35 },
      earlyChildhoodGrading: {
        core: { type: 3, ranges: EC_DEFAULT_GRADES.core3 },
        indicators: { type: 3, ranges: EC_DEFAULT_GRADES.ind3 }
      },
      popoutLists: {
        activities: CALENDAR_ACTIVITIES, leadTeam: LEAD_TEAM, extraCurricular: EXTRA_CURRICULAR,
        daycareDetails: DAYCARE_DETAILS, tlms: TLMS, remarks: REMARKS_LIST,
        observationNotes: ["Participated fully", "Needed assistance", "Exhibited leadership skills"],
        facilitatorRemarks: ["Shows keen interest", "Consistent effort"],
        generalRemarks: ["Promoted with credit", "Satisfactory performance"],
        punctualityRemarks: ["Always early", "Maintains consistent arrival"],
        nonTeachingAreas: ["Accounts", "Security", "Kitchen", "Registry"]
      },
      gradingSystemRemarks: {},
      facilitatorMapping: {},
      submittedSubjects: [],
      activeIndicators: Object.values(DAYCARE_ACTIVITY_GROUPS).flat(),
      sbaConfigs: {},
      sbaMarksLocked: false,
      financeConfig: {
        categories: ['School Fees', 'Lunch Fee'],
        classBills: {},
        receiptMessage: '"Thanks for using our services"',
        taxConfig: { vatRate: 15, nhilRate: 2.5, getLevyRate: 2.5, covidLevyRate: 1, isTaxEnabled: false }
      }
    };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('uba_students', JSON.stringify(students));
    localStorage.setItem('uba_settings', JSON.stringify(settings));
  }, [students, settings]);

  const handleSave = () => {
    setIsSyncing(true);
    localStorage.setItem('uba_settings', JSON.stringify(settings));
    localStorage.setItem('uba_students', JSON.stringify(students));
    setTimeout(() => setIsSyncing(false), 500);
    notify("System Ledger Synchronized Locally", "success");
  };

  const notify = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setStatus({ message: msg, type });
    setTimeout(() => setStatus({ message: 'System Ready', type: 'info' }), 5000);
  };

  const isEarlyChildhood = activeTab === 'D&N' || activeTab === 'KG';
  const subjectList = getSubjectsForDepartment(activeTab);
  const classSpecificStudents = students.filter(s => s.status === 'Admitted' && s.currentClass === activeClass);
  const processedPupils = processStudentData(classSpecificStudents, settings, subjectList);

  const modules = [
    'Academic Calendar', 'Pupil Management', 'Payment Point', 'Staff Management', 
    'Time Table', 'Examination', 'Assessment', 'Reports & Master Sheets', 'Admin Dashboard'
  ].filter(m => settings.modulePermissions[m] !== false);

  return (
    <div className="flex flex-col h-screen bg-[#f4f6f7] overflow-hidden font-sans">
      <header className="no-print bg-[#0f3460] text-white p-4 shadow-2xl flex justify-between items-center z-50 border-b-4 border-[#cca43b]">
        <div className="flex items-center gap-6">
          <div className="bg-[#cca43b] p-3 rounded-2xl font-black text-[#0f3460] shadow-lg">UBA</div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter leading-none">{settings.schoolName} S-MAP</h1>
            <p className="text-[10px] uppercase font-bold text-[#cca43b] tracking-widest mt-1">INTEGRATED SCHOOL MANAGEMENT PLATFORM</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <button disabled={isSyncing} onClick={handleSave} className="min-w-[140px] px-8 py-2 rounded-xl text-xs font-black uppercase shadow-lg transition-all bg-[#2e8b57] text-white hover:scale-105">
             {isSyncing ? 'Syncing...' : 'Sync Ledger'}
           </button>
           <div className="flex bg-white/10 p-1.5 rounded-full gap-2 border border-white/20">
            {Object.values(ROLES).map((r: string) => (
              <button key={r} onClick={() => setRole(r as any)} className={`px-6 py-2 rounded-full text-xs font-black uppercase transition-all ${role === r ? 'bg-[#2e8b57] text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>{r}</button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="no-print w-80 bg-white border-r border-gray-200 shadow-xl p-6 hidden md:flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-6">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Department</span>
                <div className="flex flex-col gap-2 mt-2">
                  {DEPARTMENTS.map(dept => (
                    <button key={dept.id} onClick={() => { setActiveTab(dept.id); setActiveClass(CLASS_MAPPING[dept.id][0]); }} className={`text-left p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === dept.id ? 'bg-[#0f3460] text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{dept.label}</button>
                  ))}
                </div>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Class</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {CLASS_MAPPING[activeTab].map(cls => (
                    <button key={cls} onClick={() => setActiveClass(cls)} className={`text-center p-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeClass === cls ? 'bg-[#cca43b] text-[#0f3460]' : 'bg-gray-50 text-gray-500'}`}>{cls}</button>
                  ))}
                </div>
             </div>
             <div className="h-px bg-gray-100"></div>
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Module Navigation</span>
                <div className="flex flex-col gap-1 mt-2">
                  {modules.map(mod => (
                    <button key={mod} onClick={() => setActiveModule(mod)} className={`text-left p-3 rounded-xl text-[11px] font-black uppercase transition-all ${activeModule === mod ? 'bg-[#cca43b] text-[#0f3460] shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{mod}</button>
                  ))}
                </div>
             </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 relative bg-gray-50/50">
          <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {activeModule === 'Admin Dashboard' ? (
              <AdminDashboard section="Main" dept={activeTab} notify={notify} settings={settings} onSettingsChange={setSettings} students={students} onStudentsUpdate={setStudents} />
            ) : activeModule === 'Academic Calendar' ? (
              <AcademicCalendar settings={settings} onSettingsChange={setSettings} notify={notify} />
            ) : activeModule === 'Pupil Management' ? (
              <PupilManagement students={students} onStudentsUpdate={setStudents} settings={settings} onSettingsChange={setSettings} notify={notify} />
            ) : activeModule === 'Payment Point' ? (
              <PaymentPoint students={students} onStudentsUpdate={setStudents} settings={settings} onSettingsChange={setSettings} notify={notify} />
            ) : activeModule === 'Staff Management' ? (
              <StaffManagement settings={settings} onSettingsChange={setSettings} department={activeTab} notify={notify} />
            ) : activeModule === 'Time Table' ? (
              isEarlyChildhood ? (
                <DaycareTimeTable settings={settings} onSettingsChange={setSettings} activeClass={activeClass} notify={notify} />
              ) : (
                <GenericModule module="Time Table" department={activeTab} activeClass={activeClass} students={students} settings={settings} onSettingsChange={setSettings} notify={notify} />
              )
            ) : activeModule === 'Examination' ? (
              <ExaminationDesk settings={settings} onSettingsChange={setSettings} department={activeTab} activeClass={activeClass} notify={notify} />
            ) : activeModule === 'Assessment' ? (
              isEarlyChildhood ? (
                <AssessmentDesk settings={settings} onSettingsChange={setSettings} students={students} onStudentsUpdate={setStudents} activeClass={activeClass} notify={notify} />
              ) : (
                <ScoreEntry students={classSpecificStudents} onUpdate={(updated) => setStudents(prev => [...prev.filter(s => s.currentClass !== activeClass || s.status !== 'Admitted'), ...updated])} onSave={handleSave} settings={settings} onSettingsChange={setSettings} subjectList={subjectList} department={activeTab} activeClass={activeClass} />
              )
            ) : activeModule === 'Reports & Master Sheets' ? (
              <div className="space-y-12">
                 <ReportCenter role={role} notify={notify} dept={activeTab} />
                 {isEarlyChildhood ? (
                   <DaycareMasterSheet pupils={processedPupils} students={classSpecificStudents} settings={settings} onSettingsChange={setSettings} subjectList={subjectList} activeClass={activeClass} />
                 ) : (
                   <MasterSheet pupils={processedPupils} settings={settings} onSettingsChange={setSettings} subjectList={subjectList} department={activeTab} activeClass={activeClass} />
                 )}
                 <div className="space-y-20">
                   {processedPupils.map(p => (
                     isEarlyChildhood ? (
                       <DaycareReportCard key={p.no} pupil={p} settings={settings} onSettingsChange={setSettings} onStudentUpdate={(id, field, val) => setStudents(students.map(s => s.id === id ? {...s, [field]: val} : s))} activeClass={activeClass} />
                     ) : (
                       <ReportCard key={p.no} pupil={p} settings={settings} onSettingsChange={setSettings} onStudentUpdate={(id, field, val) => setStudents(students.map(s => s.id === id ? {...s, [field]: val} : s))} department={activeTab} />
                     )
                   ))}
                 </div>
              </div>
            ) : (
              <GenericModule module={activeModule} department={activeTab} activeClass={activeClass} students={students} settings={settings} onSettingsChange={setSettings} notify={notify} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
