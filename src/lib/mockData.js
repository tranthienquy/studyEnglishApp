// ============================================================
// MOCK DATA — Cấu trúc mới: Mỗi section có instruction + passage + questions inline
// Hỗ trợ tối đa 50 câu hỏi, chia nhiều sections, mỗi section = 1 tab
// ============================================================

export const MOCK_TEACHERS = [
  { id: 't1', name: 'Cô Nguyễn Thị Lan',  subject: 'Tiếng Anh' },
  { id: 't2', name: 'Thầy Trần Văn Minh', subject: 'Tiếng Anh' },
  { id: 't3', name: 'Cô Lê Thị Hoa',      subject: 'Tiếng Anh' },
];

export const MOCK_CLASSES = [
  '6A1','6A2','6A3','7A1','7A2','7A3',
  '8A1','8A2','8A3','9A1','9A2','9A3',
  '10A1','10A2','10A3','11A1','11A2','12A1',
];

// ============================================================
// TEST STRUCTURE
// sections[]: mỗi section = 1 tab
//   instruction: header xanh đậm
//   passage: đoạn văn, blanks được ký hiệu là <b>(N)________</b> hoặc plain text
//   questions[]: danh sách câu hỏi của section đó
//     options: ['option A text', 'option B text', 'option C text', 'option D text']
//     correct: 'A' | 'B' | 'C' | 'D'
// ============================================================

