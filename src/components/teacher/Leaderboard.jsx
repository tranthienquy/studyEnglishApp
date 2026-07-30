import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Clock, Star, ChevronUp } from 'lucide-react';
import { MOCK_LEADERBOARD } from '../../lib/mockData';
import { getLeaderboard } from '../../lib/supabase';
import useAppStore from '../../stores/useAppStore';

const MEDAL_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
const MEDAL_BG = ['bg-yellow-50', 'bg-gray-50', 'bg-amber-50'];

export default function Leaderboard() {
  const { currentTest, student } = useAppStore();
  const [data, setData] = useState(MOCK_LEADERBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rows = await getLeaderboard(currentTest?.id || '');
        if (rows?.length > 0) setData(rows);
      } catch { /* keep mock */ }
      setLoading(false);
    }
    load();
  }, []);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="p-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="loading loading-spinner loading-md text-brand-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Top 3 */}
          <div className="flex gap-3 justify-center mb-6">
            {data.slice(0, 3).map((row, i) => (
              <div
                key={i}
                className={`flex flex-col items-center p-3 rounded-xl ${MEDAL_BG[i]} border border-white/40 ${i === 0 ? 'scale-110 shadow-lg' : ''}`}
              >
                {i === 0 ? (
                  <Trophy size={20} className="text-yellow-500 mb-1" />
                ) : (
                  <Medal size={16} className={`${MEDAL_COLORS[i]} mb-1`} />
                )}
                <span className="text-xs font-bold text-center leading-tight max-w-16 text-gray-700">
                  {row.name.split(' ').pop()}
                </span>
                <span className={`text-sm font-bold mt-1 ${MEDAL_COLORS[i]}`}>
                  {row.score}đ
                </span>
                <span className="text-xs text-gray-400">{row.class}</span>
              </div>
            ))}
          </div>

          {/* Full list */}
          <div className="space-y-1.5">
            {data.map((row, i) => {
              const isMe = student?.name && row.name === student.name;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                    isMe
                      ? 'bg-brand-100/70 border border-brand-300/50'
                      : 'glass-sm hover:bg-white/60'
                  }`}
                >
                  <span className={`w-6 text-center text-sm font-bold ${
                    i < 3 ? MEDAL_COLORS[i] : 'text-gray-400'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMe ? 'text-brand-700' : 'text-gray-700'}`}>
                      {row.name} {isMe && <span className="text-brand-400">(Bạn)</span>}
                    </p>
                    <p className="text-xs text-gray-400">{row.class}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={10} /> {formatTime(row.time)}
                    </span>
                    <span className={`text-sm font-bold ${
                      row.score >= 8 ? 'text-green-600' : row.score >= 6 ? 'text-brand-500' : 'text-gray-500'
                    }`}>
                      {row.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
