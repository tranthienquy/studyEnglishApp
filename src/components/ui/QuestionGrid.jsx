import React from 'react';
import { Flag } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';

export default function QuestionGrid({ questions, currentQ, onSelect }) {
  const { answers, flagged } = useAppStore();

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Điều hướng câu hỏi
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-400 to-brand-300 inline-block" />
          Đã làm
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-gray-200/70 inline-block" />
          Chưa làm
        </span>
        <span className="flex items-center gap-1.5">
          <Flag size={12} className="text-amber-500" />
          Đã ghim
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const isAnswered = !!answers[q.id];
          const isFlagged  = flagged.has(q.id);
          const isCurrent  = currentQ === q.id;

          let dotClass = 'q-dot ';
          if (isFlagged)  dotClass += 'flagged';
          else if (isAnswered) dotClass += 'answered';
          else dotClass += 'unanswered';
          if (isCurrent) dotClass += ' current';

          return (
            <button
              key={q.id}
              className={dotClass}
              onClick={() => onSelect(q.id)}
              title={`Câu ${q.no}${isFlagged ? ' (đã ghim)' : ''}`}
            >
              {isFlagged && !isCurrent
                ? <Flag size={10} />
                : q.no}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-3 border-t border-white/30">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Đã làm: <strong className="text-brand-500">{Object.keys(answers).length}</strong></span>
          <span>Chưa làm: <strong className="text-gray-400">{questions.length - Object.keys(answers).length}</strong></span>
          <span>Ghim: <strong className="text-amber-500">{flagged.size}</strong></span>
        </div>
        <div className="mt-2 h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-300 rounded-full transition-all duration-500"
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-center text-gray-400 mt-1">
          {Math.round((Object.keys(answers).length / questions.length) * 100)}% hoàn thành
        </p>
      </div>
    </div>
  );
}
