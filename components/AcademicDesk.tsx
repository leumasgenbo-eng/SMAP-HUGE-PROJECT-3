import React, { useState } from 'react';
import { GlobalSettings, Student } from '../types';
import GenericModule from './GenericModule';
import DaycareTimeTable from './DaycareTimeTable';
import PupilManagement from './PupilManagement';
import AssessmentDesk from './AssessmentDesk';
import ExaminationDesk from './ExaminationDesk';
import MockExaminationDesk from './MockExaminationDesk';
import ReportModule from './ReportModule';
import AnnouncementModule from './AnnouncementModule';
import { getSubjectsForDepartment } from '../constants';

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  students: Student[];
  onStudentsUpdate: (s: Student[]) => void;
  activeClass: string;
  department: string;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onStudentUpdate: (id: string, field: string, value: any) => void;
}

const AcademicDesk: React.FC<Props> = ({ settings, onSettingsChange, students, onStudentsUpdate, activeClass, department, notify, onStudentUpdate }) => {
  const [activeTab, setActiveTab] = useState<'pupils' | 'assessment' | 'exams' | 'mock' | 'reports' | 'announcements'>('pupils');

  const classSpecificStudents = students.filter(s => s.status === 'Admitted' && s.currentClass === activeClass);
  const subjectList = getSubjectsForDepartment(department);

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* High-Radius Academic Header */}
      <div className="bg-white p-12 rounded-[5rem] shadow-2xl border border-gray-100 no-print flex flex-col items-center">
        <div className="bg-[#cca43b] text-[#0f3460] py-3 px-16 rounded-full font-black text-sm uppercase tracking-[0.3em] shadow-lg mb-8">
           INSTRUCTIONAL & ACADEMIC DESK
        </div>
        
        <div className="flex flex-wrap justify-center bg-gray-100 p-2 rounded-[2.5rem] mt-4 mb-4 shadow-inner gap-1">
           <button 
             onClick={() => setActiveTab('pupils')} 
             className={`px-8 py-3 rounded-[2rem] text-[9px] font-black uppercase transition-all ${activeTab === 'pupils' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
           >
             1. Registers
           </button>
           <button 
             onClick={() => setActiveTab('assessment')} 
             className={`px-8 py-3 rounded-[2rem] text-[9px] font-black uppercase transition-all ${activeTab === 'assessment' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
           >
             2. Assessment
           </button>
           <button 
             onClick={() => setActiveTab('exams')} 
             className={`px-8 py-3 rounded-[2rem] text-[9px] font-black uppercase transition-all ${activeTab === 'exams' ? 'bg-[#0f3460] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
           >
             3. Terminal Exams
           </button>
           <button 
             onClick={() => setActiveTab('mock')} 
             className={`px-8 py-3 rounded-[2rem] text-[9px] font-black uppercase transition-all ${activeTab === 'mock' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
           >
             4. Mock Portal
           </button>
           <button 
             onClick={() => setActiveTab('reports')} 
             className={`px-8 py-3 rounded-[2rem] text-[9px] font-black uppercase transition-all ${activeTab === 'reports' ? 'bg-[#2e8b57] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
           >
             5. Reports
           </button>
           <button 
             onClick={() => setActiveTab('announcements')} 
             className={`px-8 py-3 rounded-[2rem] text-[9px] font-black uppercase transition-all ${activeTab === 'announcements' ? 'bg-orange-50 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
           >
             6. Broadcast
           </button>
        </div>

        <div className="flex gap-4 mt-4">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Focus:</span>
           <span className="text-[10px] font-black text-[#cca43b] uppercase tracking-widest">{activeClass} ({department})</span>
        </div>
      </div>

      <div className="animate-fadeIn">
        {activeTab === 'pupils' && (
          <PupilManagement students={students} onStudentsUpdate={onStudentsUpdate} settings={settings} onSettingsChange={onSettingsChange} notify={notify} />
        )}

        {activeTab === 'assessment' && (
          <AssessmentDesk 
            settings={settings} 
            onSettingsChange={onSettingsChange} 
            students={classSpecificStudents} 
            onStudentsUpdate={(updated) => onStudentsUpdate([...students.filter(s => s.currentClass !== activeClass || s.status !== 'Admitted'), ...updated])}
            activeClass={activeClass} 
            department={department}
            notify={notify} 
          />
        )}

        {activeTab === 'exams' && (
          <ExaminationDesk 
            settings={settings} 
            onSettingsChange={onSettingsChange} 
            department={department} 
            activeClass={activeClass} 
            students={classSpecificStudents}
            onStudentsUpdate={(updated) => onStudentsUpdate([...students.filter(s => s.currentClass !== activeClass || s.status !== 'Admitted'), ...updated])}
            onSave={() => notify("Exam Ledger Synced", "success")}
            subjectList={subjectList}
            notify={notify} 
          />
        )}

        {activeTab === 'mock' && (
          <MockExaminationDesk 
            settings={settings} 
            onSettingsChange={onSettingsChange} 
            activeClass={activeClass} 
            students={classSpecificStudents}
            onStudentsUpdate={(updated) => onStudentsUpdate([...students.filter(s => s.currentClass !== activeClass || s.status !== 'Admitted'), ...updated])}
            onSave={() => notify("Mock Ledger Synced & Normalized", "success")}
            subjectList={subjectList}
            notify={notify}
          />
        )}

        {activeTab === 'reports' && (
          <ReportModule 
            students={classSpecificStudents} 
            settings={settings} 
            onSettingsChange={onSettingsChange} 
            activeClass={activeClass} 
            department={department} 
            onStudentUpdate={onStudentUpdate}
            notify={notify}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementModule settings={settings} onSettingsChange={onSettingsChange} notify={notify} students={students} />
        )}
      </div>
    </div>
  );
};

export default AcademicDesk;