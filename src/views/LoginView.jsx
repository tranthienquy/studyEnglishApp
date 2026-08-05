import React, { useState } from 'react';
import { GraduationCap, User, Users, ArrowRight, Clock, BookOpen, ShieldCheck } from 'lucide-react';
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

    const cleanClass = form.class.trim().toUpperCase();
    const isClassValid = cleanClass.startsWith('10') || cleanClass.startsWith('11') || cleanClass.startsWith('12');
    if (!isClassValid) {
      setError('Tên lớp không hợp lệ!');
      return;
    }

    setStudent({ name: form.name.trim(), class: cleanClass });
    setView('test-select');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white relative z-10">
      <div className="w-full max-w-md animate-slide-up">

        {/* Card Modal */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/80 text-center relative overflow-hidden">

          {/* Top Logo Icon */}
          <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
            <img
              src="/fpt-logo.png"
              alt="FPT Logo"
              className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
          </div>

          {/* Main Title & Subtitle */}
          <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            HỆ THỐNG ÔN TẬP FPT SCHOOLS
          </h1>
          <p className="text-xs text-orange-600 font-bold tracking-wide mt-1 mb-6">
            Trang dành cho Học sinh
          </p>

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
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users size={13} className="text-orange-500" />  LỚP HỌC <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-gray-400 font-normal normal-case">(Khối 10, 11, 12)</span>
              </label>
              <div className="relative">
                <input
                  id="student-class"
                  type="text"
                  className="input input-bordered w-full bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white text-sm h-11 pl-9 rounded-xl font-medium"
                  placeholder="Ví dụ: 12A1, 11B2, 10C3..."
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
                {error}
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
                  className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/90 hover:from-orange-100 hover:to-amber-100 text-orange-800 border border-orange-200/90 flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  onClick={onSwitchTeacher}
                  id="switch-teacher-btn"
                >
                  <ShieldCheck size={16} className="text-orange-600" />
                  <span>Trang dành cho Giáo viên</span>
                </button>
            </div>
          </div>
        </div>
      </div>

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
