import React, { useState } from 'react';
import { Flag, Send, Trophy, ChevronDown } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';
import Modal from '../ui/Modal';
import Leaderboard from '../teacher/Leaderboard';

/**
 * QuestionNavigator — Panel bên phải (desktop) hoặc bottom sheet (mobile)
 * Hiển thị grid câu hỏi và nút nộp bài
 */
export default function QuestionNavigator({ sections, onSubmit }) {
  const { answers, flagged, currentTest } = useAppStore();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const allQuestions = sections?.flatMap(s => s.questions) || [];
  const answeredCount = allQuestions.filter(q => answers[q.id]).length;
  const totalCount = allQuestions.length;
  const unansweredCount = totalCount - answeredCount;
  const pct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  function getDotClass(q) {
    const isAnswered = !!answers[q.id];
    const isFlagged  = flagged.has(q.id);
    if (isFlagged)  return 'q-dot flagged';
    if (isAnswered) return 'q-dot answered';
    return 'q-dot unanswered';
  }

  return (
    <>
      <div className="nav-panel">
        {/* Progress */}
        <div className="nav-progress">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Tiến độ làm bài</span>
            <span className="font-bold text-brand-500">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-200/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-400 to-brand-300 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>✅ Đã làm: <strong className="text-brand-500">{answeredCount}</strong></span>
            <span>⬜ Còn lại: <strong>{unansweredCount}</strong></span>
            <span>⚑ Ghim: <strong className="text-amber-500">{flagged.size}</strong></span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-gradient-to-br from-brand-400 to-brand-300 inline-block" />Đã làm
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-gray-200/70 inline-block" />Chưa làm
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-amber-300 inline-block" />Ghim
          </span>
        </div>

        {/* Question grid — grouped by sections */}
        <div className="nav-grid-scroll">
          {sections?.map((sec, si) => (
            <div key={sec.id} className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Phần {si + 1} (Q{sec.questions[0]?.no}–Q{sec.questions[sec.questions.length - 1]?.no})
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {sec.questions.map(q => (
                  <div
                    key={q.id}
                    className={getDotClass(q)}
                    title={`Câu ${q.no}${flagged.has(q.id) ? ' (đã ghim)' : ''}`}
                  >
                    {flagged.has(q.id) ? <Flag size={9} /> : q.no}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="nav-actions">
          <button
            className="btn btn-sm w-full glass-sm border border-white/40 text-amber-600 hover:border-amber-300 gap-1 mb-2"
            onClick={() => setShowLeaderboard(true)}
          >
            <Trophy size={13} /> Bảng xếp hạng
          </button>
          <button
            id="submit-nav-btn"
            className="btn btn-sm w-full bg-gradient-to-r from-brand-400 to-brand-500 text-white border-none gap-1 shadow-md"
            onClick={() => setShowSubmitConfirm(true)}
          >
            <Send size={13} /> Nộp bài
          </button>
        </div>
      </div>

      {/* Leaderboard Modal */}
      <Modal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} title="🏆 Bảng xếp hạng" size="lg">
        <Leaderboard />
      </Modal>

      {/* Submit Confirm Modal */}
      <Modal isOpen={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} title="📋 Xác nhận nộp bài" size="sm">
        <div className="p-6 text-center space-y-4">
          <div className="text-5xl">📝</div>
          <div>
            <p className="text-gray-700 font-medium">
              Bạn đã trả lời <strong className="text-brand-500">{answeredCount}/{totalCount}</strong> câu hỏi.
            </p>
            {unansweredCount > 0 && (
              <p className="text-amber-600 text-sm mt-1">⚠️ Còn {unansweredCount} câu chưa trả lời.</p>
            )}
            <p className="text-gray-400 text-sm mt-2">Sau khi nộp bài bạn sẽ không thể chỉnh sửa đáp án.</p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-sm flex-1 glass-sm border border-white/40 text-gray-600" onClick={() => setShowSubmitConfirm(false)}>Làm tiếp</button>
            <button
              className="btn btn-sm flex-1 bg-gradient-to-r from-brand-400 to-brand-500 text-white border-none"
              onClick={() => { setShowSubmitConfirm(false); onSubmit(); }}
            >
              ✅ Nộp bài
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
