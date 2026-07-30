-- ============================================================
-- READINGPRO — SUPABASE DATABASE SCHEMA MIGRATION SCRIPT
-- Copy & Paste script này vào Supabase SQL Editor và bấm Run!
-- ============================================================

-- 1. BẢNG TESTS (Lưu trữ danh sách đề thi do Giáo viên đăng lên)
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subject VARCHAR(100) DEFAULT 'TIẾNG ANH',
    duration INT DEFAULT 45,
    teacher VARCHAR(150),
    passage TEXT,
    questions_json JSONB DEFAULT '[]'::jsonb,
    sections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG RESULTS (Lưu trữ kết quả làm bài thi của Học sinh)
CREATE TABLE IF NOT EXISTS public.results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name VARCHAR(150) NOT NULL,
    student_class VARCHAR(50) NOT NULL,
    teacher VARCHAR(150),
    test_id TEXT NOT NULL,
    score NUMERIC(4, 2) NOT NULL,
    time_spent INT DEFAULT 0,
    answers_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CẤU HÌNH QUYỀN TRUY CẬP (RLS POLICIES — Mở quyền Đọc / Ghi công khai)
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc / ghi đề thi
CREATE POLICY "Allow public select tests" ON public.tests FOR SELECT USING (true);
CREATE POLICY "Allow public insert tests" ON public.tests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tests" ON public.tests FOR UPDATE USING (true);

-- Cho phép đọc / ghi kết quả bài thi
CREATE POLICY "Allow public select results" ON public.results FOR SELECT USING (true);
CREATE POLICY "Allow public insert results" ON public.results FOR INSERT WITH CHECK (true);

-- Cho phép truy cập qua API công khai (anon)
GRANT ALL ON TABLE public.tests TO anon, authenticated;
GRANT ALL ON TABLE public.results TO anon, authenticated;
