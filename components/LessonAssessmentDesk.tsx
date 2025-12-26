
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

  // Cross-Module Intelligence Extraction Logic
  const facilitatorFindings = useMemo(() => {
    const tid = currentAssessment.teacherId;
    const subj = currentAssessment.subject;
    if (!tid) return null;

    // 1. Attendance Findings
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

    // 2. Assessment (Exercise) Findings
    const exercises = (settings.exerciseEntries || []).filter(e => e.subject === subj);
    const avgBookQuality = exercises.length > 0 
      ? exercises.reduce((acc, e) => acc + (e.handwritingRating + e.clarityRating) / 2, 0) / exercises.length
      : 0;
    
    // 3. Compliance Findings
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

  const handleSharePDF = () => {
    notify("Preparing detailed assessment audit ledger for export...", "info");
    window.print();
  };

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
    setCurrentAssessment({ 
      scores: {}, checklists: {}, status: 'Draft', 
      date: new Date().toISOString().split('T')[0], week: 1,
      lessonDates: ['', '', '', '', ''],
      schemeChecks: { yearly: false, termly: false, weekly: false }
    });
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
      {/* Branding Header */}
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 no-print">
        <EditableField value={settings.schoolName} onSave={v => onSettingsChange({...settings, schoolName: v})} className="text-5xl font-black text-[#0f3460] uppercase tracking-tighter" />
        <EditableField value={settings.motto} onSave={v => onSettingsChange({...settings, motto: v})} className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cca43b]" />
      </div>

      <div className="bg-[#0f3460] p-8 rounded-[3rem] text-white flex justify-between items-center shadow-xl no-print">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Lesson Assessment Desk</h2>
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
              <h3 className="text-2xl font-black text-[#0f3460] uppercase">Supervisory Audit Trail</h3>
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
                            <button onClick={() => notify("Viewing detailed archive...", "info")} className="text-blue-500 font-black uppercase hover:underline">View Breakdown</button>
                         </td>
                      </tr>
                    ))}
                    {(!settings.lessonAssessments || settings.lessonAssessments.length === 0) && (
                      <tr><td colSpan={5} className="p-20 text-center text-gray-300 font-black uppercase italic tracking-widest">No formal assessments on record for this cycle.</td></tr>
                    )}
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
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Written Plan Marking & Live Observation Tool</p>
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
                     <label className="text-[9px] font-black uppercase text-gray-400 px-2">Staff ID</label>
                     <input readOnly className="w-full p-4 bg-gray-100 rounded-2xl border-none font-black text-[#0f3460] text-xs" value={currentAssessment.staffId || ''} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-gray-400 px-2">Class/Subject</label>
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
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-gray-400 px-2">Strand</label>
                     <input placeholder="Enter Strand..." className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460]" value={currentAssessment.strand} onChange={e => setCurrentAssessment({...currentAssessment, strand: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-gray-400 px-2">Sub-Strand</label>
                     <input placeholder="Enter Sub-Strand..." className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460]" value={currentAssessment.subStrand} onChange={e => setCurrentAssessment({...currentAssessment, subStrand: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-gray-400 px-2">Week Index</label>
                     <input type="number" min="1" max="16" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-[#0f3460]" value={currentAssessment.week} onChange={e => setCurrentAssessment({...currentAssessment, week: parseInt(e.target.value)})} />
                  </div>
               </div>

               {/* New Lesson Dates Grid */}
               <div className="space-y-4 pt-6 border-t border-gray-100">
                  <h4 className="text-xs font-black uppercase text-[#cca43b] tracking-widest">Planned Lesson Execution Cycle</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                     {[1, 2, 3, 4, 5].map((num, i) => (
                        <div key={num} className="space-y-1">
                           <label className="text-[8px] font-black uppercase text-gray-400 px-1">Lesson {num} Date</label>
                           <input 
                              type="date" 
                              className="w-full p-3 bg-gray-50 rounded-xl border-none text-[10px] font-bold"
                              value={currentAssessment.lessonDates?.[i] || ''}
                              onChange={e => {
                                 const dates = [...(currentAssessment.lessonDates || ['', '', '', '', ''])];
                                 dates[i] = e.target.value;
                                 setCurrentAssessment({...currentAssessment, lessonDates: dates});
                              }}
                           />
                        </div>
                     ))}
                  </div>
               </div>

               {/* Reference Materials & Pages */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-gray-400 px-2">Reference Materials Detail</label>
                     <textarea 
                        placeholder="List of textbooks, guides, or digital resources used..." 
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-xs h-24 resize-none"
                        value={currentAssessment.referenceMaterialDetail}
                        onChange={e => setCurrentAssessment({...currentAssessment, referenceMaterialDetail: e.target.value})}
                     />
                  </div>
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-gray-400 px-2">Pages Covered</label>
                        <input 
                           placeholder="e.g. pp. 12 - 25" 
                           className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-xs"
                           value={currentAssessment.pagesCovered}
                           onChange={e => setCurrentAssessment({...currentAssessment, pagesCovered: e.target.value})}
                        />
                     </div>
                     <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <label className="text-[9px] font-black uppercase text-[#0f3460]">Submission Status</label>
                        <div className="flex gap-2">
                           <button 
                              onClick={() => setCurrentAssessment({...currentAssessment, isPlanLate: false})}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition ${!currentAssessment.isPlanLate ? 'bg-green-600 text-white' : 'bg-white text-gray-300'}`}
                           >On-Time</button>
                           <button 
                              onClick={() => setCurrentAssessment({...currentAssessment, isPlanLate: true})}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition ${currentAssessment.isPlanLate ? 'bg-red-600 text-white' : 'bg-white text-gray-300'}`}
                           >Late Submission</button>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Scheme of Learning Checks */}
               <div className="space-y-4 pt-6 border-t border-gray-100">
                  <h4 className="text-xs font-black uppercase text-[#0f3460] tracking-widest">Scheme of Learning Alignment Check</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {['yearly', 'termly', 'weekly'].map((type) => (
                        <label key={type} className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition ${currentAssessment.schemeChecks?.[type as keyof typeof currentAssessment.schemeChecks] ? 'border-[#cca43b] bg-yellow-50/30' : 'border-gray-50 bg-gray-50'}`}>
                           <span className="text-[10px] font-black uppercase text-gray-600">{type} Scheme Alignment</span>
                           <input 
                              type="checkbox" 
                              className="w-5 h-5 accent-[#0f3460]"
                              checked={currentAssessment.schemeChecks?.[type as keyof typeof currentAssessment.schemeChecks] || false}
                              onChange={e => setCurrentAssessment({
                                 ...currentAssessment, 
                                 schemeChecks: { ...(currentAssessment.schemeChecks || { yearly: false, termly: false, weekly: false }), [type]: e.target.checked }
                              })}
                           />
                        </label>
                     ))}
                  </div>
               </div>

               <div className="flex justify-end pt-10 border-t">
                  <button onClick={() => setActiveSection('B')} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Next: Written Plan Marking →</button>
               </div>
            </div>
          )}

          {activeSection === 'B' && (
            <div className="space-y-12">
               <div className="border-b pb-6 flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">SECTION B: WRITTEN LESSON PLAN ASSESSMENT</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Plan Marking (Sec A-B)</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-gray-400 uppercase">Compliance Index</p>
                     <p className="text-4xl font-black text-[#2e8b57]">{calculateSectionScore('B')}%</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {sectionBGroups.map(group => (
                    <AssessmentGroup 
                      key={group.id} 
                      group={group} 
                      assessment={currentAssessment} 
                      onToggleCheck={toggleCheck} 
                      onSetScore={setGroupScore} 
                    />
                  ))}
               </div>

               <div className="flex justify-between pt-10 border-t">
                  <button onClick={() => setActiveSection('A')} className="text-gray-400 font-black uppercase text-[10px]">← Back to Metadata</button>
                  <button onClick={() => setActiveSection('C')} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Next: Live Observation →</button>
               </div>
            </div>
          )}

          {activeSection === 'C' && (
            <div className="space-y-12">
               <div className="border-b pb-6 flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">SECTION C: LESSON OBSERVATION (LIVE TEACHING)</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Classroom Delivery Audit</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-gray-400 uppercase">Observation Score</p>
                     <p className="text-4xl font-black text-[#2e8b57]">{calculateSectionScore('C')}%</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {sectionCGroups.map(group => (
                    <AssessmentGroup 
                      key={group.id} 
                      group={group} 
                      assessment={currentAssessment} 
                      onToggleCheck={toggleCheck} 
                      onSetScore={setGroupScore} 
                    />
                  ))}
               </div>

               <div className="flex justify-between pt-10 border-t">
                  <button onClick={() => setActiveSection('B')} className="text-gray-400 font-black uppercase text-[10px]">← Back to Written Plan</button>
                  <button onClick={() => setActiveSection('D')} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Next: Compliance Analysis →</button>
               </div>
            </div>
          )}

          {activeSection === 'D' && (
            <div className="space-y-10">
               <div className="border-b pb-6">
                  <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">SECTION D: INSTITUTIONAL COMPLIANCE RATIOS</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Weighted assessment across institutional standards</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <h4 className="text-xs font-black uppercase text-[#cca43b] tracking-widest">Master Calibration</h4>
                     <div className="space-y-4">
                        <ComplianceRow label="Plan Alignment (Sec B)" value={calculateSectionScore('B')} weight={40} />
                        <ComplianceRow label="Observation Delivery (Sec C)" value={calculateSectionScore('C')} weight={60} />
                     </div>
                  </div>
                  <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Composite Quality Indicator</p>
                     <span className={`text-8xl font-black ${compositeScore >= 70 ? 'text-[#2e8b57]' : 'text-red-500'}`}>{compositeScore}%</span>
                     <p className="text-[10px] font-bold text-[#cca43b] italic uppercase">Official Quality Assurance Metric</p>
                  </div>
               </div>
               <div className="flex justify-between pt-10 border-t">
                  <button onClick={() => setActiveSection('C')} className="text-gray-400 font-black uppercase text-[10px]">← Back</button>
                  <button onClick={() => setActiveSection('E')} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Next: Analytical Findings →</button>
               </div>
            </div>
          )}

          {activeSection === 'E' && (
            <div className="space-y-10">
               <div className="border-b pb-6">
                  <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">SECTION E: CROSS-MODULE ANALYTICAL FINDINGS</h3>
                  <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Institutional Intelligence Integration Frame</p>
               </div>

               {/* Integrated Intelligence Frame */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-lg space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-2xl">📅</span>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${facilitatorFindings?.attendance.rate! >= 90 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>Attendance Fidelity</span>
                     </div>
                     <div>
                        <p className="text-3xl font-black text-[#0f3460]">{facilitatorFindings?.attendance.rate}%</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Presence Rate in Cycle</p>
                     </div>
                     <div className="pt-2 border-t border-gray-50">
                        <p className="text-[10px] font-black text-[#cca43b]">Punctuality: {facilitatorFindings?.attendance.punctuality}%</p>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-lg space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-2xl">📝</span>
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[8px] font-black uppercase">Academic Delivery</span>
                     </div>
                     <div>
                        <p className="text-3xl font-black text-[#0f3460]">{facilitatorFindings?.delivery.totalTasks}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Exercises Logged to date</p>
                     </div>
                     <div className="pt-2 border-t border-gray-50">
                        <p className="text-[10px] font-black text-[#cca43b]">Book Quality: {facilitatorFindings?.delivery.qualityIndex}/10</p>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-lg space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-2xl">⚖️</span>
                        <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-[8px] font-black uppercase">System Compliance</span>
                     </div>
                     <div>
                        <p className="text-xl font-black text-[#0f3460] uppercase truncate">{facilitatorFindings?.compliance.lastStatus}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Last Compliance Status</p>
                     </div>
                     <div className="pt-2 border-t border-gray-50">
                        <p className="text-[10px] font-black text-[#cca43b]">Last Entry: {facilitatorFindings?.compliance.timeIn}</p>
                     </div>
                  </div>
               </div>

               {/* Manual Professional Rubric (Frame E) */}
               <div className="space-y-6 bg-gray-50 p-10 rounded-[3rem] border border-gray-100 mt-10">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Supervisor Observation Rubric</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'E1', label: 'Instructional Alignment', desc: 'Sync between objectives and assessment' },
                      { id: 'E2', label: 'Lesson Pacing', desc: 'Effective time management and transitions' },
                      { id: 'E3', label: 'Learner Participation', desc: 'Depth of active cognitive involvement' },
                      { id: 'E4', label: 'Inclusive Support', desc: 'Evidence of support for diverse learners' }
                    ].map(rubric => (
                      <div key={rubric.id} className="p-6 bg-white rounded-[2rem] border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                         <div>
                            <p className="font-black text-[#0f3460] uppercase text-xs">{rubric.label}</p>
                            <p className="text-[9px] font-bold text-gray-400 mt-1 italic">{rubric.desc}</p>
                         </div>
                         <div className="flex gap-2">
                            {[1, 2, 3, 4].map(v => (
                              <button key={v} onClick={() => setGroupScore(rubric.id, v)} className={`w-12 h-12 rounded-xl font-black transition-all ${currentAssessment.scores?.[rubric.id] === v ? 'bg-[#0f3460] text-white shadow-xl scale-110' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}`}>{v}</button>
                            ))}
                         </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="flex justify-between pt-10 border-t">
                  <button onClick={() => setActiveSection('D')} className="text-gray-400 font-black uppercase text-[10px]">← Back</button>
                  <button onClick={() => setActiveSection('F')} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Next: Qualitative Evidence →</button>
               </div>
            </div>
          )}

          {activeSection === 'F' && (
             <div className="space-y-10">
                <div className="border-b pb-6">
                  <h3 className="text-2xl font-black text-[#0f3460] uppercase tracking-tighter">SECTION F: NARRATIVES & SUPERVISOR COMMENTS</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Detailed qualitative evidence for developmental support</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <label className="text-[9px] font-black uppercase text-[#2e8b57] px-2">Institutional Strengths</label>
                      <textarea className="w-full h-40 p-6 bg-gray-50 rounded-[2rem] border-none italic text-xs leading-relaxed outline-none focus:ring-2 focus:ring-[#2e8b57]" placeholder="Log teacher strengths here..." value={currentAssessment.qualitative?.strengths} onChange={e => setCurrentAssessment({...currentAssessment, qualitative: {...currentAssessment.qualitative!, strengths: e.target.value}})} />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[9px] font-black uppercase text-red-400 px-2">Identified Areas for Improvement</label>
                      <textarea className="w-full h-40 p-6 bg-gray-50 rounded-[2rem] border-none italic text-xs leading-relaxed outline-none focus:ring-2 focus:ring-red-400" placeholder="Log prioritized improvements here..." value={currentAssessment.qualitative?.improvements} onChange={e => setCurrentAssessment({...currentAssessment, qualitative: {...currentAssessment.qualitative!, improvements: e.target.value}})} />
                   </div>
                </div>
                <div className="flex justify-between pt-10 border-t">
                  <button onClick={() => setActiveSection('E')} className="text-gray-400 font-black uppercase text-[10px]">← Back</button>
                  <button onClick={() => setActiveSection('G')} className="bg-[#0f3460] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Next: Final Authorization →</button>
               </div>
             </div>
          )}

          {activeSection === 'G' && (
            <div className="space-y-12">
               <div className="border-b pb-6 text-center">
                  <h3 className="text-3xl font-black text-[#0f3460] uppercase tracking-tighter">SECTION G: OVERALL EVALUATION & RECOMMENDATIONS</h3>
                  <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Authorization of professional standards</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-gray-50 p-10 rounded-[3rem] space-y-6">
                     <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Institutional Decision</h4>
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

                  <div className="flex flex-col justify-between p-10 border-4 border-dashed border-gray-100 rounded-[3.5rem] items-center text-center">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Quality Audit Score</p>
                        <span className={`text-7xl font-black ${compositeScore >= 70 ? 'text-[#2e8b57]' : 'text-red-500'}`}>{compositeScore}%</span>
                     </div>
                     <div className="w-full pt-10 border-t border-gray-100 mt-10">
                        <p className="italic font-serif text-3xl text-[#0f3460]">{settings.headteacherName}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mt-2 border-t pt-1">HEADTEACHER AUTHORIZATION</p>
                     </div>
                  </div>
               </div>

               <div className="flex justify-between items-center pt-10 border-t">
                  <button onClick={() => setActiveSection('F')} className="text-gray-400 font-black uppercase text-[10px]">← Back</button>
                  <div className="flex gap-4">
                     <button onClick={handleSharePDF} className="bg-gray-100 text-gray-500 px-8 py-4 rounded-2xl font-black uppercase text-xs transition">Export Detailed View</button>
                     <button onClick={handleSave} className="bg-[#2e8b57] text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Finalize & Log Record</button>
                  </div>
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
       <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-gray-400 uppercase">Score (0-4)</span>
          <select 
            className="mt-1 bg-white border-none rounded-lg text-xs font-black text-blue-600 shadow-sm px-2 py-1 outline-none focus:ring-1 focus:ring-blue-600"
            value={assessment.scores?.[group.id] || 0}
            onChange={(e) => onSetScore(group.id, parseInt(e.target.value))}
          >
             {[0, 1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
       </div>
    </div>
    <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
       {group.items.map((item: string) => (
         <label key={item} className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${assessment.checklists?.[item] ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-50 hover:bg-yellow-50'}`}>
            <span className={`text-[10px] font-bold uppercase leading-tight ${assessment.checklists?.[item] ? 'text-blue-900' : 'text-gray-400'}`}>{item}</span>
            <input type="checkbox" className="w-4 h-4 accent-[#0f3460]" checked={!!assessment.checklists?.[item]} onChange={() => onToggleCheck(item)} />
         </label>
       ))}
    </div>
  </div>
);

const ComplianceRow = ({ label, value, weight }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 px-1">
      <span>{label} ({weight}%)</span>
      <span>{value}%</span>
    </div>
    <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner flex">
      <div className="h-full bg-[#0f3460]" style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export default LessonAssessmentDesk;
