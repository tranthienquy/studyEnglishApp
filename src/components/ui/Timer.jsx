import React, { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Timer({ onExpire }) {
  const { timeLeft, setTimeLeft, currentTest } = useAppStore();
  const startTimeRef = useRef(Date.now());
  const totalSeconds = (currentTest?.duration || 45) * 60;
  const elapsed = totalSeconds - timeLeft;

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, timeLeft - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const pct = timeLeft / totalSeconds;
  const isWarning = pct < 0.25 && pct >= 0.1;
  const isDanger  = pct < 0.1;

  const timerClass = isDanger
    ? 'timer-danger animate-pulse-danger'
    : isWarning
    ? 'timer-warning'
    : 'timer-normal';

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg transition-all duration-300 ${
        isDanger
          ? 'bg-red-100/70 border border-red-300/50'
          : isWarning
          ? 'bg-amber-100/70 border border-amber-300/50'
          : 'bg-white/50 border border-white/40'
      }`}
    >
      <Clock
        size={18}
        className={isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-brand-500'}
      />
      <span className={timerClass}>{formatTime(timeLeft)}</span>
    </div>
  );
}
