export const DEPARTMENTS = [
  { id: 'Daycare', label: 'Daycare' },
  { id: 'Kindergarten', label: 'Kindergarten' },
  { id: 'Lower', label: 'Lower Basic' },
  { id: 'Upper', label: 'Upper Basic' },
  { id: 'Junior', label: 'Junior High' }
];

export const CLASS_MAPPING: Record<string, string[]> = {
  'Daycare': ['Creche 1', 'Creche 2', 'Nursery 1', 'Nursery 2'],
  'Kindergarten': ['Kindergarten 1', 'Kindergarten 2'],
  'Lower': ['Basic 1A', 'Basic 1B', 'Basic 2A', 'Basic 2B', 'Basic 3A', 'Basic 3B'],
  'Upper': ['Basic 4A', 'Basic 4B', 'Basic 5A', 'Basic 5B', 'Basic 6A', 'Basic 6B'],
  'Junior': ['Basic 7A', 'Basic 7B', 'Basic 8A', 'Basic 8B', 'Basic 9A', 'Basic 9B']
};

export const BASIC_ROOMS = [
  "RM 1A", "RM 1B", "RM 2A", "RM 2B", "RM 3A", "RM 3B",
  "RM 4A", "RM 4B", "RM 5A", "RM 5B", "RM 6A", "RM 6B",
  "RM 7A", "RM 7B", "RM 8A", "RM 8B", "RM 9A", "RM 9B"
];

export const EXAM_VENUES = BASIC_ROOMS;
export const OBSERVER_ROLES = ['Supervisory', 'Facilitator', 'Facilitator Assistant', 'Caregiver', 'Guest Resource'];
export const BLOOM_TAXONOMY = ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'];

export const CORE_SUBJECTS = ["Mathematics", "English Language", "Science", "Social Studies", "History"];

export const ROLES = {
  ADMIN: 'Administrator',
  FACILITATOR: 'Facilitator'
} as const;

export const SUBJECT_ORDER = ["Mathematics", "English Language", "Science", "Social Studies", "History", "Religious and Moral education", "French", "I.C.T", "Physical Education"];

export const ELECTIVE_SUBJECTS = ["Religious and Moral education", "French", "Career Technology", "Creative arts and designing", "Ghanaian Language", "I.C.T", "Physical Education"];

export function getSubjectsForDepartment(dept: string): string[] {
  if (dept === 'Junior') return [
    "Social Studies", "English Language", "Science", "Mathematics",
    "Computing", "Religious and Moral Education", "Creative Arts and Designing", "Career Technology", "French", "Ghanaian Language"
  ];
  if (dept === 'Lower' || dept === 'Upper') return [
    "History", "English Language", "Science", "Mathematics",
    "I.C.T", "Religious and Moral Education", "Creative Arts and Designing", "Creative Arts", "French", "Ghanaian Language"
  ];
  if (dept === 'Daycare' || dept === 'Kindergarten') return ["LANGUAGE AND LITERACY", "NUMERACY", "CREATIVE ACTIVITIES", "OUR WORLD OUR PEOPLE"];
  return ["General"];
}

export const DAYCARE_ACTIVITY_GROUPS = {
  "PHYSICAL DEVELOPMENT": ["Running & Climbing", "Motor Skills", "Outdoor play"],
  "HEALTH AND HYGIENE": ["Toilet Needs", "Hand Washing", "Personal hygiene"],
  "SOCIAL & COOPERATION": ["Role play", "Sharing", "Classroom rules"],
  "LANGUAGE & LITERACY": ["Rhymes", "Tracing", "Story time"],
  "COGNITIVE & NUMERACY": ["Counting 1-20", "Shapes", "Puzzles"]
};

export const CALENDAR_PERIODS = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8", "Week 9", "Week 10", "Week 11", "Week 12", "Week 13", "Week 14", "Week 15", "Week 16"];
export const CALENDAR_ACTIVITIES = ["Orientation", "Lesson Prep", "CAT 1", "Mid-Term", "CAT 2", "Revision", "Exams", "Vacation"];
export const EXTRA_CURRICULAR = ["Spelling Bee", "Math Quiz", "Inter-House Sports", "Cultural Day", "Excursion"];
export const LEAD_TEAM = ["Sir Michael", "Sir Mishael", "Madam Abigail", "Madam Lawrencia"];
export const TLMS = ["Visual Aids", "Flashcards", "Counting Blocks", "Digital Slides"];
export const REMARKS_LIST = ["Exceptional", "Very Good", "Satisfactory", "Needs Improvement", "At Risk"];
export const STANDARD_CLASS_RULES = [
  "Listen when others are talking.",
  "Follow directions the first time they are given.",
  "Keep hands, feet, and objects to yourself.",
  "Work quietly and do not disturb others.",
  "Show respect for school property and classmates.",
  "Always be kind and use polite language."
];
export const EC_DEFAULT_GRADES = {
  core3: [
    { label: 'G', min: 70, max: 100, color: '#ffd700', remark: 'Gold (Exceptional)' },
    { label: 'S', min: 40, max: 69, color: '#c0c0c0', remark: 'Silver (Satisfactory)' },
    { label: 'B', min: 1, max: 39, color: '#cd7f32', remark: 'Bronze (Needs Improvement)' }
  ],
  ind3: [
    { label: 'D', min: 1, max: 40, color: '#e74c3c', remark: 'Developing' },
    { label: 'A', min: 41, max: 80, color: '#cca43b', remark: 'Achieving' },
    { label: 'A+', min: 81, max: 100, color: '#2e8b57', remark: 'Advanced' }
  ]
};

// Added missing ATTENDANCE_KEYS constant to resolve AttendanceModule errors
export const ATTENDANCE_KEYS = {
  P: { code: 'P', label: 'Present', color: 'bg-green-100 text-green-700' },
  A: { code: 'A', label: 'Absent', color: 'bg-red-100 text-red-700' },
  L: { code: 'L', label: 'Late', color: 'bg-yellow-100 text-yellow-700' },
  E: { code: 'E', label: 'Excused', color: 'bg-blue-100 text-blue-700' },
};

// Added missing DAYCARE_PERIODS constant to resolve DaycareTimeTable and ObservationDesk errors
export const DAYCARE_PERIODS = [
  { code: 'L0', label: 'Arrival' },
  { code: 'L1', label: 'Circle Time' },
  { code: 'L2', label: 'Phonics' },
  { code: 'L3', label: 'Learning Centre' },
  { code: 'B1', label: 'Snack Break' },
  { code: 'L4', label: 'Individual Activity' },
  { code: 'L5', label: 'Story Time' },
  { code: 'B2', label: 'Lunch Break' },
  { code: 'L6', label: 'Group Activity' },
  { code: 'L7', label: 'Closing' }
];

// Added missing DAYCARE_VENUES constant to resolve ObservationSchedule and ObservationDesk errors
export const DAYCARE_VENUES = [
  "Main Classroom", "Outdoor Playground", "Nap Room", "Dining Area", "Assembly Hall"
];

// Added missing LESSON_PLAN_WEIGHTS constant to resolve LessonPlanAssessment and LessonAssessmentDesk errors
export const LESSON_PLAN_WEIGHTS = {
  "Objectives & Outcomes": 25,
  "Content Accuracy": 25,
  "Teaching Strategies": 25,
  "TLM Utilization": 25
};