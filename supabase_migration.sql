-- ================================================================
-- SUPABASE MIGRATION — Multi-Teacher Platform Upgrade
-- Copy toàn bộ file này và dán vào Supabase SQL Editor > Run
-- ================================================================

-- 1. Tạo & bổ sung bảng tests (Kho đề ôn tập)
CREATE TABLE IF NOT EXISTS tests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT UNIQUE NOT NULL,
  title          TEXT NOT NULL,
  subject        TEXT DEFAULT 'TIẾNG ANH',
  grade          TEXT DEFAULT '12',
  duration       INT DEFAULT 45,
  teacher        TEXT DEFAULT 'Cô Trang',
  teacher_email  TEXT,
  teacher_name   TEXT,
  passage        TEXT,
  questions_json JSONB,
  sections_json  JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS teacher_email TEXT,
  ADD COLUMN IF NOT EXISTS teacher_name  TEXT,
  ADD COLUMN IF NOT EXISTS grade         TEXT DEFAULT '12';

-- 2. Tạo bảng hồ sơ giáo viên
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  role            TEXT DEFAULT 'teacher',
  subject_default TEXT DEFAULT 'Tiếng Anh',
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ,
  login_count     INT DEFAULT 1
);

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'teacher';
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 1;

-- 3. Tạo bảng tài khoản học sinh
CREATE TABLE IF NOT EXISTS student_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  class         TEXT DEFAULT 'N/A',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  login_count   INT DEFAULT 1
);

-- 4. Tạo bảng log học sinh sử dụng hệ thống
CREATE TABLE IF NOT EXISTS student_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    TEXT,
  student_name  TEXT NOT NULL,
  student_class TEXT,
  test_id       TEXT,
  test_title    TEXT,
  action        TEXT DEFAULT 'login',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row Level Security (RLS) — Mở quyền cho tất cả các bảng
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_visible_tests" ON tests;
DROP POLICY IF EXISTS "teacher_insert_own_tests" ON tests;
DROP POLICY IF EXISTS "teacher_update_own_tests" ON tests;
DROP POLICY IF EXISTS "teacher_delete_own_tests" ON tests;
DROP POLICY IF EXISTS "public_tests_all" ON tests;
CREATE POLICY "public_tests_all" ON tests FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teacher_manage_own_profile" ON teacher_profiles;
DROP POLICY IF EXISTS "public_teacher_profiles" ON teacher_profiles;
CREATE POLICY "public_teacher_profiles" ON teacher_profiles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE student_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_student_accounts" ON student_accounts;
CREATE POLICY "public_student_accounts" ON student_accounts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE student_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_insert_student_logs" ON student_logs;
DROP POLICY IF EXISTS "public_student_logs" ON student_logs;
CREATE POLICY "public_student_logs" ON student_logs FOR ALL USING (true) WITH CHECK (true);

-- 6. Index tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_tests_teacher_email ON tests(teacher_email);
CREATE INDEX IF NOT EXISTS idx_tests_subject        ON tests(subject);
CREATE INDEX IF NOT EXISTS idx_tests_grade          ON tests(grade);
CREATE INDEX IF NOT EXISTS idx_student_logs_date    ON student_logs(created_at DESC);
