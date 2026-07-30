import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, FileText, User, Play, LogOut, Loader2, Sparkles, Search, ShieldCheck, Filter, GraduationCap } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import { getAllTests } from '../lib/supabase';

export default function TestSelectView({ onSwitchTeacher }) {
  const { student, startTest, setView } = useAppStore();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all'); // 'all', '10', '11', '12'
  const [selectedTeacher, setSelectedTeacher] = useState('all');

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

  // Extract unique teacher names
  const teachersList = Array.from(new Set(tests.map(t => t.teacher || 'Cô Trang'))).filter(Boolean);

  const filteredTests = tests.filter(t => {
    const titleLower = (t.title || '').toLowerCase();
    const subjectLower = (t.subject || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || titleLower.includes(searchLower) || subjectLower.includes(searchLower);

    let matchesGrade = true;
    if (selectedGrade !== 'all') {
      const gStr = String(selectedGrade);
      matchesGrade = titleLower.includes(gStr) ||
                     titleLower.includes(`khối ${gStr}`) ||
                     titleLower.includes(`lớp ${gStr}`) ||
                     String(t.grade) === gStr;
    }

    let matchesTeacher = true;
    if (selectedTeacher !== 'all') {
      matchesTeacher = (t.teacher || 'Cô Trang') === selectedTeacher;
    }

    return matchesSearch && matchesGrade && matchesTeacher;
  });

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 relative z-10 font-sans">
      {/* Animated Background Glow Blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000 delay-500" />

      <div className="max-w-6xl mx-auto">
        {/* Top Header / Profile Bar */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xs rounded-2xl p-3.5 sm:px-5 flex items-center justify-between mb-8 transition-all hover:shadow-md">
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
              className="btn btn-xs sm:btn-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-bold text-xs gap-1.5 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs"
              onClick={onSwitchTeacher}
            >
              <ShieldCheck size={14} className="text-indigo-600" />
              <span>Giáo viên</span>
            </button>
          </div>
        </div>

        {/* Hero Title Header */}
        <div className="text-center mb-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles size={22} className="text-blue-900 flex-shrink-0" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-400 bg-clip-text text-transparent uppercase tracking-tight">
              KHO ĐỀ ÔN THI TRỰC TUYẾN FPT SCHOOLS (THPT)
            </h1>
          </div>

          {/* ── UNIFIED SEARCH & FILTER BAR ── */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/90 shadow-md rounded-2xl p-2 sm:p-2.5 flex flex-col md:flex-row items-center gap-2.5 max-w-3xl mx-auto transition-all hover:shadow-lg">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
              <input
                type="text"
                placeholder="Tìm kiếm đề thi theo tên..."
                className="w-full bg-slate-50/90 hover:bg-slate-50 focus:bg-white border border-slate-200/70 rounded-xl pl-9 pr-16 py-2 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {filteredTests.length > 0 && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/80">
                  {filteredTests.length} đề
                </span>
              )}
            </div>

            {/* Filter Dropdowns (Khối & Giảng viên) */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {/* Select Khối */}
              <div className="flex items-center gap-1.5 bg-slate-50/90 border border-slate-200/70 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500 focus-within:bg-white transition-all flex-1 md:flex-none">
                <GraduationCap size={14} className="text-indigo-500 flex-shrink-0" />
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">Tất cả Khối</option>
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                </select>
              </div>

              {/* Select Giảng viên */}
              <div className="flex items-center gap-1.5 bg-slate-50/90 border border-slate-200/70 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500 focus-within:bg-white transition-all flex-1 md:flex-none">
                <User size={14} className="text-amber-500 flex-shrink-0" />
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer max-w-[130px] truncate"
                >
                  <option value="all">Tất cả Giảng viên</option>
                  {teachersList.map(tName => (
                    <option key={tName} value={tName}>{tName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Đang tải danh sách đề thi...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-20 text-gray-400 space-y-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed border-slate-200">
            <p className="text-base font-bold text-gray-600">Không tìm thấy đề thi phù hợp.</p>
            <p className="text-xs text-gray-400">Thử thay đổi bộ lọc Khối, Giảng viên hoặc tìm kiếm với từ khóa khác.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedGrade('all'); setSelectedTeacher('all'); }}
              className="btn btn-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs mt-2 rounded-xl"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          /* Premium Tests Grid with Staggered Animations */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((t, index) => {
              const qCount = countTotalQuestions(t);
              const isCustom = String(t.id).startsWith('custom') || String(t.code).startsWith('TEST');
              
              const d = t.created_at ? new Date(t.created_at) : new Date();
              const dateDot = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

              return (
                <div
                  key={t.id || t.code}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className="bg-white/90 backdrop-blur-2xl rounded-3xl p-6 border border-white/80 hover:border-indigo-300/80 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-2 relative overflow-hidden animate-fade-in"
                >
                  {/* Top Decorative Accent Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl opacity-90 group-hover:h-2 transition-all" />

                  <div>
                    {/* Top Badge Tag & Date */}
                    <div className="flex items-center justify-between mb-4 pt-1">
                      {isCustom ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-extrabold shadow-2xs">
                          <Sparkles size={11} className="text-emerald-500 animate-pulse" />
                          <span>Ngày tải lên: {dateDot}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
                          <BookOpen size={11} className="text-indigo-500" />
                          <span>{t.subject || 'TIẾNG ANH'}</span>
                        </span>
                      )}
                      {!isCustom && (
                        <span className="text-[11px] font-semibold text-gray-400 bg-slate-100/70 px-2.5 py-0.5 rounded-full">
                          {dateDot}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-black text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug tracking-tight mb-4">
                      {t.title}
                    </h3>

                    {/* Meta Stats Box */}
                    <div className="grid grid-cols-2 gap-2.5 bg-slate-50/90 backdrop-blur-sm p-3 rounded-2xl border border-slate-100 mb-4 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <div className="w-6 h-6 rounded-lg bg-indigo-100/80 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <Clock size={13} />
                        </div>
                        <span>{t.duration || 50} phút</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100/80 flex items-center justify-center text-emerald-600 flex-shrink-0">
                          <FileText size={13} />
                        </div>
                        <span>{qCount} câu hỏi</span>
                      </div>
                    </div>

                    {/* Teacher Info */}
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-extrabold flex-shrink-0">
                        <User size={12} />
                      </div>
                      <span className="text-xs text-gray-500 font-medium truncate">
                        Người phụ trách: <strong className="text-gray-800 font-extrabold">{t.teacher || 'Cô Trang'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    className="w-full py-3.5 px-4 rounded-2xl text-xs font-black tracking-wider text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] transition-all duration-200 shadow-md shadow-indigo-500/25 group-hover:shadow-indigo-500/40 flex items-center justify-center gap-2 cursor-pointer"
                    onClick={() => handleSelectTest(t)}
                  >
                    <Play size={13} className="fill-white group-hover:translate-x-1 transition-transform" />
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
