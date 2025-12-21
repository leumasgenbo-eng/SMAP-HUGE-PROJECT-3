
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

export const BASIC_ROOMS = [
  "B1 (A)", "B1 (B)", "B2 (A)", "B2 (B)", "B3 (A)", "B3 (B)",
  "B4 (A)", "B4 (B)", "B5 (A)", "B5 (B)", "B6 (A)", "B6 (B)",
  "B7 (A)", "B7 (B)", "B8 (A)", "B8 (B)", "B9 (A)", "B9 (B)"
];

export const EXAM_VENUES = BASIC_ROOMS;
export const OBSERVER_ROLES = ['Supervisory', 'Facilitator', 'Facilitator Assistant', 'Caregiver', 'Guest Resource'];
export const BLOOM_TAXONOMY = ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'];

export const CORE_SUBJECTS = ["Mathematics", "English Language", "Science", "Social Studies", "History"];

// Added ROLES export
export const ROLES = {
  ADMIN: 'Administrator',
  FACILITATOR: 'Facilitator'
} as const;

// Added SUBJECT_ORDER export
export const SUBJECT_ORDER = ["Mathematics", "English Language", "Science", "Social Studies", "History", "Religious and Moral education", "French", "Computing"];

// Added ELECTIVE_SUBJECTS export
export const ELECTIVE_SUBJECTS = ["Religious and Moral education", "French", "Career Technology", "Creative arts and designing", "Ghanaian Language", "Computing", "I.C.T"];

// Added FILING_CABINET_STRUCTURE export
export const FILING_CABINET_STRUCTURE = {
  'Academic Records': ['Terminal Reports', 'Broad Sheets', 'SBA Records'],
  'Staff Records': ['Deployment', 'Appraisal', 'Attendance'],
  'Student Records': ['Admission', 'Withdrawal', 'Special Needs']
};

// Added DAYCARE_SUBJECTS export
export const DAYCARE_SUBJECTS = ["Language & Literacy", "Numeracy", "OWOP", "Creative Activity"];

// Added LESSON_PLAN_WEIGHTS export
export const LESSON_PLAN_WEIGHTS = {
  "Preparation": 15,
  "Content Delivery": 35,
  "Student Engagement": 25,
  "Assessment & Feedback": 15,
  "Classroom Management": 10
};

export function getSubjectsForDepartment(dept: string): string[] {
  if (dept === 'JHS') return [
    "Mathematics", "English Language", "Science", "Social Studies", 
    "Religious and Moral education", "French", "Career Technology", 
    "Creative arts and designing", "Ghanaian Language", "Computing"
  ];
  if (dept.includes('Basic')) return [
    "Mathematics", "English Language", "Science", "History", 
    "Religious and Moral education", "French", "Creative arts", 
    "Ghanaian Language", "I.C.T"
  ];
  if (dept === 'D&N') return ["Language & Literacy", "Numeracy", "OWOP", "Creative Activity"];
  return ["General"];
}

export const ATTENDANCE_KEYS = {
  PRESENT: { code: 'P', label: 'Present', color: 'bg-green-100 text-green-800' },
  ABSENT: { code: 'A', label: 'Absent', color: 'bg-red-100 text-red-800' },
  PERMISSION: { code: 'W/P', label: 'With Permission', color: 'bg-blue-100 text-blue-800' }
};

export const DAYCARE_VENUES = [
  "Main Playroom", "Sensory Garden", "Sleeping Hall", "Dining Area", "Outdoor Playground", "Music Room"
];

export const DAYCARE_PERIODS = [
  { code: 'L0', label: 'Lesson 0', type: 'L' },
  { code: 'L1', label: 'Lesson 1', type: 'L' },
  { code: 'L2', label: 'Lesson 2', type: 'L' },
  { code: 'B1', label: 'Break 1', type: 'B' },
  { code: 'L3', label: 'Lesson 3', type: 'L' },
  { code: 'L4', label: 'Lesson 4', type: 'L' },
  { code: 'B2', label: 'Break 2', type: 'B' },
  { code: 'L5', label: 'Lesson 5', type: 'L' },
  { code: 'L6', label: 'Lesson 6', type: 'L' },
  { code: 'L7', label: 'Lesson 7', type: 'L' }
];

