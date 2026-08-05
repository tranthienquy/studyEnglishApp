import React, { useState, useEffect } from 'react';
import { ShieldCheck, LogIn, ArrowLeft, Lock, Mail, AlertCircle, UserCheck, KeyRound, Settings, X, Database } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import { signInWithGoogle, getCurrentTeacher, isValidTeacherEmail, isAdminEmail, upsertTeacherProfile, signOut } from '../lib/auth';
import { isRealSupabaseConfigured, getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';

export default function TeacherAuthView({ onSwitchStudent, onGoAdmin }) {
  const { teacherSession, setTeacherSession, setView } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Supabase Config Modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');

  // Check if session already exists
  useEffect(() => {
    async function checkExisting() {
      const teacher = await getCurrentTeacher();
      if (teacher) {
        if (!isValidTeacherEmail(teacher.email)) {
          setError(`Tài khoản Google "${teacher.email}" không được quyền truy cập. Vui lòng sử dụng Email FPT (@fpt.edu.vn) hoặc Email Admin đã được cấp quyền.`);
          await signOut();
          return;
        }
        setTeacherSession(teacher);
        await upsertTeacherProfile(teacher);
        if (isAdminEmail(teacher.email)) {
          setView('admin');
        } else {
          setView('teacher');
        }
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

  function handleOpenConfigModal() {
    const current = getSupabaseConfig();
    setConfigUrl(current.url || '');
    setConfigKey(current.key || '');
    setConfigSuccessMsg('');
    setShowConfigModal(true);
  }

  function handleSaveConfig(e) {
    e.preventDefault();
    try {
      saveSupabaseConfig(configUrl, configKey);
      setError('');
      setConfigSuccessMsg('🟢 Đã lưu cấu hình Supabase thành công! Bạn có thể Đăng nhập ngay.');
      setTimeout(() => {
        setShowConfigModal(false);
        setConfigSuccessMsg('');
      }, 1500);
    } catch (err) {
      setError(err.message);
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
          <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
            <img
              src="/fpt-logo.png"
              alt="FPT Logo"
              className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            HỆ THỐNG ÔN TẬP FPT SCHOOLS
          </h1>
          <p className="text-xs text-orange-600 font-bold tracking-wide mt-1">
            Trang dành cho Giáo viên
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs space-y-2.5 animate-slide-down text-left">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
            <button
              onClick={handleOpenConfigModal}
              className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Settings size={13} />
              <span>⚙️ Nhập Supabase URL &amp; Key Ngay Tại Đây</span>
            </button>
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
            <span>Đăng nhập bằng Google SSO</span>
          </button>

          <div className="text-[11px] text-center text-gray-500 font-medium px-2 flex items-center justify-center gap-1">
            <Lock size={12} className="text-orange-500" />
            <span>Chấp nhận email Giáo viên (<strong className="text-gray-800">@fpt.edu.vn</strong>) &amp; Email Super Admin</span>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={handleOpenConfigModal}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Settings size={12} />
              <span>⚙️ Đổi / Nhập URL &amp; Key Supabase</span>
            </button>
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

      {/* ── MODAL CẤU HÌNH SUPABASE URL & KEY ── */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-orange-100 space-y-4 animate-scale-up text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-orange-600 font-black text-base">
                <Database size={20} />
                <span>Cấu Hình Kết Nối Supabase</span>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 text-slate-400 hover:text-orange-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {configSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl animate-slide-down">
                {configSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Supabase Project URL *</label>
                <input
                  type="url"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:border-orange-500 focus:outline-none"
                  placeholder="https://xxxx.supabase.co"
                  value={configUrl}
                  onChange={e => setConfigUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Supabase Anon Key *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono font-medium focus:border-orange-500 focus:outline-none resize-none"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={configKey}
                  onChange={e => setConfigKey(e.target.value)}
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1">⚠️ Lưu ý: Chỉ nhập Public Anon Key (KHÔNG nhập Service Role Key).</span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  Lưu &amp; Kết Nối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom-Right Mascot Illustration */}
      <div className="fixed bottom-0 right-0 pointer-events-none z-0 opacity-90 select-none overflow-hidden">
        <img
          src="/bg-illustration.png"
          alt="Illustration Background"
          className="w-56 sm:w-72 md:w-80 max-w-[40vw] object-contain drop-shadow-md"
        />
      </div>
    </div>
  );
}
