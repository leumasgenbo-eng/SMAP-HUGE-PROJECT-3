

export const DEPARTMENTS = [
  { id: 'D&N', label: 'Daycare & Nursery' },
  { id: 'KG', label: 'Kindergarten' },
  { id: 'Lower', label: 'Lower Basic School' },
  { id: 'Upper', label: 'Upper Basic School' },
  { id: 'JHS', label: 'Junior High School' }
];

export const CLASS_MAPPING: Record<string, string[]> = {
  'D&N': ['Creche', 'N1', 'N2'],
  'KG': ['KG1', 'KG2'],
  'Lower': ['Basic 1', 'Basic 2', 'Basic 3'],
  'Upper': ['Basic 4', 'Basic 5', 'Basic 6'],
  'JHS': ['Basic 7', 'Basic 8', 'Basic 9']
};

export const EXAM_VENUES = [
  "B1 (A)", "B1 (B)", "B2 (A)", "B2 (B)", "B3 (A)", "B3 (B)", 
  "B4 (A)", "B4 (B)", "B5 (A)", "B5 (B)", "B6 (A)", "B6 (B)",
  "B7 (A)", "B7 (B)", "B8 (A)", "B8 (B)", "B9 (A)", "B9 (B)"
];

export const OBSERVER_ROLES = [
  "Supervisory", "Facilitator", "Facilitator Assistant", "Caregiver", "Guest Resource"
];

export const BLOOM_TAXONOMY = [
  "Knowledge", "Comprehension", "Application", "Analysis", "Synthesis", "Evaluation"
];

export const LESSON_PLAN_WEIGHTS = {
  OBJECTIVES: 15,
  CONTENT: 15,
  STRATEGIES: 20,
  STRUCTURE: 15,
  ASSESSMENT: 15,
  TLMS: 10,
  INCLUSIVITY: 10
};

export const DAYCARE_ACTIVITY_GROUPS = {
  "Language & Literacy": [
    "Rhymes & Songs", "Recitations", "Poems", "Picture Story", 
    "Storytelling & Sharing", "Print Awareness", "Picture Matching",
    "Letter Sounds", "Two Letter Sounds", "Jolly Phonics Drills"
  ],
  "Numeracy": [
    "Counting Items", "Number Identification", "Pattern Mapping",
    "Sorting & Grouping", "Throwing & Catching", "Puzzles", "Tracing Numerals"
  ],
  "OWOP": [
    "Myself & My Family", "Kitchen Objects", "Community Helpers",
    "Parts of the Body", "Hygiene Practices", "Classroom Rules"
  ],
  "Creative": [
    "Painting", "Colouring", "Scribbling", "Construction", 
    "Moulding", "Threading", "Weaving", "Drawing", "Role Play"
  ]
};

export const DAYCARE_VENUES = [
  "Main Playroom", "Outdoor Playground", "Quiet Corner", "Discovery Lab", "Dining Area"
];

// Added missing constants for Academic Calendar and shared lists
export const CALENDAR_PERIODS = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8", "Week 9", "Week 10", "Week 11", "Week 12", "Week 13", "Week 14", "Week 15", "Week 16"];
export const CALENDAR_ACTIVITIES = [
  "Orientation/Registration", "Submission of Schemes", "CAT Series 1", "Mid-Term Projects",
  "CAT Series 2", "Revision Week", "End of Term Exams", "Results Processing", "Vacation"
];
export const EXTRA_CURRICULAR = [
  "Spelling Bee", "Math Quiz", "Science Fair", "Inter-Houses Sports", "Cultural Day", 
  "French Day", "ICT Workshop", "Excursion", "Career Day"
];
export const LEAD_TEAM = ["Administration", "Academic Section", "IT Department", "Finance Office", "Welfare Committee", "SMC/PTA"];
export const TLMS = ["Markers", "Flipcharts", "Workbooks", "Projector", "Science Lab Kits", "Math Manipulatives", "Flashcards"];
export const REMARKS_LIST = ["Exceptional", "Very Strong", "Good", "Satisfactory", "Improving", "Needs Support"];

// Added missing daycare specific constants
export const DAYCARE_SUBJECTS = ["Language & Literacy", "Numeracy", "OWOP", "Creative Activity"];
export const DAYCARE_DETAILS: Record<string, string[]> = {
  "Language & Literacy": ["Rhymes", "Picture Story", "Letter Sounds", "Jolly Phonics"],
  "Numeracy": ["Counting", "Number ID", "Sorting", "Puzzles"],
  "OWOP": ["Body Parts", "Family", "Hygiene", "Classroom Rules"],
  "Creative": ["Painting", "Colouring", "Moulding", "Drawing"]
};
export const DAYCARE_SLOTS = [
  { code: 'D1', time: '08:00-08:30', activity: 'Arrival/Free Play' },
  { code: 'D2', time: '08:30-09:00', activity: 'Circle Time' },
  { code: 'D3', time: '09:00-10:00', activity: 'Activity Session 1' },
  { code: 'D4', time: '10:00-10:30', activity: 'Snack Break' },
  { code: 'D5', time: '10:30-11:30', activity: 'Activity Session 2' },
  { code: 'D6', time: '11:30-12:00', activity: 'Rest/Outdoor Play' }
];

// Added missing filing cabinet structure for Admin Dashboard
export const FILING_CABINET_STRUCTURE = [
  { id: '1', name: 'Student Academic Records', type: 'folder', children: [] },
  { id: '2', name: 'Staff Professional Files', type: 'folder', children: [] },
  { id: '3', name: 'Institutional Policies', type: 'folder', children: [] }
];

export const CORE_SUBJECTS = ["Mathematics", "English", "Science", "Social Studies"];
export const ELECTIVE_SUBJECTS = ["Computing", "RME", "CAD", "Career Tech", "French", "Ghanaian Language"];
export const SUBJECT_ORDER = [...CORE_SUBJECTS, ...ELECTIVE_SUBJECTS];

export const ROLES = {
  ADMIN: 'Admin',
  FACILITATOR: 'Facilitator'
} as const;

export function getSubjectsForDepartment(dept: string): string[] {
  if (dept === 'JHS') return ["Mathematics", "English", "Science", "Social Studies", "Computing", "RME", "CAD", "Career Tech", "French", "Ghanaian Language"];
  if (dept.includes('Basic')) return ["Mathematics", "English", "History", "Science", "ICT", "RME", "Creativity", "PE", "French"];
  if (dept === 'D&N') return ["Language & Literacy", "Numeracy", "OWOP", "Creative Activity"];
  return ["General"];
}

export const ATTENDANCE_KEYS = {
  PRESENT: { code: 'P', label: 'Present', color: 'bg-green-100 text-green-800' },
  ABSENT: { code: 'A', label: 'Absent', color: 'bg-red-100 text-red-800' },
  PERMISSION: { code: 'W/P', label: 'With Permission', color: 'bg-blue-100 text-blue-800' }
};
