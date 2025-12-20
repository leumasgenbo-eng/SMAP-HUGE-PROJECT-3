
import React, { useState, useEffect } from 'react';
import { Student, GlobalSettings } from '../types';
import EditableField from './EditableField';

interface Props {
  module: string;
  department: string;
  activeClass: string;
  students: Student[];
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  onStudentUpdate?: (id: string, field: string, value: any) => void;
}

const GenericModule: React.FC<Props> = ({ module, department, activeClass, students, settings, onSettingsChange, onStudentUpdate }) => {
  const [rows, setRows] = useState(5);
  const [tableData, setTableData] = useState<Record<string, Record<string, string>>>({});

  const isEarlyChildhood = department === 'Daycare' || department === 'Nursery';
  const isKindergarten = department === 'Kindergarten';

  const getColumns = () => {
    switch (module) {
      case 'Time Table':
      case 'Examination Time Table':
      case 'Observation Time Table':
        return ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      case 'Academic Calendar':
        return ['Date', 'Event', 'Description', 'Status'];
      case 'Facilitator List':
      case 'Invigilators List':
      case 'Observers List':
        return ['Name', 'Position', 'Specialization', 'Status', 'Contact'];
      case 'Pupil Enrolment':
        return ['ID', 'Name', 'Gender', 'DOB', 'Parent Contact', 'Address'];
      case 'Lesson Plans & Scheme of learning':
        return ['Week', 'Topic', 'Sub-Topic', 'Objective', 'Resources', 'Assessment'];
      case 'Exercise Assessment':
        return ['Week', 'Subject', 'Exercises Given', 'Pass Rate', 'Remarks'];
      case 'Staff movement':
        return ['Date', 'Staff Name', 'Destination', 'Reason', 'Time Out', 'Time In'];
      case 'Materials and Logistics':
        return ['Item Name', 'Category', 'Quantity', 'Condition', 'Requested By'];
      case 'Learner Materials & Booklist':
        return ['Subject', 'Book Title', 'Author', 'Publisher', 'Mandatory'];
      case 'Disciplinary':
        return ['Date', 'Pupil Name', 'Infraction', 'Action Taken', 'Counseling'];
      case 'SPECIAL EVENT DAY':
        return ['Date', 'Event Name', 'Theme', 'Organizer', 'Venue'];
      case 'Academic Activities':
        return ['Week', 'Period (Start-End)', 'Activities', 'Venue/Remarks', 'Responsible Person(s)'];
      case 'Class Assessment Test System':
        return isEarlyChildhood 
          ? ['Milestone Check', 'Focus Area', 'Developmental Domain', 'Method', 'Documentation', 'Notes']
          : ['CAT Series', 'Subject', 'Question Type', 'No. of Questions', 'Bloom\'s Taxonomy', 'Mode', 'Marks', 'Start Date', 'End Date'];
      case 'Extra-Curricular Activities Schedule':
        return ['Week', 'Activity', 'Type (Club/House)', 'Venue', 'Coordinator'];
      default:
        return ['Date', 'Record Name', 'Details', 'Notes'];
    }
  };

  const columns = getColumns();

  // Initialization logic for pre-filled tables
  useEffect(() => {
    if (module === 'Academic Activities') {
      const activities = [
        "REOPENING/ORIENTATION/STAFF MEETING",
        "SUBMISSION PREPARED OF SCHEME OF WORK",
        "ADMINISTER AND RECORD C.A.T",
        "CLOSING OF REGISTERS",
        "SUBMISSION OF END OF TERM QUESTIONS",
        "ADMINISTER MID TERM EXAMINATION AND RECORD",
        "INSPECTION OF S.B.A/REGISTERS",
        "CRITERION ASSESSMENT",
        "ADMINISTER AND RECORD C.A.T",
        "REVISION",
        "EXAMINATION",
        "WEEK OF VACATION"
      ];
      const initial: Record<string, any> = {};
      activities.forEach((act, idx) => {
        initial[idx] = { 'Week': `Week ${idx + 1}`, 'Activities': act };
      });
      setTableData(initial);
      setRows(activities.length);
    } else if (module === 'Class Assessment Test System') {
      const initial: Record<string, any> = {};
      if (isEarlyChildhood) {
        const checks = ["Milestone Check 1", "Portfolio Review 1", "Milestone Check 2", "Portfolio Review 2", "Final Progress Report"];
        checks.forEach((chk, idx) => {
          initial[idx] = { 'Milestone Check': chk, 'Method': 'Observation' };
        });
        setRows(checks.length);
      } else {
        const cats = ["CAT 1", "CAT 2 (Project)", "CAT 3"];
        cats.forEach((cat, idx) => {
          initial[idx] = { 'CAT Series': cat, 'Mode': idx === 1 ? 'Group' : 'Individual' };
        });
        setRows(cats.length);
      }
      setTableData(initial);
    } else if (module === 'Extra-Curricular Activities Schedule') {
      const activities = isEarlyChildhood 
        ? ["Sensory Play", "Storytelling Hour", "Nature Walk", "Music & Movement", "Art & Craft", "Role Play Day"]
        : ["Quiz", "Debate", "Poetry/Drama", "Music/Choir", "Cadet/First Aid", "Journalism", "Athletics", "Picnics/Excursion", "Spelling Bee", "Video Games"];
      const initial: Record<string, any> = {};
      activities.forEach((act, idx) => {
        initial[idx] = { 'Week': `Week ${idx + 1}`, 'Activity': act };
      });
      setTableData(initial);
      setRows(activities.length);
    }
  }, [module, isEarlyChildhood]);

  const updateCell = (rowIdx: number, col: string, val: string) => {
    setTableData(prev => ({
      ...prev,
      [rowIdx]: { ...(prev[rowIdx] || {}), [col]: val }
    }));
  };

  const getPolicyInstruction = () => {
    if (module === 'Class Assessment Test System') {
      if (isEarlyChildhood) {
        return "Early Childhood Policy: Standard tests are not administered. Assessment focuses on developmental milestones across Physical, Cognitive, and Social domains, documented within the learner's individual portfolio.";
      }
      return "C.A.T Policy: Set questions following Bloom's Taxonomy. CAT 1 (Week 3/4) and CAT 3 (Week 9/10) are individual tests. CAT 2 is a Project or Group work designed to assess collaboration and practical application.";
    }
    return null;
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 animate-fadeIn">
      {/* Particulars Header */}
      <div className="mb-10 border-b-2 border-gray-100 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#0f3460] uppercase tracking-tighter">{module}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-[#cca43b] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">{department}</span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeClass} Enrolment Base: {students.length} Pupils</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setRows(prev => prev + 1)} className="bg-[#0f3460] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:scale-105 transition">+ Add Row</button>
           <button className="bg-[#2e8b57] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:scale-105 transition">Save Records</button>
        </div>
      </div>

      {getPolicyInstruction() && (
        <div className="mb-8 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-2xl">
          <p className="text-blue-900 font-bold italic text-sm">“{getPolicyInstruction()}”</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-gray-50/30">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#f4f6f7] text-[#0f3460] uppercase font-black text-[10px]">
            <tr>
              {columns.map(col => (
                <th key={col} className="p-5 border-r border-gray-100 last:border-none">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} className="border-b border-gray-50 bg-white hover:bg-yellow-50/50 transition">
                {columns.map(col => (
                  <td key={col} className="p-4 border-r border-gray-50 last:border-none">
                    <EditableField 
                      value={tableData[rIdx]?.[col] || ''} 
                      onSave={(val) => updateCell(rIdx, col, val)}
                      placeholder="..."
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenericModule;
