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

/**
 * Check if an email belongs to an allowed teacher domain or admin whitelist
 */
export function isValidTeacherEmail(email) {
  if (!email) return false;
  const clean = email.toLowerCase();
  return ALLOWED_DOMAINS.some(domain => clean.endsWith(domain)) || isAdminEmail(clean);
}

/**
 * Check if a user is an admin
 */
export function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
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
 * Upsert teacher profile in DB after successful login
 */
export async function upsertTeacherProfile(teacher) {
  const client = getClient();
  if (!client || !teacher?.email) return;

  try {
    await client.from('teacher_profiles').upsert({
      email: teacher.email,
      name: teacher.name,
      avatar_url: teacher.avatar,
      last_login_at: new Date().toISOString(),
    }, { onConflict: 'email' });
  } catch (e) {
    console.warn('Could not upsert teacher profile:', e);
  }
}
