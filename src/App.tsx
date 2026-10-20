import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { AuthPortal } from './components/auth/AuthPortal';
import { StudentPortal } from './components/student/StudentPortal';
import { TeacherPortal } from './components/teacher/TeacherPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { testConnection } from './firebase/config';
import { verifyCurrentSession, clearAuthSession } from './lib/authSession';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function boot() {
      try {
        // Probe connectivity
        await testConnection();

        // Verify active token with backend
        const verifiedUser = await verifyCurrentSession();
        setCurrentUser(verifiedUser);
      } catch (err) {
        console.error('App boot error:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    boot();
  }, []);

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
        <div className="p-8 rounded-3xl bg-white border-2 border-sky-200 shadow-md flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-extrabold text-slate-700">
            Đang khởi động THÁM TỬ TOÁN NHÍ...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPortal onAuthenticated={handleAuthenticated} />;
  }

  if (currentUser.role === 'student') {
    return <StudentPortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === 'teacher') {
    return <TeacherPortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  if (currentUser.role === 'admin') {
    return <AdminPortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Fallback
  return <AuthPortal onAuthenticated={handleAuthenticated} />;
}
