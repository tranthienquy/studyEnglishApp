import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set, get) => ({
      // ---- App Navigation & Mode ----
      view: 'login', // 'login' | 'test-select' | 'test' | 'result' | 'review' | 'teacher' | 'teacher-auth' | 'admin'
      setView: (view) => set({ view }),

      // ---- Teacher Session ----
      teacherSession: null, // { email, name, avatar } or null
      setTeacherSession: (session) => set({ teacherSession: session }),
      clearTeacherSession: () => set({ teacherSession: null }),

      // ---- Student Info ----
      student: null,
      setStudent: (student) => set({ student }),

      // ---- Active Test ----
      currentTest: null,
      setCurrentTest: (test) => set({ currentTest: test }),
      selectTest: (test) => set({ currentTest: test }),

      // ---- Answers ----
      answers: {}, // { questionId: 'A' | 'B' | 'C' | 'D' }
      setAnswer: (qId, value) =>
        set((s) => ({ answers: { ...s.answers, [qId]: value } })),
      clearAnswers: () => set({ answers: {} }),

      // ---- Flagged Questions ----
      flagged: new Set(),
      flaggedArray: [],
      toggleFlag: (qId) =>
        set((s) => {
          const next = new Set(s.flagged);
          next.has(qId) ? next.delete(qId) : next.add(qId);
          return { flagged: next, flaggedArray: Array.from(next) };
        }),
      clearFlags: () => set({ flagged: new Set(), flaggedArray: [] }),

      // ---- Timer & Timestamps ----
      timeLeft: 0,
      setTimeLeft: (t) => set({ timeLeft: t }),
      startTimeStamp: null,

      // ---- Time Spent ----
      timeSpent: 0,
      setTimeSpent: (t) => set({ timeSpent: t }),

      // ---- Result ----
      result: null,
      setResult: (result) => set({ result }),

      // ---- Highlights in passage ----
      highlights: [], // { id, startOffset, text, color }
      addHighlight: (h) => set((s) => ({ highlights: [...s.highlights, h] })),
      removeHighlight: (id) =>
        set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),
      clearHighlights: () => set({ highlights: [] }),

      // ---- Font size ----
      fontSize: 'size-md', // size-sm | size-md | size-lg | size-xl
      setFontSize: (fs) => set({ fontSize: fs }),

      // ---- Active toolbar tool ----
      activeTool: null, // null | 'highlight' | 'eraser'
      setActiveTool: (t) => set({ activeTool: t }),

      // ---- Reset everything for new attempt ----
      resetTest: () =>
        set({
          view: 'login',
          student: null,
          currentTest: null,
          answers: {},
          flagged: new Set(),
          flaggedArray: [],
          highlights: [],
          timeLeft: 0,
          startTimeStamp: null,
          timeSpent: 0,
          result: null,
          activeTool: null,
        }),

      // ---- Start a test ----
      startTest: (student, test) => {
        const normalizedTest = {
          ...test,
          sections: test.sections || [],
        };
        const durationSec = (test.duration || 45) * 60;
        const now = Date.now();

        set({
          student,
          currentTest: normalizedTest,
          answers: {},
          flagged: new Set(),
          flaggedArray: [],
          highlights: [],
          timeLeft: durationSec,
          startTimeStamp: now,
          timeSpent: 0,
          result: null,
          activeTool: null,
          fontSize: 'size-md',
          view: 'test',
        });
      },

      // ---- Submit test & compute result ----
      submitTest: (elapsedSeconds) => {
        const { currentTest, answers, student, startTimeStamp } = get();
        if (!currentTest) return;

        const actualElapsed = elapsedSeconds || (startTimeStamp
          ? Math.floor((Date.now() - startTimeStamp) / 1000)
          : 0);

        const questions = currentTest.sections
          ? currentTest.sections.flatMap(s => s.questions)
          : currentTest.questions || [];

        let correctCount = 0;

        const detailedAnswers = questions.map((q) => {
          const chosen = answers[q.id] || null;
          const isCorrect = chosen === q.correct;
          if (isCorrect) correctCount++;
          return {
            questionId: q.id,
            no: q.no,
            chosen,
            correct: q.correct,
            isCorrect,
            question: q,
          };
        });

        const score = questions.length > 0
          ? parseFloat(((correctCount / questions.length) * 10).toFixed(1))
          : 0;

        const result = {
          studentName: student?.name || 'Học sinh',
          studentClass: student?.class || '',
          teacher: student?.teacher || '',
          testId: currentTest.id,
          testTitle: currentTest.title,
          score,
          correctCount,
          totalCount: questions.length,
          timeSpent: actualElapsed,
          detailedAnswers,
        };

        set({ result, timeSpent: actualElapsed, view: 'result' });
        return result;
      },
    }),
    {
      name: 'readingpro_session_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        view: state.view,
        student: state.student,
        currentTest: state.currentTest,
        answers: state.answers,
        flaggedArray: state.flaggedArray || Array.from(state.flagged || []),
        timeLeft: state.timeLeft,
        startTimeStamp: state.startTimeStamp,
        timeSpent: state.timeSpent,
        result: state.result,
        highlights: state.highlights,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore Set from array
          if (Array.isArray(state.flaggedArray)) {
            state.flagged = new Set(state.flaggedArray);
          } else {
            state.flagged = new Set();
          }

          // Recalculate remaining time on reload if taking test
          if (state.view === 'test' && state.startTimeStamp && state.currentTest) {
            const totalDurationSec = (state.currentTest.duration || 45) * 60;
            const elapsedSec = Math.floor((Date.now() - state.startTimeStamp) / 1000);
            const remaining = totalDurationSec - elapsedSec;
            state.timeLeft = Math.max(0, remaining);
          }
        }
      },
    }
  )
);

export default useAppStore;
