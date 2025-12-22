
export interface ParentInfo {
  name: string;
  contact: string;
  address: string;
  occupation: string;
  education: string;
  religion: string;
  isDead: boolean;
  wivesCount?: number;
}

export interface GuardianInfo extends ParentInfo {
  relationship: string;
  dateStarted: string;
}

export interface AdmissionTestInfo {
  set: 'A' | 'B' | 'C' | 'D';
  serial: string;
  date: string;
  venue: string;
  invigilator: string;
  scores?: {
    script: number;
    handwriting: number;
    spelling: number;
  };
  decision?: 'Retain' | 'Repeat Lower' | 'Skip Higher' | 'Pending Placement';
}

export interface FilingRecord {
  id: string;
  name: string;
  type: string;
  date: string;
}

export interface StaffRecord {
  id: string;
  name: string;
  role: string;
  contact: string;
  category: string;
  department: string;
  idNumber: string;
}

export interface Challenge {
  id: string;
  text: string;
  subjectId: string;
  count: number;
}

export interface InvigilatorSlot {
  date: string;
  time: string;
  name: string;
  role: string;
  subject: string;
  venue: string;
  confirmed: boolean;
}

export interface DaycareTimeTableSlot {
  code: string;
  time: string;
  activity: string;
  subject: string;
  detail: string;
  tlm: string;
  remark: string;
}

export interface LessonPlanAssessment {
  teacherId?: string;
  subject?: string;
  topic?: string;
  date?: string;
  week?: number;
  strand?: string;
  subStrand?: string;
  schemeOfWorkStatus?: 'Complete' | 'Incomplete';
  referenceMaterialsCount?: number;
  scores?: Record<string, number>;
  checklists?: Record<string, boolean>;
  quantitative?: {
    alignment: number;
    strategy: number;
    assessment: number;
    time: number;
    engagement: number;
  };
  qualitative?: {
    strengths: string;
    improvements: string;
    behaviors: string;
    patterns: string;
  };
  reflective?: {
    evidence: boolean;
    feedbackUse: boolean;
    adjustmentWillingness: boolean;
  };
  overallEvaluation?: 'Lesson meets professional standards' | 'Lesson requires improvement' | 'Re-teaching recommended' | 'Follow-up observation required' | string;
  status: 'Draft' | 'Finalized';
}

export interface Student {
  id: string;
  serialId: string;
  firstName: string;
  surname: string;
  others: string;
  dob: string;
  sex: 'Male' | 'Female';
  classApplyingFor: string;
  currentClass: string;
  status: 'Pending' | 'Scheduled' | 'Results Ready' | 'Admitted' | 'Withdrawn';
  createdAt: string;
  testDetails?: AdmissionTestInfo;
  birthCertId?: string;
  hasSpecialNeeds: boolean;
  specialNeedsDetail?: string;
  lastSchoolAttended?: string;
  father: ParentInfo;
  mother: ParentInfo;
  livesWith: 'Both Parents' | 'Mother' | 'Father' | 'Guardian' | 'Alone';
  scoreDetails: Record<string, { 
    total: number; 
    grade: string; 
    facilitatorRemark?: string;
    sectionA?: number; // CAT 1 or Indicator Avg
    sectionB?: number; // CAT 3 or Observation Score
    sectionC?: number; // CAT 2 (Group)
    examScore?: number; // End of term exam score
    mockObj?: number; // Mock Section A
    mockTheory?: number; // Mock Section B
    dailyScores?: Record<string, number>; // Date -> Score
  }>;
  attendance: Record<string, Record<string, string>>;
  recommendation?: string;
  overallRemark?: string;
  finalRemark?: string;
  payments?: Record<string, any>;
}

export interface EarlyChildhoodGradeRange {
  label: string;
  min: number;
  max: number;
  color: string;
  remark: string;
}

export interface EarlyChildhoodGradingConfig {
  type: 3 | 5 | 9;
  ranges: EarlyChildhoodGradeRange[];
}

export interface CATConfig {
  date: string;
  marks: number;
  questionType: string;
  bloomTaxonomy: string[];
}

export interface SBAConfig {
  cat1: CATConfig;
  cat2: CATConfig;
  cat3: CATConfig;
}

