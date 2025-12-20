
import React from 'react';

const TrendAnalysis: React.FC<{ notify: any }> = ({ notify }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-96 flex flex-col items-center justify-center">
         <div className="w-full flex justify-between items-center mb-6">
            <h3 className="font-black text-[#0f3460]">Gender Performance Distribution</h3>
            <span className="bg-[#cca43b] text-white text-[10px] px-2 py-1 rounded">PIE CHART</span>
         </div>
         <div className="text-gray-300 italic">Chart rendering logic (Chart.js) goes here...</div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-96 flex flex-col items-center justify-center">
         <div className="w-full flex justify-between items-center mb-6">
            <h3 className="font-black text-[#0f3460]">Subject Averages Across Mocks</h3>
            <span className="bg-[#cca43b] text-white text-[10px] px-2 py-1 rounded">BAR GRAPH</span>
         </div>
         <div className="text-gray-300 italic">Trend visualization logic goes here...</div>
      </div>
    </div>
  );
};

export default TrendAnalysis;
