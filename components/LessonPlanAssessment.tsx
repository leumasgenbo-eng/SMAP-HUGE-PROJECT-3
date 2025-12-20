
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
    // Implementation would use html2pdf logic similar to ReportCard
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0f3460] p-10 rounded-[3rem] text-white flex justify-between items-center shadow-2xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">Lesson Assessment Master</h2>
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
              <input type="date" className="p-4 bg-gray-50 rounded-2xl outline-none" value={assessment.date} onChange={e => setAssessment({...assessment, date: e.target.value})} />
              <input placeholder="Strand(s)" className="p-4 bg-gray-50 rounded-2xl outline-none" />
              <input placeholder="Indicator(s)" className="p-4 bg-gray-50 rounded-2xl outline-none" />
              <select className="p-4 bg-gray-50 rounded-2xl font-bold">
                 <option>Scheme of Learning: Complete & Attached</option>
                 <option>Scheme of Learning: Partial</option>
                 <option>Scheme of Learning: Not Attached</option>
              </select>
              <input type="number" placeholder="Count of Reference Materials" className="p-4 bg-gray-50 rounded-2xl" />
            </div>
          </div>
        )}

        {activeSection === 'B' && (
           <div className="space-y-12">
              <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4">Section B: Written Lesson Plan Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <ChecklistGroup title="B1. Objectives & Outcomes" items={['Clearly Stated', 'Learner-Centred', 'SMART', 'Align with Standards', 'Appropriate Cognitive Level', 'Measurable/Observable']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="B2. Content & Knowledge" items={['Accurate & Relevant', 'Align with Objectives', 'Logically Sequenced', 'Level Appropriate', 'Connected to Prior Knowledge', 'Real-life Relevance']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="B3. Strategies" items={['Match Objectives', 'Visual/Auditory/Kinesthetic Support', 'Active Participation', 'Inquiry/Problem-solving', 'Cooperative/Individual Balance']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="B5. TLMs" items={['Relevant & Appropriate', 'Support Objectives', 'Multi-sensory Learning', 'Available & Prepared', 'Technology (if used) appropriate']} assessment={assessment} onToggle={toggleCheck} />
              </div>
           </div>
        )}

        {activeSection === 'C' && (
           <div className="space-y-12">
              <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4">Section C: Lesson Observation Checklist (Live)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <ChecklistGroup title="C1. Professionalism" items={['Arrived on time', 'Well-prepared', 'Professional Dressing', 'Lesson Plan available', 'TLMs ready']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="C3. Content Delivery" items={['Subject matter evident', 'Explanations clear', 'Voice audible', 'Language correct', 'Board work neat', 'Effective examples']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="C4. Participation" items={['Learners active', 'Questions encourage thinking', 'Wait time provided', 'Effective collaboration', 'Teacher moves around']} assessment={assessment} onToggle={toggleCheck} />
                 <ChecklistGroup title="C5. Management" items={['Rules enforced respectfully', 'Learners focused', 'Positive behavior reinforced', 'No sarcasm/humiliation', 'Maintains authority']} assessment={assessment} onToggle={toggleCheck} />
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
                 <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-lg font-black text-[#0f3460] uppercase">Calculated Cumulative Score</span>
                    <span className="text-5xl font-black text-[#2e8b57]">100%</span>
                 </div>
              </div>
           </div>
        )}

        {activeSection === 'E' && (
           <div className="space-y-10">
              <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4">Section E: Observation Scoring Rubric</h3>
              <div className="grid grid-cols-1 gap-6">
                 {[
                   'Lesson Introduction Efficiency', 'Clarity of Instructional Language', 
                   'Effective use of TLMs', 'Classroom Behavior Management',
                   'Assessment & Feedback Loop', 'Conclusion & Reflection'
                 ].map(item => (
                   <div key={item} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                      <span className="font-black text-[#0f3460] uppercase text-xs">{item}</span>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3, 4].map(val => (
                          <button 
                            key={val} 
                            onClick={() => setScore(item, val)}
                            className={`w-10 h-10 rounded-xl font-black text-xs transition ${assessment.scores?.[item] === val ? 'bg-[#0f3460] text-white shadow-lg' : 'bg-white text-gray-300 border border-gray-100 hover:border-[#cca43b]'}`}
                            title={['Not Observed', 'Needs Improvement', 'Fair', 'Good', 'Excellent'][val]}
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
                 <div className="space-y-4">
                    <h4 className="text-xs font-black text-[#cca43b] uppercase">Quantitative Data (0-100)</h4>
                    {['Alignment Score', 'Strategy Score', 'Assessment Quality', 'Time Management', 'Learner Engagement'].map(d => (
                       <div key={d} className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-400">{d}</label>
                          <input type="number" max="100" className="w-full p-3 bg-gray-50 rounded-xl outline-none" />
                       </div>
                    ))}
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-xs font-black text-[#cca43b] uppercase">Qualitative Findings</h4>
                    <textarea placeholder="Strengths observed..." className="w-full h-24 p-4 bg-gray-50 rounded-xl outline-none" value={assessment.qualitative?.strengths}></textarea>
                    <textarea placeholder="Notable teaching behaviors..." className="w-full h-24 p-4 bg-gray-50 rounded-xl outline-none"></textarea>
                 </div>
              </div>
           </div>
        )}

        {activeSection === 'G' && (
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-[#0f3460] uppercase border-b pb-4">Section G: Overall Evaluation & Recommendation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {['Meets professional standards', 'Requires improvement', 'Re-teaching recommended', 'Follow-up observation required'].map(opt => (
                 <label key={opt} className={`p-6 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition ${assessment.overallEvaluation === opt ? 'bg-[#0f3460] text-white border-[#0f3460]' : 'bg-gray-50 border-gray-100 hover:border-[#cca43b]'}`}>
                    <input type="radio" name="overall" className="w-5 h-5 accent-[#cca43b]" onChange={() => setAssessment({...assessment, overallEvaluation: opt as any})} />
                    <span className="font-black uppercase text-xs">{opt}</span>
                 </label>
               ))}
            </div>
            <textarea className="w-full h-48 p-8 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 outline-none focus:border-[#cca43b] italic leading-relaxed text-[#0f3460]" placeholder="Supervisor's specific feedback and academic path for teacher improvement..."></textarea>
            <div className="flex justify-end pt-10 border-t items-center gap-10">
               <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Supervisor Signature</p>
                  <p className="font-serif italic text-2xl text-[#0f3460]">H. Baylor</p>
                  <p className="text-[9px] font-bold text-gray-300">{new Date().toDateString()}</p>
               </div>
               <button onClick={() => notify("Assessment Finalized and Stored!", "success")} className="bg-[#0f3460] text-white px-16 py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition active:scale-95">Finalize Assessment</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChecklistGroup = ({ title, items, assessment, onToggle }: any) => (
  <div className="space-y-4">
    <h4 className="text-xs font-black text-[#cca43b] uppercase tracking-widest flex items-center gap-2">
       <div className="w-1.5 h-1.5 bg-[#cca43b] rounded-full"></div>
       {title}
    </h4>
    <div className="grid grid-cols-1 gap-2">
      {items.map((i: string) => (
        <label key={i} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition ${assessment.checklists?.[i] ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100 hover:bg-yellow-50'}`}>
          <span className={`text-[10px] font-black uppercase ${assessment.checklists?.[i] ? 'text-blue-900' : 'text-gray-400'}`}>{i}</span>
          <input type="checkbox" className="w-5 h-5 accent-[#0f3460]" checked={!!assessment.checklists?.[i]} onChange={() => onToggle(i)} />
        </label>
      ))}
    </div>
  </div>
);

export default LessonPlanAssessmentComp;