export interface GlobalSettings {
  schoolName: string;
  address: string;
  motto: string;
  email: string;
  telephone: string;
  logo: string;
  currentTerm: 1 | 2 | 3;
  academicYear: string;
  mockSeries: string;
  examStart: string;
  examEnd: string;
  totalAttendance: number;
  modulePermissions: Record<string, boolean>;
  academicCalendar: Record<number, AcademicCalendarWeek[]>;
  daycareTimeTable: Record<string, Record<string, DaycareTimeTableSlot[]>>;
  examTimeTables: Record<string, ExamTimeTableSlot[]>;
  classTimeTables: Record<string, Record<string, string[]>>; 
  invigilators: InvigilatorEntry[];
  observers: ObserverEntry[];
  staff: StaffRecord[];
  observationSchedule: Record<string, ObservationScheduleSlot[]>;
  activeDevelopmentIndicators: string[];
  customSubjects: string[];
  disabledSubjects: string[];
  questionBank: Record<string, Record<string, string>>;
  promotionConfig: {
    passCutOffGrade: number;
    exceptionalCutOffGrade: number;
    expectedAttendanceRate: number;
    averageClassSize: number;
  };
  earlyChildhoodGrading: {
    core: EarlyChildhoodGradingConfig;
    indicators: EarlyChildhoodGradingConfig;
  };
  popoutLists: {
    activities: string[];
    leadTeam: string[];
    extraCurricular: string[];
    daycareDetails: Record<string, string[]>;
    tlms: string[];
    remarks: string[];
  };
  gradingSystemRemarks: Record<string, string>;
  facilitatorMapping: Record<string, string>;
  submittedSubjects: string[];
  activeIndicators: string[];
  exerciseEntries?: DailyExerciseEntry[];
  sbaConfigs: Record<string, Record<string, SBAConfig>>;
  sbaMarksLocked: boolean;
}

export interface AcademicCalendarWeek {
  week: string;
  dateFrom: string;
  dateTo: string;
  mainActivity: string;
  leadTeam: string;
  extraCurricular: string;
}

export interface DailyExerciseEntry {
  id: string;
  subject: string;
  week: number;
  date: string;
  type: 'Classwork' | 'Homework' | 'Project';
  strand: string;
  subStrand: string;
  indicator: string;
  bloomTaxonomy: string[];
  handwritingRating: number;
  clarityRating: number;
  appearanceRating: number;
  spellingCount?: number;
  hasTestItemPrepared: boolean;
  confirmedWithPupilId?: string;
  pupilStatus: Record<string, 'Marked' | 'Defaulter' | 'Missing'>;
  isLateSubmission: boolean;
}

export interface ExamTimeTableSlot {
  id: string;
  date: string;
  time: string;
  subject: string;
  venue: string;
  duration: string;
  isBreak: boolean;
}

export interface InvigilatorEntry {
  id: string;
  date: string;
  time: string;
  facilitatorName: string;
  role: 'Chief Invigilator' | 'Invigilator' | 'Officer';
  subject: string;
  venue: string;
  confirmed: boolean;
}

export interface ObserverEntry {
  id: string;
  name: string;
  role: 'Supervisory' | 'Facilitator' | 'Facilitator Assistant' | 'Caregiver' | 'Guest Resource';
  active: boolean;
  staffId?: string;
}

export interface ObservationScheduleSlot {
  id: string;
  date: string;
  period: string;
  duration: string;
  venue: string;
  observerId: string;
  pupilGroup: string[];
  activityIndicator: string;
  status: 'Pending' | 'Completed' | 'Postponed' | 'Cancelled';
}

export interface Pupil {
  no: number;
  name: string;
  scores: Record<string, number>;
  aggregate: number;
  categoryCode: string;
  category: string;
  computedScores: any[];
  overallRemark: string;
  recommendation: string;
  attendance: string;
}

export interface FacilitatorStats {
  subject: string;
  facilitator: string;
  distribution: Record<string, number>;
  totalPupils: number;
  performancePercentage: number;
  grade: string;
}

export interface GradingScale {
  grade: string;
  value: number;
  zScore: number;
  remark: string;
  color: string;
}
