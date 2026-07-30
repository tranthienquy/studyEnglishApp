import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BookOpen, Highlighter, Eraser, BookMarked, Globe, ZoomIn, ZoomOut, X, Loader2 } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';
import { translateWithGoogle, extractVocabulary } from '../../lib/gemini';

/**
 * ReadingPassage — Left panel
 * Features:
 *  - Tab navigation + Toolbar + Passage content
 *  - Button "Dịch nghĩa Tiếng Việt" → translate entire passage using Google Translate
 *  - Hover/select tooltip translation
 *  - AI Vocabulary panel
 */
export default function ReadingPassage({ sections, activeTab, onTabChange }) {
  const [zoom, setZoom] = useState(100);
  const { activeTool, setActiveTool } = useAppStore();
  const passageRef = useRef(null);

  // ── Highlight tool ──────────────────────────────────────────────
  const HIGHLIGHT_COLORS = {
    yellow: '#FDE68A',
    green:  '#A7F3D0',
    blue:   '#BFDBFE',
    pink:   '#FBCFE8',
    orange: '#FED7AA',
  };
  const [activeColor, setActiveColor] = useState('yellow');

  // ── Translate full passage ──────────────────────────────────────
  const [translating, setTranslating] = useState(false);
  const [translatedPassage, setTranslatedPassage] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);

  // ── Tooltip translate on selection ──────────────────────────────
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, loading: false, text: '' });
  const tooltipRef = useRef(null);

  // ── Vocabulary panel ────────────────────────────────────────────
  const [showVocab, setShowVocab] = useState(false);
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabList, setVocabList] = useState([]);

  const clampZoom = (v) => Math.max(80, Math.min(130, v));

  // Reset translation when switching tabs
  useEffect(() => {
    setTranslatedPassage('');
    setShowTranslation(false);
    setShowVocab(false);
    setVocabList([]);
    setTooltip({ visible: false, x: 0, y: 0, loading: false, text: '' });
  }, [activeTab]);

  // Close tooltip on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setTooltip(t => ({ ...t, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!sections || sections.length === 0) {
    return <div className="p-8 text-gray-400 text-center">Chưa có nội dung đề thi.</div>;
  }

  const section = sections[activeTab];

  // ── Get plain text from passage HTML ───────────────────────────
  const getPlainPassage = () => {
    const div = document.createElement('div');
    div.innerHTML = section.passage || '';
    return div.innerText || div.textContent || '';
  };

  // ── Handle "Dịch nghĩa Tiếng Việt" button ──────────────────────
  const handleTranslateAll = async () => {
    if (showTranslation && translatedPassage) {
      setShowTranslation(v => !v);
      return;
    }
    setTranslating(true);
    setShowTranslation(true);
    const plainText = getPlainPassage();
    const result = await translateWithGoogle(plainText);
    setTranslatedPassage(result);
    setTranslating(false);
  };

  // ── Handle hover/select tooltip translation ─────────────────────
  const handleMouseUp = useCallback(async (e) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setTooltip(t => ({ ...t, visible: false }));
      return;
    }
    const text = sel.toString().trim();
    if (!text || text.length > 300) return;

    // Position tooltip near the selection
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = passageRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top - 8;

    setTooltip({ visible: true, x, y, loading: true, text: '' });

    const translated = await translateWithGoogle(text);
    setTooltip(prev => ({ ...prev, loading: false, text: translated }));

    // Highlight tool behavior
    if (activeTool === 'highlight') {
      sel.removeAllRanges();
    }
  }, [activeTool]);

  // ── Handle vocabulary panel ─────────────────────────────────────
  const handleVocab = async () => {
    if (showVocab) { setShowVocab(false); return; }
    setShowVocab(true);
    if (vocabList.length > 0) return; // already loaded
    setVocabLoading(true);
    const plain = getPlainPassage();
    const result = await extractVocabulary(plain);
    setVocabList(result);
    setVocabLoading(false);
  };

  return (
    <div className="rp-panel">
      {/* ── Unified Header: title + tabs + tools all in one row ── */}
      <div className="rp-header-bar">
        {/* Left: Panel title */}
        <div className="rp-header-left">
          <div className="rp-header-icon">
            <BookOpen size={14} className="text-indigo-600" />
          </div>
          <h2 className="rp-header-title">PHẦN ĐỌC</h2>
        </div>

        {/* Center: Section tabs */}
        <div className="rp-tabs-inline">
          {sections.map((sec, i) => (
            <button
              key={i}
              className={`rp-tab-inline ${activeTab === i ? 'rp-tab-inline-active' : ''}`}
              onClick={() => onTabChange(i)}
            >
              <span>Phần {i + 1}</span>
            </button>
          ))}
        </div>

        {/* Right: Tools */}
        <div className="rp-tools-inline">
          {/* Zoom */}
          <div className="rp-zoom-group">
            <button className="rp-icon-btn" onClick={() => setZoom(z => clampZoom(z - 10))} title="Thu nhỏ">
              <ZoomOut size={13} />
            </button>
            <span className="rp-zoom-pct">{zoom}%</span>
            <button className="rp-icon-btn" onClick={() => setZoom(z => clampZoom(z + 10))} title="Phóng to">
              <ZoomIn size={13} />
            </button>
          </div>

          <div className="rp-divider" />

          {/* Highlight */}
          <button
            className={`rp-tool-btn ${activeTool === 'highlight' ? 'active' : ''}`}
            onClick={() => setActiveTool(activeTool === 'highlight' ? null : 'highlight')}
            style={activeTool === 'highlight' ? { borderColor: HIGHLIGHT_COLORS[activeColor], color: '#d97706' } : {}}
            title="Bút dạ quang"
          >
            <Highlighter size={13} />
            <span>Dạ quang</span>
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

          {/* Eraser */}
          <button
            className={`rp-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
            onClick={() => setActiveTool(activeTool === 'eraser' ? null : 'eraser')}
            title="Bút xóa"
          >
            <Eraser size={13} />
            <span>Bút xóa</span>
          </button>

          <div className="rp-divider" />

          {/* Vocabulary */}
          <button
            className={`rp-tool-btn ${showVocab ? 'active' : ''}`}
            onClick={handleVocab}
            title="Từ vựng quan trọng"
          >
            <BookMarked size={13} />
            <span>Từ vựng</span>
          </button>
        </div>
      </div>

      {/* ── Passage content ── */}
      <div className="rp-content" ref={passageRef} onMouseUp={handleMouseUp}>

        {/* Translate button */}
        <button
          className={`rp-translate-btn ${showTranslation ? 'active' : ''}`}
          onClick={handleTranslateAll}
          disabled={translating}
        >
          {translating ? <Loader2 size={12} className="rp-spin" /> : <Globe size={12} />}
          {showTranslation && !translating ? 'Ẩn bản dịch' : 'Dịch nghĩa Tiếng Việt'}
        </button>

        {/* Instruction text */}
        <p className="rp-instruction">{section.instruction}</p>

        {/* Title */}
        {section.title && !/^SECTION\s+\d+$/i.test(section.title.trim()) && (
          <h3 className="rp-title">{section.title}</h3>
        )}

        {/* Passage body */}
        <div
          className="rp-body"
          style={{ fontSize: `${zoom}%` }}
          dangerouslySetInnerHTML={{ __html: section.passage }}
        />

        {/* Translated passage block */}
        {showTranslation && (
          <div className="rp-translation-block">
            <div className="rp-translation-header">
              <Globe size={14} />
              <span>Bản dịch Tiếng Việt</span>
              <button className="rp-translation-close" onClick={() => setShowTranslation(false)}>
                <X size={13} />
              </button>
            </div>
            {translating ? (
              <div className="rp-translation-loading">
                <Loader2 size={18} className="rp-spin" />
                <span>Đang dịch...</span>
              </div>
            ) : (
              <p className="rp-translation-text">{translatedPassage}</p>
            )}
          </div>
        )}

        {/* Vocabulary panel */}
        {showVocab && (
          <div className="rp-vocab-panel">
            <div className="rp-vocab-header">
              <BookMarked size={15} />
              <span>Từ Vựng Quan Trọng Trong Bài Đọc</span>
              <button className="rp-translation-close" onClick={() => setShowVocab(false)}>
                <X size={13} />
              </button>
            </div>
            {vocabLoading ? (
              <div className="rp-translation-loading">
                <Loader2 size={18} className="rp-spin" />
                <span>AI đang phân tích từ vựng...</span>
              </div>
            ) : (
              <div className="rp-vocab-list">
                {vocabList.length === 0 ? (
                  <p className="rp-vocab-empty">Không tìm thấy từ vựng.</p>
                ) : (
                  vocabList.map((item, idx) => (
                    <div key={idx} className="rp-vocab-item">
                      <div className="rp-vocab-word">
                        <strong>{item.word}</strong>
                        {item.type && <span className="rp-vocab-type">({item.type})</span>}
                      </div>
                      <div className="rp-vocab-meaning">{item.meaning}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Floating tooltip for selected text translation */}
        {tooltip.visible && (
          <div
            ref={tooltipRef}
            className="rp-tooltip"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="rp-tooltip-flag">🇻🇳</div>
            {tooltip.loading ? (
              <div className="rp-tooltip-loading"><Loader2 size={12} className="rp-spin" /> Đang dịch...</div>
            ) : (
              <div className="rp-tooltip-text">{tooltip.text}</div>
            )}
            <div className="rp-tooltip-arrow" />
          </div>
        )}
      </div>
    </div>
  );
}
