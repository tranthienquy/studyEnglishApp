import React, { useState, useRef, useCallback } from 'react';
import { BookOpen, Highlighter, Eraser, BookMarked, Search, Globe, ZoomIn, ZoomOut } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';

/**
 * ReadingPassage — Left panel
 * Chỉ hiển thị: Tab navigation + Toolbar + Passage content
 * Câu hỏi được hiển thị ở panel bên phải (QuestionPanel)
 */
export default function ReadingPassage({ sections, activeTab, onTabChange }) {
  const [zoom, setZoom] = useState(100); // font-size percentage
  const { activeTool, setActiveTool } = useAppStore();

  const passageRef = useRef(null);

  // Highlight color map
  const HIGHLIGHT_COLORS = {
    yellow: '#FDE68A',
    green:  '#A7F3D0',
    blue:   '#BFDBFE',
    pink:   '#FBCFE8',
    orange: '#FED7AA',
  };
  const [activeColor, setActiveColor] = useState('yellow');

  const handleMouseUp = useCallback(() => {
    if (activeTool !== 'highlight') return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (!text) return;
    // Basic highlight via wrapping (visual only for now)
    sel.removeAllRanges();
  }, [activeTool]);

  const clampZoom = (v) => Math.max(80, Math.min(130, v));

  if (!sections || sections.length === 0) {
    return <div className="p-8 text-gray-400 text-center">Chưa có nội dung đề thi.</div>;
  }

  const section = sections[activeTab];

  return (
    <div className="rp-panel">
      {/* ── Tab bar ── */}
      <div className="rp-tab-bar">
        {sections.map((sec, i) => (
          <button
            key={i}
            className={`rp-tab ${activeTab === i ? 'rp-tab-active' : ''}`}
            onClick={() => onTabChange(i)}
          >
            <BookOpen size={14} />
            <span>Phần {i + 1}</span>
          </button>
        ))}
      </div>

      {/* ── Toolbar row ── */}
      <div className="rp-toolbar">
        {/* Zoom controls */}
        <div className="rp-zoom-group">
          <button className="rp-icon-btn" onClick={() => setZoom(z => clampZoom(z - 10))} title="Thu nhỏ">
            <ZoomOut size={14} />
          </button>
          <span className="rp-zoom-pct">{zoom}%</span>
          <button className="rp-icon-btn" onClick={() => setZoom(z => clampZoom(z + 10))} title="Phóng to">
            <ZoomIn size={14} />
          </button>
        </div>

        <div className="rp-divider" />

        {/* Highlight tool */}
        <div className="rp-tool-group">
          <button
            className={`rp-tool-btn ${activeTool === 'highlight' ? 'active' : ''}`}
            onClick={() => setActiveTool(activeTool === 'highlight' ? null : 'highlight')}
            style={activeTool === 'highlight' ? { borderColor: HIGHLIGHT_COLORS[activeColor], color: '#d97706' } : {}}
          >
            <Highlighter size={13} />
            <span>Bút dạ quang</span>
          </button>
          {activeTool === 'highlight' && (
            <div className="rp-color-dots">
              {Object.entries(HIGHLIGHT_COLORS).map(([name, color]) => (
                <button
                  key={name}
                  className={`rp-color-dot ${activeColor === name ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                  style={{ background: color }}
                  onClick={() => setActiveColor(name)}
                  title={name}
                />
              ))}
            </div>
          )}
        </div>

        <button
          className={`rp-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
          onClick={() => setActiveTool(activeTool === 'eraser' ? null : 'eraser')}
        >
          <Eraser size={13} />
          <span>Bút xóa</span>
        </button>

        <div className="rp-divider" />

        <button className="rp-tool-btn">
          <BookMarked size={13} />
          <span>Từ vựng</span>
        </button>
        <button className="rp-tool-btn">
          <Search size={13} />
          <span>Tra từ điển</span>
        </button>
      </div>

      {/* ── Passage content ── */}
      <div className="rp-content" ref={passageRef} onMouseUp={handleMouseUp}>
        {/* Instruction text */}
        <p className="rp-instruction">{section.instruction}</p>

        {/* Translate button */}
        <button className="rp-translate-btn">
          <Globe size={12} />
          Dịch nghĩa Tiếng Việt
        </button>

        {/* Title */}
        {section.title && !/^SECTION\s+\d+$/i.test(section.title.trim()) && (
          <h3 className="rp-title">{section.title}</h3>
        )}
        {section.subtitle && (
          <p className="rp-subtitle">{section.subtitle}</p>
        )}

        {/* Passage body */}
        <div
          className="rp-body"
          style={{ fontSize: `${zoom}%` }}
          dangerouslySetInnerHTML={{ __html: section.passage }}
        />
      </div>
    </div>
  );
}
