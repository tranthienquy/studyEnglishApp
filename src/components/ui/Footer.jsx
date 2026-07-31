import React from 'react';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 w-full h-8 bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-2xs px-4 sm:px-8 flex items-center justify-between text-[10px] text-slate-400 font-normal select-none">
      <div className="flex items-center gap-1.5">
        <span>© 2026</span>
        <span className="opacity-40">|</span>
        <span>FPT Student Experience Space</span>
      </div>
      <div className="flex items-center gap-1">
        <span>Liên hệ &amp; Hỗ trợ:</span>
        <a
          href="mailto:quytt16@fe.edu.vn"
          className="text-amber-600/80 hover:text-amber-600 font-medium underline transition-colors"
        >
          quytt16@fe.edu.vn
        </a>
      </div>
    </footer>
  );
}
