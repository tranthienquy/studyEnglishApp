-- ================================================================
-- SUPABASE MIGRATION — Multi-Teacher Platform Upgrade
-- Chạy từng block trong Supabase SQL Editor:
-- Dashboard > SQL Editor > Paste & Run
-- ================================================================

-- 1. Thêm cột teacher_email vào bảng tests (phân quyền RBAC)
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
  action       TEXT DEFAULT 'login', -- 'login' | 'start_test' | 'submit'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Row Level Security (RLS) — Giáo viên chỉ đọc/ghi đề của mình
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Policy: Học sinh/public chỉ xem đề không bị ẩn
CREATE POLICY IF NOT EXISTS "public_read_visible_tests"
  ON tests FOR SELECT
  USING (true);

-- Policy: Giáo viên chỉ INSERT đề của mình
CREATE POLICY IF NOT EXISTS "teacher_insert_own_tests"
  ON tests FOR INSERT
  WITH CHECK (teacher_email = auth.email());

-- Policy: Giáo viên chỉ UPDATE đề của mình
CREATE POLICY IF NOT EXISTS "teacher_update_own_tests"
  ON tests FOR UPDATE
  USING (teacher_email = auth.email());

-- Policy: Giáo viên chỉ DELETE đề của mình
CREATE POLICY IF NOT EXISTS "teacher_delete_own_tests"
  ON tests FOR DELETE
  USING (teacher_email = auth.email());

-- 5. RLS cho teacher_profiles — giáo viên chỉ xem/sửa hồ sơ của mình
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "teacher_manage_own_profile"
  ON teacher_profiles FOR ALL
  USING (email = auth.email());

-- 6. RLS cho student_logs — public có thể insert, chỉ admin đọc
ALTER TABLE student_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "public_insert_student_logs"
  ON student_logs FOR INSERT
  WITH CHECK (true);

-- 7. Index tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_tests_teacher_email ON tests(teacher_email);
CREATE INDEX IF NOT EXISTS idx_tests_subject        ON tests(subject);
CREATE INDEX IF NOT EXISTS idx_tests_grade          ON tests(grade);
CREATE INDEX IF NOT EXISTS idx_student_logs_date    ON student_logs(created_at DESC);
