import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, FileText, User, Play, LogOut, Loader2, Sparkles, Search, ShieldCheck } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import { getAllTests } from '../lib/supabase';

export default function TestSelectView({ onSwitchTeacher }) {
  const { student, startTest, setView } = useAppStore();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredTests = tests.filter(t =>
    (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 relative z-10 font-sans">
      {/* Background Glow Blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Top Header / Profile Bar */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xs rounded-2xl p-3.5 sm:px-5 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-indigo-500/20">
              {student?.name ? student.name.charAt(0).toUpperCase() : 'H'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-sm">{student?.name || 'Học sinh'}</p>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                  Lớp {student?.class || '12A1'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Hệ thống ôn luyện trực tuyến</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-xs sm:btn-sm bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 font-bold text-xs gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
              onClick={() => setView('login')}
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Đổi thông tin</span>
            </button>
            <button
              className="btn btn-xs sm:btn-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-bold text-xs gap-1.5 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors"
              onClick={onSwitchTeacher}
            >
              <ShieldCheck size={14} className="text-indigo-600" />
              <span>Giáo viên</span>
            </button>
          </div>
        </div>

        {/* Hero Title & Search Bar */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider mb-3 shadow-xs">
            <Sparkles size={12} className="text-indigo-600 animate-pulse" />
            <span>KHO ĐỀ ÔN THI TRỰC TUYẾN HIGH SCHOOL</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
            Kho Đề Ôn Luyện Trực Tuyến
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-6">
            Chọn bài khảo sát bên dưới để thử sức thi trực tuyến với đồng hồ bấm giờ và hệ thống chấm điểm tự động.
          </p>

          {/* Search Box */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm đề thi theo tên..."
              className="w-full bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {filteredTests.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredTests.length} đề thi
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Đang tải danh sách đề thi...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-20 text-gray-400 space-y-2">
            <p className="text-base font-bold text-gray-600">Không tìm thấy đề thi phù hợp.</p>
            <p className="text-xs">Thử tìm kiếm với từ khóa khác hoặc liên hệ giáo viên để cập nhật đề thi mới.</p>
          </div>
        ) : (
          /* Premium Tests Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTests.map((t) => {
              const qCount = countTotalQuestions(t);
              const isCustom = String(t.id).startsWith('custom') || String(t.code).startsWith('TEST');
              const dateStr = t.created_at
                ? new Date(t.created_at).toLocaleDateString('vi-VN')
                : 'Mới cập nhật';

              return (
                <div
                  key={t.id || t.code}
                  className="bg-white/85 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden"
                >
                  <div>
                    {/* Top Tag & Date */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                        isCustom ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {isCustom ? 'ĐỀ ĐÃ TẢI LÊN' : (t.subject || 'TIẾNG ANH')}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">{dateStr}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-extrabold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {t.title}
                    </h3>

                    {/* Meta Stats Pill Box */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                        <Clock size={13} className="text-indigo-500 flex-shrink-0" />
                        <span>{t.duration || 50} phút</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                        <FileText size={13} className="text-emerald-500 flex-shrink-0" />
                        <span>{qCount} câu hỏi</span>
                      </div>
                    </div>

                    {/* Teacher Info */}
                    <p className="text-[11px] text-gray-400 mb-5 flex items-center gap-1">
                      <span>Người phụ trách:</span>
                      <strong className="text-gray-700 font-semibold">{t.teacher || 'Cô Trang'}</strong>
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all duration-200 shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/35 flex items-center justify-center gap-2 cursor-pointer"
                    onClick={() => handleSelectTest(t)}
                  >
                    <Play size={13} className="fill-white group-hover:translate-x-0.5 transition-transform" />
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
