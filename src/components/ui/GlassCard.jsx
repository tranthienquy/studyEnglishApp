import React from 'react';

/**
 * GlassCard - Reusable glassmorphism card component
 */
export default function GlassCard({
  children,
  className = '',
  size = 'normal', // 'sm' | 'normal' | 'dark'
  animate = 'slide-up',
  style = {},
  onClick,
}) {
  const glassClass = {
    sm:     'glass-sm',
    normal: 'glass',
    dark:   'glass-dark',
  }[size] || 'glass';

  const animClass = {
    'slide-up':  'animate-slide-up',
    'fade-in':   'animate-fade-in',
    'scale-in':  'animate-scale-in',
    'none':      '',
  }[animate] || '';

  return (
    <div
      className={`${glassClass} rounded-2xl ${animClass} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
