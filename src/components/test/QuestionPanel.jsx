import React, { useState } from 'react';
import {
  GraduationCap, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, BookOpen, Flag, LayoutGrid
} from 'lucide-react';
import useAppStore from '../../stores/useAppStore';

const LETTERS = ['A', 'B', 'C', 'D'];

/* ─────────────────────────────────────────────
   QuestionTracker — bảng tổng hợp câu hỏi
───────────────────────────────────────────── */
function QuestionTracker({ sections }) {
  const { answers, flagged } = useAppStore();
  const [open, setOpen] = useState(false);

  // Flatten all questions
  const allQ = sections?.flatMap(s => s.questions) || [];
  const answered = allQ.filter(q => answers[q.id]).length;
  const flaggedCount = flagged.size;
  const total = allQ.length;
  const unanswered = total - answered;

  function getStatus(q) {
    if (flagged.has(q.id)) return 'flagged';
    if (answers[q.id]) return 'done';
    return 'empty';
  }

  return (
    <div className="qt-wrapper">
      {/* Toggle header */}
      <button className="qt-toggle" onClick={() => setOpen(o => !o)}>
        <LayoutGrid size={13} />
        <span>Bảng tổng hợp câu hỏi</span>
        <div className="qt-stats">
          <span className="qt-stat done">{answered} đã làm</span>
          <span className="qt-stat empty">{unanswered} chưa làm</span>
          {flaggedCount > 0 && <span className="qt-stat flagged">⚑ {flaggedCount}</span>}
        </div>
        {open ? <ChevronUp size={12} className="ml-auto flex-shrink-0" /> : <ChevronDown size={12} className="ml-auto flex-shrink-0" />}
      </button>

      {/* Grid */}
      {open && (
        <div className="qt-body">
          {/* Legend */}
          <div className="qt-legend">
            <span className="qt-leg-item"><span className="qt-dot done" />Đã làm</span>
            <span className="qt-leg-item"><span className="qt-dot empty" />Chưa làm</span>
            <span className="qt-leg-item"><span className="qt-dot flagged" />Ghim</span>
          </div>

          {/* Per-section groups */}
          {sections?.map((sec, si) => (
            <div key={sec.id} className="qt-section">
              <p className="qt-sec-label">
                Phần {si + 1} <span className="qt-sec-range">Q{sec.questions[0]?.no}–Q{sec.questions[sec.questions.length - 1]?.no}</span>
              </p>
              <div className="qt-grid">
                {sec.questions.map(q => {
                  const st = getStatus(q);
                  return (
                    <div
                      key={q.id}
                      className={`qt-cell ${st}`}
                      title={`Câu ${q.no}${st === 'done' ? ` — ${answers[q.id]}` : ''}${st === 'flagged' ? ' (đã ghim)' : ''}`}
                    >
                      {st === 'flagged' ? <Flag size={8} /> : q.no}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Progress bar */}
          <div className="qt-progress-bar">
            <div
              className="qt-progress-fill"
              style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
            />
          </div>
          <p className="qt-progress-label">{total > 0 ? Math.round((answered / total) * 100) : 0}% hoàn thành</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SingleQuestion — Box câu hỏi rộng chuẩn Ảnh 2
───────────────────────────────────────────── */
function SingleQuestion({ q, isReview = false }) {
  const { answers, setAnswer, flagged, toggleFlag } = useAppStore();
  const [showExplain, setShowExplain] = useState(false);

  const chosen = answers[q.id];
  const isFlagged = flagged.has(q.id);

  // Clean question prompt text: remove inline options repetition if present
  let questionPrompt = q.text || `Question ${q.no}.`;
  if (questionPrompt.includes('A.') && questionPrompt.includes('B.')) {
    questionPrompt = questionPrompt.split(/A[\.\:\)]/)[0].trim() || `Question ${q.no}.`;
  }

  return (
    <div
      id={`q-card-${q.id}`}
      className={`bg-white rounded-2xl p-5 border shadow-xs transition-all ${
        chosen ? 'border-indigo-400 bg-indigo-50/20 shadow-sm' : 'border-gray-200/90'
      }`}
    >
      {/* ── Question Header (Dark Navy Square Number Badge + Prompt Text) ── */}
      <div className="flex items-start gap-3 mb-4">
        {/* Dark Navy Square Number Badge (Matching Image 2) */}
        <div className="w-7 h-7 min-w-[28px] rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-xs mt-0.5">
          {q.no}
        </div>

        {/* Question Prompt Text */}
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-relaxed">
            {questionPrompt}
          </p>
        </div>

        {/* Flag button */}
        {!isReview && (
          <button
            className={`p-1.5 rounded-lg border transition-colors ${
              isFlagged ? 'bg-amber-50 border-amber-300 text-amber-600' : 'text-gray-300 hover:text-amber-500 border-transparent'
            }`}
            onClick={() => toggleFlag(q.id)}
            title={isFlagged ? 'Bỏ ghim' : 'Ghim câu nghi ngờ'}
          >
            <Flag size={14} />
          </button>
        )}
      </div>

      {/* ── Options Stack — Wide Card Buttons (Matching Image 2) ── */}
      <div className="space-y-2.5">
        {LETTERS.map((letter, i) => {
          const text = q.options[i] || '';
          const isSelected = chosen === letter;
          const isCorrect  = letter === q.correct;

          // Compute option card styles matching Image 2
          let cardStyle = "group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-all cursor-pointer user-select-none bg-white ";
          if (isReview) {
            if (isCorrect)              cardStyle += "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500";
            else if (isSelected)        cardStyle += "border-red-400 bg-red-50/60";
            else                        cardStyle += "border-gray-200 opacity-60";
          } else {
            if (isSelected)             cardStyle += "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 shadow-sm";
            else                        cardStyle += "border-gray-200/90 hover:border-indigo-300 hover:bg-slate-50/60";
          }

          return (
            <div
              key={letter}
              className={cardStyle}
              role="button"
              tabIndex={isReview ? -1 : 0}
              onClick={() => !isReview && setAnswer(q.id, letter)}
              onKeyDown={(e) => e.key === 'Enter' && !isReview && setAnswer(q.id, letter)}
            >
              {/* Circular Letter Bubble (w-8 h-8 rounded-full border) */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                isReview
                  ? (isCorrect ? 'bg-emerald-600 text-white border-emerald-600' : isSelected ? 'bg-red-500 text-white border-red-500' : 'bg-gray-100 text-gray-500 border-gray-200')
                  : (isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-gray-700 border-gray-300 group-hover:border-indigo-400')
              }`}>
                {letter}
              </div>

              {/* Option Text */}
              <span className={`flex-1 text-xs sm:text-sm ${isSelected ? 'font-bold text-indigo-950' : 'font-medium text-gray-800'}`}>
                {text}
              </span>

              {/* Review Badges */}
              {isReview && isCorrect && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 size={12} /> Đáp án đúng
                </span>
              )}
              {isReview && isSelected && !isCorrect && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100/80 px-2.5 py-1 rounded-lg">
                  <XCircle size={12} /> Sai
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Explanation Toggle (Only visible in Review mode after completing test) ── */}
      {isReview && q.explanation && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors"
            onClick={() => setShowExplain(v => !v)}
          >
            <BookOpen size={13} />
            <span>{showExplain ? 'Ẩn lời giải chi tiết' : 'Xem lời giải chi tiết'}</span>
          </button>
          {showExplain && (
            <div className="mt-2 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
              {q.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuestionPanel({ sections, activeTab, onSubmit, isReview = false }) {
  const { answers } = useAppStore();

  const section = sections?.[activeTab];
  if (!section) return null;

  const questions = section.questions || [];
  const answeredInSection = questions.filter(q => answers[q.id]).length;

  return (
    <div className="qp-panel">

      {/* ── Header ── */}
      <div className="qp-header">
        <div className="qp-header-left">
          <div className="qp-header-icon">
            <GraduationCap size={14} className="text-indigo-600" />
          </div>
          <h2 className="qp-title-text">CÂU HỎI TRẮC NGHIỆM</h2>
        </div>
        <span className="qp-count-badge">{questions.length} câu hỏi trong Phần này</span>
      </div>

      {/* ── Question Tracker (bảng tổng hợp) ── */}
      {!isReview && <QuestionTracker sections={sections} />}

      {/* ── Questions list — scrollable ── */}
      <div className="qp-list">
        {questions.map(q => (
          <SingleQuestion key={q.id} q={q} isReview={isReview} />
        ))}
      </div>

      {/* ── Footer ── */}
      {!isReview && (
        <div className="qp-footer">
          <p className="qp-footer-label">
            Đã trả lời <strong className="text-indigo-600">{answeredInSection}</strong>/{questions.length} câu trong phần này
          </p>
          <button
            className="qp-submit-btn"
            onClick={onSubmit}
          >
            📤 Nộp bài
          </button>
        </div>
      )}
    </div>
  );
}
