import mammoth from 'mammoth';

/**
 * Extracts content (HTML + raw text) from File object (.txt, .docx, .pdf)
 * Preserves yellow highlight <mark> tags & red text <mark class="red-text"> from Word .docx files!
 */
export async function extractFileText(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith('.txt')) {
    const text = await file.text();
    return { text, html: text };
  }

  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    const arrayBuffer = await file.arrayBuffer();

    const options = {
      styleMap: [
        // Yellow highlight → <mark>
        "highlight => mark",
        "r[style*='yellow'] => mark",
        "span[style*='background-color: yellow'] => mark",
        "span[style*='background-color:#ffff'] => mark",
        "span[style*='background: yellow'] => mark",
        // Red text → <span class="red-text">
        "r[style*='color: red'] => span.red-text",
        "r[style*='color: #ff0000'] => span.red-text",
        "r[style*='color: #FF0000'] => span.red-text",
        "r[style*='color: rgb(255, 0'] => span.red-text",
        "span[style*='color: red'] => span.red-text",
        // Bold blue (question labels like "Question 18:")
        "r[style*='color: #003399'] => strong",
        "r[style*='color: blue'] => strong",
      ]
    };

    const htmlResult = await mammoth.convertToHtml({ arrayBuffer }, options);
    const rawResult  = await mammoth.extractRawText({ arrayBuffer });

    return {
      text: rawResult.value || '',
      html: htmlResult.value || rawResult.value || '',
    };
  }

  if (name.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      return { text: fullText, html: fullText };
    } catch (e) {
      console.warn('PDF parsing fallback:', e);
      try {
        const text = await file.text();
        return { text, html: text };
      } catch {
        throw new Error('Không thể đọc file PDF. Vui lòng chuyển sang định dạng .docx hoặc .txt.');
      }
    }
  }

  throw new Error('Định dạng file không hỗ trợ. Vui lòng dùng .docx, .pdf hoặc .txt');
}

/* ===================================================================
   MAIN PARSER — handles multiple real-world Vietnamese exam formats:

   FORMAT 1: Multi-line options (each option on its own line)
     Question 18:
     A. because it deepens trust
     B. so it proves screen time
     C. although trust and attention
     D. but it often reflects (HIGHLIGHTED = correct)

   FORMAT 2: Inline multi-option per question row
     Question 7: A. range   B. share   C. level   D. number
     (highlight on correct option text)

   FORMAT 3: Dialogue arrangement questions
     Question 13:
     a. Ethan: Yes...
     b. Ethan: Last month...
     c. Chloe: Really?
     A. a – b – c    B. b – c – a (HIGHLIGHTED)    C. c – a – b    D. c – b – a

   Section splits: "Read the following...", "Mark the letter A,B,C or D..."
   Passage blanks: "(18) ________", "(7) _______"  → styled blanks in passage
   ================================================================= */
