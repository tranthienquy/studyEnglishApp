-- ==========================================
-- SUPABASE SCHEMA FOR READINGPRO APP
-- Run these queries in the Supabase SQL Editor
-- ==========================================

-- 1. Create table 'tests' (Lưu trữ các Đề thi)
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subject TEXT DEFAULT 'TIẾNG ANH',
    duration INTEGER DEFAULT 45,
    teacher TEXT DEFAULT 'Cô Trang',
    passage TEXT,
    questions_json JSONB,
    sections_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for 'tests'
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.tests;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.tests;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.tests;
DROP POLICY IF EXISTS "public_read_visible_tests" ON public.tests;
DROP POLICY IF EXISTS "teacher_manage_tests" ON public.tests;

-- 1. Anyone (public/students) can read tests
CREATE POLICY "public_read_tests" ON public.tests FOR SELECT USING (true);

-- 2. Only authenticated teachers can insert/update/delete tests
CREATE POLICY "teachers_insert_tests" ON public.tests FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' OR auth.jwt() ->> 'email' LIKE '%@fpt.edu.vn' OR auth.jwt() ->> 'email' LIKE '%@fe.edu.vn' OR auth.jwt() ->> 'email' IN ('quytt16@fpt.edu.vn', 'feexpspace@gmail.com')
);

CREATE POLICY "teachers_update_own_tests" ON public.tests FOR UPDATE USING (
  auth.role() = 'authenticated' OR auth.jwt() ->> 'email' LIKE '%@fpt.edu.vn' OR auth.jwt() ->> 'email' LIKE '%@fe.edu.vn' OR auth.jwt() ->> 'email' IN ('quytt16@fpt.edu.vn', 'feexpspace@gmail.com')
);

CREATE POLICY "teachers_delete_own_tests" ON public.tests FOR DELETE USING (
  auth.role() = 'authenticated' OR auth.jwt() ->> 'email' LIKE '%@fpt.edu.vn' OR auth.jwt() ->> 'email' LIKE '%@fe.edu.vn' OR auth.jwt() ->> 'email' IN ('quytt16@fpt.edu.vn', 'feexpspace@gmail.com')
);


-- 2. Create table 'results' (Lưu kết quả làm bài của học sinh)
CREATE TABLE IF NOT EXISTS public.results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_class TEXT,
    teacher TEXT,
    test_id TEXT NOT NULL,
    score NUMERIC NOT NULL,
    time_spent INTEGER NOT NULL,
    answers_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for 'results'
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.results;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.results;

CREATE POLICY "Enable read access for all users" ON public.results FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.results FOR INSERT WITH CHECK (true);
