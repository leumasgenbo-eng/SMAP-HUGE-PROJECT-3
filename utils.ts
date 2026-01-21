import { GradingScale, Student, Pupil, GlobalSettings, FacilitatorStats, EarlyChildhoodGradeRange, EarlyChildhoodGradingConfig, GradingScaleEntry } from './types';
import { CORE_SUBJECTS } from './constants';

export function getDevelopmentalRating(score: number, mean: number, stdDev: number, points: 2 | 3 | 5 | 9, scale: GradingScaleEntry[]) {
  if (stdDev <= 0) return { label: "N/A", color: "#94a3b8", value: 0 };
  const z = (score - mean) / stdDev;

  if (points === 2) {
    return z >= 0 
      ? { label: "Achieved", color: "#2e8b57", value: 2 }
      : { label: "Emerging", color: "#e67e22", value: 1 };
  }
  
  if (points === 3) {
    if (z > 1.0) return { label: "Advanced", color: "#2e8b57", value: 3 };
    if (z >= -1.0) return { label: "Achieving", color: "#cca43b", value: 2 };
    return { label: "Developing", color: "#e74c3c", value: 1 };
  }

  if (points === 5) {
    if (z > 1.5) return { label: "Exceptional", color: "#2e8b57", value: 5 };
    if (z > 0.5) return { label: "Strong", color: "#3a9d6a", value: 4 };
    if (z >= -0.5) return { label: "Average", color: "#0f3460", value: 3 };
    if (z >= -1.5) return { label: "Low Average", color: "#cca43b", value: 2 };
    return { label: "At Risk", color: "#e74c3c", value: 1 };
  }

  const gradeObj = scale.find(s => z >= s.zScore) || scale[scale.length - 1];
  return { label: gradeObj.grade, color: gradeObj.color, value: gradeObj.value };
}

export function generateSubjectRemark(score: number): string {
  if (score >= 80) return "Exceptional grasp of concepts. Keep it up!";
  if (score >= 70) return "Strong performance. Consistent effort observed.";
  if (score >= 60) return "Good understanding. Can achieve more with practice.";
  if (score >= 50) return "Satisfactory progress. Needs more focus on details.";
  if (score >= 40) return "Fair performance. More work required in basic concepts.";
  return "Needs intensive intervention and consistent monitoring.";
}

export function calculateStats(scores: number[]) {
  const n = scores.length;
  if (n === 0) return { mean: 0, stdDev: 0 };
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n);
  return { mean, stdDev };
}

export function getNRTGrade(score: number, mean: number, stdDev: number, scale: GradingScaleEntry[], settings: GlobalSettings, classSize: number) {
  if (stdDev <= 0) {
    const defaultGrade = scale[Math.floor(scale.length / 2)] || scale[0];
    return { ...defaultGrade, remark: settings.gradingSystemRemarks?.[defaultGrade.grade] || defaultGrade.remark };
  }

  const model = settings.distributionModel || 'Auto';
  const useTDist = model === 'T-Dist' || (model === 'Auto' && classSize < 30);
  
  let z = (score - mean) / stdDev;

  if (useTDist && classSize > 1) {
    const correctionFactor = Math.sqrt(classSize / (classSize - 1));
    z = z / correctionFactor;
  }

  const gradeData = scale.find(s => z >= s.zScore) || scale[scale.length - 1];
  return { ...gradeData, remark: settings.gradingSystemRemarks?.[gradeData.grade] || gradeData.remark };
}

