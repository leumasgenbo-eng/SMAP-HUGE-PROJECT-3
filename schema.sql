-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SCHOOL IDENTITY & GLOBAL SETTINGS
-- This table stores all the "Particulars" you want editable on reports
CREATE TABLE school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name TEXT DEFAULT 'UNITED BAYLOR ACADEMY',
    email TEXT DEFAULT 'info@unitedbaylor.edu.gh',
    telephone TEXT DEFAULT '+233 24 000 0000',
    logo_url TEXT,
    academic_year TEXT DEFAULT '2024/2025',
    current_term INTEGER DEFAULT 1,
    mock_series TEXT DEFAULT 'MOCK TWO',
    exam_start DATE,
    exam_end DATE,
    total_attendance_days INTEGER DEFAULT 85,
    -- Flexible configurations stored as JSONB for React state parity
    grading_remarks JSONB DEFAULT '{"A1": "Excellent", "B2": "Very Good", "B3": "Good", "C4": "Credit", "C5": "Credit", "C6": "Credit", "D7": "Pass", "E8": "Pass", "F9": "Fail"}'::jsonb,
    popout_lists JSONB, 
    module_permissions JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. STAFF / USER PROFILES
-- Links to Supabase Auth users
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('Administrator', 'Facilitator')) DEFAULT 'Facilitator',
    department TEXT, -- 'D&N', 'JHS', etc.
    id_number TEXT UNIQUE,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. STUDENT REGISTRY
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_id TEXT UNIQUE, -- e.g., UBA-B1-001
    first_name TEXT NOT NULL,
    surname TEXT NOT NULL,
    other_names TEXT,
    dob DATE,
    sex TEXT CHECK (sex IN ('Male', 'Female')),
    current_class TEXT NOT NULL,
    status TEXT DEFAULT 'Admitted', -- 'Pending', 'Admitted', 'Withdrawn'
    lives_with TEXT,
    special_needs_detail TEXT,
    -- JSONB storage for parent/guardian info to match React types
    father_info JSONB,
    mother_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ACADEMIC RECORDS (SCORES)
CREATE TABLE assessment_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    term INTEGER NOT NULL,
    section_a NUMERIC DEFAULT 0, -- CAT 1 / Daily Avg
    section_b NUMERIC DEFAULT 0, -- CAT 3 / Observation
    section_c NUMERIC DEFAULT 0, -- CAT 2 (Group)
    total_score NUMERIC DEFAULT 0,
    facilitator_remark TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_name, academic_year, term)
);

-- 6. ATTENDANCE REGISTRY
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('P', 'A', 'W/P')),
    term INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    UNIQUE(student_id, date)
);

-- 7. TIMETABLES & CALENDARS (JSON Storage)
CREATE TABLE academic_calendar (
    term INTEGER PRIMARY KEY,
    weeks JSONB -- Array of AcademicCalendarWeek objects
);

CREATE TABLE timetables (
    class_name TEXT PRIMARY KEY,
    schedule JSONB -- Record<Day, string[]> or specialized DaycareTimeTableSlot
);

-- 8. INITIAL SEED DATA
-- Create the initial settings row
INSERT INTO school_settings (school_name, academic_year, current_term)
VALUES ('UNITED BAYLOR ACADEMY', '2024/2025', 1);

-- 9. ENABLE ROW LEVEL SECURITY (Optional but recommended for Supabase)
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_scores ENABLE ROW LEVEL SECURITY;

-- Simple Policy: Authenticated users can read/write everything (for initial dev)
CREATE POLICY "Allow all to authenticated" ON school_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON students FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all to authenticated" ON assessment_scores FOR ALL TO authenticated USING (true);