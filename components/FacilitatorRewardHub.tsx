
import React, { useMemo } from 'react';
import { GlobalSettings } from '../types';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  notify: any;
}

const FacilitatorRewardHub: React.FC<Props> = ({ settings }) => {
  const staffRewards = useMemo(() => {
    return settings.staff.filter(s => s.category === 'Teaching').map(staff => {
      let totalDays = 0;
      let presentDays = 0;
      Object.values(settings.staffAttendance || {}).forEach(dayLogs => {
        const log = dayLogs[staff.id];
        if (log) {
          totalDays++;
          if (log.status === 'Present') presentDays++;
        }
      });
      const attendanceScore = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      const compositeMerit = attendanceScore;
      let badge = 'Standard';
      let bonus = 0;
      if (compositeMerit >= 90) { badge = 'Platinum'; bonus = 500; }
      else if (compositeMerit >= 80) { badge = 'Gold'; bonus = 300; }
      return { staff, compositeMerit, badge, bonus };
    }).sort((a, b) => b.compositeMerit - a.compositeMerit);
  }, [settings]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-gradient-to-br from-[#0f3460] to-[#1a4a8d] p-10 rounded-[3rem] text-white shadow-2xl">
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Facilitator Reward Hub</h2>
          <p className="text-xs font-bold text-[#cca43b] uppercase tracking-widest mt-2 italic">Performance recognition system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
          <h3 className="text-xl font-black text-[#0f3460] uppercase mb-8 border-b pb-4">Performance Ranking</h3>
          <div className="space-y-4">
            {staffRewards.map((item, idx) => (
              <div key={item.staff.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] hover:bg-white border-2 border-transparent hover:border-[#cca43b] transition group shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center font-black text-[#0f3460]">{idx + 1}</div>
                  <div>
                    <p className="font-black text-[#0f3460] uppercase">{item.staff.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{item.staff.department}</p>
                  </div>
                </div>
                <div className="flex gap-8 items-center">
                   <div className="text-center">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Merit</p>
                      <p className="text-lg font-black text-[#0f3460]">{item.compositeMerit.toFixed(1)}%</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[8px] font-black text-[#cca43b] uppercase">Bonus</p>
                      <p className="text-lg font-black text-green-600">GH₵ {item.bonus}</p>
                   </div>
                   <span className="px-4 py-1.5 rounded-xl text-[8px] font-black uppercase bg-blue-50 text-blue-700">
                      {item.badge}
                   </span>
                </div>
              </div>
            ))}
            {staffRewards.length === 0 && <p className="text-center text-gray-300 font-black uppercase italic py-20">No data found.</p>}
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-[#0f3460] p-8 rounded-[3rem] text-white shadow-xl">
              <h4 className="text-xs font-black uppercase text-[#cca43b] tracking-widest border-b border-white/10 pb-2 mb-6">Calibration</h4>
              <p className="text-[9px] text-white/50 italic leading-relaxed">Performance analysis derived from cross-portal attendance and assessment fidelity logs.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FacilitatorRewardHub;
