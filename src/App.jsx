import React, { useState } from 'react';
import useAppStore from './stores/useAppStore';
import LoginView from './views/LoginView';
import TestSelectView from './views/TestSelectView';
import TestView from './views/TestView';
import ResultView from './views/ResultView';
import TeacherView from './views/TeacherView';

export default function App() {
  const { view } = useAppStore();
  const [isTeacher, setIsTeacher] = useState(false);

  // If teacher mode, show teacher view regardless of view state
  if (isTeacher) {
    return <TeacherView onSwitchStudent={() => setIsTeacher(false)} />;
  }

  return (
    <>
      {view === 'login'       && <LoginView onSwitchTeacher={() => setIsTeacher(true)} />}
      {view === 'test-select'  && <TestSelectView onSwitchTeacher={() => setIsTeacher(true)} />}
      {view === 'test'         && <TestView />}
      {view === 'review'       && <TestView isReviewMode={true} />}
      {view === 'result'       && (
        <div className="relative min-h-screen overflow-hidden">
          <div className="filter blur-[6px] pointer-events-none select-none opacity-75">
            <TestView />
          </div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <ResultView />
          </div>
        </div>
      )}
    </>
  );
}
