import React, { useState } from 'react';
import { GraduationCap, User, Users, ArrowRight, Clock, BookOpen } from 'lucide-react';
import useAppStore from '../stores/useAppStore';

export default function LoginView({ onSwitchTeacher }) {
  const { setStudent, setView } = useAppStore();
  const [form, setForm] = useState({
    name: '',
    class: '',
  });
  const [error, setError] = useState('');

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  function handleStart() {
    if (!form.name.trim()) { setError('Vui lòng nhập họ và tên học sinh.'); return; }
    if (!form.class.trim()) { setError('Vui lòng nhập lớp học.'); return; }

    setStudent({ name: form.name.trim(), class: form.class.trim().toUpperCase() });
    setView('test-select');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md relative z-10">
      <div className="w-full max-w-md animate-slide-up">
        {/* Card Modal */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/80 text-center relative overflow-hidden">

          {/* Top Graduation Icon */}
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mx-auto mb-4 shadow-sm">
            <GraduationCap size={32} strokeWidth={1.5} />
          </div>

          {/* Main Title */}
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-1">
            KỲ THI THỬ NGHIỆM THPT 2026
          </h1>
          <p className="text-xs text-orange-600 font-semibold mb-6">
            Giáo viên hướng dẫn: <span className="text-gray-500 font-normal">Ms. Trang - FSC3DN</span>
          </p>

          {/* Form */}
          <div className="space-y-4 text-left">
            {/* Student Name */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User size={13} className="text-orange-500" /> HỌ VÀ TÊN HỌC SINH <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="student-name"
                  type="text"
                  className="input input-bordered w-full bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white text-sm h-11 pl-9 rounded-xl font-medium"
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                />
                <User size={15} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            {/* Class */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Users size={13} className="text-orange-500" /> LỚP HỌC <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="student-class"
                  type="text"
                  className="input input-bordered w-full bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white text-sm h-11 pl-9 rounded-xl font-medium"
                  placeholder="12A1"
                  value={form.class}
                  onChange={e => update('class', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                />
                <Users size={15} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium animate-slide-down">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button (Radiant Orange) */}
            <button
              id="start-test-btn"
              className="btn w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white border-none h-12 text-sm font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all duration-200 gap-2 mt-2 cursor-pointer"
              onClick={handleStart}
            >
              Bắt Đầu Làm Bài <ArrowRight size={16} />
            </button>

            {/* Footer Time info */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium pt-2">
              <Clock size={13} className="text-gray-400" />
              <span>Thời gian: 50 phút | Số câu hỏi: 40 câu</span>
            </div>
          </div>
        </div>

        {/* Switch to teacher */}
        <div className="text-center mt-4">
          <button
            className="text-xs text-slate-300 hover:text-white transition-colors underline underline-offset-2 font-medium"
            onClick={onSwitchTeacher}
            id="switch-teacher-btn"
          >
            👨‍🏫 Chuyển sang giao diện Giáo viên
          </button>
        </div>
      </div>
    </div>
  );
}
