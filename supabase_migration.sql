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
  role            TEXT DEFAULT 'teacher',
  subject_default TEXT DEFAULT 'Tiếng Anh',
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ,
  login_count     INT DEFAULT 1
);

-- Đảm bảo các cột mới tồn tại nếu bảng đã được tạo trước đó
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'teacher';
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 1;

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
DROP POLICY IF EXISTS "Enable read access for all users" ON tests;
CREATE POLICY "public_read_visible_tests"
  ON tests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "teacher_insert_own_tests" ON tests;
DROP POLICY IF EXISTS "public_insert_tests" ON tests;
DROP POLICY IF EXISTS "Enable insert access for all users" ON tests;
CREATE POLICY "teacher_insert_own_tests"
  ON tests FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' OR auth.jwt() ->> 'email' LIKE '%@fpt.edu.vn' OR auth.jwt() ->> 'email' LIKE '%@fe.edu.vn' OR auth.jwt() ->> 'email' IN ('quytt16@fpt.edu.vn', 'feexpspace@gmail.com')
  );

DROP POLICY IF EXISTS "teacher_update_own_tests" ON tests;
DROP POLICY IF EXISTS "public_update_tests" ON tests;
CREATE POLICY "teacher_update_own_tests"
  ON tests FOR UPDATE
  USING (
    auth.role() = 'authenticated' OR auth.jwt() ->> 'email' LIKE '%@fpt.edu.vn' OR auth.jwt() ->> 'email' LIKE '%@fe.edu.vn' OR auth.jwt() ->> 'email' IN ('quytt16@fpt.edu.vn', 'feexpspace@gmail.com')
  );

DROP POLICY IF EXISTS "teacher_delete_own_tests" ON tests;
DROP POLICY IF EXISTS "public_delete_tests" ON tests;
DROP POLICY IF EXISTS "Enable delete access for all users" ON tests;
CREATE POLICY "teacher_delete_own_tests"
  ON tests FOR DELETE
  USING (
    auth.role() = 'authenticated' OR auth.jwt() ->> 'email' LIKE '%@fpt.edu.vn' OR auth.jwt() ->> 'email' LIKE '%@fe.edu.vn' OR auth.jwt() ->> 'email' IN ('quytt16@fpt.edu.vn', 'feexpspace@gmail.com')
  );

-- 5. RLS — Bảng teacher_profiles
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_manage_own_profile" ON teacher_profiles;
DROP POLICY IF EXISTS "public_teacher_profiles" ON teacher_profiles;

CREATE POLICY "public_teacher_profiles"
  ON teacher_profiles FOR ALL
  USING (true)
  WITH CHECK (true);

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
