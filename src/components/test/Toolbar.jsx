import React, { useState } from 'react';
import {
  Highlighter, Eraser, ZoomIn, ZoomOut, Globe, Trophy,
  Send, X, ChevronDown, Type
} from 'lucide-react';
import useAppStore from '../../stores/useAppStore';
import Modal from '../ui/Modal';
import Leaderboard from '../teacher/Leaderboard';

const HIGHLIGHT_COLORS = [
  { key: 'yellow', label: 'Vàng',  bg: 'bg-yellow-200' },
  { key: 'green',  label: 'Xanh lá', bg: 'bg-green-200' },
  { key: 'blue',   label: 'Xanh dương', bg: 'bg-blue-200' },
  { key: 'pink',   label: 'Hồng',  bg: 'bg-pink-200' },
  { key: 'orange', label: 'Cam',   bg: 'bg-orange-200' },
];

const FONT_SIZES = [
  { key: 'size-sm', label: '14px', icon: '↓A' },
  { key: 'size-md', label: '16px', icon: 'A'  },
  { key: 'size-lg', label: '18px', icon: '↑A' },
  { key: 'size-xl', label: '20px', icon: '↑↑A' },
];

export default function Toolbar({ onSubmit }) {
  const { activeTool, setActiveTool, fontSize, setFontSize } = useAppStore();
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const { answers, currentTest } = useAppStore();

  const answeredCount = Object.keys(answers).length;
  const totalCount = currentTest?.questions?.length || 0;
  const unansweredCount = totalCount - answeredCount;

  function toggleTool(tool) {
    setActiveTool(activeTool === tool ? null : tool);
    setShowHighlightMenu(false);
    setShowFontMenu(false);
  }

  return (
    <>
      <div className="flex items-center gap-1 flex-wrap">
        {/* Highlight tool */}
        <div className="relative">
          <button
            className={`btn btn-sm gap-1 border transition-all ${
              activeTool?.startsWith('highlight-')
                ? 'bg-brand-100 border-brand-300 text-brand-600'
                : 'glass-sm border-white/40 text-gray-600 hover:border-brand-200'
            }`}
            onClick={() => {
              setShowHighlightMenu(!showHighlightMenu);
              setShowFontMenu(false);
            }}
            title="Bút highlight"
          >
            <Highlighter size={14} />
            <ChevronDown size={10} />
          </button>
          {showHighlightMenu && (
            <div className="absolute top-10 left-0 glass rounded-xl p-2 z-30 animate-slide-down flex flex-col gap-1 min-w-36 shadow-xl">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.key}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/50 ${
                    activeTool === `highlight-${c.key}` ? 'bg-white/70 font-medium' : ''
                  }`}
                  onClick={() => { toggleTool(`highlight-${c.key}`); setShowHighlightMenu(false); }}
                >
                  <span className={`w-4 h-4 rounded-sm ${c.bg}`} />
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Eraser */}
        <button
          className={`btn btn-sm gap-1 border transition-all ${
            activeTool === 'eraser'
              ? 'bg-red-100 border-red-300 text-red-500'
              : 'glass-sm border-white/40 text-gray-600 hover:border-red-200'
          }`}
          onClick={() => toggleTool('eraser')}
          title="Xóa highlight"
        >
          <Eraser size={14} />
        </button>

        <div className="w-px h-5 bg-white/40 mx-1" />

        {/* Font size */}
        <div className="relative">
          <button
            className="btn btn-sm gap-1 glass-sm border-white/40 text-gray-600 hover:border-brand-200 border"
            onClick={() => { setShowFontMenu(!showFontMenu); setShowHighlightMenu(false); }}
            title="Cỡ chữ"
          >
            <Type size={14} />
            <ChevronDown size={10} />
          </button>
          {showFontMenu && (
            <div className="absolute top-10 left-0 glass rounded-xl p-2 z-30 animate-slide-down flex flex-col gap-1 min-w-32 shadow-xl">
              {FONT_SIZES.map(f => (
                <button
                  key={f.key}
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/50 ${
                    fontSize === f.key ? 'bg-brand-50 text-brand-600 font-semibold' : ''
                  }`}
                  onClick={() => { setFontSize(f.key); setShowFontMenu(false); }}
                >
                  <span>{f.icon}</span>
                  <span className="text-xs text-gray-400">{f.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-white/40 mx-1" />

        {/* Leaderboard */}
        <button
          className="btn btn-sm gap-1 glass-sm border-white/40 text-gray-600 hover:border-amber-300 border"
          onClick={() => setShowLeaderboard(true)}
          title="Bảng xếp hạng"
        >
          <Trophy size={14} className="text-amber-500" />
          <span className="hidden sm:inline text-xs">Xếp hạng</span>
        </button>

        <div className="w-px h-5 bg-white/40 mx-1" />

        {/* Submit */}
        <button
          className="btn btn-sm gap-1 bg-gradient-to-r from-brand-400 to-brand-500 text-white border-none hover:from-brand-500 hover:to-brand-600 shadow-md hover:shadow-brand-300/50 transition-all"
          onClick={() => setShowSubmitConfirm(true)}
          id="submit-test-btn"
        >
          <Send size={14} />
          <span className="hidden sm:inline">Nộp bài</span>
        </button>
      </div>

      {/* Leaderboard Modal */}
      <Modal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        title="🏆 Bảng xếp hạng lớp"
        size="lg"
      >
        <Leaderboard />
      </Modal>

      {/* Submit Confirm Modal */}
      <Modal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="📋 Xác nhận nộp bài"
        size="sm"
      >
        <div className="p-6 text-center space-y-4">
          <div className="text-5xl">📝</div>
          <div>
            <p className="text-gray-700 font-medium">Bạn đã trả lời <strong className="text-brand-500">{answeredCount}/{totalCount}</strong> câu hỏi.</p>
            {unansweredCount > 0 && (
              <p className="text-amber-600 text-sm mt-1">
                ⚠️ Còn {unansweredCount} câu chưa trả lời.
              </p>
            )}
            <p className="text-gray-500 text-sm mt-2">Sau khi nộp bài bạn sẽ không thể chỉnh sửa đáp án.</p>
          </div>
          <div className="flex gap-3">
            <button
              className="btn btn-sm flex-1 glass-sm border border-white/40 text-gray-600"
              onClick={() => setShowSubmitConfirm(false)}
            >
              Làm tiếp
            </button>
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
