import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, BookOpen, GraduationCap, ArrowLeft, Trash2, Eye, EyeOff,
  Search, RefreshCw, CheckCircle2, UserPlus, FileSpreadsheet, Lock, AlertTriangle
} from 'lucide-react';
import { getAllTests, deleteTest, toggleHideTest, isTestHidden, getAllTeacherProfiles, getAllStudentLogs } from '../lib/supabase';
import { SUBJECTS } from '../lib/templates';
import useAppStore from '../stores/useAppStore';

export default function AdminView({ onExit }) {
  const { setView } = useAppStore();
  const [activeTab, setActiveTab] = useState('tests'); // 'teachers' | 'tests' | 'students'
  
  // Tests repository state
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [testSearch, setTestSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Teachers profiles state
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('Tiếng Anh');

  // Student logs state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoadingTests(true);
    setLoadingTeachers(true);
    setLoadingStudents(true);

    const [allTestsData, profilesData, logsData] = await Promise.all([
      getAllTests(true), // include hidden tests
      getAllTeacherProfiles(),
      getAllStudentLogs(),
    ]);

    setTests(allTestsData || []);
    setLoadingTests(false);

    setTeachers(profilesData || []);
    setLoadingTeachers(false);

    setStudents(logsData || []);
    setLoadingStudents(false);
  }

  async function handleDeleteTest(testId) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài thi này khỏi toàn bộ hệ thống?')) return;
    await deleteTest(testId);
    setTests(prev => prev.filter(t => t.id !== testId && t.code !== testId));
  }

  function handleToggleHide(testId) {
    toggleHideTest(testId);
    setTests(prev => [...prev]);
  }

  const filteredTests = tests.filter(t => {
    const matchSearch = (t.title || '').toLowerCase().includes(testSearch.toLowerCase()) ||
                        (t.teacher || '').toLowerCase().includes(testSearch.toLowerCase()) ||
                        (t.code || '').toLowerCase().includes(testSearch.toLowerCase());
    const matchSubject = selectedSubject === 'all' || (t.subject || 'TIẾNG ANH').toLowerCase() === selectedSubject.toLowerCase();
    return matchSearch && matchSubject;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* ── Top Header Navigation Bar ── */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base tracking-tight uppercase bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                  WEB ADMIN — QUẢN TRỊ HỆ THỐNG FPT
                </h1>
                <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Quản lý Giáo viên, Kho Đề thi & Danh sách Học sinh</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              className="btn btn-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Làm mới</span>
            </button>
            <button
              onClick={() => setView('login')}
              className="btn btn-sm bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs gap-1.5 rounded-xl cursor-pointer border-none shadow-md shadow-orange-600/30"
            >
              <ArrowLeft size={13} />
              <span>Thoát Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-7xl mx-auto px-6 pt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BookOpen size={16} />
            <span>KHO ĐỀ THI TRỰC TUYẾN ({tests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Users size={16} />
            <span>QUẢN LÝ ĐẮNG NHẬP GIẢNG VIÊN ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <GraduationCap size={16} />
            <span>DANH SÁCH HỌC SINH SỬ DỤNG ({students.length})</span>
          </button>
        </div>

        {/* ── TAB 1: KHO ĐỀ THI TRỰC TUYẾN ── */}
        {activeTab === 'tests' && (
          <div className="space-y-4 animate-slide-up">
            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs h-9 pl-9 pr-3 rounded-xl focus:border-orange-500 focus:outline-none"
                  placeholder="Tìm theo tên bài thi, giáo viên..."
                  value={testSearch}
                  onChange={e => setTestSearch(e.target.value)}
                />
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-medium">Môn học:</span>
                <select
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs h-9 px-3 rounded-xl focus:border-orange-500 focus:outline-none"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                >
                  <option value="all">Tất cả môn học</option>
                  {SUBJECTS.map(s => (
                    <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tests table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">STT</th>
                    <th className="p-4">Tên bài thi & Môn học</th>
                    <th className="p-4">Giáo viên khởi tạo</th>
                    <th className="p-4">Thời lượng</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {loadingTests ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-500">Đang tải dữ liệu kho đề...</td>
                    </tr>
                  ) : filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-500">Không tìm thấy bài thi nào phù hợp.</td>
                    </tr>
                  ) : (
                    filteredTests.map((t, idx) => {
                      const hidden = isTestHidden(t.id || t.code);
                      return (
                        <tr key={t.id || t.code} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 text-slate-500 font-bold">{idx + 1}</td>
                          <td className="p-4">
                            <div className="font-extrabold text-slate-100 uppercase">{t.title}</div>
                            <div className="text-[10px] text-orange-400 font-semibold mt-0.5">Môn: {t.subject || 'TIẾNG ANH'} | Mã: {t.code}</div>
                          </td>
                          <td className="p-4 text-slate-300 font-semibold">
                            {t.teacher || 'Cô Trang'}
                            {t.teacher_email && <div className="text-[10px] text-slate-500 font-normal">{t.teacher_email}</div>}
                          </td>
                          <td className="p-4">{t.duration || 50} phút</td>
                          <td className="p-4">
                            {hidden ? (
                              <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800/80 rounded-full text-[10px] font-bold">Đã ẩn</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded-full text-[10px] font-bold">Đang hiển thị</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleHide(t.id || t.code)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                                title={hidden ? 'Hiện bài thi' : 'Ẩn bài thi'}
                              >
                                {hidden ? <Eye size={14} className="text-emerald-400" /> : <EyeOff size={14} className="text-amber-400" />}
                              </button>
                              <button
                                onClick={() => handleDeleteTest(t.id || t.code)}
                                className="p-2 bg-red-950/80 hover:bg-red-900 text-red-400 rounded-xl transition-colors cursor-pointer border border-red-800/50"
                                title="Xóa vĩnh viễn bài thi"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: QUẢN LÝ DỮ LIỆU ĐĂNG NHẬP GIẢNG VIÊN ── */}
        {activeTab === 'teachers' && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h2 className="text-sm font-extrabold text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users size={16} />
                <span>Danh sách Giảng viên được phép đăng nhập qua Google (@fpt.edu.vn)</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-4">STT</th>
                      <th className="p-4">Họ và Tên Giảng Viên</th>
                      <th className="p-4">Email Google (@fpt.edu.vn)</th>
                      <th className="p-4">Môn giảng dạy</th>
                      <th className="p-4">Đăng nhập gần nhất</th>
                      <th className="p-4 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {loadingTeachers ? (
                      <tr><td colSpan="6" className="text-center py-12 text-slate-500">Đang tải danh sách giảng viên...</td></tr>
                    ) : teachers.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-12 text-slate-500">Chưa có dữ liệu giảng viên. Tất cả tài khoản có đuôi @fpt.edu.vn đều có thể đăng nhập.</td></tr>
                    ) : (
                      teachers.map((prof, idx) => (
                        <tr key={prof.email} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 text-slate-500 font-bold">{idx + 1}</td>
                          <td className="p-4 font-bold text-slate-100">{prof.name || 'Giảng viên'}</td>
                          <td className="p-4 font-mono text-orange-400">{prof.email}</td>
                          <td className="p-4">{prof.subject_default || 'Tiếng Anh'}</td>
                          <td className="p-4 text-slate-400">{prof.last_login_at ? new Date(prof.last_login_at).toLocaleString('vi-VN') : 'Mới khởi tạo'}</td>
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded-full text-[10px] font-bold">
                              Đang hoạt động
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: DANH SÁCH HỌC SINH SỬ DỤNG ── */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h2 className="text-sm font-extrabold text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <GraduationCap size={16} />
                <span>Nhật ký truy cập & lượt làm bài của Học sinh</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-4">STT</th>
                      <th className="p-4">Họ tên Học sinh</th>
                      <th className="p-4">Lớp học</th>
                      <th className="p-4">Bài thi chọn làm</th>
                      <th className="p-4">Thời điểm truy cập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {loadingStudents ? (
                      <tr><td colSpan="5" className="text-center py-12 text-slate-500">Đang tải nhật ký học sinh...</td></tr>
                    ) : students.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-12 text-slate-500">Chưa có dữ liệu truy cập của học sinh.</td></tr>
                    ) : (
                      students.map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 text-slate-500 font-bold">{idx + 1}</td>
                          <td className="p-4 font-bold text-slate-100">{log.student_name}</td>
                          <td className="p-4 font-bold text-orange-400">{log.student_class}</td>
                          <td className="p-4 font-medium text-slate-300">{log.test_title || 'Truy cập hệ thống'}</td>
                          <td className="p-4 text-slate-400">{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