export function parseExamText(fileData) {
  let rawContent = typeof fileData === 'string' ? fileData : (fileData.html || fileData.text || '');
  if (!rawContent || !rawContent.trim()) return null;

  // ── 0. Cut off solution/answer key section ─────────────────────────
  // Files may contain "LỜI GIẢI CHI TIẾT" or "----- Hết -----" markers
  // Everything after these should be excluded to avoid duplicate questions
  rawContent = cutOffSolutionSection(rawContent);

  // ── 1. Detect Test Code from red text ──────────────────────────────
  let detectedCode = '';
  const redSpanMatch = rawContent.match(/<span class="red-text"[^>]*>(.*?)<\/span>/i);
  const testCodeMatch = rawContent.match(/\bTEST\s*0*(\d+)\b/i);
  const masoMatch     = rawContent.match(/MÃ\s*SỐ\s*0*(\d+)/i);
  if (redSpanMatch?.[1]) {
    detectedCode = redSpanMatch[1].replace(/<[^>]+>/g, '').trim();
  } else if (testCodeMatch) {
    detectedCode = testCodeMatch[0].trim();
  } else if (masoMatch) {
    detectedCode = masoMatch[0].trim();
  }

  // ── 2. Normalize HTML → line-by-line text (keep <mark> for answers) ──
  // Keep raw HTML lines so we can detect <mark> highlights on options
  const htmlLines = splitHtmlToLines(rawContent);

  // ── 3. Split into SECTIONS by instruction headers ──────────────────
  // Instruction patterns:
  //   "Read the following passage..."
  //   "Mark the letter A, B, C or D on your answer sheet to indicate..."
  const SECTION_BREAK = /^(?:Read the following|Mark the letter\s+A[,.]?\s*B[,.]?\s*C\s+or\s+D|Choose the (?:word|best)|Section\s+\d|Phần\s+\d)/i;

  const sectionGroups = [];
  let currentGroup   = [];

  for (const lineObj of htmlLines) {
    if (SECTION_BREAK.test(lineObj.plain) && currentGroup.length > 0) {
      sectionGroups.push(currentGroup);
      currentGroup = [lineObj];
    } else {
      currentGroup.push(lineObj);
    }
  }
  if (currentGroup.length > 0) sectionGroups.push(currentGroup);

  const parsedSections = [];
  let detectedTitle = '';
  let globalQNo = 0; // for tracking absolute question numbering

  for (let sIdx = 0; sIdx < sectionGroups.length; sIdx++) {
    const group = sectionGroups[sIdx];
    if (group.length === 0) continue;

    let instruction = '';
    let passageLines = [];
    let questions    = [];

    // First line = instruction if matches SECTION_BREAK
    let startIdx = 0;
    if (SECTION_BREAK.test(group[0].plain)) {
      instruction = group[0].plain;
      startIdx = 1;
    }

    // Collect title/subtitle from passage header lines
    let sectionTitle = '';
    let sectionSubtitle = '';

    // ── Parse lines ──────────────────────────────────────────────────
    let i = startIdx;
    while (i < group.length) {
      const lineObj = group[i];
      const plain   = lineObj.plain;

      // Skip header banners
      if (isHeaderBannerLine(plain)) {
        i++; continue;
      }

      // ── Detect "Question N:" or "Question N." as start of a question block ──
      if (isQuestionStart(plain)) {
        // Try to parse this line (may be FORMAT 2 inline with options)
        const inlineQ = tryParseInlineLine(lineObj, globalQNo + 1);
        if (inlineQ) {
          questions.push(inlineQ);
          globalQNo = inlineQ.no;
          i++;
        } else {
          // FORMAT 1 or FORMAT 3: collect subsequent option lines
          const qBlock = [lineObj];
          i++;
          while (i < group.length) {
            const nextLine = group[i];
            if (isQuestionStart(nextLine.plain)) break;
            if (isHeaderBannerLine(nextLine.plain)) { i++; continue; }
            qBlock.push(nextLine);
            i++;
          }
          const q = parseQuestionBlock(qBlock, globalQNo + 1);
          if (q) {
            questions.push(q);
            globalQNo = q.no;
          }
        }
        continue;
      }

      // ── Passage line ──────────────────────────────────────────────
      if (questions.length === 0) {
        if (!sectionTitle && plain.length < 80 && isTitleLine(plain)) {
          sectionTitle = plain;
          if (!detectedTitle) detectedTitle = plain;
        } else if (sectionTitle && !sectionSubtitle && plain.length < 80 && !plain.includes('.') && isTitleLine(plain)) {
          sectionSubtitle = plain;
        } else if (plain.length > 0) {
          // Format blanks inline: (18) ________, **(18) ________**
          passageLines.push(lineObj.html || plain);
        }
      }
      i++;
    }

    const passageHtml = formatPassageBlanks(passageLines.join('\n'));

    if (questions.length > 0 || passageLines.length > 2) {
      parsedSections.push({
        id: `sec-${sIdx + 1}`,
        instruction: instruction || 'Read the following passage and answer the questions below.',
        title: sectionTitle || `SECTION ${parsedSections.length + 1}`,
        subtitle: sectionSubtitle || '',
        passage: passageHtml || '',
        questions: questions.length > 0 ? questions : [],
      });
    }
  }

  // Fallback
  if (parsedSections.length === 0) {
    parsedSections.push(parseSingleSectionFallback(htmlLines));
  }

  return {
    code: detectedCode || '',
    title: detectedTitle || parsedSections[0]?.title || 'Đề Ôn Tập',
    sections: parsedSections,
    questions: parsedSections.flatMap(s => s.questions),
    passage: parsedSections[0]?.passage || '',
  };
}