// ==== TEST 1: ENG2025A — 12 câu, 2 sections (mẫu từ ảnh) ====
const test1Sections = [
  {
    id: 'sec1',
    instruction: 'Read the following advertisement and mark the letter A, B, C, or D on your answer sheet to indicate the option that best fits each of the numbered blanks from 1 to 6.',
    title: 'BEYOND WORDS',
    subtitle: 'A Family Understanding Initiative',
    passage: `Modern families often spend hours together but rarely listen to one another. To address this concern, Beyond Words is a community initiative <mark class="blank">(1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> helps family members improve communication and strengthen trust.

<strong>What Can Families Expect?</strong>
Participants can join a workshop that <mark class="blank">(2)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> to feature guided discussions and real-life family situations. Through these activities, family members learn to consider different viewpoints instead of trying <mark class="blank">(3)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> every disagreement.

<strong>Why Is Understanding Important?</strong>
Families with strong communication habits are more likely to handle conflicts successfully and show greater <mark class="blank">(4)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> during difficult situations. Parents committed <mark class="blank">(5)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> maintaining open conversations often build closer relationships with their children. The initiative also promotes understanding <mark class="blank">(6)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> generations and encourages a more supportive home environment.`,
    questions: [
      { id: 'q1',  no: 1,  options: ['where', 'whom', 'whose', 'that'],           correct: 'D', explanation: 'Dùng "that" làm đại từ quan hệ thay thế cho "a community initiative" (vật). "that" phổ biến hơn "which" trong văn nói/viết thông thường.' },
      { id: 'q2',  no: 2,  options: ['designs', 'is designed', 'designed', 'has designed'], correct: 'B', explanation: '"is designed" (bị động hiện tại đơn) vì workshop là chủ thể bị thiết kế/lên kế hoạch bởi người tổ chức.' },
      { id: 'q3',  no: 3,  options: ['winning', 'win', 'won', 'to win'],           correct: 'D', explanation: '"instead of trying TO WIN" — sau "instead of trying" dùng "to + V" (infinitive) để diễn tả mục đích.' },
      { id: 'q4',  no: 4,  options: ['supportive', 'supportively', 'support', 'supporter'], correct: 'C', explanation: '"greater support" — sau "greater" cần danh từ. "support" (sự hỗ trợ) là danh từ phù hợp ngữ cảnh.' },
      { id: 'q5',  no: 5,  options: ['at', 'with', 'to', 'for'],                  correct: 'C', explanation: '"committed TO maintaining" — cụm từ cố định: "be committed to + V-ing/N".' },
      { id: 'q6',  no: 6,  options: ['beside', 'through', 'against', 'across'],   correct: 'D', explanation: '"across generations" = xuyên suốt các thế hệ. "across" chỉ sự lan rộng/phổ biến.' },
    ],
  },
  {
    id: 'sec2',
    instruction: 'Read the following leaflet and mark the letter A, B, C, or D on your answer sheet to indicate the option that best fits each of the numbered blanks from 7 to 12.',
    title: 'When Encouragement Comes from a Brother or Sister',
    subtitle: '',
    passage: `Many teenagers do not immediately talk to their parents when they face difficulties. Instead, they often turn to a sibling for emotional support.

<strong>Why siblings matter</strong>
• A recent survey reported a high <mark class="blank">(7)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> of confidence among students who regularly receive encouragement from their brothers or sisters.
• Siblings are usually close in age, <mark class="blank">(8)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> they often understand school pressure and friendship problems better.
• During stressful periods, many teenagers <mark class="blank">(9)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> their brothers or sisters for advice and reassurance.

<strong>More than just conversation</strong>
• While some teenagers may need advice from parents, <mark class="blank">(10)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> can cope more easily with encouragement from siblings.
• These shared experiences help build <mark class="blank">(11)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> and mutual understanding within the family.
• As a result, siblings can become a valuable source of emotional <mark class="blank">(12)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark> during difficult times.`,
    questions: [
      { id: 'q7',  no: 7,  options: ['range', 'share', 'level', 'number'],         correct: 'C', explanation: '"a high level of confidence" = mức độ tự tin cao. "level" dùng để chỉ mức độ/cấp độ.' },
      { id: 'q8',  no: 8,  options: ['but', 'or', 'for', 'so'],                    correct: 'D', explanation: '"so" = kết quả/hệ quả. Vì gần bằng tuổi, nên (so) họ hiểu áp lực học đường tốt hơn.' },
      { id: 'q9',  no: 9,  options: ['wash up', 'turn to', 'put away', 'get into'], correct: 'B', explanation: '"turn to someone" = nhờ ai đó giúp đỡ, tìm đến ai. Cụm từ cố định trong tiếng Anh.' },
      { id: 'q10', no: 10, options: ['most', 'each', 'either', 'neither'],          correct: 'A', explanation: '"most" = hầu hết. "most teenagers" phù hợp nghĩa: hầu hết thanh thiếu niên.' },
      { id: 'q11', no: 11, options: ['trust', 'patience', 'equality', 'curiosity'], correct: 'A', explanation: '"build trust" = xây dựng sự tin tưởng. "trust and mutual understanding" là cặp từ tự nhiên.' },
      { id: 'q12', no: 12, options: ['selfish', 'support', 'skill', 'necessity'],  correct: 'B', explanation: '"emotional support" = hỗ trợ tinh thần/cảm xúc. Cụm từ cố định rất phổ biến.' },
    ],
  },
  {
    id: 'sec3',
    instruction: 'Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate the correct answer to each of the following questions from 13 to 20.',
    title: 'THE POWER OF READING',
    subtitle: '',
    passage: `Reading is one of the most valuable habits a person can develop. It not only expands vocabulary and knowledge but also improves concentration and critical thinking skills. In today's fast-paced digital world, however, many people — especially young people — are reading far less than previous generations.

Research consistently shows that students who read regularly outside of school perform better academically. They tend to have stronger language skills, a wider range of knowledge, and greater empathy for others. This is because reading fiction, in particular, requires readers to step into the perspectives of different characters and understand complex emotional situations.

Despite its benefits, encouraging teenagers to read can be challenging. Many report that they find books "boring" compared to social media, video games, or streaming services. Educators and parents are therefore exploring creative strategies to reignite interest in reading, such as book clubs, digital reading platforms, and connecting books to students' personal interests.

Some schools have introduced "reading for pleasure" programmes where students choose their own books during designated classroom time. Early results from these programmes are promising: students show increased motivation, improved reading comprehension, and a more positive attitude towards learning in general.`,
    questions: [
      { id: 'q13', no: 13, options: [
        'Reading has declined significantly among all age groups.',
        'Reading improves various cognitive and linguistic skills.',
        'Digital devices are more educational than books.',
        'Critical thinking is the most important reading skill.'
      ], correct: 'B', explanation: 'Đoạn 1 nêu: reading "expands vocabulary and knowledge" and "improves concentration and critical thinking" → B là ý chính.' },
      { id: 'q14', no: 14, options: [
        'They use social media more responsibly.',
        'They tend to avoid challenging academic subjects.',
        'They perform better academically and show greater empathy.',
        'They prefer non-fiction over fiction.'
      ], correct: 'C', explanation: 'Đoạn 2: "students who read regularly...perform better academically...greater empathy for others."' },
      { id: 'q15', no: 15, options: [
        'It helps readers understand different characters\' perspectives.',
        'It is easier to read than non-fiction.',
        'It is more popular than reading non-fiction.',
        'It teaches grammar rules more effectively.'
      ], correct: 'A', explanation: '"reading fiction...requires readers to step into the perspectives of different characters." → Đọc văn học giúp hiểu góc nhìn nhân vật.' },
      { id: 'q16', no: 16, options: [
        'boring',
        'engaging',
        'educational',
        'challenging'
      ], correct: 'A', explanation: 'Đoạn 3: "Many report that they find books \'boring\' compared to social media..." → Từ trong ngoặc kép là "boring".' },
      { id: 'q17', no: 17, options: [
        'Banning the use of digital devices in schools.',
        'Using book clubs, digital platforms, and personal interest connections.',
        'Requiring students to read at least two hours daily.',
        'Replacing all textbooks with fiction novels.'
      ], correct: 'B', explanation: 'Đoạn 3 liệt kê: "book clubs, digital reading platforms, and connecting books to students\' personal interests."' },
      { id: 'q18', no: 18, options: [
        'teachers select books for students to read',
        'students choose their own books during class time',
        'students compete to read the most books',
        'parents read aloud to students every evening'
      ], correct: 'B', explanation: '"students choose their own books during designated classroom time" → học sinh tự chọn sách trong giờ học.' },
      { id: 'q19', no: 19, options: [
        'unsuccessful and unpopular',
        'too difficult to implement',
        'promising, with improved motivation and comprehension',
        'causing students to dislike reading even more'
      ], correct: 'C', explanation: '"Early results...are promising: students show increased motivation, improved reading comprehension..." → kết quả khả quan.' },
      { id: 'q20', no: 20, options: [
        'The challenges of modern technology for students',
        'Why fiction is superior to non-fiction',
        'The importance of reading and ways to encourage it',
        'How schools can improve exam results through reading'
      ], correct: 'C', explanation: 'Toàn bài nói về lợi ích của việc đọc và các chiến lược khuyến khích đọc sách → C phù hợp nhất.' },
    ],
  },
];

