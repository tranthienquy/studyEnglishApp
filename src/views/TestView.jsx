import React, { useState, useRef } from 'react';
import { GraduationCap, User, Send, Trophy, Menu, X, Info, Clock } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import { saveResult } from '../lib/supabase';
import Timer from '../components/ui/Timer';
import ReadingPassage from '../components/test/ReadingPassage';
import QuestionPanel from '../components/test/QuestionPanel';
import Modal from '../components/ui/Modal';
import Leaderboard from '../components/teacher/Leaderboard';

export default function TestView({ isReviewMode = false }) {
  const { currentTest, student, submitTest, answers } = useAppStore();
  const startTimeRef = useRef(Date.now());

  // Shared active tab state — synced between left (passage) and right (questions) panels
  const [activeTab, setActiveTab] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [mobilePanel, setMobilePanel] = useState('passage'); // 'passage' | 'questions'

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

  if (!currentTest) return null;

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

      {/* ══ MOBILE PANEL SWITCHER ══ */}
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
          />
        </div>

        {/* Divider */}
        <div className="tv-divider hidden lg:block" />

        {/* RIGHT: Question panel */}
        <div className={`tv-right ${mobilePanel === 'questions' ? 'mobile-show' : 'mobile-hide'}`}>
          <QuestionPanel
            sections={sections}
            activeTab={activeTab}
            onSubmit={() => setShowSubmitConfirm(true)}
            isReview={isReviewMode}
          />
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

  return (
    <div className="p-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto text-2xl">
        ⚠️
      </div>
      <div>
        <h3 className="text-lg font-extrabold text-gray-900 tracking-tight uppercase mb-1">
          XÁC NHẬN NỘP BÀI THI
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
          Bạn đã làm được <strong className="text-indigo-600">{done}/{total}</strong> câu hỏi. Bạn có chắc chắn muốn nộp bài thi ngay bây giờ để nhận kết quả?
        </p>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          className="btn btn-sm flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-none font-semibold"
          onClick={onCancel}
        >
          Quay lại làm tiếp
        </button>
        <button
          className="btn btn-sm flex-1 bg-indigo-600 hover:bg-indigo-700 text-white border-none font-semibold shadow-md shadow-indigo-500/20"
          onClick={onConfirm}
        >
          Xác nhận Nộp bài
        </button>
      </div>
    </div>
  );
}