/* ===================================================================
   HELPERS
================================================================= */

/**
 * Cut off the solution/answer-key section from the raw HTML content.
 * Vietnamese exam files often include "LỜI GIẢI CHI TIẾT" (detailed solutions)
 * or "----- Hết -----" (end marker) followed by the answer explanations.
 * We strip everything after these markers to avoid parsing duplicate questions.
 */
function cutOffSolutionSection(html) {
  if (!html) return html;

  // Try HTML-aware cuts first (handles <strong>----- Hết -----</strong> etc.)
  // Pattern 1: "----- Hết -----" (end of test marker)
  const hetPatterns = [
    /[-–—]{3,}\s*Hết\s*[-–—]{3,}/i,
    />[-–—]{3,}\s*Hết\s*[-–—]{3,}/i,
  ];
  for (const pat of hetPatterns) {
    const match = html.match(pat);
    if (match) {
      return html.substring(0, match.index);
    }
  }

  // Pattern 2: "LỜI GIẢI CHI TIẾT" (solution header)
  const loiGiaiIdx = html.search(/LỜI\s+GIẢI\s+CHI\s+TIẾT/i);
  if (loiGiaiIdx > 0) {
    return html.substring(0, loiGiaiIdx);
  }

  // Pattern 3: "🗝️" emoji (key emoji often used before solutions)
  const keyIdx = html.indexOf('🗝️');
  if (keyIdx > 0) {
    return html.substring(0, keyIdx);
  }

  // Pattern 4: "Hướng dẫn giải" section header (alternative format)
  const hdgIdx = html.search(/Hướng\s+dẫn\s+giải/i);
  if (hdgIdx > 0) {
    // Only cut if it appears after at least some questions
    const questionsBefore = html.substring(0, hdgIdx).match(/Question\s+\d+/gi);
    if (questionsBefore && questionsBefore.length >= 10) {
      return html.substring(0, hdgIdx);
    }
  }

  return html;
}

/**
 * Convert HTML string → array of { html, plain } line objects
 * We normalise block tags to newlines but preserve inline HTML (for <mark> detection)
 */
function splitHtmlToLines(html) {
  // Replace block-level tags with newline markers
  const normalized = html
    .replace(/<\/?(p|div|tr|li|h[1-6]|br)[^>]*>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

  return normalized
    .split('\n')
    .map(rawLine => ({
      html: rawLine.trim(),
      plain: rawLine.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    }))
    .filter(l => l.plain.length > 0);
}

/** True if line looks like a page header / footer to skip */
function isHeaderBannerLine(text) {
  if (!text || text.length === 0) return true;
  const u = text.toUpperCase();
  return (
    u.includes('LUYỆN THI TIẾNG ANH') ||
    (u.includes('GLOBAL SUCCESS') && !u.includes('QUESTION') && text.length < 80) ||
    u.startsWith('NĂM HỌC') ||
    /^TRANG\s+\d+$/i.test(text) ||
    /^MÃ SỐ\s+\d+/.test(u) ||
    (u.startsWith('TEST') && text.length < 12) ||
    u.includes('MÔN TIẾNG ANH - BÀI TẬP')
  );
}

/** True if line is an ALL-CAPS short title (passage heading) */
function isTitleLine(text) {
  const upper = text.toUpperCase();
  // All uppercase or Title Case, no sentence punctuation
  return !text.match(/[a-z]{5,}/) || upper === text || /^[A-Z][a-zA-Z\s\&\-]+$/.test(text);
}

/** Detects Question 18: / Question 18. / Q18. / Câu 18. / 18. */
function isQuestionStart(plain) {
  return /^(?:Question|Câu|Q)\s*\d+\s*[:\.\)]/i.test(plain);
}

