-- SQL Schema for student study planner
-- Run this in your Supabase SQL Editor to initialize/update the tables.

-- Table 0: Users (Authentication & Accounts)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- Nullable for Google OAuth
  name TEXT NOT NULL,
  avatar_url TEXT,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table 1: Schools
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table 2: Programs (Majors/Departments)
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(name, school_id)
);

-- Table 3: Courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  exam_date DATE,
  target_score TEXT, -- "50%", "60%", "70%", "80%+"
  daily_available_hours NUMERIC DEFAULT 2,
  current_level TEXT, -- "weak", "average", "strong"
  review_status TEXT DEFAULT 'Not Started', -- 'Not Started', 'In Progress', 'Ready'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table 4: Materials
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  material_type TEXT NOT NULL, -- Homework, Quiz, Midterm, Final Exam, Lecture Notes, Practice Questions, Other
  text TEXT NOT NULL, -- Extracted document text
  size INTEGER, -- file size in bytes
  word_count INTEGER,
  hash TEXT, -- SHA-256 hash of the content text for deduplication
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table 5: Course Analyses (AI analysis caching)
CREATE TABLE IF NOT EXISTS course_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE UNIQUE NOT NULL,
  summary TEXT,
  extracted_topics JSONB,
  topic_frequency JSONB,
  predicted_exam_topics JSONB,
  question_bank JSONB,
  difficulty_breakdown JSONB,
  last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  source_material_ids TEXT[] NOT NULL, -- Array of material IDs used for this analysis
  analysis_version INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table 6: Study Plans
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE UNIQUE NOT NULL,
  target_score TEXT NOT NULL,
  days_remaining INTEGER NOT NULL,
  daily_available_hours NUMERIC NOT NULL,
  plan_json JSONB NOT NULL,
  generated_from_analysis_version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table 7: Cached Outputs (Deterministic Caching)
CREATE TABLE IF NOT EXISTS cached_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  course_code TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  output_type TEXT NOT NULL, -- 'analysis' or 'study_plan'
  output_json JSONB NOT NULL,
  input_variables JSONB NOT NULL,
  model_version TEXT NOT NULL,
  prompt_version TEXT,
  course_profile_version INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS and create public policies (or REST API bypass policies)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow public select on schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Allow public insert on schools" ON schools FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on programs" ON programs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on programs" ON programs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on courses" ON courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on courses" ON courses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on courses" ON courses FOR DELETE USING (true);

CREATE POLICY "Allow public select on materials" ON materials FOR SELECT USING (true);
CREATE POLICY "Allow public insert on materials" ON materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on materials" ON materials FOR DELETE USING (true);

CREATE POLICY "Allow public select on course_analyses" ON course_analyses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on course_analyses" ON course_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on course_analyses" ON course_analyses FOR UPDATE USING (true);

CREATE POLICY "Allow public select on study_plans" ON study_plans FOR SELECT USING (true);
CREATE POLICY "Allow public insert on study_plans" ON study_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on study_plans" ON study_plans FOR UPDATE USING (true);

CREATE POLICY "Allow public select on cached_outputs" ON cached_outputs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on cached_outputs" ON cached_outputs FOR INSERT WITH CHECK (true);