// ==== TEST 2: ENG2025B — 12 câu, 2 sections ====
const test2Sections = [
  {
    id: 'sec1',
    instruction: 'Read the following passage and mark the letter A, B, C, or D to indicate the word(s) CLOSEST in meaning to the underlined word(s) in each of the following questions from 1 to 6.',
    title: 'ARTIFICIAL INTELLIGENCE IN EDUCATION',
    subtitle: '',
    passage: `Artificial intelligence (AI) has begun to <u>transform</u> the way students learn and teachers teach. In many schools around the world, AI-powered tools are being used to <u>personalise</u> learning experiences, adapting content to suit each student's pace and abilities. This approach has shown <u>remarkable</u> results in helping students who previously struggled with traditional classroom methods.

However, not all educators are <u>enthusiastic</u> about this shift. Some argue that over-reliance on technology may <u>undermine</u> the development of essential social and critical thinking skills. Others worry that AI tools may <u>widen</u> the gap between students from wealthy and disadvantaged backgrounds, as access to technology remains unequal.`,
    questions: [
      { id: 'q1',  no: 1,  options: ['change dramatically', 'protect carefully', 'describe clearly', 'reduce slowly'],    correct: 'A', explanation: '"transform" = thay đổi hoàn toàn/đáng kể. "change dramatically" là gần nghĩa nhất.' },
      { id: 'q2',  no: 2,  options: ['standardise', 'customise', 'evaluate', 'simplify'],                                 correct: 'B', explanation: '"personalise" = cá nhân hóa, tùy chỉnh theo từng người = "customise".' },
      { id: 'q3',  no: 3,  options: ['ordinary', 'expected', 'extraordinary', 'disappointing'],                           correct: 'C', explanation: '"remarkable" = đáng chú ý, xuất sắc = "extraordinary" (phi thường).' },
      { id: 'q4',  no: 4,  options: ['excited', 'worried', 'confused', 'satisfied'],                                      correct: 'A', explanation: '"enthusiastic" = nhiệt tình, hào hứng ≈ "excited" (hứng khởi).' },
      { id: 'q5',  no: 5,  options: ['support', 'weaken', 'develop', 'improve'],                                          correct: 'B', explanation: '"undermine" = làm suy yếu, phá hoại ngầm ≈ "weaken".' },
      { id: 'q6',  no: 6,  options: ['close', 'increase', 'reduce', 'eliminate'],                                         correct: 'B', explanation: '"widen the gap" = mở rộng khoảng cách ≈ "increase". Động từ "widen" = làm rộng thêm.' },
    ],
  },
  {
    id: 'sec2',
    instruction: 'Read the following passage and mark the letter A, B, C, or D to indicate the correct answer to each of the following questions from 7 to 12.',
    title: 'CLIMATE CHANGE AND YOUNG ACTIVISTS',
    subtitle: '',
    passage: `In recent years, young people around the world have become increasingly vocal about climate change. Inspired by activists like Greta Thunberg, millions of students have joined marches, organised school strikes, and lobbied their governments to take stronger action on environmental issues.

This youth-led movement has had a significant impact on public discourse. Surveys show that young people are now more concerned about climate change than any previous generation, and many consider it the defining challenge of their lifetime. Their passion has pushed climate change higher on the political agenda in many countries.

Critics, however, argue that youth activism, while admirable, can sometimes be misguided. They suggest that students would be better served by studying science and engineering to develop practical solutions, rather than spending time on protests. Supporters counter that raising awareness and holding governments accountable are equally vital steps toward meaningful change.

Regardless of one's views on activism, it is clear that young people are no longer willing to remain silent on issues that will shape their futures. Their voices, whether in the streets or in the classroom, are becoming an increasingly powerful force in the global conversation about our planet's future.`,
    questions: [
      { id: 'q7',  no: 7,  options: [
        'Young people have always been interested in climate change.',
        'Youth activism has had little effect on politics.',
        'Young people are increasingly active in addressing climate change.',
        'Greta Thunberg started the climate change movement alone.'
      ], correct: 'C', explanation: 'Đoạn 1 và 2 mô tả sự tham gia ngày càng tăng của giới trẻ → C là ý chính.' },
      { id: 'q8',  no: 8,  options: ['vocal', 'quiet', 'passive', 'indifferent'],   correct: 'A', explanation: '"vocal" = lên tiếng mạnh mẽ, thẳng thắn bày tỏ quan điểm. Được dùng trong dòng đầu tiên.' },
      { id: 'q9',  no: 9,  options: [
        'It has had little influence on the public.',
        'It has brought climate change higher on the political agenda.',
        'It has caused conflict between generations.',
        'It has reduced the number of climate scientists.'
      ], correct: 'B', explanation: 'Đoạn 2: "pushed climate change higher on the political agenda in many countries."' },
      { id: 'q10', no: 10, options: [
        'Young activists are wasting their time on protests.',
        'Science education is more important than political action.',
        'Students should study instead of protesting.',
        'Protests and political work are more effective than education.'
      ], correct: 'C', explanation: 'Đoạn 3, phần phê bình: "students would be better served by studying science and engineering...rather than spending time on protests."' },
      { id: 'q11', no: 11, options: ['problematic', 'praiseworthy', 'unusual', 'harmful'], correct: 'B', explanation: '"admirable" = đáng khâm phục, đáng khen ngợi ≈ "praiseworthy".' },
      { id: 'q12', no: 12, options: [
        'Youth activism is unlikely to change government policies.',
        'Young people are becoming a powerful voice on global environmental issues.',
        'Climate protests have replaced scientific research.',
        'Most governments now agree on how to solve climate change.'
      ], correct: 'B', explanation: 'Đoạn cuối: "Their voices...are becoming an increasingly powerful force in the global conversation about our planet\'s future."' },
    ],
  },
];