/**
 * FORMAT 2: Single line with all 4 options inline
 * "Question 7: A. range   B. share   C. level   D. number"
 * Returns parsed question or null if can't find ≥2 options on this line
 */
function tryParseInlineLine(lineObj, defaultNo) {
  const plain = lineObj?.plain;
  if (!plain) return null;

  // Must have at least 2 option markers A, B, C, D (dot, bracket, colon, optional space)
  const optMatches = plain.match(/\b[A-D][\.\)\:]\s*/g) || [];
  if (optMatches.length < 2) return null;

  const qNoMatch = plain.match(/(?:Question|Câu|Q)\s*(\d+)\s*[:\.\)]/i);
  const qNo = qNoMatch ? parseInt(qNoMatch[1], 10) : defaultNo;

  // Extract question text (before first A.)
  const firstOptIdx = plain.search(/\bA[\.\)\:]\s*/);
  const questionText = firstOptIdx > 0
    ? plain.slice(0, firstOptIdx).replace(/^(?:Question|Câu|Q)\s*\d+\s*[:\.\)]\s*/i, '').trim()
    : '';

  // Parse options — use html version for highlight detection
  const { options, correct } = extractOptionsFromLine(lineObj.html || lineObj.plain);

  if (options.length < 2) return null;

  return {
    id: `q-${qNo}-${Date.now()}`,
    no: qNo,
    text: questionText || `Question ${qNo}.`,
    options: options.slice(0, 4),
    correct,
    explanation: `Đáp án đúng là ${correct}.`,
  };
}

/**
 * FORMAT 1 / FORMAT 3: Question block = question line + following option lines
 * Question 18:
 * A. because it deepens trust...
 * B. so it proves screen time...  (plain text, not inline)
 * C. although trust...
 * D. but it often reflects...   ← <mark>highlighted</mark>
 */