export const DAYCARE_ACTIVITY_GROUPS = {
  "Language & Literacy": ["Vocabulary building", "Listening to stories", "Pre-writing skills", "Phonics awareness", "Letter recognition"],
  "Numeracy": ["Counting 1-20", "Shape recognition", "Color sorting", "Pattern making", "Basic measurement"],
  "Physical Development": ["Gross motor skills", "Fine motor skills", "Hand-eye coordination", "Balance and posture", "Personal hygiene"],
  "Socio-Emotional": ["Sharing toys", "Following instructions", "Self-expression", "Empathy for others", "Cooperation in groups"],
  "Creative Arts": ["Painting and drawing", "Music and movement", "Role play", "Molding with clay", "Rhymes and songs"]
};

export const CALENDAR_PERIODS = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8", "Week 9", "Week 10", "Week 11", "Week 12", "Week 13", "Week 14", "Week 15", "Week 16"];
export const CALENDAR_ACTIVITIES = ["Orientation", "Lesson Prep", "CAT 1", "Mid-Term", "CAT 2", "Revision", "Exams", "Vacation"];
export const EXTRA_CURRICULAR = ["Spelling Bee", "Math Quiz", "Inter-House Sports", "Cultural Day", "Excursion"];
export const LEAD_TEAM = ["Sir Michael", "Sir Mishael", "Madam Abigail", "Madam Lawrencia"];
export const TLMS = ["Visual Aids", "Flashcards", "Counting Blocks", "Audio Recordings", "Digital Slides"];
export const REMARKS_LIST = ["Exceptional", "Very Good", "Satisfactory", "Needs Improvement", "At Risk"];
export const DAYCARE_DETAILS: Record<string, string[]> = {
  "Language & Literacy": ["Rhymes", "Storytelling", "Letter Sounds", "Tracing"],
  "Numeracy": ["Counting", "Shapes", "Sorting", "Numbers"],
  "OWOP": ["My Family", "My Body", "Hygiene", "Rules"],
  "Creative": ["Painting", "Drawing", "Singing", "Dance"]
};
export const DAYCARE_SLOTS = [
  { code: 'D1', time: '08:00-08:30', activity: 'Arrival' },
  { code: 'D2', time: '08:30-09:00', activity: 'Circle Time' }
];
export const EC_DEFAULT_GRADES = {
  core3: [
    { label: 'G', min: 70, max: 100, color: '#ffd700', remark: 'Gold (Exceptional)' },
    { label: 'S', min: 40, max: 69, color: '#c0c0c0', remark: 'Silver (Satisfactory)' },
    { label: 'B', min: 1, max: 39, color: '#cd7f32', remark: 'Bronze (Needs Improvement)' }
  ],
  core5: [
    { label: 'A', min: 80, max: 100, color: '#2e8b57', remark: 'Excellent' },
    { label: 'B', min: 70, max: 79, color: '#3a9d6a', remark: 'Very Good' },
    { label: 'C', min: 60, max: 69, color: '#cca43b', remark: 'Good' },
    { label: 'D', min: 45, max: 59, color: '#e67e22', remark: 'Fair' },
    { label: 'E', min: 0, max: 44, color: '#e74c3c', remark: 'Poor' }
  ],
  ind3: [
    { label: 'D', min: 1, max: 40, color: '#e74c3c', remark: 'Developing' },
    { label: 'A', min: 41, max: 80, color: '#cca43b', remark: 'Achieving' },
    { label: 'A+', min: 81, max: 100, color: '#2e8b57', remark: 'Advanced' }
  ]
};
