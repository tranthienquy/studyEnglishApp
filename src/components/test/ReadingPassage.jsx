import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BookOpen, Globe, X, Loader2 } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';
import { translateWithGoogle, extractVocabulary } from '../../lib/gemini';

/**
 * ReadingPassage — Left panel
 * zoom, activeTool, showVocab are lifted up to TestView via props
 */
export default function ReadingPassage({ sections, activeTab, onTabChange, zoom = 100, activeTool, activeColor, showVocab, setShowVocab }) {
  const passageRef = useRef(null);

  // ── Translate full passage ──────────────────────────────────────
  const [translating, setTranslating] = useState(false);
  const [translatedPassage, setTranslatedPassage] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);

  // ── Tooltip translate on selection ──────────────────────────────
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, loading: false, text: '' });
  const tooltipRef = useRef(null);

  // ── Vocabulary panel ────────────────────────────────────────────
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabList, setVocabList] = useState([]);

  // Reset translation when switching tabs
  useEffect(() => {
    setTranslatedPassage('');
    setShowTranslation(false);
    setVocabList([]);
    setTooltip({ visible: false, x: 0, y: 0, loading: false, text: '' });
  }, [activeTab]);

  // Load vocab when showVocab toggled on from parent
  useEffect(() => {
    if (showVocab && vocabList.length === 0 && !vocabLoading) {
      setVocabLoading(true);
      const div = document.createElement('div');
      div.innerHTML = (sections[activeTab]?.passage) || '';
      const plain = div.innerText || div.textContent || '';
      extractVocabulary(plain).then(result => {
        setVocabList(result);
        setVocabLoading(false);
      });
    }
  }, [showVocab]);

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

  // ── Highlighted HTML state per section tab ──
  const [highlightedPassages, setHighlightedPassages] = useState({});

  const savePassageHtml = () => {
    setTimeout(() => {
      const bodyEl = passageRef.current?.querySelector('.rp-body');
      if (bodyEl) {
        setHighlightedPassages(prev => ({
          ...prev,
          [activeTab]: bodyEl.innerHTML
        }));
      }
    }, 0);
  };

  const currentPassageHtml = highlightedPassages[activeTab] ?? section.passage;

  const COLOR_MAP = {
    yellow: '#FDE68A',
    green:  '#A7F3D0',
    blue:   '#BFDBFE',
    pink:   '#FBCFE8',
    orange: '#FED7AA',
  };

  // ── Handle clicking on highlighted mark to erase ────────────────
  const handlePassageClick = (e) => {
    if (activeTool === 'eraser') {
      const mark = e.target.closest('.custom-highlight') || e.target.closest('mark');
      if (mark) {
        const parent = mark.parentNode;
        if (parent) {
          while (mark.firstChild) {
            parent.insertBefore(mark.firstChild, mark);
          }
          parent.removeChild(mark);
          savePassageHtml();
        }
      }
    }
  };

  // ── Handle text selection for Highlight / Eraser / Tooltip Translate ──
  const handleMouseUp = useCallback(async (e) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setTooltip(t => ({ ...t, visible: false }));
      return;
    }
    const text = sel.toString().trim();
    if (!text) return;

    // 1. Eraser mode: remove any marks in selection
    if (activeTool === 'eraser') {
      if (passageRef.current) {
        const marks = passageRef.current.querySelectorAll('.custom-highlight, mark');
        let erased = false;
        marks.forEach(mark => {
          if (sel.containsNode(mark, true)) {
            const parent = mark.parentNode;
            if (parent) {
              while (mark.firstChild) {
                parent.insertBefore(mark.firstChild, mark);
              }
              parent.removeChild(mark);
              erased = true;
            }
          }
        });
        if (erased) savePassageHtml();
      }
      sel.removeAllRanges();
      return;
    }

    // 2. Highlight mode: apply background color mark (remains active until Eraser button clicked)
    if (activeTool === 'highlight') {
      try {
        const range = sel.getRangeAt(0);
        const hexColor = COLOR_MAP[activeColor] || '#FDE68A';
        const mark = document.createElement('mark');
        mark.className = 'custom-highlight';
        mark.style.backgroundColor = hexColor;
        mark.style.color = 'inherit';
        mark.style.padding = '1px 3px';
        mark.style.borderRadius = '4px';
        mark.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
        mark.style.cursor = 'pointer';
        mark.title = 'Highlight (Bấm Bút xóa để gỡ màu)';

        try {
          range.surroundContents(mark);
        } catch (err) {
          const fragment = range.extractContents();
          mark.appendChild(fragment);
          range.insertNode(mark);
        }
        savePassageHtml();
      } catch (err) {
        console.warn('Highlighting error:', err);
      }
      sel.removeAllRanges();
      return;
    }

    // 3. Normal mode: Tooltip translation (appears right next to cursor)
    if (text.length <= 300) {
      const containerRect = passageRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 600 };
      let x = e.clientX ? (e.clientX - containerRect.left + 12) : 100;
      let y = e.clientY ? (e.clientY - containerRect.top - 8) : 100;
      let alignLeft = false;

      if (x + 220 > containerRect.width) {
        x = e.clientX - containerRect.left - 12;
        alignLeft = true;
      }

      setTooltip({ visible: true, x, y, alignLeft, loading: true, text: '' });
      const translated = await translateWithGoogle(text);
      setTooltip(prev => ({ ...prev, loading: false, text: translated }));
    }
  }, [activeTool, activeColor, activeTab]);

  return (
    <div className="rp-panel">
      {/* ── Panel header: "PHẦN ĐỌC" (Matching CÂU HỎI TRẮC NGHIỆM exactly) ── */}
      <div className="qp-header">
        <div className="qp-header-left">
          <div className="qp-header-icon">
            <BookOpen size={14} className="text-indigo-600" />
          </div>
          <h2 className="qp-title-text">PHẦN ĐỌC</h2>
        </div>
      </div>

      {/* ── Passage content ── */}
      <div
        className={`rp-content ${activeTool === 'highlight' ? 'tool-highlight' : ''} ${activeTool === 'eraser' ? 'tool-eraser' : ''}`}
        ref={passageRef}
        onMouseUp={handleMouseUp}
        onClick={handlePassageClick}
      >

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
          dangerouslySetInnerHTML={{ __html: currentPassageHtml }}
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

        {/* Floating tooltip for selected text translation right next to cursor */}
        {tooltip.visible && (
          <div
            ref={tooltipRef}
            className="rp-tooltip"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: tooltip.alignLeft ? 'translate(-100%, -100%)' : 'translate(0, -100%)',
            }}
          >
            <div className="rp-tooltip-flag">🇻🇳</div>
            {tooltip.loading ? (
              <div className="rp-tooltip-loading"><Loader2 size={12} className="rp-spin" /> Đang dịch...</div>
            ) : (
              <div className="rp-tooltip-text">{tooltip.text}</div>
            )}
            <div className={`rp-tooltip-arrow ${tooltip.alignLeft ? 'right-3 left-auto' : 'left-3'}`} />
          </div>
        )}
      </div>
    </div>
  );
}
