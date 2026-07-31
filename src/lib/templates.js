// ================================================================
// src/lib/templates.js
// Generate and download Word (.docx) template files by subject
// Uses plain HTML → blob trick (no external library needed)
// ================================================================

export const SUBJECTS = [
  { value: 'Tiếng Anh',  label: 'Tiếng Anh',  icon: '🇬🇧', hasPassage: true  },
  { value: 'Toán',       label: 'Toán học',    icon: '📐', hasPassage: false },
  { value: 'Ngữ Văn',    label: 'Ngữ Văn',     icon: '📖', hasPassage: true  },
  { value: 'Vật Lý',     label: 'Vật Lý',      icon: '⚡', hasPassage: false },
  { value: 'Hóa Học',    label: 'Hóa Học',     icon: '🧪', hasPassage: false },
  { value: 'Sinh Học',   label: 'Sinh Học',    icon: '🧬', hasPassage: false },
  { value: 'Lịch Sử',   label: 'Lịch Sử',     icon: '🏛️', hasPassage: true  },
  { value: 'Địa Lý',    label: 'Địa Lý',      icon: '🗺️', hasPassage: false },
  { value: 'GDCD',       label: 'GDCD',         icon: '⚖️', hasPassage: false },
  { value: 'Tin Học',    label: 'Tin Học',      icon: '💻', hasPassage: false },
  { value: 'Tiếng Pháp', label: 'Tiếng Pháp',  icon: '🇫🇷', hasPassage: true  },
  { value: 'Tiếng Nhật', label: 'Tiếng Nhật',  icon: '🇯🇵', hasPassage: true  },
];

/**
 * Get subject metadata
 */
export function getSubjectInfo(subjectValue) {
  return SUBJECTS.find(s => s.value === subjectValue) || SUBJECTS[0];
}

/**
 * Generate and download Word template for a given subject
 */
