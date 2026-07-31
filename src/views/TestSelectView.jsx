import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, FileText, User, Play, LogOut, Loader2, Sparkles, Search, ShieldCheck, Filter, GraduationCap } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import { getAllTests, saveStudentLog } from '../lib/supabase';

export default function TestSelectView({ onSwitchTeacher }) {
  const { student, startTest, setView } = useAppStore();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all'); // 'all', '10', '11', '12'
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

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
    saveStudentLog(student?.name || 'Học sinh', student?.class || '12A1', test.id || test.code, test.title);
    startTest(student, test);
  }

  function countTotalQuestions(test) {
    if (test.sections) {
      return test.sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
    }
    return test.questions?.length || 0;
  }

  // Extract unique teacher names & subjects
  const teachersList = Array.from(new Set(tests.map(t => t.teacher || 'Cô Trang'))).filter(Boolean);
  const subjectsList = Array.from(new Set(tests.map(t => t.subject || 'TIẾNG ANH'))).filter(Boolean);

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

    let matchesSubject = true;
    if (selectedSubject !== 'all') {
      matchesSubject = (t.subject || 'TIẾNG ANH').toLowerCase() === selectedSubject.toLowerCase();
    }

    return matchesSearch && matchesGrade && matchesTeacher && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-[#F8FAFC] to-amber-50/40 text-gray-800 font-sans pb-12 pt-20 relative z-10">
      {/* Animated Background Glow Blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000 delay-500" />

      {/* ── Top Header Navigation Bar (Synchronized with Teacher View) ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-orange-100 px-6 py-3 shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Logo Image + Title */}
          <div className="flex items-center gap-3">
            <img
              src="/fpt-logo.png"
              alt="FPT Schools Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-2xs"
            />
            <div>
              <h1 className="font-extrabold text-base tracking-tight uppercase bg-gradient-to-r from-orange-600 to-orange-200 bg-clip-text text-transparent">
                HỆ THỐNG ÔN TẬP FPT SCHOOLS
              </h1>
            </div>
          </div>

          {/* Right: Student Info + Change Info Button + Switch Role */}
          <div className="flex items-center gap-3">
            {/* Student Info */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Xin chào,</span>
              <span className="text-gray-900 font-extrabold">{student?.name || 'Học sinh'}</span>
              <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-100/90 ml-0.5">
                Lớp {student?.class || '12A1'}
              </span>
            </div>

            <button
              className="btn btn-xs sm:btn-sm bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 font-bold text-xs gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
              onClick={() => setView('login')}
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Đổi thông tin</span>
            </button>
            <button
              className="btn btn-xs sm:btn-sm bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 font-bold text-xs gap-1.5 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs"
              onClick={onSwitchTeacher}
            >
              <ShieldCheck size={14} className="text-orange-600" />
              <span>Giáo viên</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        {/* Hero Title Header */}
        <div className="text-center mb-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles size={24} className="text-orange-500 flex-shrink-0 animate-pulse" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-tight drop-shadow-2xs">
              KHO ĐỀ ÔN THI TRỰC TUYẾN FPT SCHOOLS (THPT)
            </h1>
          </div>

          {/* ── UNIFIED SEARCH & FILTER BAR (Radiant Orange-White) ── */}
          <div className="bg-gradient-to-r from-orange-100/90 via-white to-amber-100/80 backdrop-blur-xl border border-orange-200/90 shadow-md shadow-orange-500/5 rounded-2xl p-2 sm:p-2.5 flex flex-col md:flex-row items-center gap-2.5 max-w-3xl mx-auto transition-all hover:shadow-lg hover:shadow-orange-500/15">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500" />
              <input
                type="text"
                placeholder="Tìm kiếm đề ôn tập theo tên..."
                className="w-full bg-white/90 hover:bg-white focus:bg-white border border-orange-200/80 rounded-xl pl-9 pr-16 py-2 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {filteredTests.length > 0 && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-orange-700 bg-orange-100/80 px-2.5 py-0.5 rounded-full border border-orange-200">
                  {filteredTests.length} đề
                </span>
              )}
            </div>

            {/* Filter Dropdowns (Môn, Khối & Giảng viên) */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap md:flex-nowrap">
              {/* Select Môn học */}
              <div className="flex items-center gap-1.5 bg-white/90 border border-orange-200/80 rounded-xl px-2.5 py-1.5 focus-within:border-orange-500 focus-within:bg-white transition-all flex-1 md:flex-none">
                <BookOpen size={14} className="text-orange-500 flex-shrink-0" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer max-w-[120px] truncate"
                >
                  <option value="all">Tất cả Môn</option>
                  {subjectsList.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>

              {/* Select Khối */}
              <div className="flex items-center gap-1.5 bg-white/90 border border-orange-200/80 rounded-xl px-2.5 py-1.5 focus-within:border-orange-500 focus-within:bg-white transition-all flex-1 md:flex-none">
                <GraduationCap size={14} className="text-orange-500 flex-shrink-0" />
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
              <div className="flex items-center gap-1.5 bg-white/90 border border-orange-200/80 rounded-xl px-2.5 py-1.5 focus-within:border-orange-500 focus-within:bg-white transition-all flex-1 md:flex-none">
                <User size={14} className="text-amber-600 flex-shrink-0" />
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
            <Loader2 size={32} className="animate-spin text-orange-600" />
            <p className="text-xs font-semibold">Đang tải danh sách đề ôn tập...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-20 text-gray-400 space-y-2 bg-white/60 backdrop-blur-sm rounded-2xl border border-dashed border-orange-200">
            <p className="text-base font-bold text-gray-600">Không tìm thấy đề ôn tập phù hợp.</p>
            <p className="text-xs text-gray-400">Thử thay đổi bộ lọc Khối, Giảng viên hoặc tìm kiếm với từ khóa khác.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedGrade('all'); setSelectedTeacher('all'); }}
              className="btn btn-xs bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold text-xs mt-2 rounded-xl"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredTests.map((t, index) => {
              const qCount = countTotalQuestions(t);
              const isCustom = String(t.id).startsWith('custom') || String(t.code).startsWith('TEST');

              const d = t.created_at ? new Date(t.created_at) : new Date();
              const dateDot = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

              return (
                <div
                  key={t.id || t.code}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="bg-gradient-to-br from-orange-50/90 via-white to-amber-50/70 backdrop-blur-xl rounded-xl p-3.5 border border-orange-200/70 hover:border-orange-400/80 shadow-2xs hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5 relative overflow-hidden animate-fade-in"
                >
                  {/* Top Radiant Accent Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-300 rounded-t-xl opacity-90 group-hover:h-1.5 transition-all" />

                  <div>
                    {/* Top Badge Tag */}
                    <div className="flex items-center justify-between mb-2 pt-0.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100/80 border border-orange-200/90 text-orange-800 text-[9.5px] font-extrabold uppercase tracking-wider shadow-2xs">
                        <BookOpen size={9} className="text-orange-600" />
                        <span>{t.subject || 'TIẾNG ANH'}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug tracking-tight mb-2.5 uppercase">
                      {t.title}
                    </h3>

                    {/* Meta Stats Box */}
                    <div className="grid grid-cols-2 gap-1.5 bg-gradient-to-r from-orange-100/60 to-amber-100/50 backdrop-blur-sm p-2 rounded-lg border border-orange-200/60 mb-2.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <div className="w-4 h-4 rounded bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <Clock size={10} />
                        </div>
                        <span className="text-[10.5px] font-bold">{t.duration || 50} phút</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <div className="w-4 h-4 rounded bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <FileText size={10} />
                        </div>
                        <span className="text-[10.5px] font-bold">{qCount} câu hỏi</span>
                      </div>
                    </div>

                    {/* Teacher & Upload Date Info */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[8px] font-extrabold flex-shrink-0">
                          <User size={9} />
                        </div>
                        <span className="text-[10.5px] text-gray-500 font-medium truncate">
                          Giáo viên: <strong className="text-slate-900 font-bold">{t.teacher || 'Cô Trang'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[8px] font-extrabold flex-shrink-0 border border-orange-200">
                          <Sparkles size={9} />
                        </div>
                        <span className="text-[10.5px] text-gray-500 font-medium truncate">
                          Ngày tải lên: <strong className="text-slate-900 font-bold">{dateDot}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    className="w-full py-2 px-2.5 rounded-lg text-[11px] font-black tracking-wider text-white bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] transition-all duration-200 shadow-sm shadow-orange-500/20 group-hover:shadow-orange-500/35 flex items-center justify-center gap-1.5 cursor-pointer"
                    onClick={() => handleSelectTest(t)}
                  >
                    <Play size={11} className="fill-white group-hover:translate-x-0.5 transition-transform" />
                    <span>LÀM BÀI</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom-Right Background Illustration */}
      <div className="fixed bottom-0 right-0 pointer-events-none z-0 opacity-90 select-none overflow-hidden">
        <img
          src="/bg-illustration.png"
          alt="Illustration Background"
          className="w-56 sm:w-72 md:w-80 lg:w-96 max-w-[40vw] object-contain drop-shadow-md"
        />
      </div>
    </div>
  );
}
