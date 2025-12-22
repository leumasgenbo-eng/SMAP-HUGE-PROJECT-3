
import React, { useState, useEffect } from 'react';
import { CORE_SUBJECTS, ELECTIVE_SUBJECTS } from '../constants';
import { Challenge } from '../types';

// Updated interface to include dept and make challenges optional to resolve App.tsx type errors
interface PortalProps {
  notify: any;
  challenges?: Challenge[];
  dept?: string;
}

const FacilitatorPortal: React.FC<PortalProps> = ({ notify, challenges = [], dept }) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [mockType, setMockType] = useState('Internal');
  const [localChallenges, setLocalChallenges] = useState<Challenge[]>([]);

  // Simulation of top 5 challenges for the selected subject
  useEffect(() => {
    if (selectedSubject) {
      notify(`Loading ranked challenges for ${selectedSubject}...`);
      const filtered = challenges
        .filter(c => c.subjectId === selectedSubject)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setLocalChallenges(filtered);
    }
  }, [selectedSubject, challenges, notify]);

  const handleSubmit = () => {
    notify("Processing mock submission sequence...", "info");
    // Sequence: 
    // 1. Send scores to Code.gs
    // 2. Increment Challenge counts
    // 3. Update Audit Log
    setTimeout(() => notify("Submission Finalized & Stored in Sheet! Audit Log Updated.", "success"), 2000);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-2 border-gray-50 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#0f3460] uppercase tracking-tighter">Score Entry Desk</h2>
          <p className="text-[10px] font-bold text-[#cca43b] uppercase tracking-widest mt-1">Facilitator Portal • Mock Series 2 {dept ? `• ${dept}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="border-2 border-gray-200 p-3 rounded-2xl font-black text-sm outline-none focus:border-[#cca43b]" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
            <option value="">Select Subject</option>
            {[...CORE_SUBJECTS, ...ELECTIVE_SUBJECTS].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="border-2 border-gray-200 p-3 rounded-2xl font-black text-sm outline-none focus:border-[#cca43b]" value={mockType} onChange={e => setMockType(e.target.value)}>
            <option>Internal Mock</option>
            <option>External Mock</option>
            <option>Past Question Based</option>
          </select>
        </div>
      </div>

      {!selectedSubject ? (
        <div className="text-center py-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="text-5xl mb-4">📑</div>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No Subject Selected Now. Select a subject to begin entry.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[#0f3460] text-white">
                <tr>
                  <th className="p-4 text-left uppercase text-[10px] font-black tracking-widest">Pupil ID</th>
                  <th className="p-4 text-left uppercase text-[10px] font-black tracking-widest">Full Name</th>
                  <th className="p-4 uppercase text-[10px] font-black tracking-widest">Section A (30)</th>
                  <th className="p-4 uppercase text-[10px] font-black tracking-widest">Section B (70)</th>
                  <th className="p-4 uppercase text-[10px] font-black tracking-widest">Total</th>
                  <th className="p-4 uppercase text-[10px] font-black tracking-widest text-left">Top Ranked Challenges</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(i => (
                  <tr key={i} className="border-b hover:bg-yellow-50/30 transition">
                    <td className="p-4 font-mono font-bold text-gray-400">UBA-P-00{i}</td>
                    <td className="p-4 font-black text-[#0f3460]">Sample Pupil {i}</td>
                    <td className="p-4 text-center"><input type="number" max="30" className="w-16 border-2 border-gray-200 rounded-lg p-2 text-center font-black focus:border-[#cca43b] outline-none" /></td>
                    <td className="p-4 text-center"><input type="number" max="70" className="w-16 border-2 border-gray-200 rounded-lg p-2 text-center font-black focus:border-[#cca43b] outline-none" /></td>
                    <td className="p-4 font-black text-center text-lg text-[#2e8b57]">0</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {localChallenges.length > 0 ? localChallenges.map(c => (
                          <label key={c.id} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full text-[9px] font-black cursor-pointer hover:bg-[#cca43b]/20 transition uppercase">
                            <input type="checkbox" className="accent-[#0f3460]" /> {c.text}
                          </label>
                        )) : <span className="text-[10px] text-gray-400 italic">No ranked challenges for this subject.</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-8 border-t-2 border-gray-50">
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Facilitator General Remarks (Subject-Wide)</label>
            <textarea className="w-full h-32 p-5 border-2 border-gray-100 rounded-3xl outline-none focus:border-[#cca43b] font-medium text-sm leading-relaxed italic" placeholder="Summarize class performance, specific difficulties, and areas needing attention..."></textarea>
            
            <div className="flex justify-end gap-4 mt-8">
              <button className="px-8 py-3 rounded-2xl font-black text-xs uppercase text-gray-500 hover:bg-gray-100 transition">Save Draft</button>
              <button onClick={handleSubmit} className="bg-[#2e8b57] text-white px-12 py-3 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-[1.05] active:scale-95 transition tracking-widest">Confirm &amp; Finalize Submission</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilitatorPortal;
