import React from 'react';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 w-full h-10 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xs px-4 sm:px-8 flex items-center justify-between text-xs text-slate-500 font-medium select-none">
      <div className="flex items-center gap-1.5">
        <span>© 2026</span>
        <span className="text-slate-300">|</span>
        <span className="font-semibold text-slate-700">FPT Student Experience Space</span>
      </div>
      <div className="flex items-center gap-1">
        <span>Liên hệ &amp; Hỗ trợ:</span>
        <a
          href="mailto:quytt16@fe.edu.vn"
          className="text-amber-600 hover:text-amber-700 font-bold underline transition-colors"
        >
          quytt16@fe.edu.vn
        </a>
      </div>
    </footer>
  );
}
