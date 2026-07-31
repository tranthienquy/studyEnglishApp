import React from 'react';
import useAppStore from './stores/useAppStore';
import LoginView from './views/LoginView';
import TestSelectView from './views/TestSelectView';
import TestView from './views/TestView';
import ResultView from './views/ResultView';
import TeacherView from './views/TeacherView';
import TeacherAuthView from './views/TeacherAuthView';
import AdminView from './views/AdminView';

import { getTestByCode } from './lib/supabase';

import Footer from './components/ui/Footer';

export default function App() {
  const { view, setView, setCurrentTest, student } = useAppStore();

  React.useEffect(() => {
    async function checkSharedLink() {
      try {
        const params = new URLSearchParams(window.location.search);
        const sharedCode = params.get('test');
        if (sharedCode) {
          const found = await getTestByCode(sharedCode);
          if (found) {
            setCurrentTest(found);
            if (student && student.name && student.class) {
              setView('test-select');
            } else {
              setView('login');
            }
          }
        }
      } catch (e) {
        console.warn('Check shared link failed:', e);
      }
    }
    checkSharedLink();
  }, []);

  return (
    <>
      <div className="pb-10">
        {view === 'login'        && <LoginView onSwitchTeacher={() => setView('teacher-auth')} />}
        {view === 'test-select'   && <TestSelectView onSwitchTeacher={() => setView('teacher-auth')} />}
        {view === 'test'          && <TestView />}
        {view === 'review'        && <TestView isReviewMode={true} />}
        {view === 'teacher-auth'  && <TeacherAuthView onSwitchStudent={() => setView('login')} />}
        {view === 'teacher'       && <TeacherView onSwitchStudent={() => setView('login')} />}
        {view === 'admin'         && <AdminView onExit={() => setView('login')} />}
        {view === 'result'        && (
          <div className="relative min-h-screen overflow-hidden">
            <div className="filter blur-[6px] pointer-events-none select-none opacity-75">
              <TestView />
            </div>
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <ResultView />
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
