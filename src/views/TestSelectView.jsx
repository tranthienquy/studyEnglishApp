import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, FileText, User, Play, LogOut, Loader2, Sparkles } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import useAppStore from '../stores/useAppStore';
import { getAllTests, deleteTest } from '../lib/supabase';

export default function TestSelectView({ onSwitchTeacher }) {
  const { student, startTest, setView } = useAppStore();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllTests()
      .then(data => {
        setTests(data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  function handleSelectTest(test) {
    startTest(student, test);
  }



  function countTotalQuestions(test) {
    if (test.sections) {
      return test.sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
    }
    return test.questions?.length || 0;
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-5xl mx-auto">

        {/* Top student info bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center text-white font-bold shadow-md">
              {student?.name ? student.name.charAt(0).toUpperCase() : 'H'}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-base">{student?.name || 'Học sinh'}</p>
              <p className="text-xs text-gray-500">Lớp: <strong className="text-brand-500">{student?.class || 'N/A'}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="btn btn-xs sm:btn-sm glass-sm border border-white/40 text-gray-600 gap-1 text-xs"
              onClick={() => setView('login')}
            >
              <LogOut size={12} /> Đổi thông tin
            </button>
            <button
              className="btn btn-xs sm:btn-sm glass-sm border border-white/40 text-brand-600 gap-1 text-xs"
              onClick={onSwitchTeacher}
            >
              👨‍🏫 Giáo viên
            </button>
          </div>
        </div>

        {/* Title Header */}
        <div className="text-center mb-10 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Kho Đề Ôn Luyện Trực Tuyến
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Các đề khảo sát do thầy cô biên soạn hoặc nhận diện tự động từ AI. Chọn đề thi bên dưới để thử sức thi trực tuyến!
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <Loader2 size={32} className="animate-spin text-brand-400" />
            <p className="text-sm">Đang tải danh sách đề thi...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            Chưa có đề thi nào trong hệ thống.
          </div>
        ) : (
          /* Tests Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {tests.map((t) => {
              const qCount = countTotalQuestions(t);
              const dateStr = t.created_at
                ? new Date(t.created_at).toLocaleDateString('vi-VN')
                : '16/7/2026';

              return (
                <div
                  key={t.id || t.code}
                  className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div>
                    {/* Top Row: Badge + Date + Delete Trash Button */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 tracking-wide uppercase">
                        {t.subject || 'TIẾNG ANH'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium">{dateStr}</span>
                      </div>
                    </div>

                    {/* Test Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-brand-500 transition-colors leading-snug">
                      {t.title}
                    </h3>

                    {/* Meta info: Duration + Question count */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-gray-400" /> {t.duration || 45} phút
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FileText size={13} className="text-gray-400" /> {qCount} câu trắc nghiệm
                      </span>
                    </div>

                    {/* Teacher info */}
                    <p className="text-xs text-gray-400 italic mb-6">
                      Người phụ trách: <span className="font-semibold text-gray-500 not-italic">{t.teacher || 'Cô Trang'}</span>
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all duration-200 shadow-md hover:shadow-indigo-500/25 flex items-center justify-center gap-2 group/btn"
                    onClick={() => handleSelectTest(t)}
                  >
                    <Play size={14} className="fill-white group-hover/btn:translate-x-0.5 transition-transform" />
                    <span>VÀO LÀM BÀI THI TRỰC TUYẾN</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
