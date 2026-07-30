import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, FileText, Settings, Trophy, PlusCircle, Trash2,
  CheckCircle2, Loader2, BookOpen, Save, Eye, RefreshCw,
  GripVertical, ChevronDown, ChevronUp, AlertTriangle, ArrowLeft,
  Users, Sparkles, Database, ExternalLink
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Leaderboard from '../components/teacher/Leaderboard';
import ReadingPassage from '../components/test/ReadingPassage';
import QuestionPanel from '../components/test/QuestionPanel';
import Modal from '../components/ui/Modal';
import {
  saveTest, getAllTests, deleteTest, clearAllMockTests, getSupabaseConfig, saveSupabaseConfig, isRealSupabaseConfigured, testDatabaseConnection, isTestHidden, toggleHideTest
} from '../lib/supabase';
import { parseTestContent } from '../lib/gemini';
import { extractFileText, parseExamText } from '../lib/parser';
import { MOCK_TESTS } from '../lib/mockData';
import useAppStore from '../stores/useAppStore';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function TeacherView({ onSwitchStudent }) {
  const { setTest } = useAppStore();

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
  const [uploadDuration, setUploadDuration] = useState(50);
  const [uploadTeacher, setUploadTeacher] = useState('Cô Trang');
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

  // Fetch all available tests on mount
  useEffect(() => {
    loadTests();
  }, []);

  const [hiddenVersion, setHiddenVersion] = useState(0);

  async function loadTests() {
    setLoadingList(true);
    try {
      const tests = await getAllTests(true);
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
    <div className="min-h-screen bg-[#F4F6F9] text-gray-800 font-sans pb-12">
      {/* ── Top Header Navigation Bar ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-gray-900 uppercase">
                LUYỆN THI THPT QUỐC GIA
              </h1>
              <p className="text-[11px] font-semibold text-gray-400 tracking-wider">
                HỆ THỐNG ĐỀ ÔN LUYỆN THÔNG MINH AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs gap-1.5 rounded-xl shadow-xs"
              onClick={() => setShowSupabaseModal(true)}
            >
              <Database size={13} /> Lưu trữ Tệp
            </button>

            <button
              className="btn btn-sm bg-gray-100 hover:bg-gray-200 text-gray-700 border-none font-bold text-xs gap-1.5 rounded-xl"
              onClick={onSwitchStudent}
            >
              <Users size={13} /> Học sinh ôn tập
            </button>

            <button
              className="btn btn-sm bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs gap-1.5 rounded-xl pointer-events-none"
            >
              <Settings size={13} /> Giáo viên quản lý
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
                  <BookOpen size={16} className="text-indigo-600" />
                  ĐỀ THI TRÊN HỆ THỐNG ({testList.length})
                </h2>
                <p className="text-[10px] text-gray-400 mt-0.5">Bao gồm đề đã tải lên &amp; đề mẫu demo</p>
              </div>
              <button
                className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-colors flex-shrink-0"
                title="Xóa 2 đề mẫu demo mặc định khỏi danh sách"
                onClick={() => {
                  if (window.confirm('Bạn có muốn xóa toàn bộ 2 đề thi mẫu mặc định (Demo) khỏi hệ thống?')) {
                    clearAllMockTests();
                    loadTests();
                  }
                }}
              >
                🗑️ Xóa đề mẫu
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {loadingList ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2 text-indigo-500" />
                  Đang tải danh sách đề thi...
                </div>
              ) : testList.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">Chưa có đề thi nào.</div>
              ) : (
                testList.map(t => {
                  const isSelected = selectedTestId === (t.id || t.code);
                  const qCount = t.questions?.length || t.questions_json?.length || 40;
                  const isCustom = String(t.id).startsWith('custom') || String(t.code).startsWith('TEST');
                  return (
                    <div
                      key={t.id || t.code}
                      onClick={() => selectTest(t)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-500 ring-1 ring-indigo-500'
                          : 'bg-white border-gray-100 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            isCustom ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {isCustom ? 'ĐỀ ĐÃ TẢI LÊN' : (t.subject || 'ĐỀ MẪU')}
                          </span>
                          {isTestHidden(t.id || t.code) && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                              🔴 Đã ẩn
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
                <Sparkles size={16} className="text-indigo-600" />
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Môn học</label>
                  <select
                    className="select select-bordered select-sm w-full bg-slate-50 border-gray-200 text-xs rounded-xl"
                    value={uploadSubject}
                    onChange={e => setUploadSubject(e.target.value)}
                  >
                    <option>Tiếng Anh</option>
                    <option>Ngữ Văn</option>
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

              {/* Upload Dropzone */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Nguồn tài liệu</label>
                <div
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-indigo-300'
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
                      <Loader2 size={28} className="text-indigo-600 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-indigo-700">{parseMsg}</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={28} className="text-indigo-400 mx-auto mb-2" strokeWidth={1.5} />
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
                  <span className="text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-md tracking-wider">
                    {editingTest.subject || 'TIẾNG ANH'}
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
                  className="btn btn-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs gap-1.5 px-4 rounded-xl shadow-xs"
                  onClick={() => setMainTab('preview')}
                >
                  <Eye size={14} /> Xem trước
                </button>

                {(() => {
                  const isHidden = editingTest ? isTestHidden(editingTest.id || editingTest.code) : false;
                  return (
                    <button
                      className={`btn font-bold text-xs gap-1.5 px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer ${
                        isHidden
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      }`}
                      onClick={handleToggleStudentAccess}
                      title={isHidden ? 'Đề đang bị ẩn đối với học sinh. Bấm để hiển thị!' : 'Đề đang được hiển thị cho học sinh. Bấm để ẩn!'}
                    >
                      {isHidden ? '🔴 ẨN HỌC SINH ÔN TẬP' : '🟢 MỞ HỌC SINH ÔN TẬP'}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 2. Three Metric Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">SỐ LƯỢT LÀM BÀI</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-indigo-900">0</span>
                <span className="text-xs text-gray-400 font-semibold">Lượt nộp bài</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ĐIỂM TRUNG BÌNH</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-indigo-900">0</span>
                <span className="text-xs text-gray-400 font-semibold">Thang điểm 10</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ĐIỂM CAO NHẤT</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-indigo-900">0</span>
                <span className="text-xs text-amber-500 font-bold">Thành tích cao nhất</span>
              </div>
            </div>
          </div>

          {/* 3. Navigation Tabs Bar (Chỉnh sửa trực tiếp, Xem trước & Bảng kết quả) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50/50 px-2 pt-2 flex-wrap">
              <button
                className={`px-5 py-3 text-xs font-bold transition-all border-b-2 gap-2 flex items-center ${
                  mainTab === 'edit'
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setMainTab('edit')}
              >
                ✏️ CHỈNH SỬA TRỰC TIẾP ĐỀ THI ({totalQuestionsCount} CÂU)
              </button>

              <button
                className={`px-5 py-3 text-xs font-bold transition-all border-b-2 gap-2 flex items-center ${
                  mainTab === 'preview'
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setMainTab('preview')}
              >
                👁 XEM TRƯỚC ĐỀ ÔN TẬP (PREVIEW)
              </button>

              <button
                className={`px-5 py-3 text-xs font-bold transition-all border-b-2 gap-2 flex items-center ${
                  mainTab === 'results'
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => setMainTab('results')}
              >
                👥 BẢNG KẾT QUẢ HỌC SINH (0)
              </button>
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
                            className="btn btn-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-none font-bold rounded-lg gap-1"
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
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0">
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
                                  <span className="text-xs font-extrabold text-indigo-700 w-4">{l}.</span>
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
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    className="btn btn-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs gap-1.5"
                    onClick={addNewSection}
                  >
                    <PlusCircle size={14} /> Thêm phần đọc mới (Section)
                  </button>

                  <div className="flex items-center gap-3">
                    {savedMsg && <span className="text-xs font-bold text-emerald-600">{savedMsg}</span>}
                    <button
                      className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs px-6 gap-1.5 shadow-md shadow-indigo-500/20"
                      onClick={handleSaveTest}
                      disabled={saving}
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Lưu bài thi lên hệ thống
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: XEM TRƯỚC ĐỀ ÔN TẬP (PREVIEW MODE) */}
            {mainTab === 'preview' && (
              <div className="p-6 space-y-4">
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                    <Eye size={16} className="text-indigo-600" />
                    <span>CHẾ ĐỘ XEM TRƯỚC (PREVIEW): Bạn đang xem giao diện đọc hiểu &amp; làm bài thực tế của học sinh.</span>
                  </div>
                  <button
                    className="btn btn-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg border-none"
                    onClick={() => setMainTab('edit')}
                  >
                    ✏️ Quay lại chỉnh sửa
                  </button>
                </div>

                {/* 2-Column Student Test Simulator */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[650px] border border-gray-200 rounded-2xl overflow-hidden bg-slate-50">
                  <div className="lg:col-span-7 h-full border-r border-gray-200 overflow-hidden bg-white">
                    <ReadingPassage
                      sections={editingTest.sections}
                      activeTab={previewTab}
                      onTabChange={setPreviewTab}
                    />
                  </div>
                  <div className="lg:col-span-5 h-full overflow-hidden bg-white">
                    <QuestionPanel
                      sections={editingTest.sections}
                      activeTab={previewTab}
                      isReview={false}
                      onSubmit={() => alert('Chế độ Xem trước (Preview): Học sinh làm xong sẽ bấm nộp bài để xem điểm & lời giải chi tiết!')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BẢNG KẾT QUẢ HỌC SINH */}
            {mainTab === 'results' && (
              <div className="p-6">
                <Leaderboard />
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
            {testing ? <Loader2 size={14} className="animate-spin text-indigo-600" /> : null}
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
          className="btn btn-sm w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs gap-1.5"
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
