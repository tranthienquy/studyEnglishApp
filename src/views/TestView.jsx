import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, User, Send, Trophy, Menu, X, Info, Clock, BookOpen, Highlighter, Eraser, ZoomIn, ZoomOut, BookMarked } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import { saveResult } from '../lib/supabase';
import Timer from '../components/ui/Timer';
import ReadingPassage from '../components/test/ReadingPassage';
import QuestionPanel, { QuestionTracker, QuestionTrackerSidebar } from '../components/test/QuestionPanel';
import Modal from '../components/ui/Modal';
import Leaderboard from '../components/teacher/Leaderboard';

export default function TestView({ isReviewMode = false }) {
  const { currentTest, student, submitTest, answers, activeTool, setActiveTool } = useAppStore();
  const startTimeRef = useRef(Date.now());

  // Shared active tab state
  const [activeTab, setActiveTab] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [mobilePanel, setMobilePanel] = useState('passage');

  // Lifted toolbar state (shared across the top subnav bar)
  const [zoom, setZoom] = useState(100);
  const [activeColor, setActiveColor] = useState('yellow');
  const [showVocab, setShowVocab] = useState(false);
  const HIGHLIGHT_COLORS = { yellow: '#FDE68A', green: '#A7F3D0', blue: '#BFDBFE', pink: '#FBCFE8', orange: '#FED7AA' };
  const clampZoom = (v) => Math.max(80, Math.min(130, v));

  // Reset vocab when switching tabs
  useEffect(() => { setShowVocab(false); }, [activeTab]);

  const sections = currentTest?.sections || [];

  function handleSubmit() {
    const { startTimeStamp } = useAppStore.getState();
    const elapsed = startTimeStamp
      ? Math.floor((Date.now() - startTimeStamp) / 1000)
      : Math.floor((Date.now() - startTimeRef.current) / 1000);
    const result = submitTest(elapsed);
    saveResult({
      student_name: student?.name || '',
      student_class: student?.class || '',
      teacher: student?.teacher || '',
      test_id: currentTest?.id || '',
      score: result?.score || 0,
      time_spent: elapsed,
      answers_json: result?.detailedAnswers || [],
    }).catch(() => {});
  }

  if (!currentTest) {
    setTimeout(() => useAppStore.getState().setView('test-select'), 0);
    return <div className="flex h-screen items-center justify-center text-slate-500">Đang tải đề thi...</div>;
  }

  return (
    <div className="tv-root">

      {/* ══ MAIN TOP HEADER ══ */}
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between gap-4 flex-shrink-0">
        {/* Left: Brand Icon + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <GraduationCap size={22} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-gray-900 truncate">
              {currentTest.title || 'Đề Thử Nghiệm Tốt Nghiệp THPT 2026'}
            </h1>
            <p className="text-xs text-gray-400 font-medium truncate">
              Môn: <strong className="text-indigo-600">TIẾNG ANH</strong> &nbsp;•&nbsp; Giáo viên: <span className="text-gray-600">{currentTest.teacher || 'Ms. Trang - FSC3DN'}</span>
            </p>
          </div>
        </div>

        {/* Center/Right: Candidate Tag + Timer + Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Candidate Tag */}
          <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              {student?.name ? student.name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="text-left">
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block leading-none">THÍ SINH</span>
              <span className="text-gray-800 text-xs font-medium">{student?.name || 'Học sinh'} ({student?.class || 'N/A'})</span>
            </div>
          </div>

          {!isReviewMode ? (
            <>
              {/* Timer */}
              <Timer onExpire={handleSubmit} />

              {/* Submit Button (Electric Royal Blue) */}
              <button
                className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border-none px-4 rounded-xl font-bold shadow-md shadow-indigo-500/20 gap-1.5"
                onClick={() => setShowSubmitConfirm(true)}
              >
                <span>Nộp Bài</span> <Send size={13} />
              </button>
            </>
          ) : (
            <>
              {/* Static Time Spent */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
                <Clock size={14} />
                {Math.floor((useAppStore.getState().timeSpent || 0) / 60).toString().padStart(2, '0')}:
                {((useAppStore.getState().timeSpent || 0) % 60).toString().padStart(2, '0')}
              </div>

              {/* Back to Result Button */}
              <button
                className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border-none px-4 rounded-xl font-bold shadow-md shadow-emerald-500/20 gap-1.5"
                onClick={() => useAppStore.getState().setView('result')}
              >
                <span>Kết Quả</span> <Trophy size={13} />
              </button>
            </>
          )}

          {/* Leaderboard Button */}
          <button
            className="btn btn-sm btn-square bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 rounded-xl"
            onClick={() => setShowLeaderboard(true)}
            title="Bảng xếp hạng"
          >
            <Trophy size={16} />
          </button>
        </div>
      </header>

      {/* ══ TOP ANNOUNCEMENT BAR ══ */}
      <div className="bg-indigo-950 text-indigo-200 text-xs py-1.5 px-4 flex items-center justify-center gap-2 font-medium tracking-wide flex-shrink-0 text-center">
        <Info size={14} className="text-indigo-400 flex-shrink-0" />
        <span>Mẹo học tập: Nhấp đúp chuột (Double-click) vào bất kỳ từ nào trong bài đọc, câu hỏi hoặc đáp án để xem nghĩa tiếng Việt ngay tức thì!</span>
      </div>
      {/* ══ FULL-WIDTH SUBNAV: Tabs (left) + Tools (right) ══ */}
      <div className="tv-subnav">
        {/* LEFT: Section tabs */}
        <div className="tv-subnav-tabs">
          {sections.map((sec, i) => (
            <button
              key={i}
              className={`tv-subnav-tab ${activeTab === i ? 'active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              <BookOpen size={12} />
              <span>Phần {i + 1}</span>
            </button>
          ))}
        </div>

        {/* RIGHT: Toolbar */}
        <div className="tv-subnav-tools">
          {/* Zoom */}
          <div className="tv-subnav-zoom">
            <button className="tv-subnav-icon-btn" onClick={() => setZoom(z => clampZoom(z - 10))} title="Thu nhỏ"><ZoomOut size={13} /></button>
            <span className="tv-subnav-zoom-pct">{zoom}%</span>
            <button className="tv-subnav-icon-btn" onClick={() => setZoom(z => clampZoom(z + 10))} title="Phóng to"><ZoomIn size={13} /></button>
          </div>
          <div className="tv-subnav-sep" />

          {/* Highlight */}
          <button
            className={`tv-subnav-tool-btn ${activeTool === 'highlight' ? 'active' : ''}`}
            onClick={() => setActiveTool(activeTool === 'highlight' ? null : 'highlight')}
            style={activeTool === 'highlight' ? { borderColor: HIGHLIGHT_COLORS[activeColor], color: '#d97706' } : {}}
          >
            <Highlighter size={13} /><span>Dạ quang</span>
          </button>
          {activeTool === 'highlight' && (
            <div className="tv-subnav-colors">
              {Object.entries(HIGHLIGHT_COLORS).map(([name, color]) => (
                <button key={name} className={`tv-subnav-color-dot ${activeColor === name ? 'selected' : ''}`} style={{ background: color }} onClick={() => setActiveColor(name)} title={name} />
              ))}
            </div>
          )}

          {/* Eraser */}
          <button
            className={`tv-subnav-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
            onClick={() => setActiveTool(activeTool === 'eraser' ? null : 'eraser')}
          >
            <Eraser size={13} /><span>Bút xóa</span>
          </button>

          <div className="tv-subnav-sep" />

          {/* Vocab */}
          <button
            className={`tv-subnav-tool-btn ${showVocab ? 'active' : ''}`}
            onClick={() => setShowVocab(v => !v)}
          >
            <BookMarked size={13} /><span>Từ vựng</span>
          </button>
        </div>
      </div>


      <div className="tv-mobile-switch lg:hidden">
        <button
          className={`tv-switch-btn ${mobilePanel === 'passage' ? 'active' : ''}`}
          onClick={() => setMobilePanel('passage')}
        >
          📄 Đề thi
        </button>
        <button
          className={`tv-switch-btn ${mobilePanel === 'questions' ? 'active' : ''}`}
          onClick={() => setMobilePanel('questions')}
        >
          ❓ Câu hỏi
        </button>
      </div>

      {/* ══ MAIN BODY ══ */}
      <main className="tv-body">
        {/* LEFT: Passage panel */}
        <div className={`tv-left ${mobilePanel === 'passage' ? 'mobile-show' : 'mobile-hide'}`}>
          <ReadingPassage
            sections={sections}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            zoom={zoom}
            activeTool={activeTool}
            activeColor={activeColor}
            showVocab={showVocab}
            setShowVocab={setShowVocab}
          />
        </div>

        {/* Divider */}
        <div className="tv-divider hidden lg:block" />

        {/* MIDDLE: Question panel */}
        <div className={`tv-middle ${mobilePanel === 'questions' ? 'mobile-show' : 'mobile-hide'}`}>
          <QuestionPanel
            sections={sections}
            activeTab={activeTab}
            onSubmit={() => setShowSubmitConfirm(true)}
            isReview={isReviewMode}
          />
        </div>

        {/* RIGHT: Question tracker sidebar */}
        <div className="tv-right">
          {!isReviewMode && <QuestionTrackerSidebar sections={sections} />}
        </div>
      </main>

      {/* ══ MODALS ══ */}
      <Modal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} title="🏆 Bảng xếp hạng" size="lg">
        <Leaderboard />
      </Modal>

      <Modal isOpen={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} title="" size="sm">
        <SubmitConfirmModal
          sections={sections}
          onCancel={() => setShowSubmitConfirm(false)}
          onConfirm={() => { setShowSubmitConfirm(false); handleSubmit(); }}
        />
      </Modal>
    </div>
  );
}

function SubmitConfirmModal({ sections, onCancel, onConfirm }) {
  const { answers } = useAppStore();
  const allQ = sections?.flatMap(s => s.questions) || [];
  const done = allQ.filter(q => answers[q.id]).length;
  const total = allQ.length;
  const unanswered = total - done;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="p-6 text-center relative overflow-hidden">
      {/* Top Send Icon Badge */}
      <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-xs">
        <Send size={28} strokeWidth={1.75} className="translate-x-0.5" />
      </div>

      {/* Title & Subtitle */}
      <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase mb-1">
        XÁC NHẬN NỘP BÀI THI
      </h2>
      <p className="text-xs text-indigo-600 font-semibold mb-5">
        Vui lòng kiểm tra kỹ trước khi nộp bài
      </p>

      {/* Metrics Summary Box */}
      <div className="grid grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 mb-5">
        <div className="text-center p-2 border-r border-indigo-100/60">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ĐÃ LÀM</span>
          <p className="text-2xl font-black text-emerald-600 my-0.5">{done}/{total}</p>
          <span className="text-[10px] text-gray-400 font-medium">câu hỏi</span>
        </div>
        <div className="text-center p-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">CHƯA LÀM</span>
          <p className={`text-2xl font-black my-0.5 ${unanswered > 0 ? 'text-amber-500' : 'text-gray-400'}`}>{unanswered}</p>
          <span className="text-[10px] text-gray-400 font-medium">câu hỏi</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1.5">
          <span>Tiến độ hoàn thành</span>
          <span className="text-indigo-600 font-bold">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className="btn bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold py-3 transition-colors cursor-pointer"
          onClick={onCancel}
        >
          Quay lại làm tiếp
        </button>
        <button
          className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl text-xs font-bold py-3 shadow-md shadow-indigo-500/25 cursor-pointer flex items-center justify-center gap-1.5"
          onClick={onConfirm}
        >
          <Send size={14} /> Xác nhận Nộp bài
        </button>
      </div>
    </div>
  );
}
