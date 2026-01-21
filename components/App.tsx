import React, { useState, useEffect } from 'react';
import { ROLES, DEPARTMENTS, CLASS_MAPPING, CALENDAR_ACTIVITIES, LEAD_TEAM, EXTRA_CURRICULAR, TLMS, REMARKS_LIST, DAYCARE_ACTIVITY_GROUPS, EC_DEFAULT_GRADES, STANDARD_CLASS_RULES, getSubjectsForDepartment } from '../constants';
import AdminDashboard from './AdminDashboard';
import GenericModule from './GenericModule';
import AcademicCalendar from './AcademicCalendar';
import PupilManagement from './PupilManagement';
import StaffManagement from './StaffManagement';
import DaycareTimeTable from './DaycareTimeTable';
import ExaminationDesk from './ExaminationDesk';
import MockExaminationDesk from './MockExaminationDesk';
import AssessmentDesk from './AssessmentDesk';
import PaymentPoint from './PaymentPoint';
import LessonAssessmentDesk from './LessonAssessmentDesk';
import MaterialsLogistics from './MaterialsLogistics';
import AnnouncementModule from './AnnouncementModule';
import ReportModule from './ReportModule';
import BillSheet from './BillSheet';
import FacilitatorRewardHub from './FacilitatorRewardHub';
import { GlobalSettings, Student } from '../types';

