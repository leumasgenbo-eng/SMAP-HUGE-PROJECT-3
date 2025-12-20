
import React, { useState } from 'react';

const LessonPlanModule: React.FC<any> = ({ notify }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-[#0f3460] p-10 text-white relative">
        <h2 className="text-4xl font-black uppercase tracking-tighter">Lesson Assessment Master</h2>
        <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Live Observation & Written Plan Analysis</p>
        <div className="absolute top-10 right-10 flex gap-4">
           <div className="text-right">
              <span className="text-[10px] font-black text-white/50 block">Current Rubric Score</span>
              <span className="text-4xl font-black">85 / 100</span>
           </div>
        </div>
      </div>

      <div className="p-10 space-y-12">
        <section>
          <h3 className="text-xs font-black uppercase text-gray-400 mb-6 tracking-widest flex items-center gap-3">
             <div className="w-8 h-1 bg-[#cca43b]"></div>
             Section B: Written Lesson Plan Checklist
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ChecklistGroup title="B1. Objectives & Outcomes" items={['Clearly Stated', 'Learner-Centred', 'SMART', 'Measurable']} />
            <ChecklistGroup title="B2. Content & Accuracy" items={['Logically Sequenced', 'Accurate Knowledge', 'Real-Life Relevance']} />
            <ChecklistGroup title="B3. Teaching Strategies" items={['Active Participation', 'Different Learning Styles', 'Problem-Solving']} />
            <ChecklistGroup title="B4. TLMs & Resources" items={['Relevant Materials', 'Multi-sensory Support', 'Technology Integrated']} />
          </div>
        </section>

        <section className="bg-[#f4f6f7] p-10 rounded-3xl border border-gray-100">
           <h3 className="text-lg font-black text-[#0f3460] uppercase mb-4">Overall Recommendations</h3>
           <textarea 
             className="w-full h-32 p-6 border-none rounded-2xl shadow-inner outline-none italic text-sm text-gray-600"
             placeholder="Detailed supervisor feedback on instructional quality..."
           ></textarea>
           <button className="mt-6 bg-[#0f3460] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition">Finalize Assessment</button>
        </section>
      </div>
    </div>
  );
};

const ChecklistGroup = ({ title, items }: any) => (
  <div className="space-y-3">
    <h4 className="text-[11px] font-black text-[#0f3460] uppercase">{title}</h4>
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
      {items.map((item: string) => (
        <label key={item} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition">
          <span className="text-xs font-bold text-gray-600">{item}</span>
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#2e8b57] focus:ring-[#2e8b57]" />
        </label>
      ))}
    </div>
  </div>
);

export default LessonPlanModule;