export const MOCK_TESTS = [
  {
    id: 'test001',
    code: 'ENG2025A',
    title: 'Luyện thi Tiếng Anh THCS — Năm học 2026–2027',
    subject: 'Tiếng Anh - Reading',
    duration: 45,
    teacher: 'Cô Nguyễn Thị Lan',
    sections: test1Sections,
    // Flat questions list (auto-built from sections)
    get questions() {
      return this.sections.flatMap(s => s.questions);
    },
  },
  {
    id: 'test002',
    code: 'ENG2025B',
    title: 'Luyện thi Tiếng Anh THPT — Năm học 2026–2027',
    subject: 'Tiếng Anh - Reading',
    duration: 40,
    teacher: 'Thầy Trần Văn Minh',
    sections: test2Sections,
    get questions() {
      return this.sections.flatMap(s => s.questions);
    },
  },
];

// ---- Leaderboard ----
export const MOCK_LEADERBOARD = [
  { rank: 1,  name: 'Nguyễn Minh Châu',    class: '10A1', score: 9.5, time: 1820 },
  { rank: 2,  name: 'Trần Thị Bích Ngọc',  class: '10A2', score: 9.0, time: 1950 },
  { rank: 3,  name: 'Lê Hoàng Phúc',       class: '10A1', score: 8.5, time: 2100 },
  { rank: 4,  name: 'Phạm Thị Thu Hà',     class: '10A3', score: 8.0, time: 2300 },
  { rank: 5,  name: 'Đinh Văn Khoa',       class: '10A2', score: 7.5, time: 2050 },
  { rank: 6,  name: 'Vũ Thị Lan Anh',      class: '11A1', score: 7.5, time: 2400 },
  { rank: 7,  name: 'Ngô Quang Huy',       class: '10A1', score: 7.0, time: 2250 },
  { rank: 8,  name: 'Hoàng Thị Mỹ Linh',  class: '11A2', score: 7.0, time: 2600 },
  { rank: 9,  name: 'Bùi Đức Toàn',        class: '10A3', score: 6.5, time: 2700 },
  { rank: 10, name: 'Đặng Thị Quỳnh',      class: '11A1', score: 6.0, time: 2850 },
];