const App: React.FC = () => {
  const [role, setRole] = useState<typeof ROLES[keyof typeof ROLES]>(ROLES.ADMIN);
  const [activeTab, setActiveTab] = useState('Lower');
  const [activeModule, setActiveModule] = useState('Admin Dashboard');
  const [activeClass, setActiveClass] = useState('Basic 1');
  const [isSyncing, setIsSyncing] = useState(false);

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
      logo: '',
      currentTerm: 1,
      academicYear: '2024/2025',
      mockSeries: 'MOCK TWO',
      examStart: '2025-06-01',
      examEnd: '2025-06-15',
      reopeningDate: '2025-09-08',
      headteacherName: 'H. BAYLOR',
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
      facilitatorComplianceLogs: [],
      lessonAssessments: [],
      announcements: [],
      staffAttendance: {},
      observationSchedule: {},
      subjectProfiles: {},
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
        activities: CALENDAR_ACTIVITIES,
        leadTeam: LEAD_TEAM,
        extraCurricular: EXTRA_CURRICULAR,
        daycareDetails: {},
        tlms: TLMS,
        remarks: REMARKS_LIST,
        observationNotes: ["Participated fully", "Needed assistance", "Exhibited leadership skills"],
        facilitatorRemarks: ["Shows keen interest", "Consistent effort", "Requires more practice"],
        generalRemarks: ["Promoted with credit", "Needs improvement"],
        punctualityRemarks: ["Always early", "Regularly late"],
        nonTeachingAreas: ["Accounts", "Security", "Kitchen", "Transport"],
        classRules: [...STANDARD_CLASS_RULES]
      },
      gradingSystemRemarks: { "A1": "Excellent", "B2": "Very Good", "B3": "Good", "C4": "Credit", "C5": "Credit", "C6": "Credit", "D7": "Pass", "E8": "Pass", "F9": "Fail" },
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
      assessmentWeights: { exercises: 20, cats: 30, terminal: 50 },
      terminalConfigs: {},
      facilitatorMapping: {},
      submittedSubjects: [],
      activeIndicators: Object.values(DAYCARE_ACTIVITY_GROUPS).flat(),
      sbaConfigs: {},
      sbaMarksLocked: false,
      globalConfigsLocked: false,
      materialRequests: [],
      classroomInventories: [],
      staffInvitations: [],
      staffQueries: [],
      financeConfig: {
        categories: ['School Fees', 'Lunch Fee', 'Tuition', 'Uniform/Wear', 'Books/Stationery'],
        classBills: {},
        receiptMessage: '"Thanks for using our services"',
        taxConfig: { vatRate: 15, nhilRate: 2.5, getLevyRate: 2.5, covidLevyRate: 1, isTaxEnabled: false }
      },
      scienceThreshold: 140,
      distributionModel: 'Auto'
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
    setTimeout(() => setIsSyncing(false), 800);
  };

  const handleStudentUpdate = (id: string, field: string, value: any) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const classSpecificStudents = students.filter(s => s.status === 'Admitted' && s.currentClass === activeClass);

  // REORDERED MODULES: Operational modules moved up
  const modules = [
    'Admin Dashboard', 
    'Payment Point', 
    'Bill Sheet', 
    'Staff Management', 
    'Class Time Table', 
    'Examination', 
    'Assessment', 
    'Logistics & Materials', 
    'Lesson Assessment Desk', 
    'Facilitator Reward Hub',
    'Academic Calendar', 
    'Pupil Management', 
    'Academic Reports', 
    'Announcements'
  ].filter(m => settings.modulePermissions[m] !== false);

  const showSubNav = !['Admin Dashboard', 'Facilitator Reward Hub', 'Academic Calendar', 'Announcements', 'Staff Management'].includes(activeModule);

  return (
    <div className="flex flex-col h-screen bg-[#f4f6f7] overflow-hidden font-sans">
      {/* HEADER SECTION - Clean branding, no role switcher */}
      <header className="no-print bg-[#0f3460] text-white p-3 md:p-4 shadow-xl flex flex-col md:flex-row justify-between items-center z-50 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center overflow-hidden border-2 border-[#cca43b] shadow-lg flex-shrink-0">
             {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain" /> : <span className="text-xl md:text-2xl">🎓</span>}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg md:text-2xl tracking-tighter leading-none uppercase">{settings.schoolName}</span>
              <span className="bg-[#cca43b] text-[#0f3460] px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase shadow-sm">S-MAP</span>
            </div>
            <span className="text-[7px] md:text-[9px] uppercase font-bold text-[#cca43b] tracking-[0.1em] md:tracking-[0.2em] mt-0.5">{settings.motto}</span>
          </div>
        </div>

        <div className="flex items-center justify-end w-full md:w-auto gap-2 md:gap-4 border-t border-white/5 pt-3 md:pt-0 md:border-t-0">
           <button disabled={isSyncing} onClick={handleSave} className={`flex-1 md:flex-none min-w-[100px] md:min-w-[140px] px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black uppercase shadow-lg transition-all flex items-center justify-center gap-2 ${isSyncing ? 'bg-gray-400' : 'bg-[#2e8b57] hover:scale-105'} text-white`}>
             {isSyncing ? 'Processing' : 'Sync Ledger'}
           </button>
        </div>
      </header>

      {/* THREE-TIER STACKED NAVIGATION */}
      <nav className="no-print bg-white border-b border-gray-200 shadow-sm z-40">
        <div className="max-w-screen-2xl mx-auto flex flex-col">
          
          {/* TIER 1: DEPARTMENTS STRIP */}
          <div className="flex items-center px-2 md:px-4 py-2 bg-gray-100/50 overflow-x-auto scrollbar-hide border-b border-gray-100">
            <div className="flex gap-1.5">
              {DEPARTMENTS.map(dept => (
                <button 
                  key={dept.id} 
                  onClick={() => { setActiveTab(dept.id); setActiveClass(CLASS_MAPPING[dept.id][0]); }} 
                  className={`px-3 md:px-4 py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === dept.id ? 'bg-[#0f3460] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200'}`}
                >
                  {dept.label}
                </button>
              ))}
            </div>
          </div>

          {/* TIER 2: CLASSES STRIP */}
          {showSubNav && (
            <div className="flex items-center px-2 md:px-4 py-2 overflow-x-auto border-b border-gray-100 scrollbar-hide animate-fadeIn">
               <div className="flex gap-1.5">
                  {CLASS_MAPPING[activeTab].map(cls => (
                    <button 
                      key={cls} 
                      onClick={() => setActiveClass(cls)} 
                      className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeClass === cls ? 'bg-[#cca43b] text-[#0f3460] shadow-sm' : 'text-gray-400 hover:bg-gray-50 border border-transparent'}`}
                    >
                      {cls}
                    </button>
                  ))}
               </div>
            </div>
          )}

          {/* TIER 3: MODULE STRIP */}
          <div className="flex items-center px-2 md:px-4 py-2 bg-gray-50/40 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5">
              {modules.map(mod => (
                <button 
                  key={mod} 
                  onClick={() => setActiveModule(mod)} 
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all whitespace-nowrap border ${activeModule === mod ? 'bg-[#0f3460] border-[#0f3460] text-white shadow-md scale-105' : 'text-gray-400 bg-white border-gray-100 hover:border-[#cca43b] hover:text-[#0f3460]'}`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-3 md:p-8 relative bg-gray-50/50">
        <div className="max-w-screen-2xl mx-auto space-y-4 md:y-8 pb-10 md:pb-20">
          {activeModule === 'Admin Dashboard' ? (
            <AdminDashboard section="Main" dept={activeTab} notify={console.log} settings={settings} onSettingsChange={setSettings} students={students} onStudentsUpdate={setStudents} />
          ) : activeModule === 'Academic Calendar' ? (
            <AcademicCalendar settings={settings} onSettingsChange={setSettings} notify={console.log} />
          ) : activeModule === 'Pupil Management' ? (
            <PupilManagement students={students} onStudentsUpdate={setStudents} settings={settings} onSettingsChange={setSettings} notify={console.log} />
          ) : activeModule === 'Academic Reports' ? (
            <ReportModule 
              students={classSpecificStudents} 
              settings={settings} 
              onSettingsChange={setSettings} 
              activeClass={activeClass} 
              department={activeTab} 
              onStudentUpdate={handleStudentUpdate}
              notify={console.log}
            />
          ) : activeModule === 'Announcements' ? (
            <AnnouncementModule settings={settings} onSettingsChange={setSettings} notify={console.log} students={students} />
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
            <ExaminationDesk 
              settings={settings} 
              onSettingsChange={setSettings} 
              department={activeTab} 
              activeClass={activeClass} 
              students={classSpecificStudents}
              onStudentsUpdate={(updated) => setStudents(prev => [...prev.filter(s => s.currentClass !== activeClass || s.status !== 'Admitted'), ...updated])}
              onSave={handleSave}
              subjectList={getSubjectsForDepartment(activeTab)}
              notify={console.log} 
            />
          ) : activeModule === 'Assessment' ? (
            <AssessmentDesk 
              settings={settings} 
              onSettingsChange={setSettings} 
              students={classSpecificStudents} 
              onStudentsUpdate={(updated) => setStudents(prev => [...prev.filter(s => s.currentClass !== activeClass || s.status !== 'Admitted'), ...updated])}
              activeClass={activeClass} 
              department={activeTab}
              notify={console.log} 
            />
          ) : activeModule === 'Lesson Assessment Desk' ? (
            <LessonAssessmentDesk
              settings={settings}
              onSettingsChange={setSettings}
              department={activeTab}
              activeClass={activeClass}
              notify={console.log}
            />
          ) : activeModule === 'Logistics & Materials' ? (
            <MaterialsLogistics
              settings={settings}
              onSettingsChange={setSettings}
              activeClass={activeClass}
              staffList={settings.staff}
              notify={console.log}
            />
          ) : activeModule === 'Facilitator Reward Hub' ? (
            <FacilitatorRewardHub settings={settings} onSettingsChange={setSettings} notify={console.log} />
          ) : (
            <div className="p-10 md:p-20 text-center opacity-40">
                <span className="text-3xl md:text-4xl">⚓</span>
                <p className="mt-4 font-black uppercase text-[10px] md:text-xs">Portal ready.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;