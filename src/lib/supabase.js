import { createClient } from '@supabase/supabase-js';
import { MOCK_TESTS, MOCK_LEADERBOARD } from './mockData';

// Get config from localStorage or env vars
export function getSupabaseConfig() {
  const localConfig = localStorage.getItem('readingpro_supabase_config');
  if (localConfig) {
    try {
      const parsed = JSON.parse(localConfig);
      if (parsed.url && parsed.key) return parsed;
    } catch {}
  }
  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}

export function saveSupabaseConfig(url, key) {
  if (!url || !key) {
    localStorage.removeItem('readingpro_supabase_config');
  } else {
    const trimmedKey = key.trim();
    // Prevent user from saving service_role key into browser localStorage
    if (trimmedKey.includes('service_role') || (trimmedKey.length > 50 && trimmedKey.toLowerCase().includes('secret'))) {
      throw new Error('CẢNH BÁO BẢO MẬT: Không được lưu Service Role / Secret Key vào trình duyệt! Chỉ sử dụng Anon (Public) Key.');
    }
    localStorage.setItem('readingpro_supabase_config', JSON.stringify({ url: url.trim(), key: trimmedKey }));
  }
  // Reset client so it re-initializes
  supabaseClient = null;
}

let supabaseClient = null;

export function getClient() {
  if (supabaseClient) return supabaseClient;
  const config = getSupabaseConfig();
  if (config.url && config.key) {
    try {
      supabaseClient = createClient(config.url, config.key);
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }
  return supabaseClient;
}

export function isRealSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.key);
}

// ---- Test database live connection ----
export async function testDatabaseConnection() {
  const config = getSupabaseConfig();
  if (!config.url || !config.key) {
    return {
      success: false,
      mode: 'local',
      message: 'Chưa cấu hình URL/Key. Hệ thống hiện đang lưu trữ tự động trong Bộ nhớ trình duyệt (Local Storage).'
    };
  }

  const client = getClient();
  if (!client) {
    return {
      success: false,
      mode: 'error',
      message: 'Không thể tạo Supabase Client. Kiểm tra lại định dạng URL & Key.'
    };
  }

  try {
    const { data, error } = await client.from('tests').select('id').limit(1);
    if (error) {
      return {
        success: false,
        mode: 'error',
        message: `Kết nối Supabase bị từ chối: ${error.message}`
      };
    }
    return {
      success: true,
      mode: 'supabase',
      message: '🟢 Đã kết nối thành công với Database Supabase thực tế! Dữ liệu đang được lưu trữ trực tuyến.'
    };
  } catch (e) {
    return {
      success: false,
      mode: 'error',
      message: `Lỗi kết nối CSDL: ${e.message}`
    };
  }
}

