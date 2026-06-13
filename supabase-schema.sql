-- SQL Schema for CoursePack AI Feedback Loop
-- Run this in your Supabase SQL Editor (https://supabase.com) to initialize the tables.

-- Table 1: Log all AI Study Pack generations
CREATE TABLE IF NOT EXISTS study_pack_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code TEXT NOT NULL,
  course_name TEXT,
  subject TEXT,
  text_length INTEGER,
  generated_pack JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for querying logs by course
CREATE INDEX IF NOT EXISTS idx_study_pack_logs_course ON study_pack_logs(course_code);

-- Table 2: Collect student ratings, notes, and corrections
CREATE TABLE IF NOT EXISTS study_pack_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID REFERENCES study_pack_logs(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  user_notes TEXT,
  corrected_concepts JSONB, -- Stores corrections in JSON format for comparison
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for looking up feedback on specific generations
CREATE INDEX IF NOT EXISTS idx_study_pack_feedback_log ON study_pack_feedback(log_id);

-- Enable Row Level Security (RLS) if public inserts are needed, 
-- or write direct service-role inserts. For this MVP, we will allow anonymous inserts.
ALTER TABLE study_pack_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_pack_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to study_pack_logs" 
  ON study_pack_logs FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts to study_pack_feedback" 
  ON study_pack_feedback FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select to study_pack_logs" 
  ON study_pack_logs FOR SELECT 
  USING (true);

CREATE POLICY "Allow anonymous select to study_pack_feedback" 
  ON study_pack_feedback FOR SELECT 
  USING (true);