function parseQuestionBlock(blockLines, defaultNo) {
  if (blockLines.length === 0) return null;

  const firstPlain = blockLines[0].plain;
  const qNoMatch   = firstPlain.match(/(?:Question|Câu|Q)\s*(\d+)\s*[:\.\)]/i);
  const qNo        = qNoMatch ? parseInt(qNoMatch[1], 10) : defaultNo;

  // Question text = everything after "Question N:" before first option
  let questionText = firstPlain.replace(/^(?:Question|Câu|Q)\s*\d+\s*[:\.\)]\s*/i, '').trim();

  const options  = [];
  let correct    = 'A';
  let dialogueParts = []; // for FORMAT 3 (a. / b. / c. / d. / e. dialogue sub-lines)
  let contextParts  = []; // for context text like "Dear Olivia,..." in letter-format questions

  for (let i = 1; i < blockLines.length; i++) {
    const { html, plain } = blockLines[i];

    // FORMAT 3 dialogue/arrangement sub-item: lowercase letter + period "a. Ethan: ..."
    // Range a-e to support questions with up to 5 sub-items (Q14-Q17)
    // IMPORTANT: Only match lowercase a-e, NOT uppercase A-D (answer labels)
    if (/^[a-e]\.\s+/.test(plain) && /^[a-e]/.test(plain)) {
      dialogueParts.push(plain);
      continue;
    }

    // Check if this line has MULTIPLE inline options (A. B. C. D. on same line)
    // This happens for tab-separated option lines in arrangement questions:
    //   "A. a – b – c	B. b – c – a	C. c – a – b	D. c – b – a"
    const inlineOptCount = (plain.match(/\b[A-D]\.\s/g) || []).length;
    if (inlineOptCount >= 2) {
      const { options: inlineOpts, correct: inlineCorrect } = extractOptionsFromLine(html);
      if (inlineOpts.length >= 2) {
        options.push(...inlineOpts);
        correct = inlineCorrect;
        continue;
      }
    }

    // Standard option line "A. text" or "A) text" (single option per line)
    // CASE-SENSITIVE: Only match uppercase A-D to avoid confusion with
    // lowercase dialogue items (a. b. c. d. e.) in arrangement questions
    const optMatch = plain.match(/^([A-D])[.\)]\s+(.*)/);
    if (optMatch) {
      const letter = optMatch[1];
      const rawText = optMatch[2].trim();
      const isHighlighted = isHighlightedHtml(html);
      if (isHighlighted) correct = letter;
      options.push(rawText);
      continue;
    }

    // Context text for arrangement questions (e.g. "Dear Olivia,...", "Best wishes, Nathan")
    // This is text that appears between Question line and dialogue items or after them,
    // but is NOT a dialogue item and NOT an option
    if (options.length === 0 && !isQuestionStart(plain)) {
      if (dialogueParts.length === 0) {
        // Context text before dialogue items → add to question text
        contextParts.push(plain);
      } else {
        // Context text after dialogue items (e.g. closing of a letter)
        contextParts.push(plain);
      }
      continue;
    }

    // Option continuation (no letter prefix — could be wrapped text)
    if (options.length > 0 && !isQuestionStart(plain)) {
      options[options.length - 1] += ' ' + plain;
    }
  }

  // If it was a dialogue/arrangement question, embed context + dialogue in question text
  if (dialogueParts.length > 0 && options.length > 0) {
    const allParts = [];
    if (contextParts.length > 0) {
      // Insert context before dialogue items (e.g. "Dear Olivia,...")
      // Split: context lines before first dialogue = prefix, after last dialogue = suffix
      allParts.push(...contextParts);
    }
    allParts.push(...dialogueParts);
    questionText += '\n' + allParts.join('\n');
  } else if (contextParts.length > 0 && options.length === 0) {
    // Pure context text without dialogue — append to question text
    questionText += '\n' + contextParts.join('\n');
  }

  // If no options found, try parsing any line in blockLines as inline options
  if (options.length < 2) {
    for (const bLine of blockLines) {
      const inlineResult = tryParseInlineLine(bLine, qNo);
      if (inlineResult && inlineResult.options.length >= 2) {
        return {
          ...inlineResult,
          text: (questionText && questionText !== `Question ${qNo}.`) ? questionText : inlineResult.text,
        };
      }
    }
  }

  while (options.length < 4) options.push(`Lựa chọn ${'ABCD'[options.length]}`);

  return {
    id: `q-${qNo}-${Date.now()}`,
    no: qNo,
    text: questionText || `Question ${qNo}.`,
    options: options.slice(0, 4),
    correct,
    explanation: `Đáp án đúng là ${correct}.`,
  };
}

/**
 * Extract A/B/C/D options from a single HTML/plain line (inline FORMAT 2)
 * Handles Word docs with flexible option formats: A. A) A: with or without spaces and <strong> wrappers
 * Returns { options: string[], correct: string }
 */
