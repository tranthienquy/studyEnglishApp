import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Clock, Star, Crown, Flame, Award, User, Sparkles } from 'lucide-react';
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
  }, [currentTest]);

  function formatTime(seconds) {
    if (!seconds && seconds !== 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const top1 = data[0];
  const top2 = data[1];
  const top3 = data[2];

  return (
    <div className="p-2 sm:p-4 space-y-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-orange-600 gap-3">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          <span className="text-xs font-bold text-gray-500">Đang tải bảng xếp hạng...</span>
        </div>
      ) : (
        <>
          {/* ── TOP 3 OLYMPIC PODIUM ── */}
          {data.length >= 3 && (
            <div className="bg-gradient-to-b from-orange-50/80 via-slate-50 to-white p-5 rounded-3xl border border-orange-100/80 shadow-sm">
              <div className="text-center mb-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/80 text-amber-800 text-[11px] font-black uppercase tracking-wider shadow-2xs">
                  <Flame size={13} className="text-amber-500 fill-amber-500" />
                  <span>TOP VINH DANH XUẤT SẮC</span>
                </span>
              </div>

              <div className="flex items-end justify-center gap-2 sm:gap-4 pt-4 pb-2">
                {/* 2ND PLACE (LEFT - SILVER) */}
                {top2 && (
                  <div className="flex flex-col items-center w-1/3 max-w-[130px] group">
                    <div className="relative mb-2">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 p-0.5 shadow-md flex items-center justify-center">
                        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-slate-700 text-base sm:text-lg">
                          {top2.name ? top2.name.charAt(0).toUpperCase() : '2'}
                        </div>
                      </div>
                      <span className="absolute -bottom-2 -right-1 bg-slate-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-xs">
                        🥈 #2
                      </span>
                    </div>

                    <div className="w-full bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200/80 border border-slate-300/80 rounded-2xl p-3 text-center shadow-sm h-32 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-extrabold text-slate-800 truncate" title={top2.name}>
                          {top2.name.split(' ').pop()}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-500">Lớp {top2.class || '12A1'}</p>
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-700">{top2.score}đ</p>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-0.5">
                          <Clock size={10} /> {formatTime(top2.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1ST PLACE (CENTER - GOLD PODIUM) */}
                {top1 && (
                  <div className="flex flex-col items-center w-1/3 max-w-[145px] z-10 group">
                    <div className="relative mb-2">
                      <Crown size={22} className="text-amber-500 fill-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce" />
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center ring-4 ring-amber-300/40">
                        <div className="w-full h-full bg-amber-50 rounded-[14px] flex items-center justify-center font-black text-amber-700 text-lg sm:text-xl">
                          {top1.name ? top1.name.charAt(0).toUpperCase() : '1'}
                        </div>
                      </div>
                      <span className="absolute -bottom-2 -right-1 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-md">
                        👑 #1
                      </span>
                    </div>

                    <div className="w-full bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-100/90 border-2 border-amber-300/90 rounded-2xl p-3 text-center shadow-lg shadow-amber-500/10 h-40 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-black text-amber-950 truncate" title={top1.name}>
                          {top1.name.split(' ').pop()}
                        </p>
                        <p className="text-[10px] font-bold text-amber-700">Lớp {top1.class || '12A1'}</p>
                      </div>
                      <div>
                        <p className="text-xl font-black text-amber-600 drop-shadow-xs">{top1.score}đ</p>
                        <p className="text-[10px] font-bold text-amber-700/80 flex items-center justify-center gap-0.5">
                          <Clock size={10} /> {formatTime(top1.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3RD PLACE (RIGHT - BRONZE) */}
                {top3 && (
                  <div className="flex flex-col items-center w-1/3 max-w-[130px] group">
                    <div className="relative mb-2">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 p-0.5 shadow-md flex items-center justify-center">
                        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-amber-800 text-base sm:text-lg">
                          {top3.name ? top3.name.charAt(0).toUpperCase() : '3'}
                        </div>
                      </div>
                      <span className="absolute -bottom-2 -right-1 bg-amber-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-xs">
                        🥉 #3
                      </span>
                    </div>

                    <div className="w-full bg-gradient-to-b from-amber-50 via-orange-50 to-orange-100/70 border border-amber-200/80 rounded-2xl p-3 text-center shadow-sm h-28 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-extrabold text-amber-900 truncate" title={top3.name}>
                          {top3.name.split(' ').pop()}
                        </p>
                        <p className="text-[10px] font-semibold text-amber-700/80">Lớp {top3.class || '12A1'}</p>
                      </div>
                      <div>
                        <p className="text-base font-black text-amber-800">{top3.score}đ</p>
                        <p className="text-[10px] font-bold text-amber-700/60 flex items-center justify-center gap-0.5">
                          <Clock size={10} /> {formatTime(top3.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── FULL RANKING TABLE ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
              <span>Hạng & Thí sinh</span>
              <span>Thời gian / Điểm</span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {data.map((row, i) => {
                const isMe = student?.name && row.name === student.name;
                const isTop1 = i === 0;
                const isTop2 = i === 1;
                const isTop3 = i === 2;

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 ${
                      isMe
                        ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-400/50'
                        : isTop1
                        ? 'bg-amber-50/90 border border-amber-200/80 text-gray-900 shadow-xs'
                        : isTop2
                        ? 'bg-slate-100/90 border border-slate-200/80 text-gray-900 shadow-xs'
                        : isTop3
                        ? 'bg-orange-50/70 border border-orange-200/70 text-gray-900 shadow-xs'
                        : 'bg-white border border-gray-100 hover:border-orange-200 text-gray-800 shadow-2xs hover:shadow-sm'
                    }`}
                  >
                    {/* Left: Rank badge & Student Name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs">
                        {isTop1 ? (
                          <span className="text-base">🥇</span>
                        ) : isTop2 ? (
                          <span className="text-base">🥈</span>
                        ) : isTop3 ? (
                          <span className="text-base">🥉</span>
                        ) : (
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${isMe ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {i + 1}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs sm:text-sm font-extrabold truncate ${isMe ? 'text-white' : 'text-gray-900'}`}>
                            {row.name}
                          </p>
                          {isMe && (
                            <span className="text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-md">
                              (Bạn)
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] font-medium ${isMe ? 'text-amber-100' : 'text-gray-400'}`}>
                          Lớp {row.class || '12A1'}
                        </p>
                      </div>
                    </div>

                    {/* Right: Time & Score */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className={`flex items-center gap-1 text-xs font-semibold ${isMe ? 'text-amber-100' : 'text-gray-400'}`}>
                        <Clock size={12} className={isMe ? 'text-amber-200' : 'text-gray-400'} />
                        {formatTime(row.time)}
                      </span>

                      <div className="text-right">
                        <span className={`text-sm sm:text-base font-black ${
                          isMe
                            ? 'text-white'
                            : row.score >= 8
                            ? 'text-emerald-600'
                            : row.score >= 5
                            ? 'text-amber-600'
                            : 'text-gray-600'
                        }`}>
                          {row.score} <span className="text-xs font-bold">đ</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
