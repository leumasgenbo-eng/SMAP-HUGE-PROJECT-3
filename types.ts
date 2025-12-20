
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
    sectionA?: number; // Maps to Average Daily Score (Indicator %) for EC
    sectionB?: number; // Maps to Exam Score (Observation) for EC
  }>;
  attendance: Record<string, Record<string, string>>;
  recommendation?: string;
  overallRemark?: string;
  finalRemark?: string;
}

export interface StaffRecord {
  id: string;
  fullName: string;
  bioData: string;
  demographics: string;
  certifications: string[];
  professionalQualification: string;
  department: string;
  classes: string[];
  subjects: string[];
  employmentType: 'Full-Time' | 'Part-Time';
  roles: ('Facilitator' | 'Invigilator' | 'Guest' | 'Supervisor' | 'Non-Teaching')[];
  skills: string[];
  jobDescription?: string;
  dutyPost?: string;
  attendanceLog: Record<string, { status: string; checkIn: string; checkOut: string; notes: string }>;
}

export interface ExamTimeTableSlot {
  date: string;
  time: string;
  subject: string;
  venue: string;
  duration: string;
  isBreak?: boolean;
}

export interface InvigilatorSlot {
  date: string;
  time: string;
  name: string;
  role: 'Chief Invigilator' | 'Invigilator' | 'Officer';
  subject: string;
  venue: string;
  confirmed: boolean;
}

export interface LessonPlanAssessment {
  id: string;
  teacherId: string;
  subject: string;
  topic: string;
  date: string;
  week: number;
  duration: string;
  strand: string;
  subStrand: string;
  indicator: string;
  classSize: number;
  schemeOfWorkStatus: 'Complete' | 'Incomplete';
  referenceMaterialsCount: number;
  supervisor: string;
  scores: Record<string, number>; // Section E Rubric (0-4)
  checklists: Record<string, boolean>; // Sections B & C
  quantitative: {
    alignment: number;
    strategy: number;
    assessment: number;
    time: number;
    engagement: number;
  };
  qualitative: {
    strengths: string;
    improvements: string;
    behaviors: string;
    patterns: string;
  };
  reflective: {
    evidence: boolean;
    feedbackUse: boolean;
    adjustmentWillingness: boolean;
  };
  overallEvaluation: 'Meets Standards' | 'Requires Improvement' | 'Re-teaching Recommended' | 'Follow-up Required';
  status: 'Draft' | 'Final';
}

export interface DailyExerciseEntry {
  id: string;
  subject: string;
  week: number;
  strand: string;
  subStrand: string;
  indicator: string;
  date: string;
  type: 'Classwork' | 'Homework' | 'Project';
  pupilStatus: Record<string, 'Marked' | 'Defaulter' | 'Missing'>;
  handwritingRating: number; // 1-10
  spellingCount: number; // Correct spellers
  clarityRating: number; // 1-10
  bloomTaxonomy: string[];
  hasTestItemPrepared: boolean;
  isLateSubmission: boolean;
}

export interface ObservationSlot {
  date: string;
  period: string;
  duration: string;
  venue: string;
  observer: string;
  observedPupils: string[];
  activity: string;
}

export interface FilingRecord {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: FilingRecord[];
}

export interface AcademicCalendarWeek {
  week: string;
  dateFrom: string;
  dateTo: string;
  mainActivity: string;
  leadTeam: string;
  extraCurricular: string;
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

export interface GlobalSettings {
  schoolName: string;
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
  invigilatorsList: InvigilatorSlot[];
  observationSchedules: Record<string, ObservationSlot[]>;
  observersList: Array<{ name: string; role: string; active: boolean }>;
  exerciseEntries: DailyExerciseEntry[];
  lessonPlans: LessonPlanAssessment[];
  questionBank: Record<string, Record<string, string>>;
  promotionConfig: {
    passCutOffGrade: number;
    exceptionalCutOffGrade: number;
    expectedAttendanceRate: number;
    averageClassSize: number;
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

export interface Challenge {
  id: string;
  subjectId: string;
  text: string;
  count: number;
}
