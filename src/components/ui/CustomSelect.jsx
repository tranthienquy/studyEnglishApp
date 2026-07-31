import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  icon: Icon,
  placeholder = 'Chọn...',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];

  function handleSelect(val) {
    onChange(val);
    setIsOpen(false);
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-3 rounded-xl bg-white/95 border transition-all duration-200 flex items-center justify-between gap-2 text-xs font-bold cursor-pointer shadow-2xs select-none ${
          isOpen
            ? 'border-orange-500 ring-2 ring-orange-500/20 text-orange-900 bg-white'
            : 'border-orange-200/90 text-gray-700 hover:border-orange-400 hover:bg-orange-50/40'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate max-w-[140px]">
          {Icon && <Icon size={14} className="text-orange-500 flex-shrink-0" />}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-orange-500' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 bg-white/95 backdrop-blur-md rounded-2xl p-1.5 border border-orange-100 shadow-xl shadow-orange-950/10 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-extrabold shadow-xs shadow-orange-500/20'
                      : 'text-gray-700 font-semibold hover:bg-orange-50 hover:text-orange-950'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-white flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
