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
    localStorage.setItem('readingpro_supabase_config', JSON.stringify({ url: url.trim(), key: key.trim() }));
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
export async function getAllTests() {
  const deletedIds = getDeletedTestIds();
  const isDeleted = (t) => deletedIds.includes(String(t.id)) || deletedIds.includes(String(t.code));

  const client = getClient();
  let dbTests = [];
  
  if (client) {
    try {
      const { data, error } = await client.from('tests').select('*').order('created_at', { ascending: false });
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
  
  // Also include mock tests if not already present or deleted
  for (const mt of MOCK_TESTS) {
    if (!merged.find(t => t.code === mt.code)) {
      merged.push(mt);
    }
  }
  
  return merged.filter(t => !isDeleted(t));
}

// ---- Save result (student) ----
export async function saveResult(resultData) {
  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('results').insert({
        student_name: resultData.student_name,
        student_class: resultData.student_class,
        teacher: resultData.teacher,
        test_id: resultData.test_id,
        score: resultData.score,
        time_spent: resultData.time_spent,
        answers_json: resultData.answers_json,
        created_at: new Date().toISOString(),
      }).select().single();

      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase save result failed:', e);
    }
  }

  // Fallback local log
  console.log('[Local Session] Saved result:', resultData);
  return { id: `local-${Date.now()}`, ...resultData };
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
export async function saveTest(testData) {
  const formattedForDB = {
    code: testData.code,
    title: testData.title,
    subject: testData.subject || 'TIẾNG ANH',
    duration: parseInt(testData.duration) || 45,
    teacher: testData.teacher || 'Cô Trang',
    passage: testData.passage,
    questions_json: testData.questions_json,
    sections_json: testData.sections,
    created_at: new Date().toISOString(),
  };

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
      }
    } catch (e) {
      console.warn('Supabase save test exception (falling back to Local Storage):', e.message);
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

function formatTestFromDB(dbRow) {
  const questions = dbRow.questions_json || [];

  return {
    id: dbRow.id || `test-${dbRow.code}`,
    code: dbRow.code,
    title: dbRow.title,
    subject: dbRow.subject || 'TIẾNG ANH',
    duration: dbRow.duration || 45,
    teacher: dbRow.teacher || 'Cô Trang',
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