// ---- AI Feedback Templates ----
const AI_FEEDBACK_TEMPLATES = {
  excellent: (name, score) => `🌟 Xuất sắc, ${name}! Bạn đạt ${score}/10 điểm — một kết quả thật đáng tự hào! Khả năng đọc hiểu của bạn rất sắc bén, và cách bạn phân tích ngữ cảnh để chọn đáp án cho thấy tư duy ngôn ngữ vô cùng nhạy bén. Cô/thầy tin rằng với sự nỗ lực này, bạn hoàn toàn có thể chinh phục mọi bài thi Tiếng Anh! ✨`,
  good:      (name, score) => `💪 Tốt lắm, ${name}! ${score}/10 điểm là một kết quả rất khả quan! Bạn đã thể hiện nền tảng đọc hiểu vững chắc. Hãy xem lại phần giải thích chi tiết bên dưới để hiểu sâu hơn nhé! 🎯`,
  average:   (name, score) => `😊 Cố gắng lên, ${name}! Bạn đạt ${score}/10 — hãy xem lại từng câu sai, chú ý các từ khoá và cách lý luận. Cô/thầy tin bạn sẽ làm tốt hơn ở lần sau! 📖`,
  low:       (name, score) => `🌱 Đừng bỏ cuộc, ${name}! ${score}/10 là điểm ban đầu. Hãy đọc kỹ phần giải thích, học thêm từ vựng mỗi ngày và thử lại. Bạn nhất định sẽ tiến bộ! 💡`,
};

export function getAIFeedback(name, score) {
  if (score >= 8.5) return AI_FEEDBACK_TEMPLATES.excellent(name, score);
  if (score >= 7.0) return AI_FEEDBACK_TEMPLATES.good(name, score);
  if (score >= 5.0) return AI_FEEDBACK_TEMPLATES.average(name, score);
  return AI_FEEDBACK_TEMPLATES.low(name, score);
}

export async function mockTranslate(text) {
  await new Promise(r => setTimeout(r, 600));
  return `🇻🇳 [Bản dịch] "${text}" — Kết nối Gemini API để dịch chính xác.`;
}
