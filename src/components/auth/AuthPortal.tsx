import React, { useState } from 'react';
import { Shield, GraduationCap, Sparkles, LogIn, ArrowRight, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase/config';
import { UserProfile } from '../../types';
import { FoxDetective } from '../mascot/FoxDetective';

interface AuthPortalProps {
  onAuthenticated: (user: UserProfile) => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onAuthenticated }) => {
  const [activePortal, setActivePortal] = useState<'student' | 'teacher' | 'admin'>('student');

  // Student credentials
  const [studentCode, setStudentCode] = useState('HS1A01');
  const [studentSecret, setStudentSecret] = useState('matkhau123');

  // Teacher / Admin credentials
  const [email, setEmail] = useState('giaovien1@thamtutoannhi.edu.vn');
  const [password, setPassword] = useState('MatKhauGiaoVien@123');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Demo Fill Helper
  const handleSelectDemoUser = (role: 'student' | 'teacher' | 'admin', preset: string) => {
    setActivePortal(role);
    setErrorMsg(null);
    if (role === 'student') {
      if (preset === '1A') {
        setStudentCode('HS1A01');
        setStudentSecret('matkhau123');
      } else if (preset === '2B') {
        setStudentCode('HS2B05');
        setStudentSecret('matkhau123');
      }
    } else if (role === 'teacher') {
      setEmail('giaovien1@thamtutoannhi.edu.vn');
      setPassword('MatKhauGiaoVien@123');
    } else {
      setEmail('admin@thamtutoannhi.edu.vn');
      setPassword('AdminBaoMat@123');
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!studentCode.trim() || !studentSecret.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Mã học sinh và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      // Call server student login endpoint which verifies against Firestore and creates/authenticates student token
      const res = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode: studentCode.trim().toUpperCase(),
          accessSecret: studentSecret.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Mã học sinh hoặc mật khẩu không chính xác.');
        return;
      }

      onAuthenticated(data.user);
    } catch (err) {
      console.error('Student login error:', err);
      setErrorMsg('Lỗi kết nối máy chủ xác thực.');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      // 1. First check if user exists in Firestore users collection
      const res = await fetch('/api/auth/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Email hoặc mật khẩu không đúng.');
        return;
      }

      onAuthenticated(data.user);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Lỗi kết nối máy chủ xác thực.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;

      // Check role in Firestore users
      const uDoc = await getDoc(doc(db, 'users', user.uid));
      if (uDoc.exists()) {
        onAuthenticated(uDoc.data() as UserProfile);
      } else {
        // Bootstrapped admin email check
        const isAdmin = user.email === 'AT.IT.K10@gmail.com';
        const newProfile: UserProfile = {
          id: user.uid,
          role: isAdmin ? 'admin' : 'teacher',
          displayName: user.displayName || 'Giáo viên',
          email: user.email || '',
          createdAt: new Date().toISOString(),
          dataOrigin: 'real',
          environmentTag: 'production',
        };
        await setDoc(doc(db, 'users', user.uid), newProfile);
        onAuthenticated(newProfile);
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setErrorMsg('Không thể đăng nhập bằng Google hoặc bạn đã hủy cửa sổ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50/50 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Banner */}
      <div className="max-w-6xl mx-auto w-full pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FoxDetective mood="happy" size="md" />
          <div>
            <span className="text-xs font-black uppercase text-sky-700 tracking-wider">
              Chương Trình GDPT 2018
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              THÁM TỬ TOÁN NHÍ
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 border border-sky-200 text-xs font-extrabold text-sky-800 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Mỗi lỗi sai – Một cơ hội khám phá</span>
        </div>
      </div>

      {/* Main Login Box */}
      <div className="max-w-md mx-auto w-full my-6 bg-white rounded-4xl border-4 border-sky-300 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-amber-200/50 -z-0" />

        {/* Portal Selection Tabs */}
        <div className="relative z-10 flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 mb-6 text-xs font-black">
          <button
            type="button"
            onClick={() => { setActivePortal('student'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activePortal === 'student'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🦊 Học Sinh
          </button>

          <button
            type="button"
            onClick={() => { setActivePortal('teacher'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activePortal === 'teacher'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Giáo Viên
          </button>

          <button
            type="button"
            onClick={() => { setActivePortal('admin'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activePortal === 'admin'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" /> Quản Trị
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. STUDENT LOGIN FORM */}
        {activePortal === 'student' && (
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div className="text-center mb-2">
              <h3 className="text-xl font-black text-slate-800">
                Cổng Học Sinh Vào Bàn Nhiệm Vụ
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Nhập Mã học sinh và Mật khẩu do thầy/cô cấp
              </p>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1.5">
                Mã Học Sinh
              </label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                placeholder="Ví dụ: HS1A01"
                className="w-full h-14 px-4 rounded-2xl border-3 border-slate-200 bg-slate-50 text-xl font-black text-sky-800 tracking-wider focus:bg-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1.5">
                Mật Khẩu Truy Cập
              </label>
              <input
                type="password"
                value={studentSecret}
                onChange={(e) => setStudentSecret(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 px-4 rounded-2xl border-3 border-slate-200 bg-slate-50 text-xl font-black text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-black text-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-200 transition-all active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang kiểm tra...
                </>
              ) : (
                <>
                  <span>Vào Phá Án Toán Học</span> <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. TEACHER & ADMIN LOGIN FORM */}
        {(activePortal === 'teacher' || activePortal === 'admin') && (
          <form onSubmit={handleTeacherAdminLogin} className="space-y-4">
            <div className="text-center mb-2">
              <h3 className="text-xl font-black text-slate-800">
                {activePortal === 'teacher' ? 'Cổng Giáo Viên Bộ Môn' : 'Cổng Quản Trị Hệ Thống'}
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Đăng nhập tài khoản định danh hoặc Google
              </p>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1.5">
                Email Tài Khoản
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="giaovien@thamtutoannhi.edu.vn"
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1.5">
                Mật Khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 rounded-xl text-white font-black text-base flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-60 ${
                activePortal === 'teacher' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang đăng nhập...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Đăng nhập
                </>
              )}
            </button>

            {activePortal === 'teacher' && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="w-full h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-extrabold border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Đăng nhập nhanh với Google
                </button>
              </div>
            )}
          </form>
        )}

        {/* Quick Demo Credentials Panel for Testers */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 text-center mb-2">
            🔑 Tài Khoản Thử Nghiệm Nhanh (Demo Preset):
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectDemoUser('student', '1A')}
              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer"
            >
              Học sinh 1A (HS1A01)
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoUser('student', '2B')}
              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer"
            >
              Học sinh 2B (HS2B05)
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoUser('teacher', '')}
              className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-bold cursor-pointer"
            >
              Giáo viên 1
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoUser('admin', '')}
              className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold cursor-pointer"
            >
              Quản trị viên
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 font-bold py-2">
        THÁM TỬ TOÁN NHÍ © 2026 • Nền tảng học Toán Lớp 1-2 ứng dụng AI phân tích mẫu lỗi và củng cố trực quan GDPT 2018.
      </footer>
    </div>
  );
};
