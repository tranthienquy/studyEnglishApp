import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, FileText, Settings, Trophy, PlusCircle, Trash2,
  CheckCircle2, Loader2, BookOpen, Save, Eye, EyeOff, FileEdit, RefreshCw,
  GripVertical, ChevronDown, ChevronUp, AlertTriangle, ArrowLeft,
  Users, Sparkles, Database, ExternalLink, Download, FileSpreadsheet, LogOut, ShieldCheck
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Leaderboard from '../components/teacher/Leaderboard';
import ReadingPassage from '../components/test/ReadingPassage';
import QuestionPanel from '../components/test/QuestionPanel';
import Modal from '../components/ui/Modal';
import {
  saveTest, getAllTests, deleteTest, clearAllMockTests, getSupabaseConfig, saveSupabaseConfig, isRealSupabaseConfigured, testDatabaseConnection, isTestHidden, toggleHideTest, getTestSubmissions, exportResultsToExcel
} from '../lib/supabase';
import { parseTestContent } from '../lib/gemini';
import { extractFileText, parseExamText } from '../lib/parser';
import { MOCK_TESTS } from '../lib/mockData';
import { downloadWordTemplate, SUBJECTS } from '../lib/templates';
import useAppStore from '../stores/useAppStore';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

  export default function TeacherView({ onSwitchStudent }) {
  const { teacherSession, clearTeacherSession, setView } = useAppStore();

  // Tests list state
  const [testList, setTestList] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [loadingList, setLoadingList] = useState(true);

  // Active view tab in right column: 'edit' | 'preview' | 'results'
  const [mainTab, setMainTab] = useState('edit');
  const [previewTab, setPreviewTab] = useState(0);

  // Supabase modal state
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  // Upload sidebar state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('Tiếng Anh');
  const [uploadGrade, setUploadGrade] = useState('12');
  const [uploadDuration, setUploadDuration] = useState(50);
  const [uploadTeacher, setUploadTeacher] = useState(teacherSession?.name || 'Cô Trang');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseStatus, setParseStatus] = useState(null);
  const [parseMsg, setParseMsg] = useState('');
  const fileInputRef = useRef(null);

  // Active test editing state
  const [editingTest, setEditingTest] = useState({
    id: 'test-10',
    code: 'ENG2025A',
    title: 'ĐỀ THI TRÍCH XUẤT TỪ: ĐỀ 10',
    subject: 'TIẾNG ANH',
    duration: 50,
    teacher: 'Cô Trang',
    sections: [],
  });

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const isFirstLoad = useRef(true);
  const autoSaveTimer = useRef(null);

  // Fetch all available tests on mount
  useEffect(() => {
    loadTests();
  }, []);

  const [hiddenVersion, setHiddenVersion] = useState(0);

  // Submissions state for active editingTest
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    if (editingTest) {
      const testId = editingTest.id || editingTest.code;
      setLoadingSubmissions(true);
      getTestSubmissions(testId).then(data => {
        setSubmissions(data || []);
        setLoadingSubmissions(false);
      });
    }
  }, [editingTest?.id, editingTest?.code]);

  // ── Auto-save: debounce 2s after any editingTest content change ──
  useEffect(() => {
    // Skip the very first load (when test is selected from list)
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    // Clear any pending timer
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    // Debounce: save after 2 seconds of inactivity
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const allQs = editingTest.sections.flatMap(s => s.questions);
        await saveTest({
          code: editingTest.code,
          title: editingTest.title,
          subject: editingTest.subject,
          duration: editingTest.duration,
          teacher: editingTest.teacher,
          passage: editingTest.sections[0]?.passage || '',
          sections: editingTest.sections,
          questions_json: allQs,
        });
        setSavedMsg('✓ Đã tự động lưu');
        setTimeout(() => setSavedMsg(''), 2500);
      } catch (_) { /* silent fail */ }
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTest]);

  async function loadTests() {
    setLoadingList(true);
    try {
      const teacherEmail = teacherSession?.email || null;
      const tests = await getAllTests(true, teacherEmail);
      setTestList(tests || []);
      if (tests && tests.length > 0) {
        selectTest(tests[0]);
      }
    } catch (e) {
      console.error('Failed to load tests:', e);
    }
    setLoadingList(false);
  }

  function selectTest(t) {
    setSelectedTestId(t.id || t.code);

    // Normalize sections if missing
    let secs = t.sections;
    if (!secs || secs.length === 0) {
      secs = [
        {
          id: 'sec-1',
          title: 'Phần đọc quảng cáo và điền từ (Questions 1-6)',
          instruction: 'Read the following passage and answer the questions.',
          passage: t.passage || '',
          questions: t.questions || t.questions_json || [],
        }
      ];
    }

    isFirstLoad.current = true;
    setEditingTest({
      id: t.id || t.code,
      code: t.code || 'ENG2025A',
      title: t.title || 'Đề thi trích xuất từ: ĐỀ 10',
      subject: t.subject || 'TIẾNG ANH',
      duration: t.duration || 50,
      teacher: t.teacher || 'Cô Trang',
      sections: secs,
    });
  }

  // Handle file upload & auto-parsing
  async function handleFile(file) {
    if (!file) return;

    setUploading(true);
    setParseStatus('parsing');
    setParseMsg('Đang đọc nội dung file Word/PDF...');

    try {
      const fileData = await extractFileText(file);
      setParseMsg('Đang nhận diện các đoạn văn (Passage) & đáp án highlight...');

      // 1. Always prioritize local rule-based parseExamText for docx/txt files (supports multi-sections & 40+ questions)
      let parsed = parseExamText(fileData);
      if (!parsed || !parsed.sections || parsed.sections.length === 0) {
        parsed = await parseTestContent(fileData.text || fileData.html);
      }

      if (parsed && parsed.sections && parsed.sections.length > 0) {
        const newTitle = uploadTitle.trim() || parsed.title || `Đề thi trích xuất từ ${file.name.replace(/\.[^/.]+$/, '')}`;
        const newCode = parsed.code || `TEST-${Date.now().toString().slice(-4)}`;

        const newTestObj = {
          id: `custom-${Date.now()}`,
          code: newCode,
          title: newTitle,
          subject: uploadSubject,
          grade: uploadGrade,
          duration: parseInt(uploadDuration) || 50,
          teacher: uploadTeacher || 'Cô Trang',
          sections: parsed.sections,
          passage: parsed.passage || parsed.sections[0]?.passage || '',
          questions: parsed.questions || [],
        };

        // Save to system as 1 single test
        await saveTest({
          code: newTestObj.code,
          title: newTestObj.title,
          subject: newTestObj.subject,
          grade: newTestObj.grade,
          duration: newTestObj.duration,
          teacher: newTestObj.teacher,
          passage: newTestObj.passage,
          sections: newTestObj.sections,
          questions_json: newTestObj.questions,
        });

        setParseStatus('done');
        setParseMsg(`✅ Đã nhận diện 1 ĐỀ THI ("${newTitle}") gồm ${newTestObj.sections.length} phần & ${parsed.questions.length} câu hỏi!`);
        await loadTests();
        selectTest(newTestObj);
      } else {
        throw new Error('Không nhận diện được cấu trúc đề thi. Vui lòng kiểm tra lại file.');
      }
    } catch (e) {
      console.error(e);
      setParseStatus('error');
      setParseMsg(e.message || 'Lỗi khi phân tích file.');
    }

    setUploading(false);
  }

  async function handleDeleteTest(t) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đề thi "${t.title}" khỏi hệ thống?`)) return;
    try {
      if (t.id) await deleteTest(t.id);
      if (t.code && t.code !== t.id) await deleteTest(t.code);
      await loadTests();
    } catch (e) {
      console.error('Failed to delete test:', e);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // Section & Question Editing Handlers
  function updateSectionPassage(secIdx, newPassage) {
    setEditingTest(prev => {
      const updated = [...prev.sections];
      updated[secIdx] = { ...updated[secIdx], passage: newPassage };
      return { ...prev, sections: updated };
    });
  }

  function updateQuestion(secIdx, qIdx, field, value) {
    setEditingTest(prev => {
      const updatedSecs = [...prev.sections];
      const sec = { ...updatedSecs[secIdx] };
      const qs = [...sec.questions];
      qs[qIdx] = { ...qs[qIdx], [field]: value };
      sec.questions = qs;
      updatedSecs[secIdx] = sec;
      return { ...prev, sections: updatedSecs };
    });
  }

  function addQuestionToSection(secIdx) {
    setEditingTest(prev => {
      const updatedSecs = [...prev.sections];
      const sec = { ...updatedSecs[secIdx] };
      const qs = [...sec.questions];
      const totalQ = updatedSecs.reduce((acc, s) => acc + s.questions.length, 0);

      qs.push({
        id: `q-${Date.now()}`,
        no: totalQ + 1,
        text: `Question ${totalQ + 1}.`,
        options: ['', '', '', ''],
        correct: 'A',
        explanation: '',
      });
      sec.questions = qs;
      updatedSecs[secIdx] = sec;
      return { ...prev, sections: updatedSecs };
    });
  }

  function deleteQuestionFromSection(secIdx, qIdx) {
    setEditingTest(prev => {
      const updatedSecs = [...prev.sections];
      const sec = { ...updatedSecs[secIdx] };
      sec.questions = sec.questions.filter((_, i) => i !== qIdx);
      updatedSecs[secIdx] = sec;
      return { ...prev, sections: updatedSecs };
    });
  }

  function deleteSection(secIdx) {
    if (editingTest.sections.length <= 1) {
      alert('Đề thi phải có ít nhất 1 phần (Section).');
      return;
    }
    setEditingTest(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== secIdx)
    }));
  }

  function addNewSection() {
    setEditingTest(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `sec-${Date.now()}`,
          title: `Phần bài đọc mới (Section ${prev.sections.length + 1})`,
          instruction: 'Read the following passage and answer the questions below.',
          passage: 'Nhập nội dung đoạn văn đọc hiểu tại đây...',
          questions: [],
        }
      ]
    }));
  }

  async function handleSaveTest() {
    setSaving(true);
    try {
      const allQs = editingTest.sections.flatMap(s => s.questions);
      const result = await saveTest({
        code: editingTest.code,
        title: editingTest.title,
        subject: editingTest.subject,
        duration: editingTest.duration,
        teacher: editingTest.teacher,
        passage: editingTest.sections[0]?.passage || '',
        sections: editingTest.sections,
        questions_json: allQs,
      });

      if (result && result.error) {
        alert('Lỗi từ Supabase: ' + result.error);
      } else {
        setSavedMsg('Đã lưu đề thi thành công!');
        setTimeout(() => setSavedMsg(''), 3000);
      }
      await loadTests();
    } catch (e) {
      alert('Lưu thất bại: ' + e.message);
    }
    setSaving(false);
  }

  function handleToggleStudentAccess() {
    if (!editingTest) return;
    const idStr = editingTest.id || editingTest.code;
    toggleHideTest(idStr);
    setHiddenVersion(v => v + 1);
  }

  const totalQuestionsCount = editingTest.sections.reduce((acc, s) => acc + s.questions.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-[#F8FAFC] to-orange-50/30 text-gray-800 font-sans pb-12">
      {/* ── Top Header Navigation Bar ── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-amber-100 px-6 py-3 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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

          <div className="flex items-center gap-2">
            {/* Teacher Profile Badge */}
            {teacherSession && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-orange-50/80 border border-orange-200/90 rounded-xl text-xs">
                <div className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {teacherSession.name ? teacherSession.name.charAt(0).toUpperCase() : 'G'}
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-slate-900 leading-none">{teacherSession.name || 'Giáo viên'}</div>
                  <div className="text-[9.5px] text-orange-700 font-semibold">{teacherSession.email}</div>
                </div>
              </div>
            )}

            <button
              className="btn btn-sm bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs gap-1.5 rounded-xl shadow-xs cursor-pointer"
              onClick={() => setShowSupabaseModal(true)}
            >
              <Database size={13} /> CSDL
            </button>

            <button
              className="btn btn-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border-none font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
              onClick={onSwitchStudent}
            >
              <Users size={13} /> Trang Học Sinh
            </button>

            <button
              className="btn btn-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs gap-1.5 rounded-xl cursor-pointer"
              onClick={() => {
                clearTeacherSession();
                setView('teacher-auth');
              }}
              title="Đăng xuất khỏi cổng Giáo viên"
            >
              <LogOut size={13} /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* ── Main 2-Column Content ── */}
      <main className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN (Sidebar: Available Tests & AI Upload Zone) ── */}
        <div className="lg:col-span-4 space-y-6">

          {/* 1. DANH SÁCH ĐỀ THI TRÊN HỆ THỐNG Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <BookOpen size={16} className="text-amber-600" />
                  ĐỀ THI TRÊN HỆ THỐNG ({testList.length})
                </h2>
                <p className="text-[10px] text-gray-400 mt-0.5">Bao gồm đề đã tải lên &amp; đề mẫu demo</p>
              </div>
              <button
                className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-colors flex-shrink-0 flex items-center gap-1 cursor-pointer"
                title="Xóa 2 đề mẫu demo mặc định khỏi danh sách"
                onClick={() => {
                  if (window.confirm('Bạn có muốn xóa toàn bộ 2 đề thi mẫu mặc định (Demo) khỏi hệ thống?')) {
                    clearAllMockTests();
                    loadTests();
                  }
                }}
              >
                <Trash2 size={12} className="text-red-500" />
                <span>Xóa đề mẫu</span>
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {loadingList ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2 text-amber-500" />
                  Đang tải danh sách đề thi...
                </div>
              ) : testList.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">Chưa có đề thi nào.</div>
              ) : (
                testList.map(t => {
                  const isSelected = selectedTestId === (t.id || t.code);
                  const qCount = t.questions?.length || t.questions_json?.length || 40;
                  const isCustom = String(t.id).startsWith('custom') || String(t.code).startsWith('TEST');
                  
                  const d = t.created_at ? new Date(t.created_at) : new Date();
                  const dateDot = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

                  return (
                    <div
                      key={t.id || t.code}
                      onClick={() => selectTest(t)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400'
                          : 'bg-white border-gray-100 hover:border-amber-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            isCustom ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100/80 text-amber-800'
                          }`}>
                            {isCustom ? `Ngày tải lên: ${dateDot}` : (t.subject || 'ĐỀ MẪU')}
                          </span>
                          {isTestHidden(t.id || t.code) && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <EyeOff size={11} className="text-amber-700" />
                              <span>Đã ẩn</span>
                            </span>
                          )}
                        </div>
                        <button
                          className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                          title="Xóa đề thi này"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTest(t);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <h3 className="font-bold text-xs text-gray-900 line-clamp-1 mb-1">{t.title}</h3>
                      <p className="text-[11px] text-gray-400 flex items-center gap-3">
                        <span>⏱ {t.duration || 50} phút</span>
                        <span>•</span>
                        <span>{qCount} câu hỏi</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">Người tạo: {t.teacher || 'Cô Trang'}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. TẢI ĐỀ THI AI THÔNG MINH Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-4">
            <div>
              <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                TẢI ĐỀ THI AI THÔNG MINH
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">AI tự động nhận diện và soạn lời giải chi tiết</p>
            </div>

            {/* Form controls */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Tiêu đề đề thi đề xuất (Tùy chọn)</label>
                <input
                  className="input input-bordered input-sm w-full bg-slate-50 border-gray-200 text-xs rounded-xl"
                  placeholder="Ví dụ: Đề khảo sát Tiếng Anh 12 lần 1"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Môn học</label>
                  <select
                    className="select select-bordered select-sm w-full bg-slate-50 border-gray-200 text-xs rounded-xl"
                    value={uploadSubject}
                    onChange={e => setUploadSubject(e.target.value)}
                  >
                    {SUBJECTS.map(s => (
                      <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Khối</label>
                  <select
                    className="select select-bordered select-sm w-full bg-slate-50 border-gray-200 text-xs rounded-xl"
                    value={uploadGrade}
                    onChange={e => setUploadGrade(e.target.value)}
                  >
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Thời gian (Phút)</label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full bg-slate-50 border-gray-200 text-xs rounded-xl"
                    value={uploadDuration}
                    onChange={e => setUploadDuration(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Tên giáo viên upload</label>
                <input
                  className="input input-bordered input-sm w-full bg-slate-50 border-gray-200 text-xs rounded-xl"
                  placeholder="Ví dụ: Cô Minh Trang"
                  value={uploadTeacher}
                  onChange={e => setUploadTeacher(e.target.value)}
                />
              </div>

              {/* Download Word Template Button */}
              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-amber-900">File Word Mẫu Chuẩn FPT</div>
                  <div className="text-[10px] text-amber-700 font-medium">Môn {uploadSubject}</div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadWordTemplate(uploadSubject)}
                  className="btn btn-xs bg-amber-600 hover:bg-amber-700 text-white border-none font-bold text-[11px] gap-1 px-2.5 py-1 rounded-lg cursor-pointer shadow-2xs"
                >
                  <Download size={12} />
                  <span>Tải Template</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Nguồn tài liệu</label>
                <div
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 bg-slate-50/50 hover:bg-amber-50/40 hover:border-amber-300'
                  }`}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.pdf,.txt"
                    className="hidden"
                    onChange={e => handleFile(e.target.files[0])}
                  />
                  {uploading ? (
                    <div className="space-y-2 py-2">
                      <Loader2 size={28} className="text-amber-500 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-amber-700">{parseMsg}</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={28} className="text-amber-400 mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-xs font-bold text-gray-700">Tải lên file Word (.doc, .docx), PDF hoặc .txt</p>
                      <p className="text-[10px] text-gray-400 mt-1">Kéo thả hoặc nhấn vào để chọn tệp</p>
                    </>
                  )}
                </div>
              </div>

              {/* Status indicator */}
              {parseStatus === 'done' && !uploading && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
                  <CheckCircle2 size={14} /> {parseMsg}
                </div>
              )}
              {parseStatus === 'error' && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} /> {parseMsg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Main Test Config & Multi-Section Editor) ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. Header Overview Banner */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase bg-amber-100/80 text-amber-800 px-2.5 py-0.5 rounded-md tracking-wider">
                    {editingTest.subject || 'TIẾNG ANH'}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase bg-orange-100/80 text-orange-800 px-2.5 py-0.5 rounded-md tracking-wider">
                    Khối {editingTest.grade || '12'}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">Tạo ngày: 16/7/2026</span>
                </div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">
                  {editingTest.title}
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Người phụ trách: <strong className="text-gray-800">{editingTest.teacher}</strong> | Thời gian: <strong className="text-gray-800">{editingTest.duration} phút</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="h-9 px-4 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs min-w-[110px]"
                  onClick={() => setMainTab('preview')}
                >
                  <Eye size={14} className="text-amber-600" />
                  <span>Xem trước</span>
                </button>

                {(() => {
                  const isHidden = editingTest ? isTestHidden(editingTest.id || editingTest.code) : false;
                  return (
                    <button
                      className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs min-w-[110px] border ${
                        isHidden
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-500/20'
                          : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-amber-500/20'
                      }`}
                      onClick={handleToggleStudentAccess}
                      title={isHidden ? 'Đề đang bị ẩn đối với học sinh. Bấm để hiển thị (Hiện đề)!' : 'Đề đang được hiển thị cho học sinh. Bấm để ẩn (Ẩn đề)!'}
                    >
                      {isHidden ? (
                        <>
                          <Eye size={14} />
                          <span>Hiện đề</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} />
                          <span>Ẩn đề</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 2. Three Metric Stats Cards */}
          {(() => {
            const subCount = submissions.length;
            const avgScore = subCount > 0
              ? (submissions.reduce((acc, s) => acc + Number(s.score || 0), 0) / subCount).toFixed(1)
              : '0.0';
            const maxScore = subCount > 0
              ? Math.max(...submissions.map(s => Number(s.score || 0))).toFixed(1)
              : '0.0';

            return (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 rounded-2xl p-4 border border-amber-200/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-extrabold text-amber-800/80 uppercase tracking-wider">SỐ LƯỢT LÀM BÀI</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-extrabold text-amber-600">{subCount}</span>
                    <span className="text-xs text-amber-600 font-bold">Lượt nộp bài</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 rounded-2xl p-4 border border-amber-200/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-extrabold text-amber-800/80 uppercase tracking-wider">ĐIỂM TRUNG BÌNH</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-extrabold text-amber-600">{avgScore}</span>
                    <span className="text-xs text-amber-600 font-bold">Thang điểm 10</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 rounded-2xl p-4 border border-amber-200/80 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-extrabold text-amber-800/80 uppercase tracking-wider">ĐIỂM CAO NHẤT</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-3xl font-extrabold text-amber-600">{maxScore}</span>
                    <span className="text-xs text-amber-600 font-bold">Thành tích cao nhất</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 3. Navigation Tabs Bar (Chỉnh sửa trực tiếp, Xem trước & Bảng kết quả) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50/50 px-2 pt-2 flex-wrap items-center">
              <button
                className={`px-5 py-3 text-xs font-bold transition-all border-b-2 gap-2 flex items-center cursor-pointer ${
                  mainTab === 'edit'
                    ? 'border-amber-500 text-amber-600 bg-amber-50/40 rounded-t-xl font-extrabold'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setMainTab('edit')}
              >
                <FileEdit size={14} className="text-amber-600" />
                <span>Chỉnh sửa đề ({totalQuestionsCount} câu)</span>
              </button>

              <button
                className={`px-5 py-3 text-xs font-bold transition-all border-b-2 gap-2 flex items-center cursor-pointer ${
                  mainTab === 'preview'
                    ? 'border-amber-500 text-amber-600 bg-amber-50/40 rounded-t-xl font-extrabold'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setMainTab('preview')}
              >
                <Eye size={14} className="text-amber-600" />
                <span>Preview</span>
              </button>

              <button
                className={`px-5 py-3 text-xs font-bold transition-all border-b-2 gap-2 flex items-center cursor-pointer ${
                  mainTab === 'results'
                    ? 'border-amber-500 text-amber-600 bg-amber-50/40 rounded-t-xl font-extrabold'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setMainTab('results')}
              >
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span>Tải Excel ({submissions.length})</span>
              </button>

              {/* Save button — pinned to the right of the tab bar */}
              {mainTab === 'edit' && (
                <div className="ml-auto flex items-center gap-2 pb-1 pr-1">
                  {savedMsg && <span className="text-xs font-bold text-emerald-600">{savedMsg}</span>}
                  <button
                    className="btn btn-sm bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs px-4 gap-1.5 shadow-md shadow-orange-500/20"
                    onClick={handleSaveTest}
                    disabled={saving}
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Lưu chỉnh sửa
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: CHỈNH SỬA TRỰC TIẾP ĐỀ THI */}
            {mainTab === 'edit' && (
              <div className="p-6 space-y-6">
                {/* Meta Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Tiêu đề bài thi</label>
                    <input
                      className="input input-bordered input-sm w-full bg-slate-50 border-gray-200 text-xs font-semibold rounded-xl"
                      value={editingTest.title}
                      onChange={e => setEditingTest(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Thời gian thi (phút)</label>
                    <input
                      type="number"
                      className="input input-bordered input-sm w-full bg-slate-50 border-gray-200 text-xs font-semibold rounded-xl"
                      value={editingTest.duration}
                      onChange={e => setEditingTest(prev => ({ ...prev, duration: parseInt(e.target.value) || 50 }))}
                    />
                  </div>
                </div>

                {/* Multi-Section List (Từng phần / Từng Tab) */}
                <div className="space-y-6">
                  {editingTest.sections.map((sec, secIdx) => (
                    <div key={sec.id || secIdx} className="border border-gray-300 rounded-2xl p-5 bg-white space-y-4 shadow-xs">
                      {/* Section Header Bar */}
                      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wide">
                          {sec.title || `PHẦN BÀI ĐỌC ${secIdx + 1}`}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border-none font-bold rounded-lg gap-1"
                            onClick={() => addQuestionToSection(secIdx)}
                          >
                            + Thêm câu hỏi
                          </button>
                          <button
                            className="btn btn-xs bg-red-50 hover:bg-red-100 text-red-600 border-none font-bold rounded-lg"
                            onClick={() => deleteSection(secIdx)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Passage Textarea */}
                      <div>
                        <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1.5">
                          ĐOẠN VĂN ĐỌC HIỂU / VĂN BẢN HƯỚNG DẪN (NẾU CÓ)
                        </label>
                        <textarea
                          className="textarea textarea-bordered w-full bg-slate-50/70 border-gray-200 text-xs leading-relaxed font-reading resize-none rounded-xl"
                          rows={6}
                          value={sec.passage || ''}
                          onChange={e => updateSectionPassage(secIdx, e.target.value)}
                          placeholder="Dán nội dung bài đọc..."
                        />
                      </div>

                      {/* Questions List inside this Section */}
                      <div className="space-y-4 pt-2">
                        {sec.questions.map((q, qIdx) => (
                          <div key={q.id || qIdx} className="bg-slate-50/60 rounded-xl p-4 border border-gray-200/80 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 flex-1">
                                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                                  {q.no || qIdx + 1}
                                </span>
                                <input
                                  className="input input-bordered input-sm flex-1 bg-white border-gray-200 text-xs font-semibold rounded-lg"
                                  value={q.text || ''}
                                  onChange={e => updateQuestion(secIdx, qIdx, 'text', e.target.value)}
                                  placeholder="Nhập nội dung câu hỏi..."
                                />
                              </div>
                              <button
                                className="text-gray-300 hover:text-red-500 p-1"
                                onClick={() => deleteQuestionFromSection(secIdx, qIdx)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* 2x2 Options Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {OPTION_LABELS.map((l, oi) => (
                                <div key={l} className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-amber-700 w-4">{l}.</span>
                                  <input
                                    className="input input-bordered input-sm flex-1 bg-white border-gray-200 text-xs rounded-lg"
                                    value={q.options?.[oi] || ''}
                                    onChange={e => {
                                      const opts = [...(q.options || ['', '', '', ''])];
                                      opts[oi] = e.target.value;
                                      updateQuestion(secIdx, qIdx, 'options', opts);
                                    }}
                                    placeholder={`Lựa chọn ${l}...`}
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Correct Answer & Explanation Row */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                              <div className="md:col-span-4">
                                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">ĐÁP ÁN ĐÚNG</label>
                                <select
                                  className="select select-bordered select-sm w-full bg-white border-gray-200 text-xs font-bold rounded-lg text-emerald-700"
                                  value={q.correct || 'A'}
                                  onChange={e => updateQuestion(secIdx, qIdx, 'correct', e.target.value)}
                                >
                                  <option value="A">Đáp án A</option>
                                  <option value="B">Đáp án B</option>
                                  <option value="C">Đáp án C</option>
                                  <option value="D">Đáp án D</option>
                                </select>
                              </div>

                              <div className="md:col-span-8">
                                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">LỜI GIẢI CHI TIẾT (XEM LẠI BÀI)</label>
                                <textarea
                                  className="textarea textarea-bordered textarea-xs w-full bg-white border-gray-200 text-xs resize-none rounded-lg"
                                  rows={2}
                                  value={q.explanation || ''}
                                  onChange={e => updateQuestion(secIdx, qIdx, 'explanation', e.target.value)}
                                  placeholder="Giải thích ngữ pháp/từ vựng chi tiết cho học sinh xem sau khi nộp bài..."
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Controls Footer */}
                <div className="flex items-center justify-start pt-4 border-t border-gray-200">
                  <button
                    className="btn btn-sm bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold rounded-xl text-xs gap-1.5"
                    onClick={addNewSection}
                  >
                    <PlusCircle size={14} /> Thêm phần đọc mới (Section)
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: XEM TRƯỚC ĐỀ ÔN TẬP (PREVIEW MODE) */}
            {mainTab === 'preview' && (
              <div className="p-6 space-y-4">
                {/* 2-Column Student Test Simulator */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[650px] border border-gray-200 rounded-2xl overflow-hidden bg-slate-50">
                  <div className="lg:col-span-7 h-full border-r border-gray-200 overflow-hidden bg-white">
                    <ReadingPassage
                      sections={editingTest.sections}
                      activeTab={previewTab}
                      onTabChange={setPreviewTab}
                      zoom={80}
                    />
                  </div>
                  <div className="lg:col-span-5 h-full overflow-hidden bg-white">
                    <QuestionPanel
                      sections={editingTest.sections}
                      activeTab={previewTab}
                      isReview={false}
                      zoom={80}
                      onSubmit={() => alert('Chế độ Xem trước (Preview): Học sinh làm xong sẽ bấm nộp bài để xem điểm & lời giải chi tiết!')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BẢNG KẾT QUẢ HỌC SINH & XUẤT EXCEL */}
            {mainTab === 'results' && (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-emerald-600" />
                      DANH SÁCH HỌC SINH ĐÃ NỘP BÀI ({submissions.length} LƯỢT)
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Tải về dữ liệu Excel đầy đủ bao gồm thời gian làm bài, số câu đúng và ngày giờ nộp bài.</p>
                  </div>
                  <button
                    onClick={() => exportResultsToExcel(editingTest?.title, submissions)}
                    className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs gap-1.5 px-3.5 py-1.5 rounded-xl shadow-xs shadow-emerald-500/20 cursor-pointer flex items-center transition-all"
                  >
                    <Download size={13} />
                    <span>Tải Excel</span>
                  </button>
                </div>

                {loadingSubmissions ? (
                  <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                    <Loader2 size={20} className="animate-spin text-amber-500" />
                    <span className="text-xs font-semibold">Đang tải danh sách kết quả...</span>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-600">Chưa có lượt nộp bài nào cho đề thi này.</p>
                    <p className="text-xs text-gray-400">Khi học sinh làm bài thi trực tuyến và bấm nộp bài, kết quả sẽ tự động lưu và hiển thị tại đây.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="table w-full text-xs">
                      <thead className="bg-slate-100/80 text-gray-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4 text-center">STT</th>
                          <th className="py-3 px-4 text-left">Tên học sinh</th>
                          <th className="py-3 px-4 text-center">Lớp</th>
                          <th className="py-3 px-4 text-center">Điểm số</th>
                          <th className="py-3 px-4 text-center">Số câu đúng</th>
                          <th className="py-3 px-4 text-center">Thời gian làm bài</th>
                          <th className="py-3 px-4 text-right">Ngày giờ nộp bài</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {submissions.map((sub, idx) => {
                          const scoreVal = Number(sub.score || 0);
                          const dateStr = sub.created_at
                            ? new Date(sub.created_at).toLocaleString('vi-VN')
                            : 'Mới nộp';

                          return (
                            <tr key={sub.id || idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                              <td className="py-3 px-4 font-bold text-gray-900">{sub.student_name || 'Học sinh'}</td>
                              <td className="py-3 px-4 text-center font-semibold text-amber-700">{sub.student_class || '12A1'}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`font-extrabold text-sm px-2.5 py-0.5 rounded-lg ${
                                  scoreVal >= 8 ? 'bg-emerald-100 text-emerald-800' : scoreVal >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {scoreVal.toFixed(1)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-medium text-gray-600">{sub.correct_count || 'N/A'}</td>
                              <td className="py-3 px-4 text-center font-medium text-gray-600">{sub.time_spent || 'N/A'}</td>
                              <td className="py-3 px-4 text-right text-gray-400 font-mono text-[11px]">{dateStr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Supabase Config Modal */}
      <Modal isOpen={showSupabaseModal} onClose={() => setShowSupabaseModal(false)} title="⚡ Cấu Hình Supabase Database" size="md">
        <SupabaseConfigModal onClose={() => setShowSupabaseModal(false)} />
      </Modal>
    </div>
  );
}

function SupabaseConfigModal({ onClose }) {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [key, setKey] = useState(currentConfig.key || '');
  const [savedMsg, setSavedMsg] = useState('');
  const [testing, setTesting] = useState(false);
  const [statusRes, setStatusRes] = useState(null);

  useEffect(() => {
    runCheck();
  }, []);

  async function runCheck() {
    setTesting(true);
    const res = await testDatabaseConnection();
    setStatusRes(res);
    setTesting(false);
  }

  async function handleSave() {
    saveSupabaseConfig(url, key);
    setSavedMsg('Đã lưu cấu hình mới!');
    await runCheck();
    setTimeout(() => setSavedMsg(''), 3000);
  }

  return (
    <div className="p-4 space-y-4">
      <div className={`p-3.5 rounded-xl text-xs font-bold border flex flex-col gap-1 ${
        statusRes?.success
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : statusRes?.mode === 'local'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-extrabold">
            {testing ? <Loader2 size={14} className="animate-spin text-amber-600" /> : null}
            {statusRes?.success
              ? '🟢 Đã kết nối thành công Supabase DB'
              : statusRes?.mode === 'local'
                ? '🟡 Đang lưu trữ trong Bộ nhớ trình duyệt (Local Storage)'
                : '🔴 Lỗi kết nối CSDL Supabase'}
          </span>
          <button
            className="btn btn-xs bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-[10px]"
            onClick={runCheck}
            disabled={testing}
          >
            {testing ? 'Đang kiểm tra...' : '🔌 Kiểm tra lại'}
          </button>
        </div>
        <p className="text-[11px] font-normal opacity-90 mt-0.5">{statusRes?.message || 'Đang kiểm tra kết nối...'}</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">Project URL (Supabase URL)</label>
          <input
            className="input input-bordered input-sm w-full bg-white text-xs font-mono"
            placeholder="https://xyzcompany.supabase.co"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">Anon / Public API Key</label>
          <input
            type="password"
            className="input input-bordered input-sm w-full bg-white text-xs font-mono"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            value={key}
            onChange={e => setKey(e.target.value)}
          />
        </div>
        <button
          className="btn btn-sm w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs gap-1.5 shadow-md shadow-orange-500/20"
          onClick={handleSave}
          disabled={testing}
        >
          {testing ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Lưu &amp; Kết Nối CSDL Supabase
        </button>
        {savedMsg && <p className="text-xs text-emerald-600 font-bold text-center">{savedMsg}</p>}
      </div>
    </div>
  );
}
