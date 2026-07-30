import React, { useState } from 'react';
import {
  GraduationCap, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, BookOpen, Flag, LayoutGrid
} from 'lucide-react';
import useAppStore from '../../stores/useAppStore';

const LETTERS = ['A', 'B', 'C', 'D'];

/* ─────────────────────────────────────────────
   QuestionTracker — bảng tổng hợp câu hỏi (collapsible, dùng trong QuestionPanel)
───────────────────────────────────────────── */
export function QuestionTracker({ sections, defaultOpen = false }) {
  const { answers, flaggedArray = [] } = useAppStore();
  const [open, setOpen] = useState(defaultOpen);

  const allQ = sections?.flatMap(s => s.questions) || [];
  const answered = allQ.filter(q => answers[q.id]).length;
  const flaggedCount = flaggedArray.length;
  const total = allQ.length;
  const unanswered = total - answered;

  function getStatus(q) {
    if (flaggedArray.includes(q.id)) return 'flagged';
    if (answers[q.id]) return 'done';
    return 'empty';
  }

  return (
    <div className="qt-wrapper">
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
      {open && (
        <div className="qt-body">
          <div className="qt-legend">
            <span className="qt-leg-item"><span className="qt-dot done" />Đã làm</span>
            <span className="qt-leg-item"><span className="qt-dot empty" />Chưa làm</span>
            <span className="qt-leg-item"><span className="qt-dot flagged" />Ghim</span>
          </div>
          {sections?.map((sec, si) => (
            <div key={sec.id} className="qt-section">
              <p className="qt-sec-label">
                Phần {si + 1} <span className="qt-sec-range">Q{sec.questions[0]?.no}–Q{sec.questions[sec.questions.length - 1]?.no}</span>
              </p>
              <div className="qt-grid">
                {sec.questions.map(q => {
                  const st = getStatus(q);
                  return (
                    <div key={q.id} className={`qt-cell ${st}`} title={`Câu ${q.no}${st === 'done' ? ` — ${answers[q.id]}` : ''}${st === 'flagged' ? ' (đã ghim)' : ''}`}>
                      {st === 'flagged' ? <Flag size={8} /> : q.no}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="qt-progress-bar">
            <div className="qt-progress-fill" style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }} />
          </div>
          <p className="qt-progress-label">{total > 0 ? Math.round((answered / total) * 100) : 0}% hoàn thành</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   QuestionTrackerSidebar — luôn hiển thị đầy đủ trong sidebar phải
───────────────────────────────────────────── */
export function QuestionTrackerSidebar({ sections }) {
  const { answers, flaggedArray = [] } = useAppStore();

  const allQ = sections?.flatMap(s => s.questions) || [];
  const answered = allQ.filter(q => answers[q.id]).length;
  const flaggedCount = flaggedArray.length;
  const total = allQ.length;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  function getStatus(q) {
    if (flaggedArray.includes(q.id)) return 'flagged';
    if (answers[q.id]) return 'done';
    return 'empty';
  }

  return (
    <div className="qts-sidebar">
      {/* Header */}
      <div className="qts-header">
        <LayoutGrid size={14} className="text-indigo-500" />
        <span className="qts-header-title">Bảng câu hỏi</span>
      </div>

      {/* Legend */}
      <div className="qts-legend">
        <span className="qts-leg"><span className="qts-dot empty" />Chưa làm</span>
        <span className="qts-leg"><span className="qts-dot done" />Đã làm</span>
        <span className="qts-leg"><span className="qts-dot flagged" />Đánh dấu</span>
      </div>

      {/* Question grid per section */}
      <div className="qts-body">
        {sections?.map((sec, si) => (
          <div key={sec.id} className="qts-section">
            {sections.length > 1 && (
              <p className="qts-sec-label">
                Phần {si + 1}
                <span className="qts-sec-range">
                  &nbsp;(Q{sec.questions[0]?.no}–Q{sec.questions[sec.questions.length - 1]?.no})
                </span>
              </p>
            )}
            <div className="qts-grid">
              {sec.questions.map(q => {
                const st = getStatus(q);
                return (
                  <button
                    key={q.id}
                    className={`qts-cell ${st}`}
                    title={`Câu ${q.no}${st === 'done' ? ` — ${answers[q.id]}` : ''}${st === 'flagged' ? ' (đã đánh dấu)' : ''}`}
                    onClick={() => {
                      document.getElementById(`q-card-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    {st === 'flagged' ? <Flag size={8} /> : q.no}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="qts-footer">
        <div className="qts-progress-bar">
          <div className="qts-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="qts-progress-info">
          <span>{answered}/{total} câu đã làm</span>
          <span className="font-bold text-indigo-600">{pct}%</span>
        </div>
        {flaggedCount > 0 && (
          <p className="qts-flagged-hint">⚑ {flaggedCount} câu đã đánh dấu</p>
        )}
      </div>
    </div>
  );
}



/* ─────────────────────────────────────────────
   SingleQuestion — Box câu hỏi rộng chuẩn Ảnh 2
───────────────────────────────────────────── */
function SingleQuestion({ q, isReview = false }) {
  const { answers, setAnswer, flaggedArray = [], toggleFlag } = useAppStore();
  const [showExplain, setShowExplain] = useState(false);

  const chosen = answers[q.id];

  // Safely check if it's flagged using the array
  const isFlagged = flaggedArray.includes(q.id);

  // Clean question prompt text: remove inline options repetition if present
  let questionPrompt = q.text || `Question ${q.no}.`;
  if (questionPrompt.includes('A.') && questionPrompt.includes('B.')) {
    questionPrompt = questionPrompt.split(/A[\.\:\)]/)[0].trim() || `Question ${q.no}.`;
  }

  const renderPrompt = (text) => {
    if (!text) return null;
    const parts = text.split(/(?=\b[a-e]\.\s+[A-Z])/);
    
    return parts.map((part, index) => {
      if (!part.trim()) return null;
      const subLines = part.split('\n');
      return (
        <div key={index} className={`${index > 0 ? 'mt-3' : ''}`}>
          {subLines.map((line, lIdx) => (
            <React.Fragment key={lIdx}>
              {line}
              {lIdx < subLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      );
    });
  };

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
        <div className="flex-1 text-xs sm:text-sm font-semibold text-gray-900 leading-relaxed">
          {renderPrompt(questionPrompt)}
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

      {/* ── Explanation Section (Always visible in Review mode) ── */}
      {isReview && q.explanation && (
        <div className="mt-5 p-4 bg-slate-50 border border-indigo-100/80 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={15} className="text-indigo-600" />
            <h4 className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider">
              Học liệu & giải thích sư phạm chi tiết
            </h4>
          </div>
          <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
            {q.explanation}
          </div>
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