export function calculateWeightedScore(student: Student, subject: string, settings: GlobalSettings): number {
  const weights = settings.assessmentWeights || { exercises: 20, cats: 30, terminal: 50 };
  
  const exerciseEntries = (settings.exerciseEntries || []).filter(e => e.subject === subject);
  const exerciseAvg = exerciseEntries.length > 0 
    ? exerciseEntries.reduce((acc, e) => acc + ((e.pupilScores?.[student.id] || 0) / (e.maxScore || 1)), 0) / exerciseEntries.length 
    : 0;
  const weightedExercises = (exerciseAvg * 100) * (weights.exercises / 100);

  const sbaConfig = settings.sbaConfigs[student.currentClass]?.[subject];
  let weightedCats = 0;
  if (sbaConfig) {
    const cat1 = (sbaConfig.cat1.scores?.[student.id] || 0) / (sbaConfig.cat1.marks || 20);
    const cat2 = (sbaConfig.cat2.scores?.[student.id] || 0) / (sbaConfig.cat2.marks || 20);
    const cat3 = (sbaConfig.cat3.scores?.[student.id] || 0) / (sbaConfig.cat3.marks || 10);
    const catAvg = (cat1 + cat2 + cat3) / 3;
    weightedCats = (catAvg * 100) * (weights.cats / 100);
  }

  const scoreDetails = student.scoreDetails?.[subject];
  const tConfig = settings.terminalConfigs[student.currentClass] || { sectionAMax: 30, sectionBMax: 70 };
  
  const isScience = subject.toLowerCase().includes('science');
  const scienceThreshold = settings.scienceThreshold || 140;
  const maxA = (isScience && scienceThreshold === 140) ? 40 : tConfig.sectionAMax;
  const maxB = (isScience && scienceThreshold === 140) ? 100 : tConfig.sectionBMax;
  const terminalMaxRaw = maxA + maxB;

  let weightedTerminal = 0;
  if (scoreDetails) {
    const rawTerminal = (scoreDetails.mockObj || 0) + (scoreDetails.mockTheory || 0);
    weightedTerminal = (rawTerminal / terminalMaxRaw) * 100 * (weights.terminal / 100);
  }

  return Math.round(weightedExercises + weightedCats + weightedTerminal);
}

