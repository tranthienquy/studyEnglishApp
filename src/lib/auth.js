// ================================================================
// src/lib/auth.js
// Google OAuth authentication for teacher portal
// Only allows @fpt.edu.vn email domain
// ================================================================

import { getClient } from './supabase';

// Allowed email domains for teacher login
const ALLOWED_DOMAINS = ['@fpt.edu.vn', '@fe.edu.vn'];

// Admin emails (whitelist for admin access)
const ADMIN_EMAILS = [
  'admin@fpt.edu.vn',
  // Add more admin emails here
];

/**
 * Check if an email belongs to an allowed teacher domain
 */
export function isValidTeacherEmail(email) {
  if (!email) return false;
  return ALLOWED_DOMAINS.some(domain => email.toLowerCase().endsWith(domain));
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
      queryParams: {
        hd: 'fpt.edu.vn', // Google hd param: restrict to FPT domain
      },
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