export function downloadWordTemplate(subject = 'Tiếng Anh') {
  const info = getSubjectInfo(subject);
  const content = info.hasPassage
    ? generatePassageTemplate(subject)
    : generateMCQTemplate(subject);

  const blob = new Blob(['\ufeff' + content], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TEMPLATE_${subject.replace(/\s+/g, '_').toUpperCase()}_FPT_SCHOOLS.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------
// Template 1: Môn có đoạn văn đọc hiểu (Tiếng Anh, Ngữ Văn, ...)
// ---------------------------------------------------------------
function generatePassageTemplate(subject) {
  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Template ${subject} — FPT Schools</title>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 13pt; margin: 2cm; line-height: 1.5; }
  h1 { text-align: center; font-size: 16pt; text-transform: uppercase; }
  h2 { font-size: 13pt; font-weight: bold; margin-top: 14pt; }
  .comment { color: #7F7F7F; font-style: italic; font-size: 11pt; }
  .field { color: #C00000; font-weight: bold; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  td, th { border: 1px solid #999; padding: 5pt 8pt; font-size: 12pt; }
  th { background: #FFF2CC; font-weight: bold; }
  .section-box { border: 1px solid #BDD7EE; padding: 10pt; margin: 10pt 0; background: #EFF7FF; }
</style>
</head>
<body>

<h1>HỆ THỐNG ÔN TẬP FPT SCHOOLS</h1>
<h1>TEMPLATE ĐỀ ÔN TẬP — MÔN: ${subject.toUpperCase()}</h1>

<p class="comment">════════════════════════════════════════════════════════<br>
📌 HƯỚNG DẪN SỬ DỤNG TEMPLATE NÀY:<br>
- Thay thế tất cả phần màu ĐỎ bằng nội dung thực tế của bạn<br>
- Giữ nguyên cấu trúc, định dạng và thứ tự các phần<br>
- Hệ thống sẽ tự động nhận dạng theo cấu trúc này khi upload<br>
════════════════════════════════════════════════════════</p>

<h2>THÔNG TIN ĐỀ THI</h2>
<table>
  <tr><th>Tiêu đề bài thi</th><td><span class="field">[VD: UNIT 1 - FAMILY LIFE (Phần 1)]</span></td></tr>
  <tr><th>Môn học</th><td>${subject}</td></tr>
  <tr><th>Thời gian làm bài</th><td><span class="field">[VD: 50]</span> phút</td></tr>
  <tr><th>Giáo viên</th><td><span class="field">[Họ và tên giáo viên]</span></td></tr>
  <tr><th>Khối lớp</th><td><span class="field">[VD: 10 hoặc 11 hoặc 12]</span></td></tr>
</table>

<h2>PHẦN 1: ĐỌC HIỂU — [TÊN ĐOẠN VĂN / TIÊU ĐỀ PHẦN]</h2>

<div class="section-box">
<p class="comment">📝 HƯỚNG DẪN: Dán đoạn văn đọc hiểu vào phía dưới đây.<br>
- Giữ nguyên định dạng đoạn văn (xuống dòng, in đậm tiêu đề nếu có)<br>
- Đánh dấu chỗ điền từ bằng: (1)________ (2)________ ...<br>
- Số trong ngoặc tương ứng với số thứ tự câu hỏi</p>

<p>INSTRUCTION: <span class="field">[VD: Read the following passage and mark the letter A, B, C, or D to indicate the correct answer to each of the following questions.]</span></p>

<p>PASSAGE:</p>
<p><span class="field">[DÁN NỘI DUNG ĐOẠN VĂN ĐỌC HIỂU VÀO ĐÂY. Nếu là điền từ, dùng (1)________ để đánh dấu chỗ trống.]</span></p>
</div>

<h2>CÂU HỎI TRẮC NGHIỆM</h2>
<p class="comment">📝 Liệt kê các câu hỏi theo định dạng dưới đây. Mỗi câu có 4 đáp án A, B, C, D:</p>

<p><strong>Câu 1:</strong> <span class="field">[Nội dung câu hỏi số 1]</span></p>
<p>A. <span class="field">[Đáp án A]</span></p>
<p>B. <span class="field">[Đáp án B]</span></p>
<p>C. <span class="field">[Đáp án C]</span></p>
<p>D. <span class="field">[Đáp án D]</span></p>

<p><strong>Câu 2:</strong> <span class="field">[Nội dung câu hỏi số 2]</span></p>
<p>A. <span class="field">[Đáp án A]</span></p>
<p>B. <span class="field">[Đáp án B]</span></p>
<p>C. <span class="field">[Đáp án C]</span></p>
<p>D. <span class="field">[Đáp án D]</span></p>

<p class="comment">... (tiếp tục đến câu cuối cùng)</p>

<h2>ĐÁP ÁN</h2>
<p class="comment">📝 Ghi đáp án theo định dạng: Câu số — Đáp án đúng</p>
<table>
  <tr><th>Câu</th><th>Đáp án đúng</th><th>Lời giải / Giải thích (tuỳ chọn)</th></tr>
  <tr><td>1</td><td><span class="field">A</span></td><td><span class="field">[Giải thích ngắn gọn tại sao chọn A]</span></td></tr>
  <tr><td>2</td><td><span class="field">B</span></td><td><span class="field">[Giải thích ngắn gọn tại sao chọn B]</span></td></tr>
  <tr><td>...</td><td>...</td><td>...</td></tr>
</table>

<h2>PHẦN 2 (NẾU CÓ): [TÊN PHẦN 2]</h2>
<p class="comment">📝 Lặp lại cấu trúc tương tự như Phần 1 nếu đề có nhiều phần đọc hiểu</p>

<hr>
<p class="comment" style="text-align:center">
  📚 FPT Schools — Hệ thống ôn tập trực tuyến | Template dành cho môn ${subject}<br>
  ⚠️ Lưu ý: Giữ nguyên cấu trúc để hệ thống nhận dạng chính xác khi upload
</p>
</body>
</html>`;
}

// ---------------------------------------------------------------
// Template 2: Môn chỉ có MCQ, không có đoạn văn (Toán, Lý, Hóa, ...)
// ---------------------------------------------------------------
function generateMCQTemplate(subject) {
  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Template ${subject} — FPT Schools</title>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 13pt; margin: 2cm; line-height: 1.5; }
  h1 { text-align: center; font-size: 16pt; text-transform: uppercase; }
  h2 { font-size: 13pt; font-weight: bold; margin-top: 14pt; }
  .comment { color: #7F7F7F; font-style: italic; font-size: 11pt; }
  .field { color: #C00000; font-weight: bold; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  td, th { border: 1px solid #999; padding: 5pt 8pt; font-size: 12pt; }
  th { background: #FFF2CC; font-weight: bold; }
</style>
</head>
<body>

<h1>HỆ THỐNG ÔN TẬP FPT SCHOOLS</h1>
<h1>TEMPLATE ĐỀ ÔN TẬP — MÔN: ${subject.toUpperCase()}</h1>

<p class="comment">════════════════════════════════════════════════════════<br>
📌 HƯỚNG DẪN SỬ DỤNG TEMPLATE NÀY:<br>
- Thay thế tất cả phần màu ĐỎ bằng nội dung thực tế của bạn<br>
- Giữ nguyên cấu trúc, định dạng và thứ tự các phần<br>
- Hệ thống sẽ tự động nhận dạng khi upload<br>
════════════════════════════════════════════════════════</p>

<h2>THÔNG TIN ĐỀ THI</h2>
<table>
  <tr><th>Tiêu đề bài thi</th><td><span class="field">[VD: CHƯƠNG 1 - ĐẠO HÀM (Phần 1)]</span></td></tr>
  <tr><th>Môn học</th><td>${subject}</td></tr>
  <tr><th>Thời gian làm bài</th><td><span class="field">[VD: 45]</span> phút</td></tr>
  <tr><th>Giáo viên</th><td><span class="field">[Họ và tên giáo viên]</span></td></tr>
  <tr><th>Khối lớp</th><td><span class="field">[VD: 10 hoặc 11 hoặc 12]</span></td></tr>
</table>

<h2>CÂU HỎI TRẮC NGHIỆM</h2>
<p class="comment">📝 Liệt kê câu hỏi theo định dạng dưới đây. Mỗi câu có 4 đáp án A, B, C, D.</p>

<p><strong>Câu 1:</strong> <span class="field">[Nội dung câu hỏi số 1 — có thể kèm hình ảnh mô tả bằng chữ]</span></p>
<p>A. <span class="field">[Đáp án A]</span></p>
<p>B. <span class="field">[Đáp án B]</span></p>
<p>C. <span class="field">[Đáp án C]</span></p>
<p>D. <span class="field">[Đáp án D]</span></p>

<p><strong>Câu 2:</strong> <span class="field">[Nội dung câu hỏi số 2]</span></p>
<p>A. <span class="field">[Đáp án A]</span></p>
<p>B. <span class="field">[Đáp án B]</span></p>
<p>C. <span class="field">[Đáp án C]</span></p>
<p>D. <span class="field">[Đáp án D]</span></p>

<p class="comment">... (tiếp tục đến câu cuối cùng)</p>

<h2>ĐÁP ÁN</h2>
<p class="comment">📝 Ghi đáp án theo định dạng: Câu số — Đáp án đúng — Lời giải</p>
<table>
  <tr><th>Câu</th><th>Đáp án đúng</th><th>Lời giải / Giải thích (tuỳ chọn)</th></tr>
  <tr><td>1</td><td><span class="field">A</span></td><td><span class="field">[Giải thích ngắn gọn tại sao chọn A]</span></td></tr>
  <tr><td>2</td><td><span class="field">B</span></td><td><span class="field">[Giải thích ngắn gọn tại sao chọn B]</span></td></tr>
  <tr><td>...</td><td>...</td><td>...</td></tr>
</table>

<hr>
<p class="comment" style="text-align:center">
  📚 FPT Schools — Hệ thống ôn tập trực tuyến | Template dành cho môn ${subject}<br>
  ⚠️ Lưu ý: Giữ nguyên cấu trúc để hệ thống nhận dạng chính xác khi upload
</p>
</body>
</html>`;
}
