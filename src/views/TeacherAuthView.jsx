import React, { useState, useEffect } from 'react';
import { ShieldCheck, LogIn, ArrowLeft, Lock, Mail, AlertCircle, UserCheck, KeyRound } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import { signInWithGoogle, getCurrentTeacher, isValidTeacherEmail, upsertTeacherProfile } from '../lib/auth';
import { isRealSupabaseConfigured } from '../lib/supabase';

export default function TeacherAuthView({ onSwitchStudent, onGoAdmin }) {
  const { setTeacherSession, setView } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminPass, setAdminPass] = useState('');

  // Check if session already exists
  useEffect(() => {
    async function checkExisting() {
      const teacher = await getCurrentTeacher();
      if (teacher && isValidTeacherEmail(teacher.email)) {
        setTeacherSession(teacher);
        await upsertTeacherProfile(teacher);
        setView('teacher');
      }
    }
    if (isRealSupabaseConfigured()) {
      checkExisting();
    }
  }, []);

  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    const res = await signInWithGoogle();
    if (res?.error) {
      const errText = String(res.error);
      if (errText.includes('provider is not enabled') || errText.includes('Unsupported provider')) {
        setError('⚠️ Supabase chưa bật công tắc Google Provider! Vui lòng vào Supabase Dashboard > Authentication > Providers > Google > gạt công tắc "Enable Google provider" sang BẬT (ON) và bấm nút SAVE ở góc cuối trang.');
      } else {
        setError(res.error);
      }
      setLoading(false);
    }
  }

  // Manual Demo Login (for offline or local testing)
  async function handleManualLogin() {
    if (!manualEmail.trim()) {
      setError('Vui lòng nhập Email giảng viên.');
      return;
    }
    const cleanEmail = manualEmail.trim().toLowerCase();
    if (!isValidTeacherEmail(cleanEmail)) {
      setError('Email bắt buộc phải có đuôi @fpt.edu.vn (hoặc @fe.edu.vn).');
      return;
    }

    const session = {
      email: cleanEmail,
      name: manualName.trim() || cleanEmail.split('@')[0],
      avatar: null,
    };

    setTeacherSession(session);
    await upsertTeacherProfile(session);
    setView('teacher');
  }

  function handleAdminLogin() {
    if (adminPass.trim() === 'fptadmin2026' || adminPass.trim() === 'admin') {
      setView('admin');
    } else {
      setError('Mật khẩu quản trị viên (Admin) không đúng!');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-[#F8FAFC] to-amber-50/40 flex items-center justify-center p-4 text-gray-800 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse delay-500" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-orange-100/90 relative z-10 animate-slide-up">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mx-auto mb-3 shadow-sm">
            <ShieldCheck size={36} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
            CỔNG GIÁO VIÊN FPT
          </h1>
          <p className="text-xs text-orange-600 font-semibold mt-1">
            Hệ thống Quản lý tài liệu ôn tập trực tuyến
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-start gap-2 animate-slide-down">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Login Section */}
        <div className="space-y-4 text-left">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-extrabold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Đăng nhập bằng email FPT</span>
          </button>

          <div className="text-[11px] text-center text-gray-500 font-medium px-2 flex items-center justify-center gap-1">
            <Lock size={12} className="text-orange-500" />
            <span>Chỉ chấp nhận tài khoản có đuôi <strong className="text-gray-800">@fpt.edu.vn</strong></span>
          </div>

          {/* Admin Login Toggle */}
          <div className="pt-4 border-t border-slate-100 text-center">
            {!showAdminPass ? (
              <button
                onClick={() => setShowAdminPass(true)}
                className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors"
              >
                <KeyRound size={13} />
                <span>Đăng nhập dành cho Quản trị viên (Web Admin)</span>
              </button>
            ) : (
              <div className="space-y-2 animate-slide-down">
                <label className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block">Mật khẩu Web Admin</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    className="flex-1 bg-slate-50 border border-orange-300 text-gray-900 text-xs h-9 px-3 rounded-xl focus:border-orange-500 focus:outline-none font-medium"
                    placeholder="Nhập mật khẩu Admin..."
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                  />
                  <button
                    onClick={handleAdminLogin}
                    className="px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Vào Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back to Student View */}
        <div className="mt-6 text-center">
          <button
            onClick={onSwitchStudent}
            className="text-xs text-gray-500 hover:text-orange-600 transition-colors flex items-center justify-center gap-1.5 mx-auto font-bold"
          >
            <ArrowLeft size={13} />
            <span>Quay lại trang Học sinh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
