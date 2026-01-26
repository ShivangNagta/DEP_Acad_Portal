-- Drop all existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS course_department_eligibility CASCADE;
DROP TABLE IF EXISTS course_batch_eligibility CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments table (NEW) - Master reference for all departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL COMMENT 'Department name (e.g., Computer Science, Electronics)',
    code TEXT UNIQUE COMMENT 'Department code (e.g., CSE, ECE)',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Users table (UPDATED)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    entry_number TEXT UNIQUE,
    name TEXT COMMENT 'Full name of user (student or instructor)',
    role TEXT NOT NULL CHECK (role IN ('admin', 'professor', 'student')),
    batch INTEGER COMMENT 'Year of admission (e.g., 2022, 2023, etc) - only for students',
    department_id UUID REFERENCES departments(id) COMMENT 'References departments table - for students and professors',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Courses table (UPDATED)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code TEXT NOT NULL,
    title TEXT NOT NULL,
    credits INTEGER,
    instructor_id UUID REFERENCES users(id),
    academic_session TEXT,
    enrollment_deadline DATE COMMENT 'Deadline for students to enroll/drop this course',
    slot TEXT CHECK (slot IN ('T-PCPE', 'PC-1', 'PC-2', 'PC-3', 'PC-4', 'HSME', 'PCPE', 'HSPE', 'PHSME')) COMMENT 'Course slot/time slot',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Course Batch Eligibility (NEW) - Stores multiple eligible batches for a course
CREATE TABLE IF NOT EXISTS course_batch_eligibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    batch_year INTEGER NOT NULL COMMENT 'Eligible batch year (e.g., 2023)',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(course_id, batch_year) COMMENT 'Prevent duplicate eligibilities'
);

-- Course Department Eligibility (NEW) - Stores multiple eligible departments for a course
CREATE TABLE IF NOT EXISTS course_department_eligibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(course_id, department_id) COMMENT 'Prevent duplicate eligibilities'
);

-- Enrollments table (UPDATED)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    semester TEXT NOT NULL CHECK (semester IN ('sem-1', 'sem-2', 'sem-3', 'sem-4', 'sem-5', 'sem-6', 'sem-7', 'sem-8')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(course_id, student_id, semester)
);

-- Grades table (UPDATED)
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    marks INTEGER,
    grade TEXT,
    semester TEXT NOT NULL CHECK (semester IN ('sem-1', 'sem-2', 'sem-3', 'sem-4', 'sem-5', 'sem-6', 'sem-7', 'sem-8')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(course_id, student_id, semester)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- System Settings table (for storing current_session)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES users(id)
);

-- Feedback Questions table
CREATE TABLE IF NOT EXISTS feedback_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Student Feedback table
CREATE TABLE IF NOT EXISTS student_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES feedback_questions(id) ON DELETE CASCADE,
    response INTEGER NOT NULL CHECK (response BETWEEN 1 AND 5),
    session TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, instructor_id, question_id, session)
);

-- Create indexes for better performance (UPDATED)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_batch ON users(batch);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_batch_eligibility_course ON course_batch_eligibility(course_id);
CREATE INDEX IF NOT EXISTS idx_course_batch_eligibility_batch ON course_batch_eligibility(batch_year);
CREATE INDEX IF NOT EXISTS idx_course_department_eligibility_course ON course_department_eligibility(course_id);
CREATE INDEX IF NOT EXISTS idx_course_department_eligibility_dept ON course_department_eligibility(department_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_semester ON enrollments(semester);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_semester ON enrollments(student_id, semester);
CREATE INDEX IF NOT EXISTS idx_grades_course_student ON grades(course_id, student_id);
CREATE INDEX IF NOT EXISTS idx_grades_semester ON grades(semester);
CREATE INDEX IF NOT EXISTS idx_grades_student_semester ON grades(student_id, semester);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_feedback_questions_order ON feedback_questions(question_order);
CREATE INDEX IF NOT EXISTS idx_student_feedback_student ON student_feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_student_feedback_instructor ON student_feedback(instructor_id);
CREATE INDEX IF NOT EXISTS idx_student_feedback_session ON student_feedback(session);
CREATE INDEX IF NOT EXISTS idx_student_feedback_instructor_session ON student_feedback(instructor_id, session);

-- Row Level Security (RLS) - Enable if using Supabase auth
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Additional columns (existing features)
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS status TEXT
CHECK (status IN ('approved', 'pending'));

ALTER TABLE grades
ADD COLUMN IF NOT EXISTS status TEXT
CHECK (status IN ('published', 'submitted'));

INSERT INTO system_settings (id, key, value) 
VALUES (gen_random_uuid(), 'current_session', '2025-2026')
ON CONFLICT (key) DO NOTHING;

INSERT INTO feedback_questions (id, question_text, question_order)
VALUES 
    (gen_random_uuid(), 'The instructor explains concepts clearly and is easy to understand', 1),
    (gen_random_uuid(), 'The instructor is well-prepared and organized for each class', 2),
    (gen_random_uuid(), 'The instructor creates an engaging and interactive learning environment', 3),
    (gen_random_uuid(), 'The instructor is approachable and responsive to student questions', 4),
    (gen_random_uuid(), 'The instructor provides timely and constructive feedback on assignments', 5),
    (gen_random_uuid(), 'The course materials and resources are relevant and helpful', 6),
    (gen_random_uuid(), 'The instructor manages time effectively and respects class schedule', 7),
    (gen_random_uuid(), 'The instructor relates course content to real-world applications', 8)
ON CONFLICT DO NOTHING;

INSERT INTO departments (id, name, code, created_at)
VALUES 
    (gen_random_uuid(), 'Computer Science', 'CS', NOW()),
    (gen_random_uuid(), 'Electrical Engineering', 'EE', NOW()),
    (gen_random_uuid(), 'Mechanical Engineering', 'ME', NOW()),
    (gen_random_uuid(), 'Civil Engineering', 'CE', NOW()),
    (gen_random_uuid(), 'Chemical Engineering', 'CH', NOW()),
    (gen_random_uuid(), 'Metallurgy', 'MM', NOW());

-- MIGRATION NOTE: If courses table already exists, add the enrollment_deadline column with:
-- ALTER TABLE courses ADD COLUMN enrollment_deadline DATE COMMENT 'Deadline for students to enroll/drop this course';