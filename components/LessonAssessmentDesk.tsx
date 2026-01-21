
import React, { useState, useMemo } from 'react';
import { GlobalSettings, LessonPlanAssessment, StaffRecord } from '../types';
import { LESSON_PLAN_WEIGHTS, getSubjectsForDepartment } from '../constants';
import EditableField from './EditableField';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  department: string;
  activeClass: string;
  notify: any;
}

const LessonAssessmentDesk: React.FC<Props> = ({ settings, onSettingsChange, department, activeClass, notify }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wizard'>('dashboard');
  const [activeSection, setActiveSection] = useState('A');
  const [currentAssessment, setCurrentAssessment] = useState<Partial<LessonPlanAssessment>>({
    scores: {}, checklists: {}, 
    quantitative: { alignment: 0, strategy: 0, assessment: 0, time: 0, engagement: 0 },
    qualitative: { strengths: '', improvements: '', behaviors: '', patterns: '' },
    reflective: { evidence: false, feedbackUse: false, adjustmentWillingness: false },
    status: 'Draft',
    date: new Date().toISOString().split('T')[0],
    week: 1,
    duration: '',
    staffId: '',
    lessonDates: ['', '', '', '', ''],
    pagesCovered: '',
    referenceMaterialDetail: '',
    isPlanLate: false,
    schemeChecks: { yearly: false, termly: false, weekly: false }
  });

  const sections = ['A','B','C','D','E','F','G'];
  const teachers = useMemo(() => settings.staff.filter(s => s.category === 'Teaching'), [settings.staff]);
  const subjects = useMemo(() => getSubjectsForDepartment(department), [department]);

  const facilitatorFindings = useMemo(() => {
    const tid = currentAssessment.teacherId;
    const subj = currentAssessment.subject;
    if (!tid) return null;

    let totalDays = 0;
    let presentDays = 0;
    let lateDays = 0;
    Object.values(settings.staffAttendance || {}).forEach(dayLogs => {
      const log = dayLogs[tid];
      if (log) {
        totalDays++;
        if (log.status === 'Present') {
          presentDays++;
          if (log.timeIn > settings.punctualityThreshold) lateDays++;
        }
      }
    });
    const punctualityRate = presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 0;

    const exercises = (settings.exerciseEntries || []).filter(e => e.subject === subj);
    const avgBookQuality = exercises.length > 0 
      ? exercises.reduce((acc, e) => acc + (e.handwritingRating + e.clarityRating) / 2, 0) / exercises.length
      : 0;
    
    const complianceLogs = (settings.facilitatorComplianceLogs || []).filter(l => l.staffId === tid && l.subject === subj);
    const lastCompliance = complianceLogs[complianceLogs.length - 1];

    return {
      attendance: { rate: totalDays > 0 ? Math.round((presentDays/totalDays)*100) : 0, punctuality: punctualityRate },
      delivery: { totalTasks: exercises.length, qualityIndex: avgBookQuality.toFixed(1) },
      compliance: { lastStatus: lastCompliance?.presenceStatus || 'No Logs', timeIn: lastCompliance?.timeIn || '--:--' }
    };
  }, [currentAssessment.teacherId, currentAssessment.subject, settings]);

  const toggleCheck = (id: string) => {
    setCurrentAssessment(prev => ({
      ...prev,
      checklists: { ...(prev.checklists || {}), [id]: !prev.checklists?.[id] }
    }));
  };

  const setGroupScore = (groupId: string, val: number) => {
    setCurrentAssessment(prev => ({
      ...prev,
      scores: { ...(prev.scores || {}), [groupId]: val }
    }));
  };

  const calculateSectionScore = (section: string) => {
    const relevantScores = Object.keys(currentAssessment.scores || {}).filter(k => k.startsWith(section));
    if (relevantScores.length === 0) return 0;
    const totalPossible = relevantScores.length * 4;
    const totalEarned = relevantScores.reduce((acc, k) => acc + (currentAssessment.scores?.[k] || 0), 0);
    return Math.round((totalEarned / totalPossible) * 100);
  };

  const compositeScore = useMemo(() => {
    const b = calculateSectionScore('B');
    const c = calculateSectionScore('C');
    return Math.round((b * 0.4) + (c * 0.6));
  }, [currentAssessment]);

  const handleSave = () => {
    if (!currentAssessment.teacherId || !currentAssessment.subject) {
      notify("Select a teacher and subject area first.", "error");
      return;
    }

    const teacher = teachers.find(t => t.id === currentAssessment.teacherId);
    const finalized: LessonPlanAssessment = {
      ...currentAssessment as LessonPlanAssessment,
      id: crypto.randomUUID(),
      teacherName: teacher?.name || 'Unknown',
      status: 'Finalized',
      compositeScore
    };

    onSettingsChange({
      ...settings,
      lessonAssessments: [...(settings.lessonAssessments || []), finalized]
    });

    notify(`Assessment for ${finalized.teacherName} logged!`, "success");
    setActiveTab('dashboard');
  };

  const sectionBGroups = [
    { id: 'B1', title: 'B1. Objectives Alignment', items: ['Specific', 'Measurable', 'Achievable', 'Relevant', 'Time-bound', 'Linked to Curriculum'] },
    { id: 'B2', title: 'B2. Content Mastery', items: ['Accurate Facts', 'Scope Appropriate', 'Key Concepts Identified', 'Sequencing Logical'] },
    { id: 'B3', title: 'B3. Teaching Strategies (Plan)', items: ['Learner-Centered', 'Variety of Methods', 'Questioning Techniques Planned', 'Group Work Planned'] },
    { id: 'B4', title: 'B4. Lesson Structure (Plan)', items: ['Introduction/RPK', 'Main Activities', 'Plenary/Closure', 'Time Allocation'] },
    { id: 'B5', title: 'B5. TLM Preparation', items: ['Relevant Resources Listed', 'Creative use of local materials', 'Digital Integration'] },
    { id: 'B6', title: 'B6. Assessment (Plan)', items: ['Core Points', 'Evaluation Questions', 'Homework/Assignment'] },
    { id: 'B7', title: 'B7. Language & Clarity', items: ['Clear Instructions', 'Appropriate Vocabulary', 'Legible Handwriting/Typing'] },
    { id: 'B8', title: 'B8. Inclusivity (Plan)', items: ['Differentiation Strategy', 'Support for Special Needs', 'Gender Sensitivity'] },
    { id: 'B9', title: 'B9. Teacher Reflection', items: ['Section provided for reflection', 'Previous remarks addressed'] },
  ];

  const sectionCGroups = [
    { id: 'C1', title: 'C1. Preparation & Environment', items: ['Punctuality', 'Lesson Plan Available', 'TLMs Ready', 'Class Organization'] },
    { id: 'C2', title: 'C2. Lesson Delivery', items: ['Introduction Effective', 'Subject Mastery', 'Voice Projection', 'Teacher Confidence'] },
    { id: 'C3', title: 'C3. Class Management', items: ['Discipline Maintained', 'Time Management', 'Student Engagement', 'Safe Environment'] },
    { id: 'C4', title: 'C4. Methodology Application', items: ['Use of RPK', 'Student Participation', 'Effective Questioning', 'Critical Thinking Promoted'] },
    { id: 'C5', title: 'C5. Inclusivity (Observed)', items: ['Attention to all learners', 'Gender Balance in questions', 'Support for struggling learners'] },
    { id: 'C6', title: 'C6. Assessment (Observed)', items: ['Check for understanding', 'Feedback given', 'Student corrections managed'] },
    { id: 'C7', title: 'C7. Conclusion', items: ['Lesson summarized', 'Evaluation conducted', 'Home work assigned', 'Closing effective'] },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f3460] p-8 rounded-[2rem] text-white flex justify-between items-center shadow-xl no-print">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Lesson Assessment Desk</h2>
          <div className="flex gap-4 mt-2">
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'dashboard' ? 'bg-[#cca43b] text-[#0f3460]' : 'text-white/60 hover:text-white'}`}>Report Dashboard</button>
            <button onClick={() => { setActiveTab('wizard'); setActiveSection('A'); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition ${activeTab === 'wizard' ? 'bg-[#cca43b] text-[#0f3460]' : 'text-white/60 hover:text-white'}`}>New Assessment</button>
          </div>
        </div>
        {activeTab === 'wizard' && (
          <div className="flex bg-white/10 p-1.5 rounded-full gap-1">
             {sections.map(s => (
               <button key={s} onClick={() => setActiveSection(s)} className={`w-8 h-8 rounded-full text-[10px] font-black transition ${activeSection === s ? 'bg-[#cca43b] text-[#0f3460] scale-110 shadow-lg' : 'text-white/40 hover:text-white'}`}>{s}</button>
             ))}
          </div>
        )}
      </div>

      {activeTab === 'dashboard' ? (
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 space-y-8 animate-fadeIn">
           <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black text-[#0f3460] uppercase">Supervisory Audit Trail</h3>
              <div className="flex gap-4 text-[10px] font-black uppercase">
                 <span className="text-[#cca43b]">Evaluations: {settings.lessonAssessments?.length || 0}</span>
              </div>
           </div>

           <div className="overflow-x-auto rounded-[2rem] border border-gray-100">
              <table className="w-full text-left text-[11px] border-collapse">
                 <thead className="bg-[#f4f6f7] text-[#0f3460] font-black uppercase">
                    <tr>
                       <th className="p-6">Teacher / Date</th>
                       <th className="p-6">Subject Area</th>
                       <th className="p-6 text-center">Score</th>
                       <th className="p-6 text-center">Outcome</th>
                       <th className="p-6 text-center">Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {(settings.lessonAssessments || []).slice().reverse().map(log => (
                      <tr key={log.id} className="border-b hover:bg-gray-50 transition">
                         <td className="p-6">
                            <p className="font-black text-[#0f3460] uppercase">{log.teacherName}</p>
                            <p className="text-[9px] font-bold text-gray-400 mt-1">{log.date} • Week {log.week}</p>
                         </td>
                         <td className="p-6 font-bold text-gray-500 uppercase">{log.subject}</td>
                         <td className="p-6 text-center">
                            <span className="font-black text-lg text-[#0f3460]">{log.compositeScore}%</span>
                         </td>
                         <td className="p-6 text-center">
                            <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase ${log.compositeScore! >= 70 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                               {log.overallEvaluation?.includes('meets') ? 'PASS' : 'REVIEW REQ.'}
                            </span>
                         </td>
                         <td className="p-6 text-center">
                            <button onClick={() => notify("Viewing detailed archive...", "info")} className="text-blue-500 font-black uppercase hover:underline">Breakdown</button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 min-h-[600px] animate-fadeIn relative">
          {activeSection === 'A' && (
            <div className="space-y-10">
               <div className="border-b pb-6">
                  <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">SECTION A: TEACHER & LESSON INFORMATION</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-gray-400 px-2">Teacher Name</label>
                     <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460] text-xs outline-none focus:ring-2 focus:ring-[#cca43b]" value={currentAssessment.teacherId} onChange={e => {
                        const t = teachers.find(x => x.id === e.target.value);
                        setCurrentAssessment({...currentAssessment, teacherId: e.target.value, staffId: t?.idNumber});
                     }}>
                        <option value="">-- Choose Teaching Staff --</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-gray-400 px-2">Subject</label>
                     <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460] text-xs outline-none focus:ring-2 focus:ring-[#cca43b]" value={currentAssessment.subject} onChange={e => setCurrentAssessment({...currentAssessment, subject: e.target.value})}>
                        <option value="">-- Select Subject Area --</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                     <label className="text-[9px] font-black uppercase text-gray-400 px-2">Lesson Topic</label>
                     <input placeholder="Enter topic area..." className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm shadow-inner" value={currentAssessment.topic} onChange={e => setCurrentAssessment({...currentAssessment, topic: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-gray-400 px-2">Duration</label>
                     <input placeholder="e.g. 60 mins" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460]" value={currentAssessment.duration} onChange={e => setCurrentAssessment({...currentAssessment, duration: e.target.value})} />
                  </div>
               </div>
               <div className="flex justify-end pt-10 border-t">
                  <button onClick={() => setActiveSection('B')} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Next Section →</button>
               </div>
            </div>
          )}

          {activeSection === 'B' && (
            <div className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {sectionBGroups.map(group => (
                    <AssessmentGroup key={group.id} group={group} assessment={currentAssessment} onToggleCheck={toggleCheck} onSetScore={setGroupScore} />
                  ))}
               </div>
               <div className="flex justify-between pt-10 border-t">
                  <button onClick={() => setActiveSection('A')} className="text-gray-400 font-black uppercase text-[10px]">← Back</button>
                  <button onClick={() => setActiveSection('C')} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Next Section →</button>
               </div>
            </div>
          )}

          {activeSection === 'C' && (
            <div className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {sectionCGroups.map(group => (
                    <AssessmentGroup key={group.id} group={group} assessment={currentAssessment} onToggleCheck={toggleCheck} onSetScore={setGroupScore} />
                  ))}
               </div>
               <div className="flex justify-between pt-10 border-t">
                  <button onClick={() => setActiveSection('B')} className="text-gray-400 font-black uppercase text-[10px]">← Back</button>
                  <button onClick={() => setActiveSection('G')} className="bg-[#2e8b57] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Finalize Assessment →</button>
               </div>
            </div>
          )}

          {activeSection === 'G' && (
            <div className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-gray-50 p-10 rounded-[3rem] space-y-6">
                     <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Overall Evaluation</h4>
                     <div className="space-y-3">
                        {[
                          'Lesson meets professional standards',
                          'Lesson requires improvement',
                          'Re-teaching recommended',
                          'Follow-up observation required'
                        ].map(opt => (
                          <label key={opt} className={`p-5 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition ${currentAssessment.overallEvaluation === opt ? 'bg-[#0f3460] text-white border-[#0f3460] shadow-lg' : 'bg-white border-gray-100 hover:border-[#cca43b]'}`}>
                             <input type="radio" name="evaluation" className="w-5 h-5 accent-[#cca43b]" checked={currentAssessment.overallEvaluation === opt} onChange={() => setCurrentAssessment({...currentAssessment, overallEvaluation: opt})} />
                             <span className="text-[10px] font-black uppercase">{opt}</span>
                          </label>
                        ))}
                     </div>
                  </div>
                  <div className="flex flex-col justify-center items-center text-center p-10 border-4 border-dashed border-gray-100 rounded-[3.5rem]">
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Composite Score</p>
                     <span className={`text-8xl font-black ${compositeScore >= 70 ? 'text-[#2e8b57]' : 'text-red-500'}`}>{compositeScore}%</span>
                  </div>
               </div>
               <div className="flex justify-end pt-10 border-t gap-4">
                  <button onClick={handleSave} className="bg-[#2e8b57] text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Authorize & Log</button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AssessmentGroup = ({ group, assessment, onToggleCheck, onSetScore }: any) => (
  <div className="space-y-4 bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 flex flex-col h-full">
    <div className="flex justify-between items-start border-b border-[#cca43b]/20 pb-3 mb-2">
       <h4 className="text-[11px] font-black text-[#0f3460] uppercase leading-tight pr-4">{group.title}</h4>
       <select 
          className="mt-1 bg-white border-none rounded-lg text-xs font-black text-blue-600 shadow-sm px-2 py-1"
          value={assessment.scores?.[group.id] || 0}
          onChange={(e) => onSetScore(group.id, parseInt(e.target.value))}
       >
          {[0, 1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
       </select>
    </div>
    <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
       {group.items.map((item: string) => (
         <label key={item} className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${assessment.checklists?.[item] ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-50 hover:bg-yellow-50'}`}>
            <span className={`text-[9px] font-bold uppercase ${assessment.checklists?.[item] ? 'text-blue-900' : 'text-gray-400'}`}>{item}</span>
            <input type="checkbox" className="w-4 h-4 accent-[#0f3460]" checked={!!assessment.checklists?.[item]} onChange={() => onToggleCheck(item)} />
         </label>
       ))}
    </div>
  </div>
);

export default LessonAssessmentDesk;
