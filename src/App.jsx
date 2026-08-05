import React from 'react';
import useAppStore from './stores/useAppStore';
import LoginView from './views/LoginView';
import TestSelectView from './views/TestSelectView';
import TestView from './views/TestView';
import ResultView from './views/ResultView';
import TeacherView from './views/TeacherView';
import TeacherAuthView from './views/TeacherAuthView';
import AdminView from './views/AdminView';

import { getTestByCode, isRealSupabaseConfigured } from './lib/supabase';
import { onAuthStateChange, getCurrentTeacher, isValidTeacherEmail, isAdminEmail, upsertTeacherProfile } from './lib/auth';

import Footer from './components/ui/Footer';

export default function App() {
  const { view, setView, setCurrentTest, student, setTeacherSession, teacherSession } = useAppStore();

  const hasSyncedAuth = React.useRef(false);

  // 1. Auth Listener & Initial Teacher Session Sync
  React.useEffect(() => {
    async function handleAuthUser(email, name, avatar) {
      if (!email || !isValidTeacherEmail(email)) return;
      const teacherObj = { email, name: name || email.split('@')[0], avatar };
      setTeacherSession(teacherObj);
      if (!hasSyncedAuth.current) {
        hasSyncedAuth.current = true;
        await upsertTeacherProfile(teacherObj);
      }
    }

    // Subscribe to auth changes (handles Google SSO redirect return)
    const unsubscribe = onAuthStateChange(async (session) => {
      if (session?.user?.email) {
        const email = session.user.email;
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];
        const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;
        await handleAuthUser(email, name, avatar);
      }
    });

    // Initial session check
    async function checkInitialSession() {
      if (isRealSupabaseConfigured() && !hasSyncedAuth.current) {
        const teacher = await getCurrentTeacher();
        if (teacher && isValidTeacherEmail(teacher.email)) {
          hasSyncedAuth.current = true;
          setTeacherSession(teacher);
          await upsertTeacherProfile(teacher);
        }
      }
    }
    checkInitialSession();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // 2. Check Shared Links
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
        {view === 'admin'         && <AdminView onExit={() => setView('teacher-auth')} />}
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
