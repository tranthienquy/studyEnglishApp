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

// ---- Translate text ----
export async function translateText(text) {
  if (!GEMINI_KEY) {
    await delay(700);
    return `🇻🇳 [Mock] "${text}" — Kết nối Gemini API để dịch chính xác.`;
  }
  try {
    const prompt = `Dịch đoạn văn tiếng Anh sau sang tiếng Việt một cách tự nhiên và chính xác. Chỉ trả về bản dịch, không giải thích thêm:\n\n"${text}"`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || text;
  } catch {
    return text;
  }
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
