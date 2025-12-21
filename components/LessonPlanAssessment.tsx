
import React, { useState } from 'react';
import { GlobalSettings, LessonPlanAssessment } from '../types';
import { LESSON_PLAN_WEIGHTS } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  department: string;
  activeClass: string;
  notify: any;
}

const LessonPlanAssessmentComp: React.FC<Props> = ({ settings, onSettingsChange, department, activeClass, notify }) => {
  const [activeSection, setActiveSection] = useState('A');
  const [assessment, setAssessment] = useState<Partial<LessonPlanAssessment>>({
    scores: {}, checklists: {}, quantitative: { alignment: 0, strategy: 0, assessment: 0, time: 0, engagement: 0 },
    qualitative: { strengths: '', improvements: '', behaviors: '', patterns: '' },
    reflective: { evidence: false, feedbackUse: false, adjustmentWillingness: false },
    status: 'Draft'
  });

  const sections = ['A','B','C','D','E','F','G'];

  const toggleCheck = (id: string) => {
    setAssessment(prev => ({
      ...prev,
      checklists: { ...(prev.checklists || {}), [id]: !prev.checklists?.[id] }
    }));
  };

  const setScore = (id: string, val: number) => {
    setAssessment(prev => ({
      ...prev,
      scores: { ...(prev.scores || {}), [id]: val }
    }));
  };

  const handleSharePDF = () => {
    alert("Generating Comprehensive Lesson Assessment PDF (Sections A-G)...");
  };

  const calculateSectionScore = (section: string) => {
    // Basic scoring logic: ratio of checked items
    const relevantItems = assessment.checklists ? Object.keys(assessment.checklists).filter(k => k.startsWith(section)) : [];
    if (relevantItems.length === 0) return 0;
    const checked = relevantItems.filter(k => assessment.checklists?.[k]).length;
    return Math.round((checked / relevantItems.length) * 100);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white flex justify-between items-center shadow-2xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">Comprehensive Lesson Assessment</h2>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {sections.map(s => (
              <button 
                key={s} 
                onClick={() => setActiveSection(s)} 
                className={`min-w-[40px] h-10 rounded-full font-black text-xs transition border-2 ${activeSection === s ? 'bg-[#cca43b] text-[#0f3460] border-[#cca43b]' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleSharePDF} className="bg-[#2e8b57] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 transition">Share Assessment PDF</button>
      </div>

      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 min-h-[600px] overflow-y-auto">
        {activeSection === 'A' && (
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4">Section A: Teacher & Lesson Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <input placeholder="Teacher Name" className="p-4 bg-gray-50 rounded-2xl outline-none" value={assessment.teacherId} onChange={e => setAssessment({...assessment, teacherId: e.target.value})} />
              <input placeholder="Subject / Learning Area" className="p-4 bg-gray-50 rounded-2xl outline-none" value={assessment.subject} onChange={e => setAssessment({...assessment, subject: e.target.value})} />
              <input placeholder="Topic" className="p-4 bg-gray-50 rounded-2xl outline-none" value={assessment.topic} onChange={e => setAssessment({...assessment, topic: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                 <input type="date" className="p-4 bg-gray-50 rounded-2xl outline-none" value={assessment.date} onChange={e => setAssessment({...assessment, date: e.target.value})} />
                 <input type="number" placeholder="Week (1-16)" className="p-4 bg-gray-50 rounded-2xl" value={assessment.week} onChange={e => setAssessment({...assessment, week: parseInt(e.target.value)})} />
              </div>
              <input placeholder="Strand(s)" className="p-4 bg-gray-50 rounded-2xl outline-none" value={assessment.strand} onChange={e => setAssessment({...assessment, strand: e.target.value})} />
              <input placeholder="Sub-Strand(s)" className="p-4 bg-gray-50 rounded-2xl outline-none" value={assessment.subStrand} onChange={e => setAssessment({...assessment, subStrand: e.target.value})} />
              <select className="p-4 bg-gray-50 rounded-2xl font-bold" value={assessment.schemeOfWorkStatus} onChange={e => setAssessment({...assessment, schemeOfWorkStatus: e.target.value as any})}>
                 <option value="Complete">Scheme of Learning: Complete</option>
                 <option value="Incomplete">Scheme of Learning: Incomplete</option>
              </select>
              <input type="number" placeholder="Reference Materials (Count)" className="p-4 bg-gray-50 rounded-2xl" value={assessment.referenceMaterialsCount} onChange={e => setAssessment({...assessment, referenceMaterialsCount: parseInt(e.target.value)})} />
            </div>
          </div>
        )}

        {activeSection === 'B' && (
           <div className="space-y-12">
              <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4 flex justify-between items-center">
                 <span>Section B: Written Lesson Plan Assessment</span>
                 <span className="text-xs font-black text-[#2e8b57] bg-green-50 px-4 py-1.5 rounded-full">Score: {calculateSectionScore('B')}%</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <ChecklistGroup title="B1. Objectives & Outcomes" items={['B1_Clear', 'B1_SMART', 'B1_LearnerCentred', 'B1_Aligned', 'B1_CognitiveAppropriate', 'B1_Measurable']} labels={['Clearly stated', 'SMART', 'Learner-centred', 'Align with curriculum', 'Appropriate cognitive level', 'Measurable and observable']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="B2. Content & Subject Knowledge" items={['B2_Accurate', 'B2_Relevant', 'B2_Sequenced', 'B2_ExampleAppropriate', 'B2_PriorKnowledge', 'B2_RealLife']} labels={['Content accurate', 'Relevant to syllabus', 'Logically sequenced', 'Appropriate examples', 'Connects to prior knowledge', 'Real-life relevance']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="B3. Teaching Strategies" items={['B3_Match', 'B3_MultiSensory', 'B3_Active', 'B3_Inquiry', 'B3_IndividualGroup']} labels={['Strategies match objectives', 'Visual/Auditory/Kinesthetic support', 'Promote active participation', 'Includes inquiry/problem-solving', 'Individual/Cooperative balance']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="B5. TLMs & Resources" items={['B5_Relevant', 'B5_Support', 'B5_MultiSensory', 'B5_Prepared', 'B5_Tech']} labels={['Materials relevant', 'Support objectives', 'Promote multi-sensory learning', 'Available and well-prepared', 'Appropriate tech use']} assessment={assessment} onToggle={toggleCheck} />
              </div>
           </div>
        )}

        {activeSection === 'C' && (
           <div className="space-y-12">
              <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4 flex justify-between items-center">
                 <span>Section C: Lesson Observation Checklist (Live)</span>
                 <span className="text-xs font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">Observed Score: {calculateSectionScore('C')}%</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <ChecklistGroup title="C1. Teacher Preparation" items={['C1_Time', 'C1_Prepared', 'C1_Dress', 'C1_Plan', 'C1_TLMs']} labels={['Arrived on time', 'Well-prepared', 'Appropriate dressing', 'Lesson plan available', 'TLMs ready']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="C3. Content Delivery" items={['C3_Knowledge', 'C3_Explanation', 'C3_Audible', 'C3_Language', 'C3_Board', 'C3_Examples']} labels={['Subject knowledge evident', 'Explanations clear', 'Voice audible', 'Language correct', 'Board work neat', 'Effective examples']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="C4. Participation & Strategies" items={['C4_Active', 'C4_Think', 'C4_WaitTime', 'C4_Collaborate', 'C4_Move', 'C4_Styles']} labels={['Learners active', 'Questions encourage thinking', 'Wait time provided', 'Effective collaboration', 'Teacher moves around', 'Strategies match styles']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="C5. Classroom Management" items={['C5_Rules', 'C5_Focus', 'C5_Behavior', 'C5_NoSarcasm', 'C5_Authority']} labels={['Rules enforced respectfully', 'Learners focused', 'Positive behavior reinforced', 'No sarcasm/humiliation', 'Maintains authority']} assessment={assessment} onToggle={toggleCheck} />
              </div>
           </div>
        )}

        {activeSection === 'D' && (
           <div className="space-y-10">
              <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4">Section D: Compliance Standards & Ratios</h3>
              <div className="grid grid-cols-1 gap-6 max-w-3xl">
                 {Object.entries(LESSON_PLAN_WEIGHTS).map(([k, v]) => (
                   <div key={k} className="flex items-center gap-6">
                      <span className="w-48 font-black text-[10px] uppercase text-gray-400">{k}</span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                         <div className="h-full bg-[#cca43b]" style={{ width: `${v}%` }}></div>
                      </div>
                      <span className="font-black text-[#0f3460] text-sm w-12 text-right">{v}%</span>
                   </div>
                 ))}
                 <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-10 rounded-[2.5rem]">
                    <div className="space-y-1">
                       <span className="text-xs font-black text-gray-400 uppercase">Calculated Compliance</span>
                       <p className="text-sm font-bold italic text-gray-500">Based on Section B & C averages</p>
                    </div>
                    <span className="text-6xl font-black text-[#2e8b57]">{Math.round((calculateSectionScore('B') + calculateSectionScore('C')) / 2)}%</span>
                 </div>
              </div>
           </div>
        )}

        {activeSection === 'E' && (
           <div className="space-y-10">
              <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4">Section E: Observation Scoring Rubric</h3>
              <div className="grid grid-cols-1 gap-6">
                 {[
                   'Objective Alignment Score', 'Teaching Strategy Effectiveness', 
                   'Assessment Quality', 'Time Management', 'Learner Engagement Efficiency',
                   'Quality of Reflection / Closing'
                 ].map(item => (
                   <div key={item} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                      <div className="space-y-1">
                         <span className="font-black text-[#0f3460] uppercase text-xs">{item}</span>
                         <p className="text-[9px] font-black text-gray-400 uppercase italic">{['Not Observed', 'Needs Improvement', 'Fair', 'Good', 'Excellent'][assessment.scores?.[item] || 0]}</p>
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3, 4].map(val => (
                          <button 
                            key={val} 
                            onClick={() => setScore(item, val)}
                            className={`w-12 h-12 rounded-xl font-black text-xs transition ${assessment.scores?.[item] === val ? 'bg-[#0f3460] text-white shadow-xl scale-110' : 'bg-white text-gray-300 border border-gray-100 hover:border-[#cca43b]'}`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeSection === 'F' && (
           <div className="space-y-12">
              <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4">Section F: Supervisor Analysis Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <h4 className="text-xs font-black text-[#cca43b] uppercase tracking-widest">Qualitative Evidence</h4>
                    <div className="space-y-4">
                       <textarea placeholder="Strengths observed during lesson..." className="w-full h-32 p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#cca43b]" value={assessment.qualitative?.strengths} onChange={e => setAssessment({...assessment, qualitative: {...assessment.qualitative!, strengths: e.target.value}})}></textarea>
                       <textarea placeholder="Areas for immediate improvement..." className="w-full h-32 p-4 bg-gray-50 rounded-2xl outline-none" value={assessment.qualitative?.improvements}></textarea>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <h4 className="text-xs font-black text-[#cca43b] uppercase tracking-widest">Reflective Performance</h4>
                    <div className="space-y-3">
                       {/* Fixed line 134: Added type (r: string) to reflective practice items mapping */}
                       {['Evidence of reflective practice', 'Constructive use of previous feedback', 'Willingness to adjust teaching'].map((r: string) => (
                         <label key={r} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer">
                            <span className="text-[10px] font-black uppercase text-gray-600">{r}</span>
                            <input type="checkbox" className="w-5 h-5 accent-[#0f3460]" />
                         </label>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeSection === 'G' && (
          <div className="space-y-10">
            <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4">Section G: Overall Evaluation & Signature</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {[
                 'Lesson meets professional standards', 
                 'Lesson requires improvement', 
                 'Re-teaching recommended', 
                 'Follow-up observation required'
               ].map(opt => (
                 <label key={opt} className={`p-8 rounded-[2rem] border-2 flex items-center gap-6 cursor-pointer transition ${assessment.overallEvaluation === opt ? 'bg-[#0f3460] text-white border-[#0f3460] shadow-xl' : 'bg-gray-50 border-gray-100 hover:border-[#cca43b]'}`}>
                    <input type="radio" name="overall" className="w-6 h-6 accent-[#cca43b]" checked={assessment.overallEvaluation === opt} onChange={() => setAssessment({...assessment, overallEvaluation: opt as any})} />
                    <span className="font-black uppercase text-xs tracking-wider">{opt}</span>
                 </label>
               ))}
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-gray-400">Supervisor Final Comments</label>
               <textarea className="w-full h-48 p-10 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 outline-none focus:border-[#cca43b] italic leading-relaxed text-[#0f3460]" placeholder="Supervisor's specific feedback and academic path for teacher improvement..."></textarea>
            </div>
            <div className="flex justify-end pt-10 border-t items-center gap-10">
               <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Supervisor Authentication</p>
                  <p className="font-serif italic text-3xl text-[#0f3460]">H. Baylor</p>
                  <p className="text-[9px] font-bold text-gray-300 mt-1 uppercase">Date: {new Date().toLocaleDateString()}</p>
               </div>
               <button onClick={() => notify("Comprehensive Assessment Finalized!", "success")} className="bg-[#0f3460] text-white px-16 py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition active:scale-95">Log Master Checklist</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChecklistGroup = ({ title, items, labels, assessment, onToggle }: any) => (
  <div className="space-y-4">
    <h4 className="text-xs font-black text-[#cca43b] uppercase tracking-widest flex items-center gap-3">
       <div className="w-1.5 h-1.5 bg-[#cca43b] rounded-full"></div>
       {title}
    </h4>
    <div className="grid grid-cols-1 gap-2">
      {items.map((i: string, idx: number) => (
        <label key={i} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition ${assessment.checklists?.[i] ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100 hover:bg-yellow-50'}`}>
          <span className={`text-[10px] font-black uppercase ${assessment.checklists?.[i] ? 'text-blue-900' : 'text-gray-400'}`}>{labels[idx]}</span>
          <input type="checkbox" className="w-5 h-5 accent-[#0f3460]" checked={!!assessment.checklists?.[i]} onChange={() => onToggle(i)} />
        </label>
      ))}
    </div>
  </div>
);

export default LessonPlanAssessmentComp;
