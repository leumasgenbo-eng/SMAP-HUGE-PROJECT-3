
export interface GradingScaleEntry {
  grade: string;
  value: number;
  zScore: number; // NRT Cut-off point
  remark: string;
  color: string;
}

export interface AssessmentWeights {
  exercises: number; // e.g., 20%
  cats: number;      // e.g., 30%
  terminal: number;  // e.g., 50%
}

export interface TerminalConfig {
  sectionAMax: number;
  sectionBMax: number;
}

export interface MaterialRequest {
  id: string;
  itemName: string;
  category: string;
  purpose: string;
  quantityRequested: number;
  dateRequested: string;
  dateRequired: string;
  usageDuration: string;
  priority: string;
  remarks: string;
  staffId: string;
  staffName: string;
  status: 'Pending' | 'Approved' | 'Issued' | 'Declined';
  dateIssued?: string;
}

export interface ClassroomInventory {
  id: string;
  block: string;
  roomNumber: string;
  schoolClass: string;
  inspectionDate: string;
  items: Record<string, { status: 'Available' | 'Missing' | 'Damaged'; condition: 'Good' | 'Fair' | 'Poor' }>;
  damagedMissingNotes: string;
  priority: string;
  comments: string;
}

export interface DailyExerciseEntry {
  id: string;
  subject: string;
  week: number;
  type: 'Classwork' | 'Homework' | 'Project';
  bloomTaxonomy: string[];
  pupilStatus: Record<string, 'Marked' | 'Defaulter' | 'Missing'>;
  pupilScores: Record<string, number>;
  defaulterReasons?: Record<string, string>;
  isDisciplinaryReferral?: boolean;
  maxScore: number;
  hasTestItemPrepared: boolean;
  handwritingRating: number;
  clarityRating: number;
  appearanceRating: number;
  isLateSubmission: boolean;
  indicator?: string;
  strand?: string;
  subStrand?: string;
  spellingCount?: number;
  confirmedWithPupilId?: string;
  date?: string;
}

export interface SpecialDisciplinaryLog {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  date: string;
  repeatCount: number;
  correction1: string;
  correction2: string;
  correction3: string;
  class: string;
}

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
    oral?: number;
    logic?: number;
  };
  decision?: 'Retain' | 'Repeat Lower' | 'Skip Higher' | 'Pending Placement' | 'Approved' | 'Declined';
  decisionDate?: string;
  approvedBy?: string;
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
  gender: 'Male' | 'Female';
  dob: string;
  age?: number;
  nationality: string;
  hometown: string;
  residentialAddress: string;
  email: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  category: 'Teaching' | 'Non-Teaching';
  employmentType: 'Full Time' | 'Part Time' | 'Service Personnel';
  availableDays?: string[];
  department: string;
  workArea?: string; 
  idNumber: string;
  identificationType: 'Ghana Card' | 'Passport' | 'Voter ID';
  identificationNumber: string;
  dateOfAppointment: string;
  authorizedForFinance?: boolean;
}

export interface FacilitatorComplianceLog {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  day: string;
  period: string;
  subject: string;
  class: string;
  presenceStatus: 'Present' | 'Late' | 'Closed Early' | 'Interrupted' | 'Absent';
  timeIn?: string;
  timeUsed?: number;
  lessonContent?: string;
  interruptionReason?: string;
}

export interface StaffIdLog {
  id: string;
  staffId: string;
  staffName: string;
  issuedAt: string;
  issuedBy: string;
}

export interface Challenge {
  id: string;
  text: string;
  subjectId: string;
  count: number;
}

export interface TaxConfig {
  vatRate: number;
  nhilRate: number;
  getLevyRate: number;
  covidLevyRate: number;
  isTaxEnabled: boolean;
}

export interface LedgerRecord {
  id: string;
  date: string;
  transactionCode: string;
  balanceBF: number;
  newBill: number;
  taxAmount: number;
  totalBill: number;
  amountPaid: number;
  currentBalance: number;
  status: 'Full' | 'Partial';
  category: string;
  processedBy?: {
    staffId: string;
    staffName: string;
    time: string;
  };
}

export interface TransactionAuditLog {
  id: string;
  date: string;
  time: string;
  staffId: string;
  staffName: string;
  learnerId: string;
  learnerName: string;
  amount: number;
  category: string;
  transactionCode: string;
}

export interface FinanceConfig {
  categories: string[];
  classBills: Record<string, Record<string, number>>;
  receiptMessage: string;
  taxConfig: TaxConfig;
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
  status: 'Pending' | 'Scheduled' | 'Results Ready' | 'Admitted' | 'Withdrawn' | 'Denied';
  createdAt: string;
  admissionFeeReceipt: string;
  admissionFeeDate: string;
  testDetails?: AdmissionTestInfo;
  hasSpecialNeeds: boolean;
  disabilityType?: string;
  father: ParentInfo;
  mother: ParentInfo;
  parent2?: {
    name: string;
    contact: string;
  };
  email?: string;
  livesWith: 'Both Parents' | 'Mother' | 'Father' | 'Guardian' | 'Alone';
  scoreDetails: Record<string, { 
    total: number; 
    grade: string; 
    facilitatorRemark?: string;
    sectionA?: number; 
    sectionB?: number; 
    sectionC?: number; 
    examScore?: number; 
    mockObj?: number; 
    mockTheory?: number; 
    dailyScores?: Record<string, number>; 
  }>;
  attendance: Record<string, Record<string, string>>;
  lunchRegister: Record<string, string>;
  generalRegister: Record<string, string>;
  payments?: Record<string, any>;
  ledger: LedgerRecord[];
  isFeesCleared: boolean;
  promotionStatus?: string;
  conduct?: string;
  interest?: string;
  attitude?: string;
  punctuality?: string;
  finalRemark?: string;
  recommendation?: string;
}