// Local storage fallback for custom tests & deleted test IDs
function getLocalCustomTests() {
  try {
    const raw = localStorage.getItem('readingpro_custom_tests');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getDeletedTestIds() {
  try {
    const raw = localStorage.getItem('readingpro_deleted_tests');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getHiddenTestIds() {
  try {
    const raw = localStorage.getItem('readingpro_hidden_tests');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isTestHidden(testIdOrCode) {
  if (!testIdOrCode) return false;
  const hidden = getHiddenTestIds();
  return hidden.includes(String(testIdOrCode));
}

export function toggleHideTest(testIdOrCode) {
  if (!testIdOrCode) return false;
  const hidden = getHiddenTestIds();
  const idStr = String(testIdOrCode);
  let updated;
  if (hidden.includes(idStr)) {
    updated = hidden.filter(id => id !== idStr);
  } else {
    updated = [...hidden, idStr];
  }
  localStorage.setItem('readingpro_hidden_tests', JSON.stringify(updated));
  return updated.includes(idStr); // returns true if now hidden
}

function saveLocalCustomTest(test) {
  const existing = getLocalCustomTests();
  const updated = [test, ...existing.filter(t => t.code !== test.code)];
  localStorage.setItem('readingpro_custom_tests', JSON.stringify(updated));
}

// ---- Get test by code ----
export async function getTestByCode(code) {
  const deletedIds = getDeletedTestIds();
  if (deletedIds.includes(String(code))) return null;

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('tests').select('*').eq('code', code).single();
      if (!error && data) return formatTestFromDB(data);
    } catch (e) {
      console.warn('Supabase fetch failed, fallback to local:', e);
    }
  }

  // Fallback: search local custom tests + mock tests
  const custom = getLocalCustomTests();
  const allLocal = [...custom, ...MOCK_TESTS];
  const found = allLocal.find(t => t.code === code || t.id === code);
  if (found && (deletedIds.includes(String(found.id)) || deletedIds.includes(String(found.code)))) {
    return null;
  }
  return found || null;
}

// ---- Get all tests ----
export async function getAllTests(includeHidden = false, teacherEmailFilter = null) {
  const deletedIds = getDeletedTestIds();
  const isDeleted = (t) => deletedIds.includes(String(t.id)) || deletedIds.includes(String(t.code));
  const hiddenIds = getHiddenTestIds();
  const isHidden = (t) => hiddenIds.includes(String(t.id)) || hiddenIds.includes(String(t.code));

  const client = getClient();
  let dbTests = [];
  
  if (client) {
    try {
      let query = client.from('tests').select('*').order('created_at', { ascending: false });
      if (teacherEmailFilter) {
        query = query.ilike('teacher_email', teacherEmailFilter);
      }
      const { data, error } = await query;
      if (!error && data) {
        dbTests = data.map(formatTestFromDB);
      }
    } catch (e) {
      console.warn('Supabase fetch all failed, fallback to local:', e);
    }
  }

  const localTests = getLocalCustomTests();

  // Merge tests, preferring DB tests over local tests by code
  const merged = [...dbTests];
  for (const lt of localTests) {
    if (!merged.find(t => t.code === lt.code)) {
      merged.push(lt);
    }
  }
  
  // Include mock tests ONLY if no teacherEmailFilter is passed (i.e. for students browsing all public tests)
  if (!teacherEmailFilter) {
    for (const mt of MOCK_TESTS) {
      if (!merged.find(t => t.code === mt.code)) {
        merged.push(mt);
      }
    }
  }
  
  return merged.filter(t => {
    if (isDeleted(t)) return false;
    if (!includeHidden && isHidden(t)) return false;
    if (teacherEmailFilter) {
      // STRICT SECURITY: If teacherEmailFilter is active, ONLY return tests matching this teacher's email!
      if (!t.teacher_email || t.teacher_email.toLowerCase() !== teacherEmailFilter.toLowerCase()) {
        return false;
      }
    }
    return true;
  });
}

// Local storage for results log
function getLocalResults() {
  try {
    const raw = localStorage.getItem('readingpro_results_log');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalResult(res) {
  const existing = getLocalResults();
  const updated = [res, ...existing];
  localStorage.setItem('readingpro_results_log', JSON.stringify(updated));
}

// ---- Save result (student) ----
export async function saveResult(resultData) {
  const client = getClient();
  let savedRecord = null;

  if (client) {
    try {
      const { data, error } = await client.from('results').insert({
        student_name: resultData.student_name,
        student_class: resultData.student_class,
        teacher: resultData.teacher,
        test_id: String(resultData.test_id),
        test_code: resultData.test_code,
        test_title: resultData.test_title,
        score: resultData.score,
        correct_count: resultData.correct_count,
        time_spent: resultData.time_spent,
        answers_json: resultData.answers_json,
        created_at: new Date().toISOString(),
      }).select().single();

      if (!error && data) savedRecord = data;
    } catch (e) {
      console.warn('Supabase save result failed:', e);
    }
  }

  if (!savedRecord) {
    savedRecord = { id: `local-${Date.now()}`, ...resultData, created_at: new Date().toISOString() };
  }

  saveLocalResult(savedRecord);
  return savedRecord;
}

// ---- Get submissions for a test (or all tests) ----
export async function getTestSubmissions(testId) {
  const client = getClient();
  let dbResults = [];
  
  if (client) {
    try {
      const { data, error } = await client.from('results').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        if (testId) {
          const cleanId = String(testId).replace('custom-', '');
          dbResults = data.filter(r =>
            String(r.test_id) === String(testId) ||
            String(r.test_id) === String(cleanId) ||
            String(r.test_code) === String(testId) ||
            (r.test_id && String(r.test_id).includes(String(testId)))
          );
        } else {
          dbResults = data;
        }
      }
    } catch (e) {
      console.warn('Supabase get results error:', e);
    }
  }

  const localResults = getLocalResults();
  const filteredLocal = testId
    ? localResults.filter(r => String(r.test_id) === String(testId) || String(r.test_code) === String(testId))
    : localResults;

  const merged = [...dbResults];
  for (const lr of filteredLocal) {
    if (!merged.find(r => String(r.id) === String(lr.id))) {
      merged.push(lr);
    }
  }

  return merged;
}

// ---- Export student submissions to formatted Excel (.xls) ----
export function exportResultsToExcel(testTitle, submissions = []) {
  if (!submissions || submissions.length === 0) {
    alert('Chưa có lượt làm bài nào để xuất file Excel!');
    return;
  }

  const cleanTitle = (testTitle || 'BÀI THI KHẢO SÁT TRỰC TUYẾN').toUpperCase();

  const tableRowsHtml = submissions.map((s, idx) => {
    const submittedDate = s.created_at
      ? new Date(s.created_at).toLocaleString('vi-VN')
      : new Date().toLocaleString('vi-VN');

    const scoreVal = s.score !== undefined ? Number(s.score).toFixed(1) : '0.0';

    return `
      <tr>
        <td style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 12pt;">${idx + 1}</td>
        <td style="text-align: left; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold;">${s.student_name || 'Học sinh'}</td>
        <td style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 12pt;">${s.student_class || '12A1'}</td>
        <td style="text-align: left; font-family: 'Times New Roman', Times, serif; font-size: 12pt;">${testTitle || s.test_title || 'Đề thi'}</td>
        <td style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; color: #C2410C;">${scoreVal}</td>
        <td style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 12pt;">${s.correct_count || 'N/A'}</td>
        <td style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 12pt;">${s.time_spent || 'N/A'}</td>
        <td style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 12pt;">${submittedDate}</td>
      </tr>
    `;
  }).join('');

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>KetQuaHocSinh</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; }
        table { border-collapse: collapse; width: 100%; font-family: 'Times New Roman', Times, serif; }
        th {
          background-color: #FFEDD5 !important; /* Nền cam nhạt (Amber/Orange 100) */
          color: #000000 !important; /* Chữ màu đen */
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 13pt;
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
          border: 1px solid #F97316;
          padding: 10px 14px;
        }
        td {
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 12pt;
          vertical-align: middle;
          border: 1px solid #D1D5DB;
          padding: 8px 12px;
        }
        tr:nth-child(even) {
          background-color: #FFF7ED; /* Hàng xen kẽ cam nhạt dịu */
        }
      </style>
    </head>
    <body>
      <h2 style="font-family: 'Times New Roman', Times, serif; text-align: center; color: #EA580C; margin-top: 10px; margin-bottom: 5px;">
        BẢNG THỐNG KÊ KẾT QUẢ THI TRỰC TUYẾN - ${cleanTitle}
      </h2>
      <p style="font-family: 'Times New Roman', Times, serif; text-align: center; color: #4B5563; font-size: 11pt; margin-top: 0; margin-bottom: 15px;">
        Ngày xuất dữ liệu: ${new Date().toLocaleString('vi-VN')}
      </p>
      <table>
        <thead>
          <tr>
            <th style="background-color: #FFEDD5; color: #000000; font-family: 'Times New Roman', serif;">STT</th>
            <th style="background-color: #FFEDD5; color: #000000; font-family: 'Times New Roman', serif;">Họ và Tên Học Sinh</th>
            <th style="background-color: #FFEDD5; color: #000000; font-family: 'Times New Roman', serif;">Lớp</th>
            <th style="background-color: #FFEDD5; color: #000000; font-family: 'Times New Roman', serif;">Tên Bài Thi</th>
            <th style="background-color: #FFEDD5; color: #000000; font-family: 'Times New Roman', serif;">Điểm Số (Thang 10)</th>
            <th style="background-color: #FFEDD5; color: #000000; font-family: 'Times New Roman', serif;">Số Câu Đúng</th>
            <th style="background-color: #FFEDD5; color: #000000; font-family: 'Times New Roman', serif;">Thời Gian Làm Bài</th>
            <th style="background-color: #FFEDD5; color: #000000; font-family: 'Times New Roman', serif;">Ngày Giờ Nộp Bài</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanFileName = (testTitle || 'Danh_sach_ket_qua_hoc_sinh')
    .replace(/[^a-zA-Z0-9_ -]/g, '')
    .replace(/\s+/g, '_');
  link.setAttribute('download', `${cleanFileName}_BangDiem_HocSinh.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ---- Get leaderboard ----
export async function getLeaderboard(testId) {
  const client = getClient();
  if (client) {
    try {
      let query = client.from('results').select('*').order('score', { ascending: false }).limit(20);
      if (testId) query = query.eq('test_id', testId);
      const { data, error } = await query;
      if (!error && data) {
        return data.map((row, i) => ({
          rank: i + 1,
          name: row.student_name,
          class: row.student_class,
          score: row.score,
          time: row.time_spent,
        }));
      }
    } catch (e) {
      console.warn('Supabase leaderboard fetch failed:', e);
    }
  }

  return MOCK_LEADERBOARD;
}

// ---- Save test (teacher) ----
export async function saveTest(testData, teacherEmail = null) {
  const formattedForDB = {
    code: testData.code,
    title: testData.title,
    subject: testData.subject || 'TIẾNG ANH',
    duration: parseInt(testData.duration) || 45,
    teacher: testData.teacher || 'Cô Trang',
    teacher_email: teacherEmail || testData.teacher_email || null,
    passage: testData.passage,
    questions_json: testData.questions_json,
    sections_json: testData.sections,
    created_at: new Date().toISOString(),
  };

  // Remove from deleted list if it was previously deleted
  const deletedIds = getDeletedTestIds();
  const newDeleted = deletedIds.filter(id => id !== String(testData.code));
  localStorage.setItem('readingpro_deleted_tests', JSON.stringify(newDeleted));

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('tests').upsert(formattedForDB, { onConflict: 'code' }).select().single();
      if (!error && data) {
        saveLocalCustomTest(formatTestFromDB(data));
        return data;
      }
      if (error) {
        console.warn('Supabase save test error (falling back to Local Storage):', error.message);
        const mockCreated = {
          id: `custom-${Date.now()}`,
          ...formattedForDB,
          sections: testData.sections || null,
        };
        saveLocalCustomTest(formatTestFromDB(mockCreated));
        return mockCreated;
      }
    } catch (e) {
      console.warn('Supabase save test exception (falling back to Local Storage):', e.message);
      const mockCreated = {
        id: `custom-${Date.now()}`,
        ...formattedForDB,
        sections: testData.sections || null,
      };
      saveLocalCustomTest(formatTestFromDB(mockCreated));
      return mockCreated;
    }
  }

  // Fail-safe fallback: save to localStorage custom tests so upload NEVER fails
  const mockCreated = {
    id: `custom-${Date.now()}`,
    ...formattedForDB,
    sections: testData.sections || null,
  };
  saveLocalCustomTest(formatTestFromDB(mockCreated));
  return mockCreated;
}

// ---- Delete test (teacher) ----
export async function deleteTest(idOrCode) {
  const client = getClient();
  if (client) {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
      const query = client.from('tests').delete();
      const { error } = isUUID ? await query.eq('id', idOrCode) : await query.eq('code', idOrCode);
      if (error) console.error('Supabase delete error:', error);
    } catch (e) {
      console.warn('Supabase delete test failed:', e);
    }
  }

  // Always remove from local custom tests
  const custom = getLocalCustomTests();
  const updated = custom.filter(t => String(t.id) !== String(idOrCode) && String(t.code) !== String(idOrCode));
  localStorage.setItem('readingpro_custom_tests', JSON.stringify(updated));

  // Record in deleted test IDs so mock tests & custom tests stay deleted
  const deleted = getDeletedTestIds();
  const idStr = String(idOrCode);
  if (!deleted.includes(idStr)) {
    deleted.push(idStr);
    localStorage.setItem('readingpro_deleted_tests', JSON.stringify(deleted));
  }
}

// ---- Clear all default mock demo tests ----
export function clearAllMockTests() {
  const deleted = getDeletedTestIds();
  MOCK_TESTS.forEach(m => {
    if (m.id && !deleted.includes(String(m.id))) deleted.push(String(m.id));
    if (m.code && !deleted.includes(String(m.code))) deleted.push(String(m.code));
  });
  localStorage.setItem('readingpro_deleted_tests', JSON.stringify(deleted));
}

// ---- Teacher Profiles & Student Activity Logs ----
export async function getAllTeacherProfiles() {
  const client = getClient();
  let dbProfiles = [];
  if (client) {
    try {
      const { data } = await client.from('teacher_profiles').select('*').order('last_login_at', { ascending: false });
      if (data && data.length > 0) dbProfiles = data;
    } catch (e) {
      console.warn('Fetch teacher profiles failed:', e);
    }
  }

  const localProfiles = getLocalTeacherProfiles();

  // Deduplicate by email
  const mergedMap = new Map();
  for (const lp of localProfiles) {
    if (lp?.email) mergedMap.set(lp.email.toLowerCase(), lp);
  }
  for (const dp of dbProfiles) {
    if (dp?.email) {
      const existing = mergedMap.get(dp.email.toLowerCase()) || {};
      mergedMap.set(dp.email.toLowerCase(), { ...existing, ...dp });
    }
  }

  return Array.from(mergedMap.values()).sort((a, b) => {
    const timeA = new Date(a.last_login_at || a.created_at || 0).getTime();
    const timeB = new Date(b.last_login_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });
}

export async function createTeacherProfile({ email, name, role = 'teacher', subject_default = 'Tiếng Anh' }) {
  const client = getClient();
  const profile = {
    email: email.trim().toLowerCase(),
    name: name.trim(),
    role: role || 'teacher',
    subject_default: subject_default || 'Tiếng Anh',
    is_active: true,
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  if (client) {
    try {
      const { error } = await client.from('teacher_profiles').upsert(profile, { onConflict: 'email' });
      if (error) console.warn('Supabase createTeacherProfile notice:', error.message);
    } catch (e) {
      console.warn('Supabase createTeacherProfile failed:', e);
    }
  }

  // Local Storage Sync
  try {
    const profiles = getLocalTeacherProfiles();
    const existingIdx = profiles.findIndex(p => p.email === profile.email);
    if (existingIdx >= 0) {
      profiles[existingIdx] = { ...profiles[existingIdx], ...profile };
    } else {
      profiles.unshift(profile);
    }
    localStorage.setItem('readingpro_teacher_profiles', JSON.stringify(profiles));
  } catch {}

  return profile;
}

export async function updateTeacherProfile(email, updates) {
  const client = getClient();
  const cleanEmail = email.trim().toLowerCase();

  if (client) {
    try {
      const { error } = await client.from('teacher_profiles').update(updates).eq('email', cleanEmail);
      if (error) console.warn('Supabase updateTeacherProfile notice:', error.message);
    } catch (e) {
      console.warn('Supabase updateTeacherProfile failed:', e);
    }
  }

  // Local Storage Sync
  try {
    const profiles = getLocalTeacherProfiles();
    const updated = profiles.map(p => p.email === cleanEmail ? { ...p, ...updates } : p);
    localStorage.setItem('readingpro_teacher_profiles', JSON.stringify(updated));
  } catch {}
}

export async function deleteTeacherProfile(email) {
  const client = getClient();
  const cleanEmail = email.trim().toLowerCase();

  if (client) {
    try {
      const { error } = await client.from('teacher_profiles').delete().eq('email', cleanEmail);
      if (error) console.warn('Supabase deleteTeacherProfile notice:', error.message);
    } catch (e) {
      console.warn('Supabase deleteTeacherProfile failed:', e);
    }
  }

  // Local Storage Sync
  try {
    const profiles = getLocalTeacherProfiles();
    const updated = profiles.filter(p => p.email !== cleanEmail);
    localStorage.setItem('readingpro_teacher_profiles', JSON.stringify(updated));
  } catch {}
}

function getLocalTeacherProfiles() {
  try {
    const raw = localStorage.getItem('readingpro_teacher_profiles');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export async function upsertStudentAccount({ studentId, name, studentClass }) {
  const cleanName = name?.trim() || 'Học sinh';
  const cleanClass = studentClass?.trim().toUpperCase() || 'N/A';
  const cleanId = studentId
    ? String(studentId).trim().toUpperCase()
    : `HS-${cleanName.toLowerCase().replace(/\s+/g, '')}-${cleanClass}`;

  const now = new Date().toISOString();

  // Read existing from local storage to calculate login_count & created_at
  let existingAccount = null;
  try {
    const raw = localStorage.getItem('readingpro_student_accounts');
    if (raw) {
      const accounts = JSON.parse(raw);
      existingAccount = accounts.find(a => a.student_id?.toUpperCase() === cleanId) || null;
    }
  } catch {}

  const loginCount = (existingAccount?.login_count || 0) + 1;
  const createdAt = existingAccount?.created_at || now;

  const accountData = {
    student_id: cleanId,
    name: cleanName,
    class: cleanClass,
    created_at: createdAt,
    last_login_at: now,
    login_count: loginCount,
  };

  // Sync to Supabase DB student_accounts
  const client = getClient();
  if (client) {
    try {
      const { error } = await client.from('student_accounts').upsert({
        student_id: cleanId,
        name: cleanName,
        class: cleanClass,
        last_login_at: now,
      }, { onConflict: 'student_id' });
      if (error) console.warn('Supabase student_accounts upsert notice:', error.message);
    } catch (e) {
      console.warn('Supabase student_accounts upsert failed:', e);
    }
  }

  // Sync to LocalStorage (deduplicate by student_id)
  try {
    const raw = localStorage.getItem('readingpro_student_accounts');
    const accounts = raw ? JSON.parse(raw) : [];
    const idx = accounts.findIndex(a => a.student_id?.toUpperCase() === cleanId);
    if (idx >= 0) {
      accounts[idx] = {
        ...accounts[idx],
        name: cleanName || accounts[idx].name,
        class: cleanClass || accounts[idx].class,
        last_login_at: now,
        login_count: loginCount,
      };
    } else {
      accounts.unshift(accountData);
    }
    localStorage.setItem('readingpro_student_accounts', JSON.stringify(accounts));
  } catch (e) {
    console.warn('LocalStorage sync student account failed:', e);
  }
}

export async function getAllStudentAccounts() {
  const client = getClient();
  let dbAccounts = [];
  let dbResults = [];
  let dbLogs = [];

  if (client) {
    try {
      const [accRes, resRes, logRes] = await Promise.all([
        client.from('student_accounts').select('*'),
        client.from('results').select('*'),
        client.from('student_logs').select('*'),
      ]);
      if (accRes.data) dbAccounts = accRes.data;
      if (resRes.data) dbResults = resRes.data;
      if (logRes.data) dbLogs = logRes.data;
    } catch (e) {
      console.warn('Fetch DB for student accounts failed:', e);
    }
  }

  let localAccounts = [];
  let localLogs = [];
  let localResults = [];
  try {
    const rawA = localStorage.getItem('readingpro_student_accounts');
    if (rawA) localAccounts = JSON.parse(rawA);
    const rawL = localStorage.getItem('readingpro_student_logs');
    if (rawL) localLogs = JSON.parse(rawL);
    const rawR = localStorage.getItem('readingpro_results_log');
    if (rawR) localResults = JSON.parse(rawR);
  } catch {}

  const mergedMap = new Map();

  const addOrUpdate = (studentId, name, studentClass, time) => {
    const cleanName = name?.trim() || 'Học sinh';
    const cleanClass = studentClass?.trim().toUpperCase() || 'N/A';
    let cleanId = studentId ? String(studentId).trim().toUpperCase() : '';

    if (!cleanId || cleanId === 'N/A') {
      cleanId = `HS-${cleanName.toLowerCase().replace(/\s+/g, '')}-${cleanClass}`;
    }

    const logTime = time ? new Date(time).toISOString() : new Date().toISOString();
    const existing = mergedMap.get(cleanId);

    if (existing) {
      if (cleanName && cleanName !== 'Học sinh') existing.name = cleanName;
      if (cleanClass && cleanClass !== 'N/A') existing.class = cleanClass;
      existing.login_count = (existing.login_count || 1) + 1;
      if (new Date(logTime) > new Date(existing.last_login_at || 0)) {
        existing.last_login_at = logTime;
      }
      if (new Date(logTime) < new Date(existing.created_at || logTime)) {
        existing.created_at = logTime;
      }
    } else {
      mergedMap.set(cleanId, {
        student_id: cleanId,
        name: cleanName,
        class: cleanClass,
        created_at: logTime,
        last_login_at: logTime,
        login_count: 1,
      });
    }
  };

  // 1. DB student_accounts
  for (const a of dbAccounts) {
    if (a?.student_id) {
      const cleanId = a.student_id.toUpperCase();
      mergedMap.set(cleanId, {
        student_id: cleanId,
        name: a.name || 'Học sinh',
        class: a.class || 'N/A',
        created_at: a.created_at || new Date().toISOString(),
        last_login_at: a.last_login_at || new Date().toISOString(),
        login_count: a.login_count || 1,
      });
    }
  }

  // 2. Local accounts
  for (const a of localAccounts) {
    if (a?.student_id) {
      const cleanId = a.student_id.toUpperCase();
      if (!mergedMap.has(cleanId)) {
        mergedMap.set(cleanId, { ...a, student_id: cleanId });
      }
    }
  }

  // 3. DB results & student_logs
  for (const r of dbResults) {
    addOrUpdate(r.student_id || r.studentId, r.student_name, r.student_class, r.created_at);
  }
  for (const l of dbLogs) {
    addOrUpdate(l.student_id || l.studentId, l.student_name, l.student_class, l.created_at);
  }

  // 4. Local logs & results
  for (const l of localLogs) {
    addOrUpdate(l.student_id || l.studentId, l.student_name || l.studentName, l.student_class || l.studentClass, l.created_at);
  }
  for (const r of localResults) {
    addOrUpdate(r.student_id || r.studentId, r.student_name || r.studentName, r.student_class || r.studentClass, r.created_at);
  }

  return Array.from(mergedMap.values()).sort((a, b) => {
    const timeA = new Date(a.last_login_at || a.created_at || 0).getTime();
    const timeB = new Date(b.last_login_at || b.created_at || 0).getTime();
    return timeB - timeA;
  });
}

export async function saveStudentLog(studentName, studentClass, testId = null, testTitle = null, studentId = null) {
  const cleanName = studentName?.trim() || 'Học sinh';
  const cleanClass = studentClass?.trim().toUpperCase() || 'N/A';
  const cleanId = studentId
    ? String(studentId).trim().toUpperCase()
    : `HS-${cleanName.toLowerCase().replace(/\s+/g, '')}-${cleanClass}`;

  const logData = {
    student_id: cleanId,
    student_name: cleanName,
    student_class: cleanClass,
    test_id: testId,
    test_title: testTitle,
    action: testTitle ? `Thi: ${testTitle}` : 'login',
    created_at: new Date().toISOString(),
  };

  await upsertStudentAccount({ studentId: cleanId, name: cleanName, studentClass: cleanClass });

  const client = getClient();
  if (client) {
    try {
      const { error } = await client.from('student_logs').insert(logData);
      if (error) console.warn('Supabase save student log notice:', error.message);
    } catch (e) {
      console.warn('Supabase save student log failed:', e);
    }
  }

  // Local storage fallback
  try {
    const raw = localStorage.getItem('readingpro_student_logs');
    const existing = raw ? JSON.parse(raw) : [];
    localStorage.setItem('readingpro_student_logs', JSON.stringify([logData, ...existing]));
  } catch {}
}

export async function getAllStudentLogs() {
  const client = getClient();
  let dbResults = [];
  let dbLogs = [];

  if (client) {
    try {
      const [resRes, logRes] = await Promise.all([
        client.from('results').select('*').order('created_at', { ascending: false }).limit(100),
        client.from('student_logs').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      if (resRes.data) dbResults = resRes.data;
      if (logRes.data) dbLogs = logRes.data;
    } catch (e) {
      console.warn('Fetch DB student logs/results failed:', e);
    }
  }

  let localLogs = [];
  let localResults = [];
  try {
    const rawL = localStorage.getItem('readingpro_student_logs');
    if (rawL) localLogs = JSON.parse(rawL);
    const rawR = localStorage.getItem('readingpro_results_log');
    if (rawR) localResults = JSON.parse(rawR);
  } catch {}

  const allLogs = [];

  for (const l of dbLogs) {
    allLogs.push({
      student_id: l.student_id || 'N/A',
      student_name: l.student_name || 'Học sinh',
      student_class: l.student_class || 'N/A',
      test_title: l.test_title || l.action || 'Đăng nhập hệ thống',
      created_at: l.created_at || new Date().toISOString(),
    });
  }

  for (const l of localLogs) {
    allLogs.push({
      student_id: l.student_id || l.studentId || 'N/A',
      student_name: l.student_name || l.studentName || 'Học sinh',
      student_class: l.student_class || l.studentClass || 'N/A',
      test_title: l.test_title || l.testTitle || 'Đăng nhập hệ thống',
      created_at: l.created_at || new Date().toISOString(),
    });
  }

  for (const r of dbResults) {
    allLogs.push({
      student_id: r.student_id || r.studentId || 'N/A',
      student_name: r.student_name || 'Học sinh',
      student_class: r.student_class || 'N/A',
      test_title: `Nộp bài: ${r.test_title || 'Đề ôn tập'} (${r.score?.toFixed ? r.score.toFixed(1) : r.score} điểm)`,
      created_at: r.created_at || new Date().toISOString(),
    });
  }

  for (const r of localResults) {
    allLogs.push({
      student_id: r.student_id || r.studentId || 'N/A',
      student_name: r.student_name || r.studentName || 'Học sinh',
      student_class: r.student_class || r.studentClass || 'N/A',
      test_title: `Nộp bài: ${r.test_title || r.testTitle || 'Đề ôn tập'} (${r.score?.toFixed ? r.score.toFixed(1) : r.score} điểm)`,
      created_at: r.created_at || new Date().toISOString(),
    });
  }

  const logMap = new Map();
  for (const item of allLogs) {
    const key = `${item.student_id}_${item.test_title}_${item.created_at?.slice(0, 16)}`;
    if (!logMap.has(key)) logMap.set(key, item);
  }

  return Array.from(logMap.values()).sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function formatTestFromDB(dbRow) {
  const questions = dbRow.questions_json || [];

  return {
    id: dbRow.id || `test-${dbRow.code}`,
    code: dbRow.code,
    title: dbRow.title,
    subject: dbRow.subject || 'TIẾNG ANH',
    duration: dbRow.duration || 45,
    teacher: dbRow.teacher || 'Cô Trang',
    teacher_email: dbRow.teacher_email || null,
    created_at: dbRow.created_at,
    passage: dbRow.passage || '',
    questions,
    sections: dbRow.sections_json || dbRow.sections || [
      {
        id: `sec-auto-1`,
        instruction: 'Read the following passage and answer the questions below.',
        title: dbRow.title,
        passage: dbRow.passage || '',
        questions,
      }
    ],
  };
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