export function processStudentData(students: Student[], settings: GlobalSettings, subjectList: string[]): Pupil[] {
  const scale = settings.gradingScale || [];
  const classSize = students.length;
  
  const stats = subjectList.map(subj => {
    const scores = students.map(s => calculateWeightedScore(s, subj, settings));
    return { name: subj, ...calculateStats(scores) };
  });

  const pupils: Pupil[] = students.map((s, idx) => {
    const computedScores = subjectList.map(subj => {
      const weightedTotal = calculateWeightedScore(s, subj, settings);
      const details = s.scoreDetails?.[subj] || { total: 0, facilitatorRemark: '', mockObj: 0, mockTheory: 0 };
      const stat = stats.find(st => st.name === subj)!;
      const gradeObj = getNRTGrade(weightedTotal, stat.mean, stat.stdDev, scale, settings, classSize);
      
      return {
        name: subj,
        score: weightedTotal,
        grade: gradeObj.grade,
        gradeValue: gradeObj.value,
        interpretation: gradeObj.remark,
        isCore: CORE_SUBJECTS.includes(subj),
        classAverage: stat.mean,
        facilitator: settings.facilitatorMapping?.[subj] || "N/A",
        remark: details.facilitatorRemark || generateSubjectRemark(weightedTotal),
        sectionA: details.mockObj || 0,
        sectionB: details.mockTheory || 0
      };
    }).sort((a, b) => b.score - a.score);

    const cores = computedScores.filter(sc => sc.isCore).sort((a, b) => a.gradeValue - b.gradeValue).slice(0, 4);
    const electives = computedScores.filter(sc => !sc.isCore).sort((a, b) => a.gradeValue - b.gradeValue).slice(0, 2);
    
    const aggregate = (cores.length + electives.length === 6) 
      ? cores.reduce((acc, curr) => acc + curr.gradeValue, 0) + electives.reduce((acc, curr) => acc + curr.gradeValue, 0)
      : 54;

    let catCode = 'W1';
    let cat = 'Needs Improvement';
    if (aggregate <= 10) { catCode = 'P1'; cat = 'Platinum Elite'; }
    else if (aggregate <= 18) { catCode = 'G1'; cat = 'Gold Scholar'; }
    else if (aggregate <= 30) { catCode = 'S1'; cat = 'Silver Achiever'; }
    else if (aggregate <= 45) { catCode = 'B1'; cat = 'Bronze Competent'; }

    const termAttendance = s.attendance?.[settings.currentTerm] || {};
    const presentCount = Object.values(termAttendance).filter(status => status === 'P').length;

    const combinedScores = {
      ...subjectList.reduce((acc, subj) => {
        acc[subj] = calculateWeightedScore(s, subj, settings);
        return acc;
      }, {} as Record<string, number>),
      ...(settings.activeIndicators || []).reduce((acc, ind) => {
        acc[ind] = s.scoreDetails?.[ind]?.sectionA || 0;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      no: idx + 1,
      name: `${s.firstName} ${s.surname}`,
      scores: combinedScores,
      aggregate,
      categoryCode: catCode,
      category: cat,
      computedScores,
      overallRemark: s.finalRemark || `Performance is ${cat.toLowerCase()}.`,
      recommendation: s.recommendation || "Continue with intensive review.",
      attendance: presentCount.toString(),
      classSize: students.length,
      isFeesCleared: !!s.isFeesCleared,
      promotionStatus: s.promotionStatus,
      conduct: s.conduct || "Satisfactory",
      interest: s.interest || "High Interest",
      attitude: s.attitude || "Positive",
      punctuality: s.punctuality || "Regular & Punctual"
    };
  });

  return pupils.sort((a, b) => a.aggregate - b.aggregate);
}

export function calculateFacilitatorStats(students: Student[], settings: GlobalSettings, subject: string): FacilitatorStats {
  const facilitator = settings.facilitatorMapping?.[subject] || "Unknown";
  const scores = students.map(s => calculateWeightedScore(s, subject, settings));
  const { mean, stdDev } = calculateStats(scores);
  const scale = settings.gradingScale || [];
  const classSize = students.length;
  
  const distribution: Record<string, number> = {};
  scale.forEach(s => distribution[s.grade] = 0);

  let totalWeightedValue = 0;
  scores.forEach(score => {
    const gradeObj = getNRTGrade(score, mean, stdDev, scale, settings, classSize);
    distribution[gradeObj.grade]++;
    totalWeightedValue += gradeObj.value;
  });

  const pupilsCount = students.length || 1;
  const performancePercentage = (1 - (totalWeightedValue / (pupilsCount * (scale[scale.length-1]?.value || 9)))) * 100;
  const avgGradeValue = Math.round(totalWeightedValue / pupilsCount);
  const facilitatorGrade = scale.find(s => s.value === avgGradeValue)?.grade || "F9";

  return { subject, facilitator, distribution, totalPupils: students.length, performancePercentage, grade: facilitatorGrade };
}

export function getDaycareGrade(score: number, config: EarlyChildhoodGradingConfig) {
  const range = config.ranges.find(r => score >= r.min && score <= r.max);
  return range || { label: '?', min: 0, max: 0, color: '#ccc', remark: 'Unknown' };
}

export function getObservationRating(points: number, config: EarlyChildhoodGradingConfig) {
  const range = config.ranges.find(r => points >= r.min && points <= r.max);
  return range || { label: '?', min: 0, max: 0, color: '#ccc', remark: 'Unknown' };
}

export function getNextClass(currentClass: string): string {
  const classes = [
    'Creche 1', 'Creche 2', 'Nursery 1', 'Nursery 2', 
    'Kindergarten 1', 'Kindergarten 2',
    'Basic 1A', 'Basic 1B', 'Basic 2A', 'Basic 2B', 'Basic 3A', 'Basic 3B', 
    'Basic 4A', 'Basic 4B', 'Basic 5A', 'Basic 5B', 'Basic 6A', 'Basic 6B',
    'Basic 7A', 'Basic 7B', 'Basic 8A', 'Basic 8B', 'Basic 9A', 'Basic 9B'
  ];
  const index = classes.indexOf(currentClass);
  if (index === -1 || index === classes.length - 1) return 'Graduated';
  
  // Basic Logic: A moves to next level A, B moves to next level B
  const isB = currentClass.endsWith('B');
  const levelNum = parseInt(currentClass.match(/\d+/)?.[0] || "0");
  if (levelNum > 0 && levelNum < 9) {
    return `Basic ${levelNum + 1}${isB ? 'B' : 'A'}`;
  }
  
  return classes[index + 1];
}

export const NRT_SCALE: GradingScaleEntry[] = [
  { grade: "A1", value: 1, zScore: 1.645, remark: "Excellent", color: "#2e8b57" },
  { grade: "B2", value: 2, zScore: 1.036, remark: "Very Good", color: "#3a9d6a" },
  { grade: "B3", value: 3, zScore: 0.524, remark: "Good", color: "#45b07d" },
  { grade: "C4", value: 4, zScore: 0.0, remark: "Credit", color: "#0f3460" },
  { grade: "C5", value: 5, zScore: -0.524, remark: "Credit", color: "#cca43b" },
  { grade: "C6", value: 6, zScore: -1.036, remark: "Credit", color: "#b38f32" },
  { grade: "D7", value: 7, zScore: -1.645, remark: "Pass", color: "#e67e22" },
  { grade: "E8", value: 8, zScore: -2.326, remark: "Pass", color: "#d35400" },
  { grade: "F9", value: 9, zScore: -999, remark: "Fail", color: "#e74c3c" },
];