// Gemini AI client with mock fallback
// Set VITE_GEMINI_API_KEY in .env to enable real AI

import { getAIFeedback } from './mockData';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// ---- Generate student feedback ----
export async function generateFeedback(studentName, score, correctCount, totalCount) {
  if (!GEMINI_KEY) {
    await delay(1200);
    return getAIFeedback(studentName, score);
  }
  try {
    const prompt = `Bạn là một giáo viên Tiếng Anh nhiệt tình, ấm áp và truyền cảm hứng. Hãy viết một lời nhận xét ngắn (3-4 câu, bằng Tiếng Việt) để động viên học sinh tên "${studentName}" vừa làm bài đọc hiểu Tiếng Anh đạt ${score}/10 điểm (đúng ${correctCount}/${totalCount} câu). Tone văn nhẹ nhàng, khích lệ, có emoji phù hợp.`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || getAIFeedback(studentName, score);
  } catch {
    return getAIFeedback(studentName, score);
  }
}

// ---- Explain a question answer ----
export async function explainAnswer(questionText, options, correctAnswer, explanation) {
  if (!GEMINI_KEY) {
    await delay(1500);
    return {
      translation: `📝 Câu hỏi: "${questionText}" — Yêu cầu kết nối Gemini API để dịch tự động.`,
      explanation: explanation || 'Xem lại đoạn văn để tìm thông tin liên quan đến câu hỏi này.',
    };
  }
  try {
    const prompt = `Bạn là giáo viên Tiếng Anh. Cho câu hỏi: "${questionText}" với các lựa chọn ${options.join(', ')}. Đáp án đúng là "${correctAnswer}". Hãy: 1) Dịch câu hỏi sang Tiếng Việt. 2) Giải thích tại sao đáp án đúng, phân tích từ vựng và ngữ pháp liên quan. Trả lời ngắn gọn, rõ ràng bằng Tiếng Việt.`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { translation: text, explanation: text };
  } catch {
    return { translation: '(Lỗi kết nối AI)', explanation };
  }
}

// ---- Translate text (Google Translate, no API key needed) ----
export async function translateWithGoogle(text) {
  if (!text || !text.trim()) return '';
  try {
    // Use the unofficial but widely-used Google Translate endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text.substring(0, 5000))}`;
    const res = await fetch(url);
    const data = await res.json();
    // Response is nested arrays: [[["translated", "original", ...]]]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map(part => part?.[0] || '').join('');
    }
    return text;
  } catch {
    return text;
  }
}

// ---- Translate text (Gemini fallback for backward compat) ----
export async function translateText(text) {
  return translateWithGoogle(text);
}

// ---- Extract vocabulary from passage ----
export async function extractVocabulary(passageText) {
  if (!passageText || passageText.trim().length < 50) return [];

  // If Gemini key available, use AI for richer vocab extraction
  if (GEMINI_KEY) {
    try {
      const prompt = `Bạn là giáo viên Tiếng Anh. Đọc đoạn văn sau và liệt kê 10-12 từ vựng quan trọng nhất. 
Trả về JSON array với format: [{"word": "...", "type": "n./v./adj./adv./phrase", "meaning": "nghĩa tiếng Việt ngắn gọn"}]
Chỉ trả về JSON, không giải thích thêm.

Đoạn văn:
${passageText.substring(0, 3000)}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
        }
      );
      const data = await res.json();
      const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through to Google Translate extraction */ }
  }

  // Fallback: Extract important words and translate each with Google
  const words = extractKeyWords(passageText);
  const vocabList = [];
  for (const word of words.slice(0, 10)) {
    try {
      const meaning = await translateWithGoogle(word);
      vocabList.push({ word, type: guessWordType(word), meaning });
    } catch {
      vocabList.push({ word, type: 'n.', meaning: '(đang tải...)' });
    }
  }
  return vocabList;
}

function extractKeyWords(text) {
  // Find multi-syllable words that are likely vocabulary worth studying
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/[^a-zA-Z\s'-]/g, ' ');
  const words = plain.split(/\s+/).filter(w => w.length >= 6);
  // Count frequency
  const freq = {};
  for (const w of words) {
    const lw = w.toLowerCase().replace(/[^a-z]/g, '');
    if (lw.length >= 5) freq[lw] = (freq[lw] || 0) + 1;
  }
  // Sort by frequency, exclude very common words
  const stopWords = new Set(['which', 'where', 'their', 'there', 'these', 'those', 'would', 'could', 'should', 'people', 'other', 'about', 'because', 'between', 'through', 'during', 'before', 'after', 'while', 'although', 'however']);
  return Object.entries(freq)
    .filter(([w]) => !stopWords.has(w))
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w);
}

function guessWordType(word) {
  if (word.endsWith('tion') || word.endsWith('ness') || word.endsWith('ment') || word.endsWith('ity')) return 'n.';
  if (word.endsWith('ize') || word.endsWith('ise') || word.endsWith('ify') || word.endsWith('ate')) return 'v.';
  if (word.endsWith('ful') || word.endsWith('less') || word.endsWith('ous') || word.endsWith('ive') || word.endsWith('able') || word.endsWith('ible')) return 'adj.';
  if (word.endsWith('ly')) return 'adv.';
  return 'n.';
}



// ---- Parse uploaded test content ----
export async function parseTestContent(rawText) {
  if (!GEMINI_KEY) {
    await delay(2000);
    return null; // Will trigger manual edit flow
  }
  try {
    const prompt = `Bạn nhận được nội dung một đề thi đọc hiểu Tiếng Anh. Hãy phân tích và trích xuất thành JSON với cấu trúc:
{
  "passage": "nội dung đoạn văn đọc hiểu",
  "questions": [
    {
      "no": 1,
      "text": "câu hỏi",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": "A",
      "explanation": "giải thích đáp án"
    }
  ]
}
Nội dung đề thi:\n\n${rawText.substring(0, 4000)}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
      }
    );
    const data = await res.json();
    const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
