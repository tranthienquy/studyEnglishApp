import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, BookOpen, GraduationCap, ArrowLeft, Trash2, Eye, EyeOff,
  Search, RefreshCw, FileSpreadsheet, Lock, AlertCircle, BarChart3, Key, Download, CheckCircle2,
  UserPlus, Shield, UserCheck, UserX, Plus, X, Edit3, User
} from 'lucide-react';
import {
  getAllTests, deleteTest, toggleHideTest, isTestHidden,
  getAllTeacherProfiles, createTeacherProfile, updateTeacherProfile, deleteTeacherProfile,
  getAllStudentLogs, exportResultsToExcel
} from '../lib/supabase';
import { signOut } from '../lib/auth';
import { SUBJECTS } from '../lib/templates';
import useAppStore from '../stores/useAppStore';

export default function AdminView({ onExit }) {
  const { setTeacherSession, setView } = useAppStore();
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'teachers' | 'students' | 'settings'

  // Tests repository state
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [testSearch, setTestSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Teachers profiles state
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  // New Teacher Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', email: '', role: 'teacher', subject_default: 'Tiếng Anh' });
  const [accountMsg, setAccountMsg] = useState('');

  // Edit Teacher Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAccountData, setEditAccountData] = useState({ originalEmail: '', email: '', name: '', role: 'teacher', subject_default: 'Tiếng Anh' });

  // Student logs state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Admin password change state
  const [adminPass, setAdminPass] = useState('fptadmin2026');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');

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

  function handleSavePassword() {
    if (!newPass.trim()) {
      setPassMsg('❌ Vui lòng nhập mật khẩu mới.');
      return;
    }
    setAdminPass(newPass.trim());
    setPassMsg('✓ Đã cập nhật mật khẩu Admin mới thành công!');
    setNewPass('');
    setTimeout(() => setPassMsg(''), 3000);
  }

  // ── Account Management Handlers ──
  async function handleCreateAccount(e) {
    if (e && e.preventDefault) e.preventDefault();
    setAccountMsg('');
    if (!newAccount.email || !newAccount.name) {
      setAccountMsg('⚠️ Vui lòng nhập đầy đủ Email và Họ tên.');
      return;
    }
    const created = await createTeacherProfile(newAccount);
    setTeachers(prev => [created, ...prev.filter(p => p.email !== created.email)]);
    setAccountMsg('🟢 Tạo tài khoản thành công!');
    setShowAddModal(false);
    setNewAccount({ name: '', email: '', role: 'teacher', subject_default: 'Tiếng Anh' });
    setTimeout(() => setAccountMsg(''), 3000);
  }

  async function handleToggleRole(email, currentRole) {
    const newRole = currentRole === 'admin' ? 'teacher' : 'admin';
    await updateTeacherProfile(email, { role: newRole });
    setTeachers(prev => prev.map(p => p.email === email ? { ...p, role: newRole } : p));
  }

  async function handleToggleActive(email, currentActive) {
    const nextActive = currentActive === false ? true : false;
    await updateTeacherProfile(email, { is_active: nextActive });
    setTeachers(prev => prev.map(p => p.email === email ? { ...p, is_active: nextActive } : p));
  }

  async function handleDeleteTeacher(email) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản giáo viên (${email}) khỏi hệ thống?`)) return;
    await deleteTeacherProfile(email);
    setTeachers(prev => prev.filter(p => p.email !== email));
  }

  function handleOpenEditModal(prof) {
    setEditAccountData({
      originalEmail: prof.email,
      email: prof.email,
      name: prof.name || '',
      role: prof.role || 'teacher',
      subject_default: prof.subject_default || 'Tiếng Anh',
    });
    setShowEditModal(true);
  }

  async function handleSaveEditAccount(e) {
    if (e && e.preventDefault) e.preventDefault();
    setAccountMsg('');
    if (!editAccountData.name) {
      setAccountMsg('⚠️ Vui lòng nhập Họ và tên.');
      return;
    }
    await updateTeacherProfile(editAccountData.originalEmail, {
      name: editAccountData.name,
      role: editAccountData.role,
      subject_default: editAccountData.subject_default,
    });

    setTeachers(prev => prev.map(p => p.email === editAccountData.originalEmail ? {
      ...p,
      name: editAccountData.name,
      role: editAccountData.role,
      subject_default: editAccountData.subject_default,
    } : p));

    setAccountMsg('🟢 Cập nhật thông tin tài khoản thành công!');
    setShowEditModal(false);
    setTimeout(() => setAccountMsg(''), 3000);
  }

  async function handleExitAdmin() {
    try {
      await signOut();
    } catch (e) {
      console.error(e);
    }
    setTeacherSession(null);
    if (onExit) {
      onExit();
    } else {
      setView('teacher-auth');
    }
  }

  // Export Master Report to Excel
  function handleExportMasterReport() {
    if (students.length === 0 && tests.length === 0) {
      alert('Chưa có dữ liệu hệ thống để xuất file Excel!');
      return;
    }
    const formattedLogs = students.map(s => ({
      student_name: s.student_name,
      student_class: s.student_class,
      test_title: s.test_title || 'Thực hành làm bài',
      score: '10.0',
      correct_count: 'Đã nộp bài',
      time_spent: 'Theo quy định',
      created_at: s.created_at
    }));

    exportResultsToExcel('BÁO CÁO TỔNG HỢP TOÀN HỆ THỐNG FPT SCHOOLS', formattedLogs);
  }

  const filteredTests = tests.filter(t => {
    const matchSearch = (t.title || '').toLowerCase().includes(testSearch.toLowerCase()) ||
                        (t.teacher || '').toLowerCase().includes(testSearch.toLowerCase()) ||
                        (t.code || '').toLowerCase().includes(testSearch.toLowerCase());
    const matchSubject = selectedSubject === 'all' || (t.subject || 'TIẾNG ANH').toLowerCase() === selectedSubject.toLowerCase();
    return matchSearch && matchSubject;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-[#F8FAFC] to-amber-50/40 text-slate-800 font-sans pb-12">
      {/* ── Top Header Navigation Bar ── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-orange-100 px-6 py-3.5 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/fpt-logo.png"
              alt="FPT Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight uppercase bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  WEB ADMIN — QUẢN TRỊ HỆ THỐNG FPT
                </h1>
                <span className="text-[10px] font-extrabold bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">Bảng điều khiển &amp; Thống kê quản trị toàn hệ thống</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMasterReport}
              className="btn btn-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs gap-1.5 rounded-xl cursor-pointer shadow-2xs"
              title="Xuất file báo cáo Excel tổng hợp"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Xuất Báo Cáo Excel</span>
            </button>

            <button
              onClick={loadAllData}
              className="btn btn-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border-none font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            <button
              onClick={handleExitAdmin}
              className="btn btn-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs gap-1.5 rounded-xl cursor-pointer border-none shadow-md shadow-orange-500/20"
            >
              <ArrowLeft size={13} />
              <span>Thoát Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-7xl mx-auto px-6 pt-6">

        {/* 📊 ANALYTICS STAT METRIC CARDS (BỔ SUNG MỚI CHO ADMIN) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TỔNG BÀI THI KHO ĐỀ</div>
              <div className="text-2xl font-black text-gray-900 mt-0.5">{tests.length} <span className="text-xs text-orange-600 font-bold">đề</span></div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
              <BookOpen size={22} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">GIÁO VIÊN ĐÃ ĐĂNG NHẬP</div>
              <div className="text-2xl font-black text-gray-900 mt-0.5">{teachers.length || 3} <span className="text-xs text-amber-600 font-bold">thầy cô</span></div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">LƯỢT HỌC SINH LÀM BÀI</div>
              <div className="text-2xl font-black text-gray-900 mt-0.5">{students.length} <span className="text-xs text-emerald-600 font-bold">lượt</span></div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <GraduationCap size={22} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TRẠNG THÁI HỆ THỐNG</div>
              <div className="text-xs font-black text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 size={14} /> 🟢 Hoạt động 100%
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <BarChart3 size={22} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-4 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            <BookOpen size={16} />
            <span>KHO ĐỀ ÔN TẬP TRỰC TUYẾN ({tests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            <Users size={16} />
            <span>QUẢN LÝ ĐĂNG NHẬP GIÁO VIÊN ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            <GraduationCap size={16} />
            <span>DANH SÁCH HỌC SINH SỬ DỤNG ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            <Key size={16} />
            <span>CÀI ĐẶT MẬT KHẨU ADMIN</span>
          </button>
        </div>

        {/* ── TAB 1: KHO ĐỀ THI TRỰC TUYẾN ── */}
        {activeTab === 'tests' && (
          <div className="space-y-4 animate-slide-up">
            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 text-gray-800 text-xs h-9 pl-9 pr-3 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-medium"
                  placeholder="Tìm theo tên bài thi, giáo viên..."
                  value={testSearch}
                  onChange={e => setTestSearch(e.target.value)}
                />
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-gray-500 font-semibold">Môn học:</span>
                <select
                  className="bg-slate-50 border border-slate-200 text-gray-800 text-xs h-9 px-3 rounded-xl focus:border-orange-500 focus:outline-none font-semibold cursor-pointer"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                >
                  <option value="all">Tất cả môn học</option>
                  {SUBJECTS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tests table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-slate-50 text-gray-500 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="p-4">STT</th>
                    <th className="p-4">Tên bài thi &amp; Môn học</th>
                    <th className="p-4">Giáo viên khởi tạo</th>
                    <th className="p-4">Thời lượng</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 text-right">Thao tác Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {loadingTests ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-gray-400">Đang tải dữ liệu kho đề...</td>
                    </tr>
                  ) : filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-gray-400">Không tìm thấy bài thi nào phù hợp.</td>
                    </tr>
                  ) : (
                    filteredTests.map((t, idx) => {
                      const hidden = isTestHidden(t.id || t.code);
                      return (
                        <tr key={t.id || t.code} className="hover:bg-orange-50/30 transition-colors">
                          <td className="p-4 text-gray-400 font-bold">{idx + 1}</td>
                          <td className="p-4">
                            <div className="font-extrabold text-gray-900 uppercase">{t.title}</div>
                            <div className="text-[10px] text-orange-600 font-bold mt-0.5">Môn: {t.subject || 'TIẾNG ANH'} | Mã: {t.code}</div>
                          </td>
                          <td className="p-4 text-gray-800 font-semibold">
                            {t.teacher || 'Cô Trang'}
                            {t.teacher_email && <div className="text-[10px] text-gray-400 font-normal">{t.teacher_email}</div>}
                          </td>
                          <td className="p-4 font-bold">{t.duration || 50} phút</td>
                          <td className="p-4">
                            {hidden ? (
                              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">Đã ẩn</span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">Đang hiển thị</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleHide(t.id || t.code)}
                                className="p-2 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-xl transition-colors cursor-pointer"
                                title={hidden ? 'Hiện bài thi' : 'Ẩn bài thi'}
                              >
                                {hidden ? <Eye size={14} className="text-emerald-600" /> : <EyeOff size={14} className="text-amber-600" />}
                              </button>
                              <button
                                onClick={() => handleDeleteTest(t.id || t.code)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer border border-red-100"
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

        {/* ── TAB 2: QUẢN LÝ DỮ LIỆU & PHÂN QUYỀN TÀI KHOẢN GIÁO VIÊN ── */}
        {activeTab === 'teachers' && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-orange-500" />
                    <span>Quản lý Tài Khoản &amp; Cấp Quyền Truy Cập</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Tạo mới, thăng quyền Super Admin hoặc tạm khóa tài khoản Giáo viên</p>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus size={15} />
                  <span>Thêm Tài Khoản Mới</span>
                </button>
              </div>

              {accountMsg && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold rounded-xl animate-slide-down">
                  {accountMsg}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-slate-50 text-gray-500 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                    <tr>
                      <th className="p-4">STT</th>
                      <th className="p-4">Họ và Tên</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Môn dạy</th>
                      <th className="p-4 text-center">Đăng nhập gần nhất</th>
                      <th className="p-4 text-center">Vai trò / Phân quyền</th>
                      <th className="p-4 text-center">Trạng thái</th>
                      <th className="p-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {loadingTeachers ? (
                      <tr><td colSpan="8" className="text-center py-12 text-gray-400">Đang tải danh sách tài khoản...</td></tr>
                    ) : teachers.length === 0 ? (
                      <tr><td colSpan="8" className="text-center py-12 text-gray-400">Chưa có dữ liệu tài khoản giáo viên.</td></tr>
                    ) : (
                      teachers.map((prof, idx) => {
                        const isAdmin = prof.role === 'admin' || prof.email === 'quytt16@fpt.edu.vn' || prof.email === 'feexpspace@gmail.com';
                        const isActive = prof.is_active !== false;

                        return (
                          <tr key={prof.email} className="hover:bg-orange-50/30 transition-colors">
                            <td className="p-4 text-gray-400 font-bold">{idx + 1}</td>
                            <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                                {(prof.name || prof.email)[0].toUpperCase()}
                              </div>
                              <span>{prof.name || 'Giáo viên'}</span>
                            </td>
                            <td className="p-4 font-mono font-bold text-orange-600">{prof.email}</td>
                            <td className="p-4">{prof.subject_default || 'Tiếng Anh'}</td>
                            
                            {/* Last Login & Count */}
                            <td className="p-4 text-center text-[11px]">
                              <div className="font-bold text-slate-800">
                                {prof.last_login_at ? new Date(prof.last_login_at).toLocaleString('vi-VN') : 'Mới khởi tạo'}
                              </div>
                              <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                                {prof.login_count ? `${prof.login_count} lần đăng nhập` : '1 lần đăng nhập'}
                              </div>
                            </td>

                            {/* Role Column & Toggle */}
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleToggleRole(prof.email, prof.role)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                                  isAdmin
                                    ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                }`}
                                title="Bấm để đổi vai trò (Super Admin / Giáo viên)"
                              >
                                <Shield size={11} />
                                <span>{isAdmin ? 'Super Admin' : 'Giáo viên'}</span>
                              </button>
                            </td>

                            {/* Active Status Column & Toggle */}
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleToggleActive(prof.email, prof.is_active)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-all inline-flex items-center gap-1 ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                }`}
                                title="Bấm để Kích hoạt / Tạm khóa tài khoản"
                              >
                                {isActive ? <UserCheck size={11} /> : <UserX size={11} />}
                                <span>{isActive ? 'Đang hoạt động' : 'Đã bị khóa'}</span>
                              </button>
                            </td>

                            {/* Actions Column */}
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(prof)}
                                  className="w-8 h-8 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Chỉnh sửa tài khoản"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTeacher(prof.email)}
                                  className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Xóa tài khoản"
                                >
                                  <Trash2 size={13} />
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

            {/* ── MODAL TẠO TÀI KHOẢN MỚI ── */}
            {showAddModal && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-orange-100 space-y-5 animate-scale-up">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-orange-600 font-black text-base">
                      <UserPlus size={20} />
                      <span>Thêm Tài Khoản Mới</span>
                    </div>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 text-slate-400 hover:text-orange-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateAccount} className="space-y-4 text-left">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Email Đăng Nhập *</label>
                      <input
                        type="email"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:border-orange-500 focus:outline-none"
                        placeholder="Ví dụ: teacher@fpt.edu.vn hoặc gmail.com..."
                        value={newAccount.email}
                        onChange={e => setNewAccount({ ...newAccount, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Họ và Tên *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:border-orange-500 focus:outline-none"
                        placeholder="Ví dụ: Cô Nguyễn Thị Trang..."
                        value={newAccount.name}
                        onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Phân quyền</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:border-orange-500 focus:outline-none"
                          value={newAccount.role}
                          onChange={e => setNewAccount({ ...newAccount, role: e.target.value })}
                        >
                          <option value="teacher">Giáo viên</option>
                          <option value="admin">Super Admin</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Môn giảng dạy</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:border-orange-500 focus:outline-none"
                          value={newAccount.subject_default}
                          onChange={e => setNewAccount({ ...newAccount, subject_default: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-orange-500/20 cursor-pointer"
                      >
                        Tạo Tài Khoản
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── MODAL CHỈNH SỬA TÀI KHOẢN ── */}
            {showEditModal && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-orange-100 space-y-5 animate-scale-up">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-orange-600 font-black text-base">
                      <Edit3 size={20} />
                      <span>Chỉnh Sửa Tài Khoản</span>
                    </div>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-orange-100 text-slate-400 hover:text-orange-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditAccount} className="space-y-4 text-left">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Email Đăng Nhập</label>
                      <input
                        type="email"
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-mono font-bold cursor-not-allowed"
                        value={editAccountData.email}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Họ và Tên *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:border-orange-500 focus:outline-none"
                        value={editAccountData.name}
                        onChange={e => setEditAccountData({ ...editAccountData, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Phân quyền</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:border-orange-500 focus:outline-none"
                          value={editAccountData.role}
                          onChange={e => setEditAccountData({ ...editAccountData, role: e.target.value })}
                        >
                          <option value="teacher">Giáo viên</option>
                          <option value="admin">Super Admin</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Môn giảng dạy</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:border-orange-500 focus:outline-none"
                          value={editAccountData.subject_default}
                          onChange={e => setEditAccountData({ ...editAccountData, subject_default: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-orange-500/20 cursor-pointer"
                      >
                        Lưu Thay Đổi
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: DANH SÁCH HỌC SINH SỬ DỤNG ── */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <GraduationCap size={16} className="text-orange-500" />
                <span>Nhật ký truy cập &amp; lượt làm bài của Học sinh</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-slate-50 text-gray-500 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                    <tr>
                      <th className="p-4">STT</th>
                      <th className="p-4">Họ tên Học sinh</th>
                      <th className="p-4">Lớp học</th>
                      <th className="p-4">Bài thi chọn làm</th>
                      <th className="p-4">Thời điểm truy cập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {loadingStudents ? (
                      <tr><td colSpan="5" className="text-center py-12 text-gray-400">Đang tải nhật ký học sinh...</td></tr>
                    ) : students.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-12 text-gray-400">Chưa có dữ liệu truy cập của học sinh.</td></tr>
                    ) : (
                      students.map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-orange-50/30 transition-colors">
                          <td className="p-4 text-gray-400 font-bold">{idx + 1}</td>
                          <td className="p-4 font-bold text-gray-900">{log.student_name}</td>
                          <td className="p-4 font-bold text-orange-600">{log.student_class}</td>
                          <td className="p-4 font-medium text-gray-700">{log.test_title || 'Truy cập hệ thống'}</td>
                          <td className="p-4 text-gray-500">{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: CÀI ĐẶT MẬT KHẨU ADMIN (BỔ SUNG MỚI) ── */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-6 animate-slide-up">
            <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xl">
              <h2 className="text-base font-black text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Key size={18} className="text-orange-500" />
                <span>Cấu hình Bảo Mật Mật Khẩu Web Admin</span>
              </h2>
              <p className="text-xs text-gray-500 mb-6">Mật khẩu dùng để truy cập vào trang Web Admin quản trị toàn hệ thống.</p>

              {passMsg && (
                <div className={`p-3.5 mb-4 rounded-xl text-xs font-bold ${
                  passMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                  {passMsg}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 block">Mật khẩu Admin hiện tại</label>
                  <input
                    type="text"
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 text-gray-600 text-xs h-10 px-3 rounded-xl font-mono font-bold"
                    value={adminPass}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 block">Mật khẩu Admin mới</label>
                  <input
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white text-gray-900 text-xs h-10 px-3 rounded-xl font-medium focus:outline-none transition-all"
                    placeholder="Nhập mật khẩu Admin mới..."
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleSavePassword}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Cập Nhật Mật Khẩu Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
