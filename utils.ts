
import { GradingScale, Student, Pupil, GlobalSettings, FacilitatorStats, EarlyChildhoodGradingConfig } from './types';
import { CORE_SUBJECTS } from './constants';

export const NRT_SCALE: GradingScale[] = [
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

/**
 * Dynamic Multi-Point Rating System
 * Returns a score-based rating using population statistics (NRT approach)
 */
export function getDevelopmentalRating(score: number, mean: number, stdDev: number, points: 2 | 3 | 5 | 9) {
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

  // 9-point scale (matches NRT_SCALE logic)
  const gradeObj = NRT_SCALE.find(s => z >= s.zScore) || NRT_SCALE[8];
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

export function getNRTGrade(score: number, mean: number, stdDev: number, customRemarks?: Record<string, string>) {
  if (stdDev <= 0) {
    const defaultGrade = NRT_SCALE[3];
    return { ...defaultGrade, remark: customRemarks?.[defaultGrade.grade] || defaultGrade.remark };
  }
  const z = (score - mean) / stdDev;
  const gradeData = NRT_SCALE.find(s => z >= s.zScore) || NRT_SCALE[8];
  return { ...gradeData, remark: customRemarks?.[gradeData.grade] || gradeData.remark };
}

export function processStudentData(students: Student[], settings: GlobalSettings, subjectList: string[]): Pupil[] {
  const stats = subjectList.map(subj => {
    const scores = students.map(s => (s.scoreDetails?.[subj]?.total || 0));
    return { name: subj, ...calculateStats(scores) };
  });

  const pupils: Pupil[] = students.map((s, idx) => {
    const computedScores = subjectList.map(subj => {
      const details = s.scoreDetails?.[subj] || { total: 0 };
      const stat = stats.find(st => st.name === subj)!;
      const gradeObj = getNRTGrade(details.total, stat.mean, stat.stdDev, settings.gradingSystemRemarks);
      
      return {
        name: subj,
        score: details.total,
        grade: gradeObj.grade,
        gradeValue: gradeObj.value,
        isCore: CORE_SUBJECTS.includes(subj),
        classAverage: stat.mean,
        facilitator: settings.facilitatorMapping?.[subj] || "N/A",
        remark: generateSubjectRemark(details.total)
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

    return {
      no: idx + 1,
      name: `${s.firstName} ${s.surname}`,
      scores: subjectList.reduce((acc, subj) => {
        acc[subj] = s.scoreDetails?.[subj]?.total || 0;
        return acc;
      }, {} as Record<string, number>),
      aggregate,
      categoryCode: catCode,
      category: cat,
      computedScores,
      overallRemark: s.finalRemark || `Performance is ${cat.toLowerCase()}.`,
      recommendation: s.recommendation || "Continue with intensive review.",
      attendance: presentCount.toString()
    };
  });

  return pupils.sort((a, b) => a.aggregate - b.aggregate);
}

export function calculateFacilitatorStats(students: Student[], settings: GlobalSettings, subject: string): FacilitatorStats {
  const facilitator = settings.facilitatorMapping?.[subject] || "Unknown";
  const scores = students.map(s => s.scoreDetails?.[subject]?.total || 0);
  const { mean, stdDev } = calculateStats(scores);
  
  const distribution: Record<string, number> = {};
  NRT_SCALE.forEach(s => distribution[s.grade] = 0);

  let totalWeightedValue = 0;
  scores.forEach(score => {
    const gradeObj = getNRTGrade(score, mean, stdDev);
    distribution[gradeObj.grade]++;
    totalWeightedValue += gradeObj.value;
  });

  const pupilsCount = students.length || 1;
  const performancePercentage = (1 - (totalWeightedValue / (pupilsCount * 9))) * 100;
  const avgGradeValue = Math.round(totalWeightedValue / pupilsCount);
  const facilitatorGrade = NRT_SCALE.find(s => s.value === avgGradeValue)?.grade || "F9";

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
