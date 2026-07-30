import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, RotateCcw, Eye, EyeOff, Star, BrainCircuit, Loader2, MessageSquare, ArrowLeft, RefreshCw
} from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import { generateFeedback } from '../lib/gemini';
import QuestionPanel from '../components/test/QuestionPanel';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ResultView() {
  const { result, currentTest, student, startTest, setView } = useAppStore();
  const [aiFeedback, setAiFeedback] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  useEffect(() => {
    if (!result) return;
    setLoadingFeedback(true);
    generateFeedback(result.studentName, result.score, result.correctCount, result.totalCount)
      .then(text => { setAiFeedback(text); setLoadingFeedback(false); });
  }, [result]);

  if (!result) return null;

  function handleRetry() {
    startTest(student, currentTest);
  }

  const pct = result.totalCount > 0 ? Math.round((result.correctCount / result.totalCount) * 100) : 0;

  return (
    <div className="min-h-screen py-8 px-4 flex items-center justify-center bg-slate-900/60 backdrop-blur-md relative z-10">
      <div className="w-full max-w-lg mx-auto space-y-4 animate-slide-up">

        {/* Result Card Modal */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/80 text-center relative overflow-hidden">

          {/* Top Success Check Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto mb-4 shadow-sm">
            <CheckCircle2 size={36} strokeWidth={2} />
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-1">
            KẾT QUẢ BÀI THI CỦA BẠN
          </h1>
          <p className="text-xs text-indigo-600 font-semibold mb-6">
            {result.studentName} – Lớp {result.studentClass}
          </p>

          {/* 3 Column Metrics Cards */}
          <div className="grid grid-cols-3 gap-2 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 mb-5">
            {/* Score */}
            <div className="text-center p-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ĐIỂM SỐ</span>
              <p className="text-2xl font-black text-indigo-600 my-0.5">{result.score.toFixed(2)}</p>
              <span className="text-[10px] text-gray-400 font-medium">Thang điểm 10</span>
            </div>

            {/* Correct count */}
            <div className="text-center p-2 border-x border-indigo-100/60">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">SỐ CÂU ĐÚNG</span>
              <p className="text-2xl font-black text-emerald-600 my-0.5">{result.correctCount}/{result.totalCount}</p>
              <span className="text-[10px] text-gray-400 font-medium">Đúng hoàn toàn</span>
            </div>

            {/* Time spent */}
            <div className="text-center p-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">THỜI GIAN LÀM</span>
              <p className="text-2xl font-black text-orange-500 my-0.5">{formatTime(result.timeSpent)}</p>
              <span className="text-[10px] text-gray-400 font-medium">Thời gian thực tế</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1.5">
              <span>Tỷ lệ làm đúng</span>
              <span className="text-indigo-600 font-bold">{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Teacher AI Feedback Box */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-left mb-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
              <MessageSquare size={14} className="text-indigo-600" />
              <span>NHẬN XÉT TỪ GIÁO VIÊN (MS. TRANG)</span>
            </div>
            {loadingFeedback ? (
              <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
                <Loader2 size={13} className="animate-spin text-indigo-500" /> Đang tổng hợp nhận xét...
              </div>
            ) : (
              <p className="text-xs text-gray-700 leading-relaxed italic">
                "{aiFeedback}"
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className="btn bg-slate-900 hover:bg-slate-800 text-white border-none rounded-xl text-xs font-bold py-3 gap-1.5"
              onClick={() => setView('review')}
            >
              <Eye size={14} /> Xem lại bài làm chi tiết
            </button>
            <button
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl text-xs font-bold py-3 gap-1.5 shadow-md shadow-indigo-500/25"
              onClick={handleRetry}
            >
              <RefreshCw size={14} /> Thi lại đề này
            </button>
          </div>
        </div>



        {/* Back navigation */}
        <div className="flex justify-center gap-3 pt-2">
          <button
            className="text-xs text-slate-300 hover:text-white transition-colors underline underline-offset-2 font-medium"
            onClick={() => setView('test-select')}
          >
            📚 Chọn đề ôn khác
          </button>
          <span className="text-slate-500 text-xs">•</span>
          <button
            className="text-xs text-slate-300 hover:text-white transition-colors underline underline-offset-2 font-medium"
            onClick={() => setView('login')}
          >
            👤 Đổi học sinh
          </button>
        </div>
      </div>
    </div>
  );
}