function extractOptionsFromLine(htmlLine) {
  const options = [];
  let correct   = 'A';
  if (!htmlLine) return { options, correct };

  // Strategy 1: Strip HTML tags first, then split by option markers (A. B. C. D. or A) B) C) D) or A: B: C: D:)
  const plainLine = htmlLine.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  // Split by uppercase option markers (A. B. C. D., A) B), A: B:)
  const segments = plainLine.split(/(?=(?:^|\s|\t)[A-D][\.\)\:]\s*)/);

  for (const seg of segments) {
    const trimmed = seg.trim();
    const match = trimmed.match(/^([A-D])[\.\)\:]\s*([\s\S]*)/);
    if (!match) continue;

    const letter = match[1].toUpperCase();
    const content = match[2].trim();

    // Check highlight in original HTML
    const letterIdx = htmlLine.indexOf(`${letter}.`);
    const letterIdx2 = htmlLine.indexOf(`${letter})`);
    const startIdx = Math.max(letterIdx, letterIdx2);
    if (startIdx >= 0) {
      const nextLetterIdx = 'ABCD'.indexOf(letter) < 3
        ? Math.max(
            htmlLine.indexOf(`${'ABCD'['ABCD'.indexOf(letter) + 1]}.`, startIdx + 1),
            htmlLine.indexOf(`${'ABCD'['ABCD'.indexOf(letter) + 1]})`, startIdx + 1)
          )
        : -1;
      const htmlSegment = nextLetterIdx > 0
        ? htmlLine.substring(startIdx, nextLetterIdx)
        : htmlLine.substring(startIdx);
      if (isHighlightedHtml(htmlSegment)) correct = letter;
    }

    if (content) options.push(content);
  }

  // Strategy 2 fallback: split html directly if plain text split didn't find >= 2 options
  if (options.length < 2) {
    options.length = 0;
    correct = 'A';
    const htmlSegments = htmlLine.split(/(?=(?:<strong>)?\s*[A-D][\.\)\:]\s*(?:<\/strong>)?)/i);
    for (const seg of htmlSegments) {
      const cleaned = seg.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const match = cleaned.match(/^([A-D])[\.\)\:]\s*([\s\S]*)/i);
      if (!match) continue;
      const letter = match[1].toUpperCase();
      const cleanText = match[2].trim();
      if (isHighlightedHtml(seg)) correct = letter;
      if (cleanText) options.push(cleanText);
    }
  }

  return { options, correct };
}

/**
 * Returns true if the html snippet contains a yellow <mark> highlight tag
 */
function isHighlightedHtml(html) {
  return /<mark(?:\s[^>]*)?>/.test(html) ||
         /background(?:-color)?:\s*(?:yellow|#[fF]{3,}00|rgb\(255,\s*255,\s*0\))/i.test(html) ||
         /\*[^*]+\*/.test(html);  // *bold* markdown fallback
}

/**
 * Format passage blanks:  (18) ________  →  styled span
 * Also handles **(18) ________** (Word bold format)
 */
function formatPassageBlanks(html) {
  if (!html) return '';
  // Remove existing bold/strong wrappers around blanks if any
  let out = html.replace(/<strong>\s*\((\d+)\)\s*_+\s*<\/strong>/gi, (_, n) =>
    `<span class="exam-blank">(${n})&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`
  );
  // Plain text blanks
  out = out.replace(/\((\d+)\)\s*_{2,}/g, (_, n) =>
    `<span class="exam-blank">(${n})&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`
  );
  // Also handle dashes used as blanks:  (18) ------
  out = out.replace(/\((\d+)\)\s*-{3,}/g, (_, n) =>
    `<span class="exam-blank">(${n})&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`
  );
  return out;
}

/** Fallback: treat everything as a single section */
function parseSingleSectionFallback(htmlLines) {
  const questions  = [];
  const passage    = [];
  let i = 0;
  let globalQNo = 0;

  while (i < htmlLines.length) {
    const lineObj = htmlLines[i];
    if (isHeaderBannerLine(lineObj.plain)) { i++; continue; }

    if (isQuestionStart(lineObj.plain)) {
      const inlineQ = tryParseInlineLine(lineObj, globalQNo + 1);
      if (inlineQ) {
        questions.push(inlineQ);
        globalQNo = inlineQ.no;
        i++;
      } else {
        const block = [lineObj]; i++;
        while (i < htmlLines.length && !isQuestionStart(htmlLines[i].plain)) {
          block.push(htmlLines[i]); i++;
        }
        const q = parseQuestionBlock(block, globalQNo + 1);
        if (q) { questions.push(q); globalQNo = q.no; }
      }
    } else if (questions.length === 0) {
      passage.push(lineObj.html || lineObj.plain);
      i++;
    } else {
      i++;
    }
  }

  return {
    id: 'sec-1',
    instruction: 'Read the following passage and answer the questions below.',
    title: 'ĐỀ ÔN TẬP',
    subtitle: '',
    passage: formatPassageBlanks(passage.join('\n')),
    questions,
  };
}
