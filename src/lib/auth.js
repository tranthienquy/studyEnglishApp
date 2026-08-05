// ================================================================
// src/lib/auth.js
// Google OAuth authentication for teacher portal
// Only allows @fpt.edu.vn email domain
// ================================================================

import { getClient } from './supabase';

// Allowed email domains for teacher login
const ALLOWED_DOMAINS = ['@fpt.edu.vn', '@fe.edu.vn'];

// Admin emails (whitelist for super admin access)
const DEFAULT_ADMIN_EMAILS = [
  'admin@fpt.edu.vn',
  'admin@fe.edu.vn',
  'quytt16@fpt.edu.vn',
  'feexpspace@gmail.com',
];

const ENV_ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_EMAILS = [...DEFAULT_ADMIN_EMAILS, ...ENV_ADMIN_EMAILS];

// Allowed specific teacher emails (whitelist)
const ALLOWED_TEACHER_EMAILS = [
  'tranthienquy98@gmail.com',
];

/**
 * Check if an email is allowed to log in as Teacher/Admin:
 * Must be @fpt.edu.vn / @fe.edu.vn OR added by Super Admin in system profiles
 */
export function isValidTeacherEmail(email) {
  if (!email) return false;
  const clean = email.toLowerCase();

  // 1. Allow @fpt.edu.vn & @fe.edu.vn domains
  if (ALLOWED_DOMAINS.some(domain => clean.endsWith(domain))) return true;

  // 2. Allow whitelisted static super admin & teacher emails
  if (ADMIN_EMAILS.includes(clean) || ALLOWED_TEACHER_EMAILS.includes(clean)) return true;

  // 3. Allow any email explicitly created/added by Super Admin in teacher_profiles
  try {
    const raw = localStorage.getItem('readingpro_teacher_profiles');
    if (raw) {
      const profiles = JSON.parse(raw);
      const found = profiles.find(p => p.email?.toLowerCase() === clean);
      if (found && found.is_active !== false) {
        return true;
      }
    }
  } catch {}

  return false;
}

/**
 * Check if a user is an admin (checks whitelist and dynamic teacher_profiles)
 */
export function isAdminEmail(email) {
  if (!email) return false;
  const clean = email.toLowerCase();
  if (ADMIN_EMAILS.includes(clean)) return true;

  try {
    const raw = localStorage.getItem('readingpro_teacher_profiles');
    if (raw) {
      const profiles = JSON.parse(raw);
      const found = profiles.find(p => p.email?.toLowerCase() === clean);
      if (found && found.role === 'admin' && found.is_active !== false) {
        return true;
      }
    }
  } catch {}

  return false;
}

/**
 * Sign in with Google OAuth
 * Supabase will redirect back after Google auth
 */
export async function signInWithGoogle() {
  const client = getClient();
  if (!client) {
    return { error: 'Chưa cấu hình kết nối Supabase. Vui lòng liên hệ quản trị viên.' };
  }

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    return { error: error.message };
  }
  return { data };
}

/**
 * Sign out current teacher
 */
export async function signOut() {
  const client = getClient();
  if (!client) return;
  await client.auth.signOut();
}

/**
 * Get current auth session
 */
export async function getSession() {
  const client = getClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data?.session || null;
}

/**
 * Get current teacher user info from session
 */
export async function getCurrentTeacher() {
  const session = await getSession();
  if (!session?.user) return null;

  const email = session.user.email;
  const name = session.user.user_metadata?.full_name || email.split('@')[0];
  const avatar = session.user.user_metadata?.avatar_url || null;

  return { email, name, avatar };
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - (session | null) => void
 * @returns unsubscribe function
 */
export function onAuthStateChange(callback) {
  const client = getClient();
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data?.subscription?.unsubscribe || (() => {});
}

/**
 * Upsert teacher profile in DB & LocalStorage after successful login
 * Ensures accounts are recorded for Super Admin and 2nd+ logins do not create duplicate records
 */
export async function upsertTeacherProfile(teacher) {
  if (!teacher?.email) return;

  const cleanEmail = teacher.email.trim().toLowerCase();
  const defaultName = teacher.name || cleanEmail.split('@')[0];
  const role = isAdminEmail(cleanEmail) ? 'admin' : 'teacher';
  const now = new Date().toISOString();

  // Read existing profiles from LocalStorage first to preserve user profile edits and count logins
  let existingProfile = null;
  try {
    const raw = localStorage.getItem('readingpro_teacher_profiles');
    if (raw) {
      const profiles = JSON.parse(raw);
      existingProfile = profiles.find(p => p.email?.toLowerCase() === cleanEmail) || null;
    }
  } catch {}

  const loginCount = (existingProfile?.login_count || 0) + 1;
  const createdAt = existingProfile?.created_at || now;

  const localProfileData = {
    email: cleanEmail,
    name: existingProfile?.name || defaultName,
    avatar_url: teacher.avatar || existingProfile?.avatar_url || null,
    role: existingProfile?.role || role,
    is_active: existingProfile?.is_active !== false,
    created_at: createdAt,
    last_login_at: now,
    login_count: loginCount,
  };

  // 1. Sync to LocalStorage for immediate, 100% reliable display in Super Admin portal
  try {
    const raw = localStorage.getItem('readingpro_teacher_profiles');
    const profiles = raw ? JSON.parse(raw) : [];
    const idx = profiles.findIndex(p => p.email?.toLowerCase() === cleanEmail);
    if (idx >= 0) {
      // 2nd+ Login: Update existing record without creating duplicates
      profiles[idx] = {
        ...profiles[idx],
        name: profiles[idx].name || localProfileData.name,
        avatar_url: localProfileData.avatar_url || profiles[idx].avatar_url,
        last_login_at: now,
        login_count: loginCount,
      };
    } else {
      // 1st Login: Record new account for Super Admin
      profiles.unshift({
        ...localProfileData,
        subject_default: 'Tiếng Anh',
      });
    }
    localStorage.setItem('readingpro_teacher_profiles', JSON.stringify(profiles));
  } catch (e) {
    console.warn('Could not sync teacher profile to localStorage:', e);
  }

  // 2. Safely sync to Supabase DB if available (single clean upsert call)
  const client = getClient();
  if (client) {
    try {
      const dbPayload = {
        email: cleanEmail,
        name: existingProfile?.name || defaultName,
        role: existingProfile?.role || role,
      };
      const { error } = await client.from('teacher_profiles').upsert(dbPayload, { onConflict: 'email' });
      if (error) {
        console.warn('Supabase teacher_profiles sync notice:', error.message);
      }
    } catch (e) {
      console.warn('Could not sync teacher profile to Supabase:', e);
    }
  }
}