export interface TimeTableSlot {
  id: string;
  type: 'PERIOD' | 'BREAK' | 'MANDATORY';
  label: string;
  time: string;
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
  reopeningDate: string;
  headteacherName: string;
  totalAttendance: number;
  punctualityThreshold: string;
  modulePermissions: Record<string, boolean>;
  academicCalendar: Record<number, AcademicCalendarWeek[]>;
  daycareTimeTable: Record<string, Record<string, DaycareTimeTableSlot[]>>;
  examTimeTables: Record<string, ExamTimeTableSlot[]>;
  classTimeTables: Record<string, Record<string, string[]>>; 
  timeTableStructures: Record<string, Record<string, TimeTableSlot[]>>;
  invigilators: InvigilatorEntry[];
  observers: ObserverEntry[];
  staff: StaffRecord[];
  staffIdLogs: StaffIdLog[];
  transactionAuditLogs: TransactionAuditLog[];
  facilitatorComplianceLogs: FacilitatorComplianceLog[];
  lessonAssessments?: LessonPlanAssessment[];
  staffAttendance: Record<string, Record<string, { timeIn: string; timeOut: string; status: string }>>;
  observationSchedule: Record<string, ObservationScheduleSlot[]>;
  activeDevelopmentIndicators: string[];
  customSubjects: string[];
  disabledSubjects: string[];
  questionBank: Record<string, Record<string, string>>;
  teacherConstraints: Record<string, string[]>; 
  subjectDemands: Record<string, Record<string, number>>;
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
    observationNotes: string[];
    facilitatorRemarks: string[];
    generalRemarks: string[];
    punctualityRemarks: string[];
    nonTeachingAreas: string[];
    classRules?: string[];
  };
  gradingSystemRemarks: Record<string, string>;
  gradingScale: GradingScaleEntry[];
  assessmentWeights: AssessmentWeights;
  terminalConfigs: Record<string, TerminalConfig>;
  facilitatorMapping: Record<string, string>;
  submittedSubjects: string[];
  activeIndicators: string[];
  exerciseEntries?: DailyExerciseEntry[];
  specialDisciplinaryLogs?: SpecialDisciplinaryLog[];
  materialRequests?: MaterialRequest[];
  classroomInventories?: ClassroomInventory[];
  sbaConfigs: Record<string, Record<string, SBAConfig>>;
  sbaMarksLocked: boolean;
  reportTitle?: string;
  reportFooterText?: string;
  financeConfig: FinanceConfig;
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
  classSize?: number;
  isFeesCleared: boolean;
  promotionStatus?: string;
  conduct?: string;
  interest?: string;
  attitude?: string;
  punctuality?: string;
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
  id: string;
  date: string;
  marks: number;
  questionType: string;
  bloomTaxonomy: string[];
  strand?: string;
  subStrand?: string;
  indicatorCode?: string;
  scores?: Record<string, number>;
}

export interface SBAConfig {
  cat1: CATConfig;
  cat2: CATConfig;
  cat3: CATConfig;
}

export interface LessonPlanAssessment {
  id: string;
  teacherId?: string;
  teacherName?: string;
  staffId?: string;
  duration?: string;
  subject?: string;
  topic?: string;
  date?: string;
  week?: number;
  strand?: string;
  subStrand?: string;
  lessonDates?: string[]; // [L1, L2, L3, L4, L5]
  pagesCovered?: string;
  referenceMaterialDetail?: string;
  isPlanLate?: boolean;
  schemeChecks?: {
    yearly: boolean;
    termly: boolean;
    weekly: boolean;
  };
  schemeOfWorkStatus?: 'Complete' | 'Incomplete';
  referenceMaterialsCount?: number;
  scores: Record<string, number>;
  checklists: Record<string, boolean>;
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
  status: 'Draft' | 'Finalized';
  overallEvaluation?: string;
  compositeScore?: number;
}

export interface GradingScale {
  grade: string;
  value: number;
  zScore: number;
  remark: string;
  color: string;
}

export interface FacilitatorStats {
  subject: string;
  facilitator: string;
  distribution: Record<string, number>;
  totalPupils: number;
  performancePercentage: number;
  grade: string;
}

export interface AcademicCalendarWeek {
  week: string;
  dateFrom: string;
  dateTo: string;
  mainActivity: string;
  leadTeam: string;
  extraCurricular: string;
}

export interface ObserverEntry {
  id: string;
  staffId: string;
  name: string;
  role: 'Supervisory' | 'Facilitator' | 'Facilitator Assistant' | 'Caregiver' | 'Guest Resource';
  active: boolean;
}

export interface InvigilatorEntry {
  id: string;
  date: string;
  time: string;
  facilitatorName: string;
  role: string;
  subject: string;
  venue: string;
  confirmed: boolean;
}

export type InvigilatorSlot = InvigilatorEntry;

export interface DaycareTimeTableSlot {
  code: string;
  time: string;
  activity: string;
  subject: string;
  detail: string;
  tlm: string;
  remark: string;
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

export interface ObservationScheduleSlot {
  id: string;
  date: string;
  period: string;
  duration: string;
  venue: string;
  observerId: string;
  pupilGroup: string[];
  activityIndicator: string;
  // Fix: Added 'In Progress' and 'Lapsed' to resolve comparison errors in components
  status: 'Pending' | 'In Progress' | 'Completed' | 'Lapsed';
}
