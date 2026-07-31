import React, { useState } from 'react';
import { GraduationCap, User, Users, ArrowRight, Clock, BookOpen, Minimize2 } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white relative z-10">
      <div className="w-full max-w-md animate-slide-up">

        {/* Card Modal */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/80 text-center relative overflow-hidden">

          {/* Top Graduation Icon */}
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mx-auto mb-4 shadow-sm">
            <GraduationCap size={32} strokeWidth={1.5} />
          </div>

          {/* Main Title */}
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-6">
            HỆ THỐNG ÔN TẬP FPT SCHOOLS
          </h1>

          {/* Form */}
          <div className="space-y-4 text-left">
            {/* Student Name */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User size={13} className="text-orange-500" />  HỌ VÀ TÊN HỌC SINH <span className="text-red-500">*</span>
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
                <Users size={13} className="text-orange-500" />  LỚP HỌC <span className="text-red-500">*</span>
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

            {/* Submit Button (Electric Royal Blue) */}
            <button
              id="start-test-btn"
              className="btn w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none h-12 text-sm font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all duration-200 gap-2 mt-2"
              onClick={handleStart}
            >
              Bắt Đầu Làm Bài <ArrowRight size={16} />
            </button>

            {/* Footer Switch to Teacher */}
            <div className="pt-3 border-t border-gray-100/90 text-center mt-3">
              <button
                className="inline-flex items-center justify-center gap-2 text-xs font-bold text-orange-700 hover:text-orange-800 bg-orange-50/80 hover:bg-orange-100 border border-orange-200/90 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-[0.98] w-full"
                onClick={onSwitchTeacher}
                id="switch-teacher-btn"
              >
                <Minimize2 size={14} className="text-orange-600" />
                <span>Trang dành cho Giáo viên</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
