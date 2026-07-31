-- ================================================================
-- SUPABASE MIGRATION — Multi-Teacher Platform Upgrade
-- Copy toàn bộ file này và dán vào Supabase SQL Editor > Run
-- ================================================================

-- 1. Thêm cột teacher_email, teacher_name, grade vào bảng tests
ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS teacher_email TEXT,
  ADD COLUMN IF NOT EXISTS teacher_name  TEXT,
  ADD COLUMN IF NOT EXISTS grade         TEXT DEFAULT '12';

-- Cập nhật các bản ghi cũ chưa có teacher_email
UPDATE tests
SET teacher_email = 'admin@fpt.edu.vn'
WHERE teacher_email IS NULL;

-- 2. Tạo bảng hồ sơ giáo viên
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  subject_default TEXT DEFAULT 'Tiếng Anh',
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

-- 3. Tạo bảng log học sinh sử dụng hệ thống
CREATE TABLE IF NOT EXISTS student_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_class TEXT,
  test_id      TEXT,
  test_title   TEXT,
  action       TEXT DEFAULT 'login',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Row Level Security (RLS) — Bảng tests
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_visible_tests" ON tests;
CREATE POLICY "public_read_visible_tests"
  ON tests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "teacher_insert_own_tests" ON tests;
CREATE POLICY "teacher_insert_own_tests"
  ON tests FOR INSERT
  WITH CHECK (teacher_email = auth.email());

DROP POLICY IF EXISTS "teacher_update_own_tests" ON tests;
CREATE POLICY "teacher_update_own_tests"
  ON tests FOR UPDATE
  USING (teacher_email = auth.email());

DROP POLICY IF EXISTS "teacher_delete_own_tests" ON tests;
CREATE POLICY "teacher_delete_own_tests"
  ON tests FOR DELETE
  USING (teacher_email = auth.email());

-- 5. RLS — Bảng teacher_profiles
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_manage_own_profile" ON teacher_profiles;
CREATE POLICY "teacher_manage_own_profile"
  ON teacher_profiles FOR ALL
  USING (email = auth.email());

-- 6. RLS — Bảng student_logs
ALTER TABLE student_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_student_logs" ON student_logs;
CREATE POLICY "public_insert_student_logs"
  ON student_logs FOR INSERT
  WITH CHECK (true);

-- 7. Index tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_tests_teacher_email ON tests(teacher_email);
CREATE INDEX IF NOT EXISTS idx_tests_subject        ON tests(subject);
CREATE INDEX IF NOT EXISTS idx_tests_grade          ON tests(grade);
CREATE INDEX IF NOT EXISTS idx_student_logs_date    ON student_logs(created_at DESC);
