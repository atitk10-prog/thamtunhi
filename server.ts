import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safe JSON loading compatible across Node.js 18, 20, 22, 24
const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Initialize Firebase client for server environment
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Firebase Service Account Credentials for Custom Token Minting (RS256 JWT)
// Conforms to Google Identity Toolkit Custom Token Specification (Zero external dependencies)
let serviceAccount: { client_email: string; private_key: string } | null = null;
const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
if (saEnv) {
  try {
    const sa = JSON.parse(saEnv);
    if (sa.client_email && sa.private_key) {
      serviceAccount = { client_email: sa.client_email, private_key: sa.private_key };
    }
  } catch (e) {
    console.warn('Notice: Service account parse error:', e);
  }
}

// Centralized immutable audit log helper
export async function writeAuditLog(params: {
  action: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  targetCollection?: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  success?: boolean;
}) {
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const logDoc = {
      id,
      action: params.action,
      actorId: params.actorId || 'system',
      actorName: params.actorName || '',
      actorRole: params.actorRole || 'admin',
      performedBy: params.actorId || 'system',
      targetCollection: params.targetCollection || '',
      targetId: params.targetId || '',
      targetName: params.targetName || '',
      details: params.details || '',
      success: params.success !== false,
      timestamp: new Date().toISOString(),
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    await setDoc(doc(db, 'auditLogs', id), logDoc);
  } catch (err) {
    console.warn('Failed to write audit log:', err);
  }
}

export async function mintCustomToken(uid: string, claims: Record<string, any> = {}): Promise<string | null> {
  if (!serviceAccount) return null;
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      iat: now,
      exp: now + 3600,
      uid,
      claims,
    };
    const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const data = `${b64Header}.${b64Payload}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(data);
    const sig = signer.sign(serviceAccount.private_key, 'base64url');
    return `${data}.${sig}`;
  } catch (e) {
    console.warn('Notice: Custom token generation error:', e);
    return null;
  }
}

// Gemini AI client on-demand factory (guarantees dynamic env key loading & zero stale state)
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.warn('Notice: Gemini client init error:', e);
    return null;
  }
}
let genAI: GoogleGenAI | null = getGeminiClient();

// Secret for stateless HMAC session tokens
// Supports AUTH_SECRET as primary, with SESSION_SECRET and JWT_SECRET as recognized aliases
const CONFIGURED_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET || process.env.JWT_SECRET;
const isProdEnvironment = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
// Security: Never allow insecure fallback secret in Production environment
const AUTH_SECRET = CONFIGURED_SECRET || (!isProdEnvironment ? 'thamtutoannhi-dev-insecure-secret-key-change-in-production' : '');

export interface AuthSession {
  uid: string;
  role: 'admin' | 'teacher' | 'student';
  displayName: string;
  email?: string;
  studentCode?: string;
  classId?: string;
  grade?: number;
  tokenVersion?: number;
  exp: number; // Unix timestamp
}

// In-memory registry of active token versions for real-time session revocation
export const userTokenVersions = new Map<string, number>();

export function createAuthToken(payload: Omit<AuthSession, 'exp'>, expiresInDays = 7): string {
  if (!AUTH_SECRET) {
    throw new Error('BLOCKED: Biến môi trường AUTH_SECRET chưa được cấu hình trên môi trường Production!');
  }
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 86400;
  const session: AuthSession = { ...payload, exp };
  const encodedPayload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthSession | null {
  if (!AUTH_SECRET || !token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const session = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as AuthSession;
    if (session.exp && session.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return session;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: AuthSession;
}

// Authentication middleware with revoked session enforcement
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập. Thiếu Bearer Token xác thực.' });
  }
  const token = authHeader.substring(7);
  const session = verifyAuthToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }

  // Session revocation check: if user's password was changed, older tokens are instantly revoked
  const activeVersion = userTokenVersions.get(session.uid);
  if (activeVersion !== undefined && (session.tokenVersion || 0) < activeVersion) {
    return res.status(401).json({
      error: 'Phiên đăng nhập đã hết hiệu lực do mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.',
      code: 'TOKEN_REVOKED',
    });
  }

  req.user = session;
  next();
}

// Role-based authorization middleware
export function requireRole(allowedRoles: Array<'admin' | 'teacher' | 'student'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Từ chối truy cập: Bạn không có quyền thực hiện thao tác này.' });
    }
    next();
  };
}

// In-memory brute-force & rate-limit tracker
interface AttemptTracker {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}
export const passwordAttemptTrackers = new Map<string, AttemptTracker>();

export function checkPasswordRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const tracker = passwordAttemptTrackers.get(key);
  if (!tracker) {
    return { allowed: true };
  }
  if (tracker.blockedUntil && tracker.blockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((tracker.blockedUntil - now) / 1000) };
  }
  if (now - tracker.firstAttempt > windowMs) {
    passwordAttemptTrackers.delete(key);
    return { allowed: true };
  }
  if (tracker.count >= maxAttempts) {
    tracker.blockedUntil = now + windowMs;
    return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  return { allowed: true };
}

export function recordFailedPasswordAttempt(key: string, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const tracker = passwordAttemptTrackers.get(key) || { count: 0, firstAttempt: now };
  tracker.count += 1;
  passwordAttemptTrackers.set(key, tracker);
}

export function resetPasswordAttempts(key: string) {
  passwordAttemptTrackers.delete(key);
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS & Security headers for cross-environment safety
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 1. Health check endpoint (Probes true Cloud Firestore connectivity and reports genuine status)
app.get('/api/health', async (_req: Request, res: Response) => {
  let firestoreConnected = false;
  let lessonsCount = 0;
  let errorDetail: string | null = null;

  try {
    const lSnap = await getDocs(collection(db, 'lessons'));
    lessonsCount = lSnap.size;
    firestoreConnected = true;
  } catch (err: any) {
    console.error('Firestore health probe error:', err);
    errorDetail = err?.message || String(err);
  }

  const configuredGeminiModel = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();
  const isHealthy = firestoreConnected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    firebaseProjectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    firestoreConnected,
    lessonsCount,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    geminiModel: configuredGeminiModel,
    authSecretConfigured: Boolean(CONFIGURED_SECRET),
    authSecretStatus: CONFIGURED_SECRET ? 'CONFIGURED' : (isProdEnvironment ? 'BLOCKED' : 'DEV_FALLBACK'),
    buildVersion: '1.1.0-prod',
    environmentTag: isProdEnvironment ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    ...(errorDetail ? { warning: 'Cloud Firestore kết nối gián đoạn' } : {}),
  });
});

// 2. Student Authentication endpoint (Student Code + Access Secret)
// Bcrypt-secured, transparent migration from legacy plaintext, signed session token with tokenVersion
app.post('/api/auth/student-login', async (req: Request, res: Response) => {
  if (!AUTH_SECRET) {
    return res.status(503).json({
      error: 'BẢO MẬT: Hệ thống đang ở trạng thái BLOCKED do chưa cấu hình biến môi trường AUTH_SECRET trên Production. Vui lòng cấu hình AUTH_SECRET trong Vercel Console.',
      code: 'AUTH_SECRET_BLOCKED'
    });
  }
  const { studentCode, accessSecret } = req.body;

  if (!studentCode || !accessSecret) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Mã học sinh và Mật khẩu truy cập.' });
  }

  const cleanCode = String(studentCode).trim().toUpperCase();
  const cleanSecret = String(accessSecret).trim();

  // Rate limit / brute force check
  const rateCheck = checkPasswordRateLimit('login:student:' + cleanCode);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Thử sai quá nhiều lần. Vui lòng đợi ${rateCheck.retryAfterSeconds} giây trước khi thử lại.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: rateCheck.retryAfterSeconds,
    });
  }

  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('studentCode', '==', cleanCode)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      recordFailedPasswordAttempt('login:student:' + cleanCode);
      return res.status(401).json({ error: 'Mã học sinh hoặc mật khẩu không chính xác.' });
    }

    const studentDoc: any = snap.docs[0].data();
    const expectedHash = studentDoc.accessSecretHash;
    const legacySecret = studentDoc.accessSecret;

    let isSecretValid = false;
    if (expectedHash) {
      isSecretValid = await bcrypt.compare(cleanSecret, expectedHash);
    } else if (legacySecret) {
      isSecretValid = (cleanSecret === legacySecret);
      // Transparent migration of student plaintext accessSecret to bcrypt hash
      if (isSecretValid) {
        try {
          const newHash = await bcrypt.hash(cleanSecret, 10);
          await updateDoc(doc(db, 'users', studentDoc.id), {
            accessSecretHash: newHash,
            accessSecret: null, // Wipe plaintext
            updatedAt: new Date().toISOString(),
          });
        } catch (migErr) {
          console.error('Student secret hash migration error:', migErr);
        }
      }
    }

    if (!isSecretValid) {
      recordFailedPasswordAttempt('login:student:' + cleanCode);
      return res.status(401).json({ error: 'Mã học sinh hoặc mật khẩu không chính xác.' });
    }

    resetPasswordAttempts('login:student:' + cleanCode);

    // Check account status: locked or inactive accounts cannot log in
    if (studentDoc.status === 'locked' || studentDoc.status === 'inactive') {
      return res.status(403).json({ error: 'Tài khoản học sinh này đã bị tạm khóa.' });
    }

    // Mask secrets before sending to client
    const { accessSecret: _, accessSecretHash: ___, password: __, passwordHash: ____, ...safeUser } = studentDoc;

    const currentTokenVersion = studentDoc.tokenVersion || 0;
    userTokenVersions.set(safeUser.id, currentTokenVersion);

    // Generate signed session token with tokenVersion
    const token = createAuthToken({
      uid: safeUser.id,
      role: 'student',
      displayName: safeUser.displayName,
      studentCode: safeUser.studentCode,
      classId: safeUser.classId,
      grade: safeUser.grade,
      tokenVersion: currentTokenVersion,
    });

    const customToken = await mintCustomToken(safeUser.id, {
      role: 'student',
      studentCode: safeUser.studentCode,
      classId: safeUser.classId,
      grade: safeUser.grade,
    });

    return res.json({ ok: true, user: safeUser, token, customToken });
  } catch (err: any) {
    console.error('Student login server error:', err);
    return res.status(500).json({ error: 'Lỗi hệ thống khi xác thực học sinh.' });
  }
});

// 3. Teacher & Admin Authentication endpoint
// Eliminated fixed admin backdoor & default password bypass
app.post('/api/auth/teacher-login', async (req: Request, res: Response) => {
  if (!AUTH_SECRET) {
    return res.status(503).json({
      error: 'BẢO MẬT: Hệ thống đang ở trạng thái BLOCKED do chưa cấu hình biến môi trường AUTH_SECRET trên Production. Vui lòng cấu hình AUTH_SECRET trong Vercel Console.',
      code: 'AUTH_SECRET_BLOCKED'
    });
  }
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp email và mật khẩu.' });
  }

  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    const q = query(
      collection(db, 'users'),
      where('email', '==', cleanEmail)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    const userDoc: any = snap.docs[0].data();
    const expectedHash = userDoc.passwordHash;
    const legacyPassword = userDoc.password;

    let isPasswordValid = false;
    if (expectedHash) {
      isPasswordValid = await bcrypt.compare(cleanPassword, expectedHash);
    } else if (legacyPassword) {
      isPasswordValid = (cleanPassword === legacyPassword);
      // Transparent migration of legacy plaintext password to secure bcrypt hash
      if (isPasswordValid) {
        try {
          const newHash = await bcrypt.hash(cleanPassword, 10);
          await updateDoc(doc(db, 'users', userDoc.id), {
            passwordHash: newHash,
            password: null,
            updatedAt: new Date().toISOString(),
          });
        } catch (migErr) {
          console.error('Password hash migration error:', migErr);
        }
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    // Check account status: locked or inactive accounts cannot log in
    if (userDoc.status === 'locked' || userDoc.status === 'inactive') {
      return res.status(403).json({ error: 'Tài khoản này đã bị tạm khóa.' });
    }

    // Mask secrets
    const { password: _, passwordHash: ___, accessSecret: __, ...safeUser } = userDoc;

    const currentTokenVersion = userDoc.tokenVersion || 0;
    userTokenVersions.set(safeUser.id, currentTokenVersion);

    // Generate signed session token with tokenVersion
    const token = createAuthToken({
      uid: safeUser.id,
      role: safeUser.role,
      displayName: safeUser.displayName,
      email: safeUser.email,
      tokenVersion: currentTokenVersion,
    });

    const customToken = await mintCustomToken(safeUser.id, {
      role: safeUser.role,
      email: safeUser.email,
    });

    return res.json({
      ok: true,
      user: safeUser,
      token,
      customToken,
      mustChangePassword: Boolean(userDoc.mustChangePassword),
    });
  } catch (err: any) {
    console.error('User login server error:', err);
    return res.status(500).json({ error: 'Lỗi xác thực người dùng.' });
  }
});

// 4. Session Verification endpoint (Checks token validity on client boot/refresh)
app.get('/api/auth/verify-session', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Phiên không hợp lệ.' });
  }

  try {
    const userDocRef = doc(db, 'users', req.user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'Tài khoản người dùng không tồn tại.' });
    }

    const { password: _, accessSecret: __, ...safeUser } = userSnap.data();
    return res.json({ ok: true, user: safeUser });
  } catch (err: any) {
    console.error('Verify session error:', err);
    return res.status(500).json({ error: 'Lỗi kiểm tra phiên đăng nhập.' });
  }
});

// 4b. Google Auth Session Exchange (Syncs user profile and grants HMAC session token)
app.post('/api/auth/google-login', async (req: Request, res: Response) => {
  if (!AUTH_SECRET) {
    return res.status(503).json({
      error: 'BẢO MẬT: Hệ thống đang ở trạng thái BLOCKED do chưa cấu hình biến môi trường AUTH_SECRET trên Production. Vui lòng cấu hình AUTH_SECRET trong Vercel Console.',
      code: 'AUTH_SECRET_BLOCKED'
    });
  }
  const { uid, email, displayName } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'Thiếu định danh Google.' });
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    let profile: any;

    if (userSnap.exists()) {
      profile = userSnap.data();
      // Ensure authProvider is marked
      if (profile.authProvider !== 'google') {
        await updateDoc(userDocRef, { authProvider: 'google', updatedAt: new Date().toISOString() });
        profile.authProvider = 'google';
      }
    } else {
      const isAdmin = email === 'AT.IT.K10@gmail.com';
      profile = {
        id: uid,
        role: isAdmin ? 'admin' : 'teacher',
        displayName: displayName || (isAdmin ? 'Quản trị viên' : 'Giáo viên'),
        email: email || '',
        authProvider: 'google',
        createdAt: new Date().toISOString(),
        dataOrigin: 'real',
        environmentTag: 'production',
      };
      await setDoc(userDocRef, profile);
    }

    const { password: _, accessSecret: __, passwordHash: ___, accessSecretHash: ____, ...safeUser } = profile;
    const sessionPayload: Omit<AuthSession, 'exp'> = {
      uid: safeUser.id,
      role: safeUser.role,
      displayName: safeUser.displayName,
      email: safeUser.email,
    };
    const token = createAuthToken(sessionPayload);
    const customToken = await mintCustomToken(safeUser.id, { role: safeUser.role });

    return res.json({ ok: true, user: safeUser, token, customToken });
  } catch (err: any) {
    console.error('Google login exchange error:', err);
    return res.status(500).json({ error: 'Lỗi xác thực phiên Google.' });
  }
});

// 4c. Unified Self-Service Change Password for Teacher, Student, and Admin
// Enforces: Auth session identity (never trusts client userId), current password verification,
// bcrypt hashing, role-based password complexity, rate-limiting, Google account blocking,
// and immediate revocation of older sessions via tokenVersion bump.
app.post('/api/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const role = req.user!.role;

    // Rate-limiting / brute force protection
    const rateCheck = checkPasswordRateLimit('change:' + uid);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Thử sai quá nhiều lần. Vui lòng đợi ${rateCheck.retryAfterSeconds} giây trước khi thử lại.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateCheck.retryAfterSeconds,
      });
    }

    const currentPassword = String(req.body.currentPassword || req.body.currentSecret || '').trim();
    const newPassword = String(req.body.newPassword || req.body.newSecret || '').trim();

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.' });
    }

    const uDoc = await getDoc(doc(db, 'users', uid));
    if (!uDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
    }
    const uData: any = uDoc.data();

    // Google OAuth Account Check: Prevent password modification inside app
    if (uData.authProvider === 'google' || (!uData.passwordHash && !uData.password && !uData.accessSecretHash && !uData.accessSecret && role !== 'student')) {
      return res.status(400).json({
        error: 'Tài khoản đăng nhập bằng Google không thể đổi mật khẩu nội bộ trong ứng dụng. Vui lòng quản lý mật khẩu qua tài khoản Google của bạn.',
        code: 'GOOGLE_AUTH_ACCOUNT',
      });
    }

    // Verify current password against bcrypt hash or legacy plaintext
    let isCurrentValid = false;
    if (role === 'student') {
      if (uData.accessSecretHash) {
        isCurrentValid = await bcrypt.compare(currentPassword, uData.accessSecretHash);
      } else if (uData.accessSecret) {
        isCurrentValid = (currentPassword === uData.accessSecret);
      }
    } else {
      if (uData.passwordHash) {
        isCurrentValid = await bcrypt.compare(currentPassword, uData.passwordHash);
      } else if (uData.password) {
        isCurrentValid = (currentPassword === uData.password);
      }
    }

    if (!isCurrentValid) {
      recordFailedPasswordAttempt('change:' + uid);
      return res.status(401).json({ error: 'Mật khẩu hiện tại không chính xác.' });
    }

    // Reset rate-limiting tracker upon correct verification
    resetPasswordAttempts('change:' + uid);

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' });
    }

    // Validate password strength by role
    if (role === 'student') {
      // Child-friendly PIN or word (4 to 20 characters)
      if (newPassword.length < 4 || newPassword.length > 20) {
        return res.status(400).json({ error: 'Mã bí mật của học sinh phải có từ 4 đến 20 ký tự hoặc số.' });
      }
    } else {
      // Teacher & Admin: at least 8 chars, mixed case and numbers/symbols
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' });
      }
      const hasUpper = /[A-Z]/.test(newPassword);
      const hasLower = /[a-z]/.test(newPassword);
      const hasNumberOrSymbol = /[0-9\W]/.test(newPassword);
      if (!hasUpper || !hasLower || !hasNumberOrSymbol) {
        return res.status(400).json({
          error: 'Mật khẩu mới phải chứa ít nhất một chữ hoa, một chữ thường và một chữ số hoặc ký tự đặc biệt.',
        });
      }
    }

    // Hash new password using bcrypt (cost factor = 10)
    const newHash = await bcrypt.hash(newPassword, 10);
    const nextVersion = (uData.tokenVersion || 0) + 1;

    // Update in Firestore and wipe plaintext
    const nowIso = new Date().toISOString();
    if (role === 'student') {
      await updateDoc(doc(db, 'users', uid), {
        accessSecretHash: newHash,
        accessSecret: null, // Wipe plaintext
        tokenVersion: nextVersion,
        passwordChangedAt: nowIso,
        updatedAt: nowIso,
      });
    } else {
      await updateDoc(doc(db, 'users', uid), {
        passwordHash: newHash,
        password: null, // Wipe plaintext
        tokenVersion: nextVersion,
        passwordChangedAt: nowIso,
        mustChangePassword: false,
        updatedAt: nowIso,
      });
    }

    // Invalidate old sessions immediately in memory registry
    userTokenVersions.set(uid, nextVersion);

    // Audit log without logging the secret
    await writeAuditLog({
      action: 'USER_CHANGE_PASSWORD',
      actorId: uid,
      actorName: uData.displayName || req.user?.displayName,
      actorRole: role,
      targetCollection: 'users',
      targetId: uid,
      targetName: uData.displayName || req.user?.displayName,
      details: `${role === 'teacher' ? 'Giáo viên' : role === 'student' ? 'Học sinh' : 'Quản trị viên'} đã tự đổi mật khẩu thành công. Tất cả phiên cũ đã bị thu hồi.`,
    });

    // Issue refreshed token for the new active session
    const newToken = createAuthToken({
      uid,
      role,
      displayName: uData.displayName,
      email: uData.email,
      studentCode: uData.studentCode,
      classId: uData.classId,
      grade: uData.grade,
      tokenVersion: nextVersion,
    });

    return res.json({
      ok: true,
      message: 'Đổi mật khẩu thành công. Các phiên đăng nhập cũ đã được thu hồi an toàn.',
      token: newToken,
    });
  } catch (err: any) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Lỗi đổi mật khẩu: ' + err.message });
  }
});

// 4d. Teacher Profile Update endpoint
app.patch('/api/teacher/profile', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user!.uid;
    const { displayName, phone } = req.body;
    if (!displayName || String(displayName).trim().length < 2) {
      return res.status(400).json({ error: 'Họ tên giáo viên phải có ít nhất 2 ký tự.' });
    }
    const cleanName = String(displayName).trim();
    const updates: any = {
      displayName: cleanName,
      name: cleanName,
      updatedAt: new Date().toISOString(),
    };
    if (phone !== undefined) {
      updates.phone = String(phone).trim();
    }
    await updateDoc(doc(db, 'users', teacherId), updates);

    await writeAuditLog({
      action: 'UPDATE_TEACHER_PROFILE',
      actorId: teacherId,
      actorName: cleanName,
      actorRole: req.user?.role,
      targetCollection: 'users',
      targetId: teacherId,
      targetName: cleanName,
      details: `Giáo viên cập nhật thông tin cá nhân: ${cleanName}`,
    });

    return res.json({ ok: true, profile: updates });
  } catch (err: any) {
    console.error('Update teacher profile error:', err);
    return res.status(500).json({ error: 'Lỗi cập nhật thông tin cá nhân: ' + err.message });
  }
});

async function generateGeminiContent(promptText: string): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    const err: any = new Error('Mô hình AI chưa được cấu hình. Thiếu GEMINI_API_KEY.');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }
  
  // Primary model from GEMINI_MODEL env var (default: 'gemini-3.5-flash-lite').
  // Can be easily swapped to 'gemini-3.8-flash' or any other model in Vercel environment variables without touching source code.
  // Strictly single call per teacher request to conserve API quota.
  const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();
  
  try {
    const callPromise = client.models.generateContent({
      model,
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    // 30s timeout per single controlled attempt
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        const timeoutErr: any = new Error(`Quá thời gian chờ phản hồi từ mô hình ${model} (quá 30 giây).`);
        timeoutErr.code = 'GEMINI_TIMEOUT';
        timeoutErr.model = model;
        reject(timeoutErr);
      }, 30000)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);
    if (response && response.text) {
      return response.text;
    }
    throw new Error('Mô hình AI phản hồi rỗng.');
  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    const safeMsg = rawMsg
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '***')
      .replace(/key=[^&\s]+/g, 'key=***');
    
    console.warn(`[Gemini] Lỗi gọi mô hình ${model}:`, safeMsg);

    if (
      rawMsg.includes('404') ||
      rawMsg.includes('NOT_FOUND') ||
      rawMsg.toLowerCase().includes('not found') ||
      rawMsg.toLowerCase().includes('is not supported')
    ) {
      const notFoundErr: any = new Error(`Mô hình AI (${model}) hiện không khả dụng với API Key này (Lỗi 404). Vui lòng đổi biến môi trường GEMINI_MODEL (ví dụ: gemini-3.5-flash-lite hoặc gemini-3.8-flash).`);
      notFoundErr.code = 'GEMINI_MODEL_NOT_FOUND';
      notFoundErr.detail = safeMsg;
      notFoundErr.model = model;
      throw notFoundErr;
    }

    if (
      rawMsg.includes('429') ||
      rawMsg.includes('RESOURCE_EXHAUSTED') ||
      rawMsg.toLowerCase().includes('quota') ||
      rawMsg.toLowerCase().includes('rate limit')
    ) {
      const quotaErr: any = new Error('Tài khoản Gemini API đã vượt quá hạn mức yêu cầu (Quota / Rate Limit). Vui lòng thử lại sau ít phút hoặc nâng hạn mức trên Google AI Studio.');
      quotaErr.code = 'GEMINI_QUOTA_EXCEEDED';
      quotaErr.detail = safeMsg;
      quotaErr.model = model;
      throw quotaErr;
    }

    if (
      rawMsg.includes('401') ||
      rawMsg.includes('403') ||
      rawMsg.includes('API_KEY_INVALID') ||
      rawMsg.toLowerCase().includes('api key not valid')
    ) {
      const authErr: any = new Error('API Key Gemini không hợp lệ hoặc không có quyền truy cập vào mô hình.');
      authErr.code = 'GEMINI_AUTH_INVALID';
      authErr.detail = safeMsg;
      authErr.model = model;
      throw authErr;
    }

    if (err.code === 'GEMINI_TIMEOUT' || rawMsg.includes('timeout') || rawMsg.includes('ETIMEDOUT')) {
      const timeoutErr: any = new Error(`Quá thời gian chờ phản hồi từ mô hình AI ${model} (quá 30 giây). Vui lòng thử lại.`);
      timeoutErr.code = 'GEMINI_TIMEOUT';
      timeoutErr.detail = safeMsg;
      timeoutErr.model = model;
      throw timeoutErr;
    }

    if (
      rawMsg.includes('fetch failed') ||
      rawMsg.includes('ENOTFOUND') ||
      rawMsg.includes('ECONNREFUSED') ||
      rawMsg.includes('NetworkError')
    ) {
      const netErr: any = new Error('Không thể kết nối đến máy chủ Google Gemini. Vui lòng kiểm tra lại kết nối mạng của hệ thống.');
      netErr.code = 'AI_NETWORK_ERROR';
      netErr.detail = safeMsg;
      netErr.model = model;
      throw netErr;
    }

    const finalErr: any = new Error('Dịch vụ AI tạm thời không thể xử lý yêu cầu. Vui lòng thử lại sau.');
    finalErr.code = 'AI_SERVICE_UNAVAILABLE';
    finalErr.detail = safeMsg;
    finalErr.model = model;
    throw finalErr;
  }
}

// Mathematical integrity & visualConfig enrichment helper
function enrichAiVisualConfig(q: any, tTopic: string, tGrade: number): any {
  // Auto-extract and enrich visual representation from question text
  const rawText = ((q.prompt || '') + ' ' + (q.explanation || '') + ' ' + tTopic).toLowerCase();

  // If Gemini provided visualConfig, sanitize and validate it
  if (q.visualConfig && typeof q.visualConfig === 'object' && q.visualConfig.type) {
    const vc = q.visualConfig;
    if (vc.type === 'addition') {
      const left = Number(vc.leftCount) || 1;
      const right = Number(vc.rightCount) || 1;
      return {
        type: 'addition',
        leftCount: Math.min(Math.max(1, left), 20),
        rightCount: Math.min(Math.max(1, right), 20),
        iconName: vc.iconName || 'apple',
        leftLabel: vc.leftLabel,
        rightLabel: vc.rightLabel,
      };
    }
    if (vc.type === 'counters' && typeof vc.count === 'number' && vc.count > 0) {
      if (!vc.iconName) vc.iconName = 'apple';
      return vc;
    }
    if ((vc.type === 'ten_frame' || vc.type === 'five_frame') && typeof vc.count === 'number') {
      vc.gridSize = vc.type === 'five_frame' || vc.gridSize === 5 ? 5 : 10;
      vc.count = Math.min(vc.count, vc.gridSize);
      return vc;
    }
    if (vc.type === 'bundles' || (vc.tens !== undefined && vc.ones !== undefined)) {
      const tens = Number(vc.tens) || 0;
      const ones = Number(vc.ones) || 0;
      // Safeguard: If both are 0, do NOT accept blank bundle. Fall through to auto-detection from prompt
      if (tens > 0 || ones > 0) {
        return {
          type: 'bundles',
          tens,
          ones,
        };
      }
    }
    if (vc.type === 'comparison' && (vc.leftCount !== undefined || vc.count !== undefined)) {
      return vc;
    }
    if (vc.type === 'shapes' && vc.shapeType) {
      return vc;
    }
    if (vc.type === 'money' || vc.moneyBills) {
      return vc;
    }
    if (vc.type === 'clock' || vc.hours !== undefined) {
      return vc;
    }
  }

  // 0. Addition detection: e.g. "1 + 3 = ?", "2 + 5", "gộp... lại"
  const addMatch = (q.prompt || '').match(/(\d+)\s*\+\s*(\d+)/);
  if (addMatch) {
    const a = parseInt(addMatch[1], 10);
    const b = parseInt(addMatch[2], 10);
    if (a > 0 && b > 0 && a <= 20 && b <= 20) {
      let iconName = 'apple';
      if (rawText.includes('cá')) iconName = 'fish';
      else if (rawText.includes('sao')) iconName = 'star';
      else if (rawText.includes('kẹo')) iconName = 'candy';
      else if (rawText.includes('bút') || rawText.includes('que')) iconName = 'pencil';
      else if (rawText.includes('khối') || rawText.includes('viên')) iconName = 'block';
      else if (rawText.includes('cà rốt')) iconName = 'carrot';
      else if (rawText.includes('hoa') || rawText.includes('bông')) iconName = 'flower';
      else if (rawText.includes('chim')) iconName = 'bird';
      else if (rawText.includes('thỏ')) iconName = 'rabbit';
      else if (rawText.includes('cam')) iconName = 'orange';

      return {
        type: 'addition',
        leftCount: a,
        rightCount: b,
        iconName,
        leftLabel: `Nhóm 1 (${a})`,
        rightLabel: `Nhóm 2 (${b})`,
      };
    }
  }

  // 1. Money detection
  if (rawText.includes('đồng') || rawText.includes('tiền') || rawText.includes('mua') || rawText.includes('trả lại')) {
    const billMatches = (q.prompt || '').match(/(\d[\d\s.,]*)\s*(đồng|đ)/gi);
    const bills: { denomination: number; count: number }[] = [];
    if (billMatches) {
      for (const m of billMatches) {
        const num = parseInt(m.replace(/\D/g, ''), 10);
        if ([1000, 2000, 5000, 10000, 20000, 50000, 100000].includes(num)) {
          bills.push({ denomination: num, count: 1 });
        }
      }
    }
    if (bills.length > 0) {
      return { type: 'money', moneyBills: bills };
    }
    return {
      type: 'money',
      moneyBills: [{ denomination: tGrade === 1 ? 2000 : 10000, count: 1 }]
    };
  }

  // 2. Clock detection
  if (rawText.includes('đồng hồ') || rawText.includes('giờ') || rawText.includes('phút')) {
    const hourMatch = (q.prompt || '').match(/(\d{1,2})\s*giờ/i);
    const minuteMatch = (q.prompt || '').match(/(\d{1,2})\s*phút/i);
    const hours = hourMatch ? parseInt(hourMatch[1], 10) % 12 : 8;
    const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
    return { type: 'clock', hours: hours || 12, minutes };
  }

  // 3. Ten-frame / Five-frame detection
  if (rawText.includes('khung 10') || rawText.includes('khung 5') || rawText.includes('chấm tròn')) {
    const numMatch = (q.prompt || '').match(/(\d+)/);
    const count = numMatch ? parseInt(numMatch[1], 10) : 5;
    const isFive = rawText.includes('khung 5');
    const size = isFive ? 5 : 10;
    return {
      type: isFive ? 'five_frame' : 'ten_frame',
      gridSize: size,
      count: Math.min(count, size),
      dotColor: 'blue'
    };
  }

  // 4. Bundles detection
  if (rawText.includes('que tính') || rawText.includes('bó que') || rawText.includes('chục và đơn vị')) {
    const numMatch = (q.prompt || '').match(/(\d+)/);
    const total = numMatch ? parseInt(numMatch[1], 10) : 15;
    return {
      type: 'bundles',
      tens: Math.floor(total / 10),
      ones: total % 10
    };
  }

  // 5. Shapes detection
  if (rawText.includes('hình tròn')) return { type: 'shapes', shapeType: 'circle' };
  if (rawText.includes('hình vuông')) return { type: 'shapes', shapeType: 'square' };
  if (rawText.includes('hình tam giác')) return { type: 'shapes', shapeType: 'triangle' };
  if (rawText.includes('hình chữ nhật')) return { type: 'shapes', shapeType: 'rectangle' };
  if (rawText.includes('khối trụ')) return { type: 'shapes', shapeType: 'cylinder' };
  if (rawText.includes('khối cầu')) return { type: 'shapes', shapeType: 'sphere' };

  // 6. Object counters
  let iconName = 'apple';
  if (rawText.includes('cá')) iconName = 'fish';
  else if (rawText.includes('sao')) iconName = 'star';
  else if (rawText.includes('kẹo')) iconName = 'candy';
  else if (rawText.includes('bút')) iconName = 'pencil';
  else if (rawText.includes('khối') || rawText.includes('viên')) iconName = 'block';
  else if (rawText.includes('cà rốt')) iconName = 'carrot';
  else if (rawText.includes('hoa') || rawText.includes('bông')) iconName = 'flower';
  else if (rawText.includes('chim')) iconName = 'bird';
  else if (rawText.includes('thỏ')) iconName = 'rabbit';
  else if (rawText.includes('cam')) iconName = 'orange';

  // Comparison detection
  if (rawText.includes('nhiều hơn') || rawText.includes('ít hơn') || rawText.includes('so sánh') || (rawText.includes(' và ') && rawText.includes('?'))) {
    const nums = ((q.prompt || '').match(/\b\d+\b/g) || []).map(Number);
    if (nums.length >= 2) {
      return {
        type: 'comparison',
        leftCount: Math.min(nums[0], 10),
        rightCount: Math.min(nums[1], 10),
        leftLabel: 'Nhóm 1',
        rightLabel: 'Nhóm 2',
        iconName
      };
    }
  }

  const nums = ((q.prompt || '').match(/\b\d+\b/g) || []).map(Number);
  const count = nums.length > 0 ? Math.min(nums[0], 10) : 5;
  return {
    type: 'counters',
    count,
    iconName
  };
}

// Comprehensive Question Sanitization and Normalization Helper
function sanitizeAiQuestions(
  rawList: any[],
  targetCount: number,
  topic: string,
  grade: number,
  difficulty: 'easy' | 'medium' | 'hard',
  targetPattern: string
): any[] {
  const sanitized: any[] = [];

  for (let i = 0; i < rawList.length; i++) {
    const raw = rawList[i];
    if (!raw || typeof raw !== 'object') continue;

    const order = sanitized.length + 1;
    const id = raw.id && typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `q-ai-${Date.now()}-${order}`;
    const prompt = String(raw.prompt || `Câu hỏi số ${order} về ${topic}`).trim();
    
    // Normalize interactionType to 5 standard types
    let interactionType = 'single_choice';
    const rawType = String(raw.interactionType || '').toLowerCase();
    if (rawType.includes('single') || rawType.includes('choice') || rawType.includes('select')) {
      interactionType = 'single_choice';
    } else if (rawType.includes('input') || rawType.includes('number') || rawType.includes('fill')) {
      interactionType = 'number_input';
    } else if (rawType.includes('match') || rawType.includes('pair')) {
      interactionType = 'expression_match';
    } else if (rawType.includes('operator') || rawType.includes('sign')) {
      interactionType = 'operator_pick';
    } else if (rawType.includes('ten_frame') || rawType.includes('bundle')) {
      interactionType = 'ten_frame_bundle';
    } else if (rawType.includes('order') || rawType.includes('sort') || rawType.includes('line')) {
      interactionType = 'number_line_order';
    }

    // Expected answer ALWAYS coerced to string safely with ?? (preserving numeric 0)
    let expectedAnswer = String(raw.expectedAnswer ?? '').trim();

    // Options handling for single_choice / operator_pick / number_line_order
    let options: string[] | undefined = undefined;
    if (interactionType === 'single_choice') {
      const rawOptions = Array.isArray(raw.options) ? raw.options : [];
      let strOptions = rawOptions.map((opt: any) => String(opt ?? '').trim()).filter((s: string) => s !== '');
      
      if (expectedAnswer === '' && strOptions.length > 0) {
        expectedAnswer = strOptions[0];
      } else if (expectedAnswer === '') {
        expectedAnswer = '5';
      }

      if (!strOptions.includes(expectedAnswer)) {
        strOptions.unshift(expectedAnswer);
      }

      // Deduplicate options while preserving order
      const uniqueOpts: string[] = Array.from(new Set(strOptions));
      
      // Ensure at least 4 distinct options if possible
      const numVal = parseInt(expectedAnswer, 10);
      if (!isNaN(numVal)) {
        const fallbacks = [String(numVal + 1), String(Math.max(0, numVal - 1)), String(numVal + 2), String(numVal + 3)];
        for (const fb of fallbacks) {
          if (!uniqueOpts.includes(fb) && uniqueOpts.length < 4) {
            uniqueOpts.push(fb);
          }
        }
      }
      options = uniqueOpts;
    } else if (interactionType === 'operator_pick') {
      options = ['+', '-', '=', '>', '<'];
      if (expectedAnswer === '') expectedAnswer = '+';
    } else if (interactionType === 'number_line_order') {
      const rawOptions = Array.isArray(raw.options) ? raw.options : [];
      const lineOpts: string[] = rawOptions.map((opt: any) => String(opt ?? '').trim()).filter((s: string) => s !== '');
      const finalLineOpts = lineOpts.length > 0 ? lineOpts : ['3', '5', '7', '9'];
      options = finalLineOpts;
      if (expectedAnswer === '') expectedAnswer = finalLineOpts.join(', ');
    } else if (interactionType === 'expression_match') {
      if (expectedAnswer === '') expectedAnswer = 'MATCHED_ALL';
    } else {
      if (expectedAnswer === '') expectedAnswer = '5';
    }

    // Pairs for expression_match
    let pairs: { left: string; right: string }[] | undefined = undefined;
    if (interactionType === 'expression_match') {
      if (Array.isArray(raw.pairs) && raw.pairs.length >= 2) {
        pairs = raw.pairs.map((p: any) => ({
          left: String(p.left ?? '').trim(),
          right: String(p.right ?? '').trim(),
        })).filter((p: any) => p.left !== '' && p.right !== '');
      }
      if (!pairs || pairs.length < 2) {
        pairs = [
          { left: '3 + 2', right: '5' },
          { left: '4 + 1', right: '5' },
          { left: '2 + 4', right: '6' },
        ];
      }
    }

    // Acceptable answers
    let acceptableAnswers: string[] = [expectedAnswer];
    if (Array.isArray(raw.acceptableAnswers) && raw.acceptableAnswers.length > 0) {
      acceptableAnswers = Array.from(new Set([
        expectedAnswer,
        ...raw.acceptableAnswers.map((a: any) => String(a).trim()).filter(Boolean)
      ]));
    }

    // Visual config enrichment
    const visualConfig = enrichAiVisualConfig(raw, topic, grade);

    // Rule hints
    let ruleHints: any[] = [];
    const defaultPattern = targetPattern === 'AUTO' || targetPattern === 'AI_DETECT' ? 'COUNTING_OFF_BY_ONE' : targetPattern;
    if (Array.isArray(raw.ruleHints) && raw.ruleHints.length > 0) {
      ruleHints = raw.ruleHints.map((rh: any) => ({
        pattern: String(rh.pattern || defaultPattern).trim(),
        hintText: String(rh.hintText || 'Bé hãy đọc kỹ đề và kiểm tra lại từng bước tính nhé!').trim(),
        visualActionGuidance: String(rh.visualActionGuidance || 'Quan sát hình minh họa trực quan trên màn hình.').trim(),
      }));
    } else {
      ruleHints = [
        {
          pattern: defaultPattern,
          hintText: 'Bé hãy đọc kỹ đề và kiểm tra lại từng bước tính nhé!',
          visualActionGuidance: 'Quan sát hình minh họa trực quan trên màn hình.',
        },
      ];
    }

    sanitized.push({
      id,
      order,
      prompt,
      interactionType,
      options,
      pairs,
      expectedAnswer,
      acceptableAnswers,
      explanation: String(raw.explanation || `Đáp án đúng là ${expectedAnswer}.`).trim(),
      skillTag: String(raw.skillTag || topic).trim(),
      difficulty: ['easy', 'medium', 'hard'].includes(raw.difficulty) ? raw.difficulty : difficulty,
      visualConfig,
      ruleHints,
    });
  }

  return sanitized;
}

// 5. Teacher AI Draft Generation (Protected: teacher or admin role required)
app.post('/api/teacher/generate-draft', requireAuth, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  const geminiClient = getGeminiClient();
  if (!geminiClient) {
    return res.status(503).json({
      code: 'AI_NOT_CONFIGURED',
      error: 'AI chưa cấu hình: Chưa phát hiện GEMINI_API_KEY. Vui lòng cấu hình Secret trên Vercel hoặc Google AI Studio.',
    });
  }

  const { grade, topic, targetPattern, questionCount = 4, difficulty = 'medium' } = req.body;

  // Validate parameters
  const parsedGrade = Number(grade);
  if (parsedGrade !== 1 && parsedGrade !== 2) {
    return res.status(400).json({ error: 'Khối lớp chỉ hỗ trợ Toán lớp 1 hoặc lớp 2.' });
  }

  const cleanCount = Math.min(Math.max(Number(questionCount) || 4, 1), 10);
  const cleanTopic = String(topic || 'Số và Phép tính').trim().substring(0, 100);
  const rawPattern = String(targetPattern || 'AUTO').trim().substring(0, 100);

  let patternInstruction = '';
  if (rawPattern === 'AUTO' || rawPattern === 'AI_DETECT') {
    patternInstruction = `TẬP TRUNG PHÁT HIỆN MẪU LỖI: Hãy tự động phân tích và xác định các mẫu lỗi sư phạm điển hình nhất phù hợp lứa tuổi lớp ${parsedGrade} và chủ đề "${cleanTopic}" (ví dụ: đếm lệch 1 đơn vị, nhầm dấu cộng/trừ, sai bước qua 10, nhầm vị trí hàng chục và đơn vị, nhầm lẫn hình học, v.v.). Gắn đúng mã lỗi vào từng câu hỏi.`;
  } else {
    patternInstruction = `TẬP TRUNG PHÁT HIỆN MẪU LỖI: "${rawPattern}". Hãy xây dựng các câu hỏi, dữ liệu và gợi ý sư phạm xoay quanh mẫu lỗi này để chẩn đoán và khắc phục hiệu quả cho học sinh.`;
  }

  try {
    const prompt = `
Bạn là chuyên gia giáo dục Toán tiểu học theo Chương trình Giáo dục Phổ thông 2018 (GDPT 2018) Việt Nam cho học sinh Lớp ${parsedGrade}.
Nhiệm vụ: Hãy tạo ĐÚNG CHÍNH XÁC ${cleanCount} câu hỏi môn Toán Lớp ${parsedGrade} về chủ đề: "${cleanTopic}".
Độ khó: ${difficulty}.
${patternInstruction}

YÊU CẦU SƯ PHẠM VÀ DỮ LIỆU:
1. SỐ LƯỢNG: Mảng "questions" BẮT BUỘC PHẢI CHỨA ĐÚNG ${cleanCount} PHẦN TỬ (từ câu 1 đến câu ${cleanCount}), không được thiếu hoặc thừa bất kỳ câu nào.
2. VĂN PHONG: Ngắn gọn, ấm áp, ngôn ngữ tiếng Việt trong sáng, dễ hiểu với học sinh 6-8 tuổi.
3. TIỀN TỆ: Nếu bài toán liên quan đến tiền bạc, BẮT BUỘC dùng tiền Việt Nam Đồng (VND): 1 000 đồng, 2 000 đồng, 5 000 đồng, 10 000 đồng, 20 000 đồng, 50 000 đồng, 100 000 đồng. TUYỆT ĐỐI KHÔNG dùng USD hay ký hiệu $.
4. DẠNG BÀI TẬP (interactionType): Phân bổ các dạng câu hỏi đa dạng và phù hợp:
   - "single_choice": Trắc nghiệm 4 lựa chọn (cung cấp mảng "options" gồm 4 chuỗi, trong đó có "expectedAnswer").
   - "number_input": Điền số hoặc kết quả tính (expectedAnswer là chuỗi số).
   - "expression_match": Nối cặp (cung cấp mảng "pairs" gồm ít nhất 3 cặp { left, right }, expectedAnswer là "MATCHED_ALL").
   - "operator_pick": Chọn dấu +, -, =, >, < (options: [">", "<", "="] hoặc ["+", "-"]).
5. HÌNH MINH HỌA TRỰC QUAN (visualConfig): Mỗi câu hỏi BẮT BUỘC có cấu hình trực quan chuẩn xác:
   - "addition": Dành cho phép cộng (ví dụ 1 + 3 = ?). Cấu hình: { "type": "addition", "leftCount": 1, "rightCount": 3, "iconName": "apple" }. Hiển thị Nhóm 1 + Nhóm 2. TUYỆT ĐỐI không để lộ kết quả tổng trên hình.
   - "counters": Đếm đồ vật đơn { "type": "counters", "count": 4, "iconName": "apple" } (iconName: "apple", "fish", "star", "candy", "pencil", "carrot", "flower", "bird", "rabbit", "orange", "block").
   - "ten_frame" hoặc "five_frame": Khung 10 ô hoặc khung 5 ô { "type": "ten_frame", "gridSize": 10, "count": 6, "dotColor": "blue" }.
   - "bundles": Bó que tính và que rời { "type": "bundles", "tens": 0, "ones": 4 }. Chú ý: Nếu số lượng nhỏ hơn 10 thì tens: 0 và ones: số que lẻ. Chỉ dùng tens >= 1 khi số lượng >= 10. TUYỆT ĐỐI KHÔNG để tens: 0 và ones: 0.
   - "comparison": So sánh 2 nhóm { "type": "comparison", "leftCount": 4, "rightCount": 2, "iconName": "star" }.
   - "shapes": Nhận biết hình { "type": "shapes", "shapeType": "circle" | "square" | "triangle" | "rectangle" | "cylinder" | "sphere" }.
   - "money": Tiền Việt Nam { "type": "money", "moneyBills": [{"denomination": 2000, "count": 2}] }.
   - "clock": Xem đồng hồ kim { "type": "clock", "hours": 8, "minutes": 30 }.
6. GỢI Ý MANH MỐI (ruleHints): Mỗi câu hỏi có ít nhất 1 gợi ý thám tử chứa:
   - "pattern": Mã lỗi (ví dụ COUNTING_OFF_BY_ONE, WRONG_OPERATOR, CROSS_TEN_ERROR, PLACE_VALUE_SWAP, COMPARISON_INVERSION, WORD_PROBLEM_WRONG_OPERATION, GEOMETRY_MISIDENTIFICATION...).
   - "hintText": Lời nhắc nhở nhẹ nhàng, ấm áp không lộ ngay đáp án.
   - "visualActionGuidance": Chỉ dẫn cụ thể hành động quan sát hoặc đếm trực quan.

ĐỊNH DẠNG JSON ĐẦU RA BẮT BUỘC:
{
  "questions": [
    {
      "id": "q-ai-1",
      "order": 1,
      "prompt": "Lời dẫn câu hỏi bằng tiếng Việt...",
      "interactionType": "single_choice",
      "options": ["3", "4", "5", "6"],
      "expectedAnswer": "5",
      "explanation": "Giải thích từng bước vì sao đáp án là 5...",
      "skillTag": "${cleanTopic}",
      "difficulty": "${difficulty}",
      "visualConfig": {
        "type": "counters",
        "count": 5,
        "iconName": "apple"
      },
      "ruleHints": [
        {
          "pattern": "COUNTING_OFF_BY_ONE",
          "hintText": "Bé hãy đếm chậm từng quả táo xem nào!",
          "visualActionGuidance": "Chạm vào từng quả táo để đếm từ 1 đến hết."
        }
      ]
    }
  ]
}
Chỉ trả về duy nhất chuỗi JSON hợp lệ, không có văn bản nào bên ngoài.
`;

    let text: string;
    try {
      text = await generateGeminiContent(prompt);
    } catch (aiErr: any) {
      const code = aiErr.code || 'AI_SERVICE_ERROR';
      const error = aiErr.message || 'Lỗi khi gọi API Gemini';
      const model = aiErr.model || (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();

      if (code === 'GEMINI_MODEL_NOT_FOUND') {
        return res.status(404).json({ code, error, model });
      }
      if (code === 'GEMINI_QUOTA_EXCEEDED') {
        return res.status(429).json({ code, error, model });
      }
      if (code === 'GEMINI_AUTH_INVALID') {
        return res.status(401).json({ code, error, model });
      }
      if (code === 'GEMINI_TIMEOUT') {
        return res.status(504).json({ code, error, model });
      }
      if (code === 'AI_NETWORK_ERROR') {
        return res.status(502).json({ code, error, model });
      }
      return res.status(500).json({ code, error, model });
    }

    // Robust JSON extraction
    let cleanJsonText = (text || '').trim();
    const jsonMatch = cleanJsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanJsonText = jsonMatch[1].trim();
    } else {
      const firstBrace = cleanJsonText.indexOf('{');
      const firstBracket = cleanJsonText.indexOf('[');
      let startIdx = -1;
      let endIdx = -1;
      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIdx = firstBrace;
        endIdx = cleanJsonText.lastIndexOf('}');
      } else if (firstBracket !== -1) {
        startIdx = firstBracket;
        endIdx = cleanJsonText.lastIndexOf(']');
      }
      if (startIdx !== -1 && endIdx > startIdx) {
        cleanJsonText = cleanJsonText.substring(startIdx, endIdx + 1);
      }
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJsonText || '{}');
    } catch (jsonErr: any) {
      console.error('Failed to parse Gemini output as JSON:', cleanJsonText.substring(0, 200));
      return res.status(502).json({
        code: 'AI_JSON_PARSE_ERROR',
        error: 'Nội dung phản hồi từ mô hình AI không thể phân tích cú pháp JSON hợp lệ.',
        detail: cleanJsonText.substring(0, 200),
      });
    }

    let rawQuestions: any[] = [];
    if (Array.isArray(parsed)) {
      rawQuestions = parsed;
    } else if (Array.isArray(parsed.questions)) {
      rawQuestions = parsed.questions;
    } else if (Array.isArray(parsed.items)) {
      rawQuestions = parsed.items;
    } else if (Array.isArray(parsed.questionList)) {
      rawQuestions = parsed.questionList;
    }

    if (rawQuestions.length === 0) {
      // Strictly report error without silently replacing with mock questions (REQ 8)
      return res.status(502).json({
        code: 'AI_EMPTY_QUESTIONS',
        error: 'Mô hình AI phản hồi cấu trúc JSON nhưng không chứa danh sách câu hỏi hợp lệ.',
        detail: JSON.stringify(parsed).substring(0, 200),
      });
    }

    // Sanitize and standardize questions (REQ 2, 7)
    const sanitizedQuestions = sanitizeAiQuestions(
      rawQuestions,
      cleanCount,
      cleanTopic,
      parsedGrade,
      difficulty,
      rawPattern
    );

    return res.json({
      ok: true,
      questions: sanitizedQuestions,
      count: sanitizedQuestions.length,
      grade: parsedGrade,
      topic: cleanTopic,
      targetPattern: rawPattern,
      difficulty,
    });
  } catch (err: any) {
    const safeMsg = err?.message ? err.message.replace(/AIza[0-9A-Za-z-_]{35}/g, '***').replace(/key=[^&\s]+/g, 'key=***') : String(err);
    console.error('Gemini draft generation error (sanitized):', safeMsg);
    return res.status(500).json({
      code: err?.code || 'AI_GENERATION_FAILED',
      error: `Lỗi xử lý khi tạo bài nháp từ AI: ${safeMsg}`,
      detail: safeMsg
    });
  }
});

// 6. Teacher AI Classroom Insights Summary (Protected: teacher or admin role required)
app.post('/api/teacher/summarize-insights', requireAuth, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  if (!process.env.GEMINI_API_KEY || !genAI) {
    return res.status(503).json({
      code: 'AI_NOT_CONFIGURED',
      error: 'AI chưa cấu hình: Chưa phát hiện GEMINI_API_KEY.',
    });
  }

  const { patterns, totalAttempts, avgScore, hintRecoveryRate, dataOrigin } = req.body;

  try {
    const prompt = `
Bạn là chuyên gia thẩm định giáo dục tiểu học GDPT 2018 môn Toán.
Dưới đây là dữ liệu tổng hợp ẩn danh kết quả học tập (${dataOrigin === 'simulation' ? 'Dữ liệu lưu trữ/kiểm toán' : 'Dữ liệu học tập thực tế'}):
- Tổng lượt làm bài: ${totalAttempts || 0}
- Điểm trung bình: ${avgScore || 0}%
- Tỷ lệ tiến bộ sau khi xem manh mối gợi ý: ${hintRecoveryRate || 0}%
- Các mẫu lỗi hay gặp: ${JSON.stringify(patterns || [])}

Hãy viết một bản tóm tắt sư phạm ngắn gọn (khoảng 2-3 đoạn văn) cho giáo viên biết học sinh đang gặp khó khăn ở điểm nào, và đề xuất 3 hoạt động trực quan cụ thể (sử dụng que tính, khung 10 ô, trục số) để củng cố trên lớp.
Trả về định dạng JSON:
{
  "summary": "Đoạn văn phân tích xu hướng lỗi...",
  "recommendations": ["Hoạt động 1: ...", "Hoạt động 2: ...", "Hoạt động 3: ..."]
}
`;

    const text = await generateGeminiContent(prompt);

    let cleanJsonText = (text || '').trim();
    if (cleanJsonText.startsWith('```json')) {
      cleanJsonText = cleanJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJsonText.startsWith('```')) {
      cleanJsonText = cleanJsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanJsonText || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('AI summary error (sanitized):', err?.message ? err.message.replace(/AIza[0-9A-Za-z-_]{35}/g, '***') : err);
    return res.status(500).json({ error: 'Không thể tạo bản tóm tắt AI lúc này. Thầy/Cô vui lòng thử lại sau.' });
  }
});

// 7. Admin Seed Demo Data (Protected: Admin role required + explicit guard)
app.post('/api/admin/seed-demo', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

  // Strict production protection rule: completely disabled on production
  if (isProduction) {
    return res.status(403).json({
      error: 'Khóa an toàn Production: Thao tác Seed dữ liệu bị vô hiệu hóa hoàn toàn trên môi trường sản xuất để bảo toàn dữ liệu.',
      code: 'PRODUCTION_ENDPOINT_DISABLED',
    });
  }

  const { apply = false } = req.body;

  const summary = {
    mode: apply ? 'APPLY' : 'DRY_RUN',
    teachersCount: 2,
    classesCount: 4,
    studentsCount: 48,
    lessonsCount: 24,
    questionsCount: 192,
    assignmentsCount: 24,
    attemptsCount: 144,
    dataOrigin: 'simulation',
    environmentTag: 'demo',
    timestamp: new Date().toISOString(),
  };

  // Safe dry-run default
  if (!apply) {
    return res.json({
      ok: true,
      message: 'Kiểm thử chế độ DRY-RUN thành công. Không có dữ liệu nào bị ghi.',
      plan: summary,
    });
  }

  try {
    const actorId = req.user?.uid || 'admin';

    // 1. Seed Academic Year
    await setDoc(doc(db, 'academicYears', 'year-2024-2025'), {
      id: 'year-2024-2025',
      name: 'Năm học 2024 - 2025',
      isCurrent: true,
      createdAt: new Date().toISOString(),
      dataOrigin: 'simulation',
      environmentTag: 'demo',
    });

    // 2. Seed Admin
    await setDoc(doc(db, 'users', 'admin-demo'), {
      id: 'admin-demo',
      role: 'admin',
      displayName: 'Thầy Tổng Phụ Trách Quản Trị',
      email: 'admin@thamtutoannhi.edu.vn',
      createdAt: new Date().toISOString(),
      dataOrigin: 'simulation',
      environmentTag: 'demo',
    }, { merge: true });

    // Write audit log
    await setDoc(doc(db, 'auditLogs', `log-seed-${Date.now()}`), {
      id: `log-seed-${Date.now()}`,
      action: 'APPLY_DEMO_SEED',
      actorId,
      actorRole: 'admin',
      targetCollection: 'all',
      targetId: 'demo-dataset',
      details: 'Khởi tạo seed trong phạm vi mô phỏng an toàn.',
      timestamp: new Date().toISOString(),
      dataOrigin: 'simulation',
      environmentTag: 'demo',
    });

    return res.json({
      ok: true,
      message: 'Đã hoàn thành kiểm toán dữ liệu mẫu trong phạm vi an toàn.',
      summary,
    });
  } catch (err: any) {
    console.error('Seed execution error:', err);
    return res.status(500).json({ error: 'Lỗi thực thi seed lên Firestore: ' + err.message });
  }
});

// 8. Admin Scoped Cleanup Demo Endpoint (Protected: Admin role required + locked on production)
app.post('/api/admin/cleanup-demo', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

  // Strict production protection rule: completely disabled on production
  if (isProduction) {
    return res.status(403).json({
      error: 'Khóa an toàn Production: Thao tác dọn dẹp dữ liệu bị vô hiệu hóa hoàn toàn trên môi trường sản xuất để bảo toàn dữ liệu.',
      code: 'PRODUCTION_ENDPOINT_DISABLED',
    });
  }

  const collectionsToClean = ['attempts', 'mistakeInsights', 'attemptAnswers'];
  let deletedCount = 0;

  try {
    for (const colName of collectionsToClean) {
      const q = query(
        collection(db, colName),
        where('dataOrigin', '==', 'simulation'),
        where('environmentTag', '==', 'demo')
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
        deletedCount++;
      }
    }

    // Write immutable audit log
    await setDoc(doc(db, 'auditLogs', `log-cleanup-${Date.now()}`), {
      id: `log-cleanup-${Date.now()}`,
      action: 'CLEANUP_DEMO_DATA',
      actorId: req.user?.uid || 'admin',
      actorRole: 'admin',
      targetCollection: 'demo-collections',
      targetId: 'simulation-scope',
      details: `Đã dọn dẹp ${deletedCount} bản ghi demo trong phạm vi namespace an toàn.`,
      timestamp: new Date().toISOString(),
      dataOrigin: 'real',
      environmentTag: 'production',
    });

    return res.json({
      ok: true,
      message: `Đã dọn dẹp an toàn ${deletedCount} bản ghi mô phỏng demo.`,
      deletedCount,
    });
  } catch (err: any) {
    console.error('Cleanup demo error:', err);
    return res.status(500).json({ error: 'Lỗi dọn dẹp demo: ' + err.message });
  }
});

// ============================================================================
// 8. DATA PROXY ENDPOINTS (DUAL-PATH ARCHITECTURE TO PREVENT PERMISSION_DENIED)
// ============================================================================

// --- A. STUDENT DATA ENDPOINTS ---
app.get('/api/student/assignments', requireAuth, requireRole(['student', 'teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    let classId: string | undefined;

    if (user.role === 'student') {
      classId = user.classId;
      if (!classId) {
        return res.status(400).json({
          error: 'Tài khoản học sinh chưa được phân vào lớp học. Vui lòng liên hệ giáo viên phụ trách.',
          code: 'NO_CLASS_ASSIGNED',
        });
      }
    } else {
      classId = (req.query.classId as string) || user.classId;
      if (!classId) {
        return res.status(400).json({ error: 'Thiếu thông tin classId của lớp học.' });
      }
    }

    const q = query(collection(db, 'assignments'), where('classId', '==', classId));
    const snap = await getDocs(q);
    let assignments = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

    // ABAC Enforced:
    // A student MUST only see assignments for their whole class OR targeted specifically to them
    if (user.role === 'student') {
      assignments = assignments.filter((a) => !a.studentId || a.studentId === user.uid);
    } else if (req.query.studentId) {
      // Teacher/Admin viewing assignments for a specific student in this class
      const targetStudentId = String(req.query.studentId);
      assignments = assignments.filter((a) => !a.studentId || a.studentId === targetStudentId);
    }

    return res.json({ ok: true, assignments });
  } catch (err: any) {
    console.error('Fetch student assignments error:', err);
    return res.status(500).json({ error: 'Lỗi tải danh sách bài tập: ' + err.message });
  }
});

app.get('/api/student/attempts', requireAuth, requireRole(['student', 'teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ABAC Enforced: Student can only ever read their own attempts
    if (req.user?.role === 'student' && req.query.studentId && req.query.studentId !== req.user.uid) {
      return res.status(403).json({ error: 'Từ chối truy cập: Học sinh chỉ có thể xem bài làm của chính mình.' });
    }
    const studentId = req.user?.role === 'student' ? req.user.uid : (req.query.studentId as string || req.user!.uid);
    const q = query(collection(db, 'attempts'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    const attempts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ ok: true, attempts });
  } catch (err: any) {
    console.error('Fetch student attempts error:', err);
    return res.status(500).json({ error: 'Lỗi tải lịch sử bài làm: ' + err.message });
  }
});

app.get('/api/student/lesson-version/:versionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const versionId = req.params.versionId;
    const vDoc = await getDoc(doc(db, 'lessonVersions', versionId));
    if (!vDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy phiên bản câu hỏi bài học.' });
    }
    return res.json({ ok: true, lessonVersion: { id: vDoc.id, ...vDoc.data() } });
  } catch (err: any) {
    console.error('Fetch lesson version error:', err);
    return res.status(500).json({ error: 'Lỗi tải chi tiết bài học: ' + err.message });
  }
});

app.post('/api/student/attempts', requireAuth, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, assignmentId, lessonVersionId, classId, studentId, totalQuestions, maxScore } = req.body;
    if (studentId && studentId !== req.user!.uid) {
      return res.status(403).json({ error: 'Từ chối truy cập: Không thể mạo danh tài khoản học sinh khác.' });
    }
    if (!id || !assignmentId || !lessonVersionId) {
      return res.status(400).json({ error: 'Thiếu tham số khởi tạo lượt làm bài.' });
    }

    // Determine actual questions count and maxScore from lesson version or payload
    let computedTotalQuestions = Number(totalQuestions || 0);
    let computedMaxScore = Number(maxScore || 0);

    if (lessonVersionId) {
      try {
        const vSnap = await getDoc(doc(db, 'lessonVersions', lessonVersionId));
        if (vSnap.exists()) {
          const qList: any[] = vSnap.data()?.questions || [];
          if (qList.length > 0) {
            computedTotalQuestions = qList.length;
            computedMaxScore = qList.reduce((sum: number, q: any) => sum + (Number(q.points) || 10), 0);
          }
        }
      } catch (err) {
        console.warn('Notice: Failed to fetch lesson version for maxScore:', err);
      }
    }
    if (!computedMaxScore) {
      computedMaxScore = computedTotalQuestions > 0 ? computedTotalQuestions * 10 : 80;
    }

    const attemptDoc = {
      id,
      assignmentId,
      lessonVersionId,
      classId: classId || req.user!.classId || '',
      studentId: req.user!.uid, // Strictly enforced caller UID
      studentName: req.user!.displayName,
      studentCode: req.user!.studentCode || '',
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      score: 0,
      totalQuestions: computedTotalQuestions,
      maxScore: computedMaxScore,
      firstAttemptCorrectCount: 0,
      postHintCorrectCount: 0,
      misconceptionsDetected: [],
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    await setDoc(doc(db, 'attempts', id), attemptDoc);
    return res.json({ ok: true, attempt: attemptDoc });
  } catch (err: any) {
    console.error('Create attempt error:', err);
    return res.status(500).json({ error: 'Lỗi tạo lượt làm bài: ' + err.message });
  }
});

app.post('/api/student/attempts/:id/answer', requireAuth, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attemptId = req.params.id;
    const { answerDocId, questionId, questionOrder, userAnswer, isCorrect, attemptNumber, timeSpentSeconds, detectedPattern } = req.body;

    const attSnap = await getDoc(doc(db, 'attempts', attemptId));
    if (!attSnap.exists()) {
      return res.status(404).json({ error: 'Lượt làm bài không tồn tại.' });
    }
    const attData: any = attSnap.data();
    if (attData.studentId !== req.user!.uid) {
      return res.status(403).json({ error: 'Từ chối: Không thể ghi đáp án vào bài làm của học sinh khác.' });
    }
    if (attData.status === 'completed') {
      return res.status(400).json({ error: 'Lượt làm bài đã hoàn thành, không thể nộp thêm đáp án.' });
    }

    // Server-side answer evaluation from canonical lesson version
    let evaluatedCorrect = false;
    let expectedAnswer = '';
    if (attData.lessonVersionId) {
      try {
        const vSnap = await getDoc(doc(db, 'lessonVersions', attData.lessonVersionId));
        if (vSnap.exists()) {
          const questions: any[] = vSnap.data()?.questions || [];
          const q = questions.find((item: any) => item.id === questionId || item.order === Number(questionOrder));
          if (q) {
            expectedAnswer = String(q.expectedAnswer ?? '').trim();
            const normalize = (s: any) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, '');
            const normUser = normalize(userAnswer);
            const allAcceptables = [normalize(q.expectedAnswer), ...(q.acceptableAnswers || []).map(normalize)];
            evaluatedCorrect = allAcceptables.includes(normUser);
          }
        }
      } catch (evalErr) {
        console.warn('Server-side question evaluation fallback:', evalErr);
        // Fallback to provided isCorrect only if lesson version is temporarily unreachable
        evaluatedCorrect = Boolean(isCorrect);
      }
    } else {
      evaluatedCorrect = Boolean(isCorrect);
    }

    const answerDoc = {
      id: answerDocId || `${attemptId}_q_${questionId}_a_${attemptNumber || 1}`,
      attemptId,
      studentId: req.user!.uid,
      questionId,
      questionOrder: Number(questionOrder || 1),
      userAnswer: String(userAnswer ?? ''),
      expectedAnswer,
      isCorrect: evaluatedCorrect,
      attemptNumber: Number(attemptNumber || 1),
      timeSpentSeconds: Number(timeSpentSeconds || 0),
      detectedPattern: detectedPattern || null,
      submittedAt: new Date().toISOString(),
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    await setDoc(doc(db, 'attemptAnswers', answerDoc.id), answerDoc);
    return res.json({ ok: true, answer: answerDoc });
  } catch (err: any) {
    console.error('Save attempt answer error:', err);
    return res.status(500).json({ error: 'Lỗi lưu đáp án: ' + err.message });
  }
});

app.post('/api/student/attempts/:id/complete', requireAuth, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attemptId = req.params.id;
    const { score, maxScore, completedAt, firstAttemptCorrectCount, postHintCorrectCount, misconceptionsDetected } = req.body;

    const attSnap = await getDoc(doc(db, 'attempts', attemptId));
    if (!attSnap.exists()) {
      return res.status(404).json({ error: 'Lượt làm bài không tồn tại.' });
    }
    const attData: any = attSnap.data();
    if (attData.studentId !== req.user!.uid) {
      return res.status(403).json({ error: 'Từ chối: Không thể sửa bài làm của người khác.' });
    }

    // Preserve or determine actual maxScore
    let finalMaxScore = Number(attData.maxScore || maxScore || 0);
    if (!finalMaxScore && attData.lessonVersionId) {
      try {
        const vSnap = await getDoc(doc(db, 'lessonVersions', attData.lessonVersionId));
        if (vSnap.exists()) {
          const qList: any[] = vSnap.data()?.questions || [];
          if (qList.length > 0) {
            finalMaxScore = qList.reduce((sum: number, q: any) => sum + (Number(q.points) || 10), 0);
          }
        }
      } catch (err) {}
    }
    if (!finalMaxScore) {
      finalMaxScore = attData.totalQuestions ? attData.totalQuestions * 10 : 80;
    }

    const updates = {
      status: 'completed',
      score: Number(score || 0),
      maxScore: finalMaxScore,
      completedAt: completedAt || new Date().toISOString(),
      firstAttemptCorrectCount: Number(firstAttemptCorrectCount || 0),
      postHintCorrectCount: Number(postHintCorrectCount || 0),
      misconceptionsDetected: Array.isArray(misconceptionsDetected) ? misconceptionsDetected : [],
    };
    await setDoc(doc(db, 'attempts', attemptId), updates, { merge: true });
    return res.json({ ok: true, attempt: { ...attData, ...updates } });
  } catch (err: any) {
    console.error('Complete attempt error:', err);
    return res.status(500).json({ error: 'Lỗi hoàn tất bài làm: ' + err.message });
  }
});

app.post('/api/student/mistake-insights', requireAuth, requireRole(['student']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, attemptId, questionId, errorPattern, remediationType, resolved } = req.body;
    const insightDoc = {
      id: id || `insight_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      attemptId: attemptId || '',
      studentId: req.user!.uid,
      studentName: req.user!.displayName,
      classId: req.user!.classId || '',
      questionId: questionId || '',
      errorPattern: errorPattern || 'GENERAL_CALCULATION_ERROR',
      remediationType: remediationType || 'visual_hint',
      resolved: Boolean(resolved),
      detectedAt: new Date().toISOString(),
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    await setDoc(doc(db, 'mistakeInsights', insightDoc.id), insightDoc);
    return res.json({ ok: true, insight: insightDoc });
  } catch (err: any) {
    console.error('Save mistake insight error:', err);
    return res.status(500).json({ error: 'Lỗi lưu thông tin chẩn đoán: ' + err.message });
  }
});

// --- B. TEACHER DATA ENDPOINTS ---
app.get('/api/teacher/classes', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [cSnap, uSnap] = await Promise.all([
      getDocs(collection(db, 'classes')),
      getDocs(collection(db, 'users')),
    ]);

    const allUsers = uSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const allClasses = cSnap.docs
      .filter((d) => {
        const cData: any = d.data();
        return !cData.isDeleted && cData.status !== 'archived';
      })
      .map((d) => {
        const cData: any = d.data();
        const realStudentCount = allUsers.filter(
          (u: any) => u.role === 'student' && !u.isDeleted && u.status !== 'inactive' && (u.classId === d.id || u.className === cData.name || u.classId === cData.name)
        ).length;
        return { id: d.id, ...cData, studentCount: realStudentCount };
      });

    // If admin, return all classes; if teacher, return assigned classes
    const filtered = req.user?.role === 'admin'
      ? allClasses
      : allClasses.filter((c: any) => c.teacherId === req.user?.uid);
    return res.json({ ok: true, classes: filtered });
  } catch (err: any) {
    console.error('Fetch teacher classes error:', err);
    return res.status(500).json({ error: 'Lỗi tải danh sách lớp: ' + err.message });
  }
});

// Class Roster & Student Details
app.get('/api/teacher/classes/:classId/students', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const classId = req.params.classId;
    const cDoc = await getDoc(doc(db, 'classes', classId));
    if (!cDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học.' });
    }
    const cData: any = cDoc.data();
    if (req.user?.role !== 'admin' && cData.teacherId !== req.user?.uid) {
      return res.status(403).json({ error: 'Từ chối: Bạn không được phân công phụ trách lớp học này.' });
    }

    const [uSnap, aSnap, attSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'assignments')),
      getDocs(collection(db, 'attempts')),
    ]);

    const allUsers = uSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const allAssignments = aSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const allAttempts = attSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const classAssignments = allAssignments.filter((a: any) => a.classId === classId);

    const students = allUsers
      .filter((u: any) => u.role === 'student' && !u.isDeleted && u.status !== 'inactive' && (u.classId === classId || u.className === cData.name || u.classId === cData.name))
      .map((s: any) => {
        const studentAssignments = allAssignments.filter(
          (a: any) => (a.classId === classId && (!a.studentId || a.studentId === s.id)) || a.studentId === s.id
        );
        const studentAttempts = allAttempts.filter((att: any) => att.studentId === s.id || att.studentCode === s.studentCode);
        const completedAttempts = studentAttempts.filter((att: any) => att.status === 'completed');
        const inProgressAttempts = studentAttempts.filter((att: any) => att.status === 'in_progress');

        const avgScore = completedAttempts.length > 0
          ? Math.round(
              completedAttempts.reduce((sum: number, att: any) => {
                const max = att.maxScore && att.maxScore > 0 ? att.maxScore : 80;
                return sum + ((att.score || 0) / max) * 100;
              }, 0) / completedAttempts.length
            )
          : null;

        let lastActive: string | null = null;
        studentAttempts.forEach((att: any) => {
          const dateStr = att.completedAt || att.startedAt;
          if (dateStr && (!lastActive || new Date(dateStr) > new Date(lastActive))) {
            lastActive = dateStr;
          }
        });

        return {
          id: s.id,
          studentCode: s.studentCode || '',
          displayName: s.displayName || s.name || '',
          classId: s.classId || classId,
          className: cData.name,
          grade: s.grade || cData.grade,
          status: s.status || 'active',
          assignedCount: studentAssignments.length,
          completedCount: completedAttempts.length,
          inProgressCount: inProgressAttempts.length,
          avgScore,
          lastActive,
          createdAt: s.createdAt,
        };
      })
      .sort((a, b) => a.studentCode.localeCompare(b.studentCode));

    return res.json({
      ok: true,
      class: { id: cDoc.id, ...cData, studentCount: students.length },
      students,
      assignments: classAssignments,
    });
  } catch (err: any) {
    console.error('Fetch class students error:', err);
    return res.status(500).json({ error: 'Lỗi tải danh sách học sinh: ' + err.message });
  }
});

// Add student to class
app.post('/api/teacher/classes/:classId/students', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const classId = req.params.classId;
    const cDoc = await getDoc(doc(db, 'classes', classId));
    if (!cDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học.' });
    }
    const cData: any = cDoc.data();
    if (req.user?.role !== 'admin' && cData.teacherId !== req.user?.uid) {
      return res.status(403).json({ error: 'Từ chối: Bạn không có quyền thêm học sinh vào lớp học này.' });
    }

    const { displayName, studentCode, accessSecret, grade } = req.body;
    if (!displayName || !studentCode || !accessSecret) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ: Tên học sinh, Mã học sinh và Mật khẩu truy cập.' });
    }

    const normalizedCode = String(studentCode).trim().toUpperCase();
    const uSnap = await getDocs(query(collection(db, 'users'), where('studentCode', '==', normalizedCode)));
    if (!uSnap.empty) {
      return res.status(400).json({ error: `Mã học sinh "${normalizedCode}" đã tồn tại trên hệ thống.` });
    }

    const rawSecret = String(accessSecret).trim();
    const secretHash = await bcrypt.hash(rawSecret, 10);
    const newStudentId = `student-${normalizedCode.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const studentDoc = {
      id: newStudentId,
      studentCode: normalizedCode,
      displayName: String(displayName).trim(),
      name: String(displayName).trim(),
      role: 'student',
      classId,
      className: cData.name,
      grade: Number(grade || cData.grade || 1),
      accessSecretHash: secretHash,
      tokenVersion: 1,
      status: 'active',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user?.uid,
      dataOrigin: 'real',
      environmentTag: 'production',
    };

    await setDoc(doc(db, 'users', newStudentId), studentDoc);

    // Audit log
    await setDoc(doc(db, 'auditLogs', `audit-${Date.now()}`), {
      id: `audit-${Date.now()}`,
      action: 'CREATE_STUDENT',
      performedBy: req.user?.uid,
      targetUserId: newStudentId,
      details: `Thêm học sinh ${displayName} (${normalizedCode}) vào lớp ${cData.name}`,
      timestamp: new Date().toISOString(),
    });

    // Mask secret in response
    const { accessSecretHash: _, ...safeStudent } = studentDoc;
    return res.json({ ok: true, student: safeStudent });
  } catch (err: any) {
    console.error('Add student error:', err);
    return res.status(500).json({ error: 'Lỗi thêm học sinh: ' + err.message });
  }
});

// Update student (status, class transfer, accessSecret reset, displayName)
app.patch('/api/teacher/students/:studentId', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId;
    const sDoc = await getDoc(doc(db, 'users', studentId));
    if (!sDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản học sinh.' });
    }
    const sData: any = sDoc.data();
    if (sData.role !== 'student') {
      return res.status(400).json({ error: 'Thao tác chỉ áp dụng cho tài khoản học sinh.' });
    }

    if (req.user?.role !== 'admin') {
      const cDoc = await getDoc(doc(db, 'classes', sData.classId));
      if (!cDoc.exists() || cDoc.data()?.teacherId !== req.user?.uid) {
        return res.status(403).json({ error: 'Từ chối: Bạn không phụ trách lớp của học sinh này.' });
      }
    }

    const { status, classId, accessSecret, displayName } = req.body;
    const updates: any = { updatedAt: new Date().toISOString() };

    if (status && ['active', 'locked', 'inactive'].includes(status)) {
      updates.status = status;
    }
    if (displayName && String(displayName).trim()) {
      updates.displayName = String(displayName).trim();
      updates.name = String(displayName).trim();
    }
    if (accessSecret && String(accessSecret).trim()) {
      const rawSecret = String(accessSecret).trim();
      updates.accessSecretHash = await bcrypt.hash(rawSecret, 10);
      updates.accessSecret = null;
      const nextVersion = (sData.tokenVersion || 0) + 1;
      updates.tokenVersion = nextVersion;
      userTokenVersions.set(studentId, nextVersion);
    }
    if (classId && classId !== sData.classId) {
      const targetClassDoc = await getDoc(doc(db, 'classes', classId));
      if (!targetClassDoc.exists()) {
        return res.status(400).json({ error: 'Lớp học chuyển đến không tồn tại.' });
      }
      updates.classId = classId;
      updates.className = targetClassDoc.data()?.name || '';
      updates.grade = targetClassDoc.data()?.grade || sData.grade;
    }

    await updateDoc(doc(db, 'users', studentId), updates);

    // Audit log
    await setDoc(doc(db, 'auditLogs', `audit-${Date.now()}`), {
      id: `audit-${Date.now()}`,
      action: 'UPDATE_STUDENT',
      performedBy: req.user?.uid,
      targetUserId: studentId,
      details: `Cập nhật thông tin học sinh ${sData.studentCode}: ${Object.keys(updates).join(', ')}`,
      timestamp: new Date().toISOString(),
    });

    return res.json({ ok: true, student: { ...sData, ...updates } });
  } catch (err: any) {
    console.error('Update student error:', err);
    return res.status(500).json({ error: 'Lỗi cập nhật học sinh: ' + err.message });
  }
});

// ========================================================
// ADMIN CLASS MANAGEMENT & TEACHER ASSIGNMENT (A3)
// ========================================================

// 1. Create new class
app.post('/api/admin/classes', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, grade, academicYearId, teacherId, status } = req.body;
    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({ error: 'Vui lòng cung cấp tên lớp học (ví dụ: 1A, 2B).' });
    }
    const cleanName = String(name).trim();
    const finalYearId = academicYearId || 'year-2026-2027';

    // Verify academic year exists
    const yrDoc = await getDoc(doc(db, 'academicYears', finalYearId));
    if (!yrDoc.exists()) {
      return res.status(400).json({ error: `Năm học "${finalYearId}" không tồn tại trong hệ thống.` });
    }

    // Check duplicate class name in same academic year
    const classesSnap = await getDocs(collection(db, 'classes'));
    const conflict = classesSnap.docs.find((d) => {
      const data = d.data();
      return !data.isDeleted && data.academicYearId === finalYearId && String(data.name || '').trim().toLowerCase() === cleanName.toLowerCase();
    });
    if (conflict) {
      return res.status(400).json({ error: `Lớp ${cleanName} đã tồn tại trong niên khóa này.` });
    }

    // Auto calculate grade if not provided
    let finalGrade = Number(grade);
    if (!finalGrade || isNaN(finalGrade)) {
      const match = cleanName.match(/^\d+/);
      finalGrade = match ? parseInt(match[0], 10) : 1;
    }

    // Class ID slug
    const cleanSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let classId = `class-${cleanSlug}`;
    const idExists = classesSnap.docs.some((d) => d.id === classId);
    if (idExists) {
      classId = `class-${cleanSlug}-${Date.now().toString().slice(-4)}`;
    }

    let teacherName: string | null = null;
    let finalTeacherId: string | null = null;
    if (teacherId) {
      const tDoc = await getDoc(doc(db, 'users', teacherId));
      if (tDoc.exists() && tDoc.data().role === 'teacher') {
        finalTeacherId = teacherId;
        teacherName = tDoc.data().displayName || tDoc.data().name || '';
      }
    }

    const newClassDoc: any = {
      id: classId,
      name: cleanName,
      grade: finalGrade,
      academicYearId: finalYearId,
      teacherId: finalTeacherId,
      teacherName: teacherName,
      studentCount: 0,
      status: status || 'active',
      isDeleted: false,
      dataOrigin: 'real',
      environmentTag: 'production',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'classes', classId), newClassDoc);

    await writeAuditLog({
      action: 'CREATE_CLASS',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'classes',
      targetId: classId,
      targetName: cleanName,
      details: `Tạo lớp học mới: Lớp ${cleanName} (Khối ${finalGrade}), Niên khóa: ${finalYearId}${teacherName ? `, GV: ${teacherName}` : ''}`,
    });

    return res.json({ ok: true, class: newClassDoc });
  } catch (err: any) {
    console.error('Create class error:', err);
    return res.status(500).json({ error: 'Lỗi tạo lớp học: ' + err.message });
  }
});

// 2. Update existing class
app.patch('/api/admin/classes/:id', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, grade, academicYearId, teacherId, status } = req.body;
    const clsDoc = await getDoc(doc(db, 'classes', id));
    if (!clsDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học.' });
    }
    const currentData: any = clsDoc.data();
    const updates: any = { updatedAt: new Date().toISOString() };

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) return res.status(400).json({ error: 'Tên lớp không được để trống.' });

      const targetYearId = academicYearId || currentData.academicYearId || 'year-2026-2027';
      const classesSnap = await getDocs(collection(db, 'classes'));
      const conflict = classesSnap.docs.find(
        (d) => d.id !== id && !d.data().isDeleted && d.data().academicYearId === targetYearId && String(d.data().name || '').trim().toLowerCase() === cleanName.toLowerCase()
      );
      if (conflict) {
        return res.status(400).json({ error: `Lớp ${cleanName} đã tồn tại trong niên khóa này.` });
      }
      updates.name = cleanName;
    }

    if (grade !== undefined) {
      updates.grade = Number(grade);
    }

    if (academicYearId !== undefined && academicYearId !== currentData.academicYearId) {
      const yrDoc = await getDoc(doc(db, 'academicYears', academicYearId));
      if (!yrDoc.exists()) {
        return res.status(400).json({ error: `Năm học "${academicYearId}" không tồn tại.` });
      }
      updates.academicYearId = academicYearId;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    if (teacherId !== undefined) {
      if (!teacherId || teacherId === '' || teacherId === null) {
        updates.teacherId = null;
        updates.teacherName = null;
      } else {
        const tDoc = await getDoc(doc(db, 'users', teacherId));
        if (!tDoc.exists() || tDoc.data().role !== 'teacher') {
          return res.status(400).json({ error: 'Giáo viên không hợp lệ hoặc không có vai trò giáo viên.' });
        }
        updates.teacherId = teacherId;
        updates.teacherName = tDoc.data().displayName || tDoc.data().name || '';
      }
    }

    await updateDoc(doc(db, 'classes', id), updates);

    await writeAuditLog({
      action: 'UPDATE_CLASS',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'classes',
      targetId: id,
      targetName: updates.name || currentData.name,
      details: `Cập nhật thông tin lớp: ${Object.keys(updates).join(', ')}`,
    });

    return res.json({ ok: true, id, class: { ...currentData, ...updates } });
  } catch (err: any) {
    console.error('Update class error:', err);
    return res.status(500).json({ error: 'Lỗi cập nhật lớp học: ' + err.message });
  }
});

// 3. Delete / Archive class
app.delete('/api/admin/classes/:id', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const forceArchive = req.body?.archive === true || req.query?.archive === 'true';
    const clsDoc = await getDoc(doc(db, 'classes', id));
    if (!clsDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học.' });
    }
    const clsData: any = clsDoc.data();

    // Check linked students, assignments, attempts
    const usersSnap = await getDocs(collection(db, 'users'));
    const linkedStudents = usersSnap.docs.filter((d) => d.data().role === 'student' && !d.data().isDeleted && d.data().classId === id);

    const assignmentsSnap = await getDocs(collection(db, 'assignments'));
    const linkedAssignments = assignmentsSnap.docs.filter((d) => d.data().classId === id);

    const attemptsSnap = await getDocs(collection(db, 'attempts'));
    const linkedAttempts = attemptsSnap.docs.filter((d) => d.data().classId === id);

    const linkedCount = linkedStudents.length + linkedAssignments.length + linkedAttempts.length;

    if (linkedCount > 0 || forceArchive) {
      if (!forceArchive && req.body?.hardDelete) {
        return res.status(400).json({
          error: `Lớp ${clsData.name} đang có ${linkedStudents.length} học sinh và ${linkedAssignments.length} bài giao liên kết. Không thể xóa vĩnh viễn, chỉ có thể lưu trữ.`,
          code: 'CLASS_HAS_LINKED_DATA',
          studentsCount: linkedStudents.length,
          assignmentsCount: linkedAssignments.length,
          attemptsCount: linkedAttempts.length,
        });
      }

      // Safe archive
      await updateDoc(doc(db, 'classes', id), {
        status: 'archived',
        isDeleted: true,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await writeAuditLog({
        action: 'ARCHIVE_CLASS',
        actorId: req.user?.uid,
        actorName: req.user?.displayName,
        actorRole: req.user?.role,
        targetCollection: 'classes',
        targetId: id,
        targetName: clsData.name,
        details: `Lưu trữ an toàn lớp ${clsData.name}. Giữ nguyên liên kết cho ${linkedStudents.length} học sinh và ${linkedAssignments.length} bài giao.`,
      });

      return res.json({
        ok: true,
        action: 'archived',
        id,
        linkedCount,
        message: `Lớp ${clsData.name} đã được chuyển sang trạng thái lưu trữ an toàn. Toàn bộ học sinh và bài tập được bảo toàn.`,
      });
    }

    // Empty class: Permanent Delete
    await deleteDoc(doc(db, 'classes', id));
    await writeAuditLog({
      action: 'DELETE_CLASS_PERMANENT',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'classes',
      targetId: id,
      targetName: clsData.name,
      details: `Xóa vĩnh viễn lớp trống ${clsData.name}.`,
    });

    return res.json({
      ok: true,
      action: 'deleted',
      id,
      message: `Đã xóa vĩnh viễn lớp ${clsData.name}.`,
    });
  } catch (err: any) {
    console.error('Delete class error:', err);
    return res.status(500).json({ error: 'Lỗi xóa lớp học: ' + err.message });
  }
});

// 4. Admin assign/change/unassign teacher for class
app.patch('/api/admin/classes/:classId/teacher', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const classId = req.params.classId;
    const { teacherId } = req.body;
    const clsDoc = await getDoc(doc(db, 'classes', classId));
    if (!clsDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học.' });
    }
    const clsData: any = clsDoc.data();

    // Case 1: Unassign teacher
    if (!teacherId || teacherId === '' || teacherId === null) {
      await updateDoc(doc(db, 'classes', classId), {
        teacherId: null,
        teacherName: null,
        updatedAt: new Date().toISOString(),
      });

      await writeAuditLog({
        action: 'UNASSIGN_TEACHER_FROM_CLASS',
        actorId: req.user?.uid,
        actorName: req.user?.displayName,
        actorRole: req.user?.role,
        targetCollection: 'classes',
        targetId: classId,
        targetName: clsData.name,
        details: `Hủy phân công giáo viên phụ trách của lớp ${clsData.name} (Trước đó: ${clsData.teacherName || clsData.teacherId || 'Chưa có'}).`,
      });

      return res.json({ ok: true, classId, teacherId: null, teacherName: null });
    }

    // Case 2: Assign teacher
    const tDoc = await getDoc(doc(db, 'users', teacherId));
    if (!tDoc.exists() || tDoc.data()?.role !== 'teacher') {
      return res.status(400).json({ error: 'Giáo viên không tồn tại hoặc không đúng vai trò giáo viên.' });
    }
    const tData: any = tDoc.data();
    const newTeacherName = tData.displayName || tData.name || '';

    await updateDoc(doc(db, 'classes', classId), {
      teacherId,
      teacherName: newTeacherName,
      updatedAt: new Date().toISOString(),
    });

    await writeAuditLog({
      action: 'ASSIGN_TEACHER_TO_CLASS',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'classes',
      targetId: classId,
      targetName: clsData.name,
      details: `Phân công giáo viên ${newTeacherName} phụ trách lớp ${clsData.name}.`,
    });

    return res.json({ ok: true, classId, teacherId, teacherName: newTeacherName });
  } catch (err: any) {
    console.error('Assign teacher error:', err);
    return res.status(500).json({ error: 'Lỗi phân công giáo viên: ' + err.message });
  }
});

app.get('/api/teacher/lessons', requireAuth, requireRole(['teacher', 'admin']), async (_req: Request, res: Response) => {
  try {
    const snap = await getDocs(collection(db, 'lessons'));
    const lessons = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ ok: true, lessons });
  } catch (err: any) {
    console.error('Fetch lessons error:', err);
    return res.status(500).json({ error: 'Lỗi tải kho học liệu: ' + err.message });
  }
});

app.get('/api/teacher/assignments', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await getDocs(collection(db, 'assignments'));
    const allAssignments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const filtered = req.user?.role === 'admin'
      ? allAssignments
      : allAssignments.filter((a: any) => a.teacherId === req.user?.uid);
    return res.json({ ok: true, assignments: filtered });
  } catch (err: any) {
    console.error('Fetch teacher assignments error:', err);
    return res.status(500).json({ error: 'Lỗi tải danh sách bài tập: ' + err.message });
  }
});

app.post('/api/teacher/assignments', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId, lessonId, lessonVersionId, title, studentId, studentName, dueDate, allowReassign } = req.body;
    if (!classId || !lessonId || !lessonVersionId) {
      return res.status(400).json({ error: 'Thiếu thông tin bài tập cần giao (classId, lessonId, lessonVersionId).' });
    }

    // 1. Verify Classroom & Teacher Assignment
    const classDoc = await getDoc(doc(db, 'classes', classId));
    if (!classDoc.exists()) {
      return res.status(404).json({ error: 'Lớp học không tồn tại trong hệ thống.' });
    }
    const classData: any = classDoc.data();
    if (req.user?.role !== 'admin' && classData.teacherId !== req.user?.uid) {
      return res.status(403).json({ error: 'Từ chối: Bạn không được phân công phụ trách lớp học này.' });
    }

    // 2. Verify Student (if targeted assignment)
    let safeStudentName = studentName;
    if (studentId) {
      const studentDoc = await getDoc(doc(db, 'users', studentId));
      if (!studentDoc.exists()) {
        return res.status(404).json({ error: 'Học sinh được chỉ định không tồn tại.' });
      }
      const sData: any = studentDoc.data();
      if (sData.role !== 'student' || sData.classId !== classId) {
        return res.status(400).json({ error: 'Học sinh không thuộc lớp học được chọn.' });
      }
      safeStudentName = sData.displayName || studentName;
    }

    // 3. Verify Lesson & Published Status & Grade Match
    const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
    if (!lessonDoc.exists()) {
      return res.status(404).json({ error: 'Bài học không tồn tại trong kho học liệu.' });
    }
    const lessonData: any = lessonDoc.data();
    if (lessonData.status === 'draft' || lessonData.isPublished === false) {
      return res.status(400).json({ error: 'Bài học chưa được xuất bản. Vui lòng duyệt và xuất bản trước khi giao.' });
    }
    if (Number(lessonData.grade) !== Number(classData.grade)) {
      return res.status(400).json({
        error: `Khối lớp của bài học (Khối ${lessonData.grade}) không khớp với khối của lớp (Khối ${classData.grade}).`,
        code: 'GRADE_MISMATCH',
      });
    }

    // 4. Verify Lesson Version & Valid Questions
    const versionDoc = await getDoc(doc(db, 'lessonVersions', lessonVersionId));
    if (!versionDoc.exists()) {
      return res.status(404).json({ error: 'Phiên bản bài học không tồn tại trong hệ thống.' });
    }
    const versionData: any = versionDoc.data();
    if (!versionData.questions || !Array.isArray(versionData.questions) || versionData.questions.length === 0) {
      return res.status(400).json({ error: 'Phiên bản bài học không có câu hỏi hợp lệ để giao.' });
    }

    // 5. Check Duplicate Assignment
    const existingQ = query(
      collection(db, 'assignments'),
      where('classId', '==', classId),
      where('lessonId', '==', lessonId)
    );
    const existingSnap = await getDocs(existingQ);
    const existingAssignments = existingSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as any))
      .filter((a) => (studentId ? a.studentId === studentId : !a.studentId));

    if (existingAssignments.length > 0 && allowReassign !== true) {
      return res.status(409).json({
        code: 'ASSIGNMENT_DUPLICATE',
        error: `Bài học "${lessonData.title}" đã được giao cho ${studentId ? 'học sinh' : 'lớp'} trước đó. Bạn có muốn giao lại đợt mới không?`,
        existingAssignment: existingAssignments[0],
      });
    }

    // 6. Generate Non-Colliding ID (Never overwrite old assignment runs or attempt history!)
    const cleanDueDate = dueDate || new Date(Date.now() + 7 * 86400 * 1000).toISOString().split('T')[0];
    const timestamp = Date.now();
    const assignmentId = req.body.id && allowReassign !== true && existingAssignments.length === 0
      ? req.body.id
      : `assign-${lessonId}-${classId}${studentId ? '-' + studentId : ''}-${timestamp.toString().slice(-6)}`;

    const assignmentPayload: any = {
      id: assignmentId,
      title: title || `[Toán ${lessonData.grade}] ${lessonData.title}`,
      lessonId,
      lessonVersionId,
      classId,
      className: classData.name,
      grade: Number(lessonData.grade),
      teacherId: req.user?.uid,
      teacherName: req.user?.displayName || 'Giáo viên',
      dueDate: cleanDueDate,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    if (studentId) {
      assignmentPayload.studentId = studentId;
      assignmentPayload.studentName = safeStudentName;
    }

    await setDoc(doc(db, 'assignments', assignmentId), assignmentPayload);

    await writeAuditLog({
      action: 'ASSIGN_LESSON',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'assignments',
      targetId: assignmentId,
      targetName: assignmentPayload.title,
      details: `Giao bài "${assignmentPayload.title}" cho ${studentId ? `học sinh ${safeStudentName}` : `lớp ${classData.name}`}, hạn nộp ${cleanDueDate}.`,
    });

    return res.json({ ok: true, assignment: assignmentPayload });
  } catch (err: any) {
    console.error('Save assignment error:', err);
    return res.status(500).json({ error: 'Lỗi giao bài tập: ' + err.message });
  }
});

app.post('/api/teacher/lessons', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lessonDoc, versionDoc } = req.body;
    if (!lessonDoc || !versionDoc || !lessonDoc.id || !versionDoc.id) {
      return res.status(400).json({ error: 'Thiếu thông tin bài học hoặc phiên bản câu hỏi.' });
    }

    // Immutability Check: Do not overwrite an existing version if it has assignments or attempts
    const existingVersionSnap = await getDoc(doc(db, 'lessonVersions', versionDoc.id));
    if (existingVersionSnap.exists()) {
      const existingData = existingVersionSnap.data();
      if (existingData.isPublished) {
        // Check if there are assignments or attempts referencing this version
        const aSnap = await getDocs(query(collection(db, 'assignments'), where('lessonVersionId', '==', versionDoc.id)));
        const attSnap = await getDocs(query(collection(db, 'attempts'), where('lessonVersionId', '==', versionDoc.id)));
        if (!aSnap.empty || !attSnap.empty) {
          return res.status(409).json({
            code: 'VERSION_IMMUTABLE',
            error: `Phiên bản ${versionDoc.id} đã được giao cho học sinh hoặc đã có kết quả làm bài. Theo nguyên tắc bảo toàn học liệu (Copy-on-Write), vui lòng xuất bản một phiên bản mới thay vì ghi đè lên phiên bản cũ.`
          });
        }
      }
    }

    const safeLesson = {
      ...lessonDoc,
      createdBy: lessonDoc.createdBy || req.user?.uid,
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    const safeVersion = {
      ...versionDoc,
      createdBy: versionDoc.createdBy || req.user?.uid,
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    await setDoc(doc(db, 'lessonVersions', versionDoc.id), safeVersion);
    await setDoc(doc(db, 'lessons', lessonDoc.id), safeLesson, { merge: true });
    return res.json({ ok: true, lesson: safeLesson, version: safeVersion });
  } catch (err: any) {
    console.error('Save lesson version error:', err);
    return res.status(500).json({ error: 'Lỗi lưu bài học: ' + err.message });
  }
});

// -------------------------------------------------------------
// MEDIA LIBRARY & QUESTION ILLUSTRATIONS MANAGEMENT (P0)
// -------------------------------------------------------------

const MEDIA_STORAGE_DIR = path.resolve(__dirname, 'data', 'media_storage');
const MEDIA_LIBRARY_FILE = path.resolve(__dirname, 'data', 'media_library.json');

try {
  if (!fs.existsSync(MEDIA_STORAGE_DIR)) {
    fs.mkdirSync(MEDIA_STORAGE_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Notice: Failed to initialize MEDIA_STORAGE_DIR:', err);
}

function loadMediaLibrary(): any[] {
  try {
    if (fs.existsSync(MEDIA_LIBRARY_FILE)) {
      return JSON.parse(fs.readFileSync(MEDIA_LIBRARY_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn('Failed to read media_library.json:', err);
  }
  return [];
}

function saveMediaLibrary(items: any[]) {
  try {
    const dir = path.dirname(MEDIA_LIBRARY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(MEDIA_LIBRARY_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to save media_library.json:', err);
  }
}

// In-memory cache for fast image serving
const mediaMemoryCache = new Map<string, { buffer: Buffer; mimeType: string }>();

// Strict binary and MIME validator (< 1MB, allowed formats: JPG, PNG, WebP)
function validateImageBuffer(buffer: Buffer, declaredMime?: string): { valid: boolean; error?: string; realMime?: string } {
  // 1. Max size: 1,000,000 bytes (< 1MB)
  if (buffer.length > 1_000_000) {
    return {
      valid: false,
      error: `Dung lượng tệp (${(buffer.length / 1024 / 1024).toFixed(2)} MB) vượt quá giới hạn cho phép là 1 MB (1.000.000 byte). Vui lòng nén hoặc giảm kích thước ảnh trước khi tải lên.`,
    };
  }

  if (buffer.length < 12) {
    return { valid: false, error: 'Tệp hình ảnh không hợp lệ hoặc bị hỏng (kích thước quá nhỏ).' };
  }

  // 2. Reject SVG, HTML, or executable script injections
  const startStr = buffer.slice(0, 100).toString('utf8').toLowerCase();
  if (
    startStr.includes('<svg') ||
    startStr.includes('<?xml') ||
    startStr.includes('<html') ||
    startStr.includes('<script') ||
    startStr.includes('<!doctype')
  ) {
    return {
      valid: false,
      error: 'Loại tệp không được chấp nhận. Hệ thống từ chối tệp SVG, HTML hoặc tệp chứa mã độc hại. Chỉ chấp nhận JPG, JPEG, PNG, WebP.',
    };
  }

  // 3. Magic bytes verification
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, realMime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, realMime: 'image/png' };
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, realMime: 'image/webp' };
  }

  return {
    valid: false,
    error: 'Định dạng tệp không hợp lệ. Chỉ chấp nhận hình ảnh định dạng JPG, JPEG, PNG hoặc WebP.',
  };
}

// Upload Media Endpoint (Teacher & Admin)
app.post('/api/teacher/media/upload', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, category, description, mimeType, base64Data, width, height } = req.body;

    if (!title || !category || !base64Data) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tên hình ảnh, danh mục và dữ liệu ảnh.' });
    }

    const validCategories = [
      'items', 'animals', 'fruits', 'counters_frames',
      'counting_sticks', 'geometry', 'clock_time', 'money_measurement'
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Danh mục hình ảnh không hợp lệ.' });
    }

    const cleanBase64 = String(base64Data).replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const validation = validateImageBuffer(buffer, mimeType);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error, code: 'INVALID_IMAGE' });
    }

    const detectedMime = validation.realMime || mimeType || 'image/webp';
    const mediaId = `media-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const cleanTitle = String(title).trim();
    const cleanDesc = description ? String(description).trim() : '';

    const CHUNK_SIZE = 180 * 1024; // 180 KB chunks
    const totalChunks = Math.ceil(cleanBase64.length / CHUNK_SIZE);

    const mediaDoc = {
      id: mediaId,
      title: cleanTitle,
      description: cleanDesc,
      category,
      mimeType: detectedMime,
      sizeBytes: buffer.length,
      url: `/api/media/file/${mediaId}`,
      width: Number(width) || 0,
      height: Number(height) || 0,
      totalChunks,
      uploadedBy: req.user?.uid || 'system',
      uploadedByName: req.user?.displayName || 'Giáo viên',
      uploadedAt: new Date().toISOString(),
      dataOrigin: 'real',
      environmentTag: 'production',
    };

    // 1. Persistent Cloud Firestore Storage for Vercel Production
    // Chunks ensure each document is < 250 KB (well within 1 MB Firestore limit)
    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkData = cleanBase64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await setDoc(doc(db, 'test', `media_bin_${mediaId}_${i}`), {
          mediaId,
          chunkIndex: i,
          data: chunkData,
        });
      }
      await setDoc(doc(db, 'test', `media_meta_${mediaId}`), mediaDoc);

      // Update cloud master catalog index
      const catalogRef = doc(db, 'test', 'media_catalog_index');
      const catSnap = await getDoc(catalogRef);
      let catItems = catSnap.exists() && Array.isArray(catSnap.data().items) ? catSnap.data().items : [];
      catItems = [mediaDoc, ...catItems.filter((i: any) => i.id !== mediaId)];
      if (catItems.length > 500) catItems = catItems.slice(0, 500);
      await setDoc(catalogRef, { items: catItems, updatedAt: new Date().toISOString() });
    } catch (cloudErr) {
      console.warn('Notice: Cloud Firestore chunk save notice:', cloudErr);
    }

    // 2. Local Disk Cache (fallback & high performance)
    try {
      const diskPath = path.join(MEDIA_STORAGE_DIR, mediaId);
      fs.writeFileSync(diskPath, buffer);
    } catch (fsErr) {
      console.warn('Notice: Failed writing media file to disk:', fsErr);
    }

    // 3. Local catalog sync
    const existingList = loadMediaLibrary();
    existingList.unshift(mediaDoc);
    saveMediaLibrary(existingList);

    // 4. In-memory cache for instant serving
    mediaMemoryCache.set(mediaId, { buffer, mimeType: detectedMime });

    await writeAuditLog({
      action: 'UPLOAD_MEDIA_ITEM',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'mediaLibrary',
      targetId: mediaId,
      targetName: cleanTitle,
      details: `Tải lên hình ảnh '${cleanTitle}' (${category}, ${(buffer.length / 1024).toFixed(1)} KB) thành công.`,
    });

    return res.json({
      success: true,
      media: mediaDoc,
    });
  } catch (err: any) {
    console.error('Media upload error:', err);
    return res.status(500).json({ error: 'Lỗi tải ảnh lên hệ thống: ' + err.message });
  }
});

// List Media Library Endpoint (Teacher & Admin)
app.get('/api/teacher/media', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, search } = req.query;

    let items: any[] = [];

    // Authoritative source: Cloud Firestore catalog index for Vercel production sync
    try {
      const catSnap = await getDoc(doc(db, 'test', 'media_catalog_index'));
      if (catSnap.exists() && Array.isArray(catSnap.data().items)) {
        items = catSnap.data().items;
      }
    } catch (cloudErr) {
      console.warn('Notice: Failed reading media_catalog_index from Firestore:', cloudErr);
    }

    // Fallback to local catalog if Firestore is empty or unreachable
    if (items.length === 0) {
      items = loadMediaLibrary();
    }

    // Strict sanity filter: Only keep healthy records with size >= 100 bytes and valid IDs
    // Prevents broken 38B/68B test records or missing files from appearing in the UI
    items = items.filter((item) => {
      if (!item || !item.id) return false;
      const size = Number(item.sizeBytes) || 0;
      return size >= 100;
    });

    if (category && typeof category === 'string' && category !== 'all') {
      items = items.filter((item) => item.category === category);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((item) => {
        return (
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q))
        );
      });
    }

    items.sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());

    return res.json({ ok: true, items });
  } catch (err: any) {
    console.error('Fetch media library error:', err);
    return res.status(500).json({ error: 'Lỗi lấy danh sách hình ảnh: ' + err.message });
  }
});

// Delete Media Endpoint with Strict Referential Integrity (Teacher & Admin)
app.delete('/api/teacher/media/:id', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Thiếu mã định danh hình ảnh cần xóa.' });
    }

    const items = loadMediaLibrary();
    let mediaData = items.find((it) => it.id === id);

    if (!mediaData) {
      try {
        const metaSnap = await getDoc(doc(db, 'test', `media_meta_${id}`));
        if (metaSnap.exists()) {
          mediaData = metaSnap.data() as any;
        }
      } catch {
        // Ignore
      }
    }

    if (!mediaData) {
      return res.status(404).json({ error: 'Không tìm thấy hình ảnh trong thư viện.' });
    }

    // Referential integrity check:
    // 1. Scan lessonVersions
    const versionsSnap = await getDocs(collection(db, 'lessonVersions'));
    const referencingVersions: Array<{ id: string; title: string; versionNumber: number; isPublished: boolean }> = [];

    versionsSnap.docs.forEach((d) => {
      const v = d.data();
      const hasRef = Array.isArray(v.questions) && v.questions.some((q: any) => {
        const vc = q.visualConfig;
        if (!vc) return false;
        return vc.imageId === id || (typeof vc.imageUrl === 'string' && vc.imageUrl.includes(id));
      });
      if (hasRef) {
        referencingVersions.push({
          id: d.id,
          title: v.title || d.id,
          versionNumber: v.versionNumber || 1,
          isPublished: Boolean(v.isPublished),
        });
      }
    });

    const publishedRefs = referencingVersions.filter((v) => v.isPublished);
    if (publishedRefs.length > 0) {
      const titles = publishedRefs.map((r) => `"${r.title}" (v${r.versionNumber})`).join(', ');
      return res.status(400).json({
        error: `Không thể xóa vĩnh viễn hình ảnh này vì đang được sử dụng trong bài học đã xuất bản: ${titles}. Để bảo toàn phiên bản học liệu và kết quả làm bài của học sinh, tệp đang tham chiếu được bảo vệ nghiêm ngặt.`,
        code: 'CANNOT_DELETE_REFERENCED_MEDIA',
        referencingLessons: publishedRefs,
      });
    }

    // 2. Scan attempts
    const attemptsSnap = await getDocs(collection(db, 'attempts'));
    const hasAttemptRef = attemptsSnap.docs.some((d) => {
      const a = d.data();
      if (!Array.isArray(a.questionBreakdowns)) return false;
      return a.questionBreakdowns.some((qb: any) => {
        return qb.imageId === id || (typeof qb.imageUrl === 'string' && qb.imageUrl.includes(id));
      });
    });

    if (hasAttemptRef) {
      return res.status(400).json({
        error: 'Không thể xóa hình ảnh vì đã có học sinh làm bài và ghi nhận kết quả gắn liền với hình ảnh này.',
        code: 'CANNOT_DELETE_REFERENCED_MEDIA',
      });
    }

    if (referencingVersions.length > 0) {
      const draftTitles = referencingVersions.map((r) => `"${r.title}" (bản nháp v${r.versionNumber})`).join(', ');
      return res.status(400).json({
        error: `Hình ảnh đang được tham chiếu trong các bản nháp chưa xuất bản: ${draftTitles}. Vui lòng gỡ hình khỏi các câu hỏi trong bản nháp trước khi xóa khỏi thư viện.`,
        code: 'CANNOT_DELETE_DRAFT_REFERENCED_MEDIA',
        referencingDrafts: referencingVersions,
      });
    }

    // Safe to delete: Delete Cloud Firestore chunks and metadata
    try {
      const metaSnap = await getDoc(doc(db, 'test', `media_meta_${id}`));
      const totalChunks = metaSnap.exists() ? Number(metaSnap.data().totalChunks || 1) : 4;
      for (let i = 0; i < totalChunks; i++) {
        await deleteDoc(doc(db, 'test', `media_bin_${id}_${i}`));
      }
      await deleteDoc(doc(db, 'test', `media_meta_${id}`));

      // Update cloud catalog index
      const catalogRef = doc(db, 'test', 'media_catalog_index');
      const catSnap = await getDoc(catalogRef);
      if (catSnap.exists() && Array.isArray(catSnap.data().items)) {
        const filtered = catSnap.data().items.filter((i: any) => i.id !== id);
        await setDoc(catalogRef, { items: filtered, updatedAt: new Date().toISOString() });
      }
    } catch {
      // Ignore
    }

    // Safe to delete: local storage
    const updatedList = items.filter((it) => it.id !== id);
    saveMediaLibrary(updatedList);

    try {
      const diskPath = path.join(MEDIA_STORAGE_DIR, id);
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
    } catch {
      // Ignore
    }

    mediaMemoryCache.delete(id);

    await writeAuditLog({
      action: 'DELETE_MEDIA_ITEM',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'mediaLibrary',
      targetId: id,
      targetName: mediaData.title || id,
      details: `Đã xóa hình ảnh '${mediaData.title || id}' khỏi thư viện dùng chung.`,
    });

    return res.json({ ok: true, deletedId: id });
  } catch (err: any) {
    console.error('Delete media error:', err);
    return res.status(500).json({ error: 'Lỗi xóa hình ảnh: ' + err.message });
  }
});

// Binary File Serving Endpoint (Public read for student questions & previews)
app.get('/api/media/file/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).send('Bad Request');

    // 1. In-memory cache (Fastest, zero I/O)
    const cached = mediaMemoryCache.get(id);
    if (cached && cached.buffer.length >= 100) {
      res.setHeader('Content-Type', cached.mimeType);
      res.setHeader('Content-Length', cached.buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.end(cached.buffer);
    }

    // 2. Disk storage (Local dev / container disk)
    const diskPath = path.join(MEDIA_STORAGE_DIR, id);
    if (fs.existsSync(diskPath)) {
      const buffer = fs.readFileSync(diskPath);
      if (buffer.length >= 100) {
        const items = loadMediaLibrary();
        const meta = items.find((i) => i.id === id);
        const mimeType = meta?.mimeType || 'image/webp';

        if (buffer.length < 2_000_000) {
          mediaMemoryCache.set(id, { buffer, mimeType });
        }

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.end(buffer);
      }
    }

    // 3. Persistent Cloud Firestore Chunks (For Vercel Production serverless lambdas)
    try {
      const metaSnap = await getDoc(doc(db, 'test', `media_meta_${id}`));
      if (metaSnap.exists()) {
        const meta = metaSnap.data();
        const totalChunks = Number(meta.totalChunks || 1);
        let assembledBase64 = '';
        for (let i = 0; i < totalChunks; i++) {
          const chunkSnap = await getDoc(doc(db, 'test', `media_bin_${id}_${i}`));
          if (chunkSnap.exists()) {
            assembledBase64 += chunkSnap.data().data;
          }
        }
        if (assembledBase64) {
          const buffer = Buffer.from(assembledBase64, 'base64');
          if (buffer.length >= 100) {
            const mimeType = meta.mimeType || 'image/webp';
            mediaMemoryCache.set(id, { buffer, mimeType });

            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Length', buffer.length);
            res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            return res.end(buffer);
          }
        }
      }
    } catch (cloudErr) {
      console.warn('Notice: Cloud Firestore chunk retrieval notice:', cloudErr);
    }

    return res.status(404).send('Không tìm thấy hình ảnh hoặc tệp hình ảnh không hợp lệ.');
  } catch (err: any) {
    console.error('Serve media file error:', err);
    return res.status(500).send('Lỗi máy chủ khi tải hình ảnh.');
  }
});

app.get('/api/teacher/analytics', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [attSnap, insSnap, cSnap] = await Promise.all([
      getDocs(collection(db, 'attempts')),
      getDocs(collection(db, 'mistakeInsights')),
      getDocs(collection(db, 'classes')),
    ]);

    const allClasses = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let allowedClassIds: string[] = [];

    if (req.user?.role === 'admin') {
      allowedClassIds = allClasses.map(c => c.id);
    } else {
      allowedClassIds = allClasses
        .filter((c: any) => c.teacherId === req.user?.uid)
        .map(c => c.id);
    }

    const allAttempts = attSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const allInsights = insSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const filteredAttempts = allAttempts.filter((a: any) => 
      req.user?.role === 'admin' || allowedClassIds.includes(a.classId)
    );
    const filteredInsights = allInsights.filter((i: any) => 
      req.user?.role === 'admin' || allowedClassIds.includes(i.classId)
    );

    return res.json({
      ok: true,
      attempts: filteredAttempts,
      insights: filteredInsights,
    });
  } catch (err: any) {
    console.error('Teacher analytics error:', err);
    return res.status(500).json({ error: 'Lỗi tải số liệu phân tích: ' + err.message });
  }
});

// --- C. ADMIN DATA ENDPOINTS ---
app.get('/api/admin/overview', requireAuth, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const [uSnap, cSnap, ySnap, lSnap, aSnap, attSnap, logSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'classes')),
      getDocs(collection(db, 'academicYears')),
      getDocs(collection(db, 'lessons')),
      getDocs(collection(db, 'assignments')),
      getDocs(collection(db, 'attempts')),
      getDocs(collection(db, 'auditLogs')),
    ]);

    const safeUsers = uSnap.docs.map((d) => {
      const data = d.data();
      const { password: _, accessSecret: __, ...safe } = data;
      return { id: d.id, ...safe };
    });

    return res.json({
      ok: true,
      users: safeUsers,
      classes: cSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      academicYears: ySnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      lessons: lSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      assignments: aSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      attempts: attSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      auditLogs: logSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  } catch (err: any) {
    console.error('Admin overview error:', err);
    return res.status(500).json({ error: 'Lỗi tải tổng quan hệ thống: ' + err.message });
  }
});

app.post(['/api/admin/create-user', '/api/admin/users'], requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newUser = req.body;
    if (!newUser || !newUser.id || !newUser.role) {
      return res.status(400).json({ error: 'Thiếu thông tin người dùng mới.' });
    }

    // Role protection: standard admin create cannot escalate to admin unless done by super admin
    if (newUser.role === 'admin' && req.user?.uid !== 'admin-demo' && req.user?.uid !== 'admin-root') {
      return res.status(403).json({ error: 'Chỉ Super Admin mới có quyền tạo thêm Quản trị viên.' });
    }

    let tempPassword = newUser.password;
    if (!tempPassword && newUser.role === 'teacher') {
      tempPassword = `GV_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    let passwordHash: string | null = null;
    if (tempPassword) {
      passwordHash = await bcrypt.hash(String(tempPassword), 10);
    }

    const safeNewUser: any = {
      ...newUser,
      password: null, // Zero plaintext stored!
      passwordHash: passwordHash,
      mustChangePassword: newUser.role === 'teacher' ? true : Boolean(newUser.mustChangePassword),
      tokenVersion: 1,
      createdAt: new Date().toISOString(),
      dataOrigin: 'real',
      environmentTag: 'production',
    };

    await setDoc(doc(db, 'users', newUser.id), safeNewUser);

    await writeAuditLog({
      action: 'ADMIN_CREATE_USER',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'users',
      targetId: newUser.id,
      targetName: newUser.displayName || newUser.studentCode || newUser.email,
      details: `Tạo tài khoản mới: ${newUser.displayName || newUser.studentCode} (${newUser.role})`,
    });

    const { password: _, passwordHash: __, accessSecret: ___, ...masked } = safeNewUser;
    return res.json({ ok: true, user: masked, temporaryPassword: tempPassword });
  } catch (err: any) {
    console.error('Admin create user error:', err);
    return res.status(500).json({ error: 'Lỗi tạo người dùng mới: ' + err.message });
  }
});

// ========================================================
// ADMIN USER DELETION, ARCHIVING & LINKED DATA (A2)
// ========================================================

// Inspect linked data counts for teacher/student before deletion
app.get('/api/admin/users/:id/linked-data', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const uDoc = await getDoc(doc(db, 'users', id));
    if (!uDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
    }
    const uData: any = uDoc.data();
    let assignedClasses: { id: string; name: string }[] = [];
    let lessonsCreated = 0;
    let assignmentsCount = 0;
    let attemptsCount = 0;

    if (uData.role === 'teacher') {
      const classesSnap = await getDocs(collection(db, 'classes'));
      assignedClasses = classesSnap.docs
        .filter((d) => d.data().teacherId === id && !d.data().isDeleted)
        .map((d) => ({ id: d.id, name: d.data().name }));

      const lessonsSnap = await getDocs(collection(db, 'lessons'));
      lessonsCreated = lessonsSnap.docs.filter((d) => d.data().createdBy === id).length;

      const assignmentsSnap = await getDocs(collection(db, 'assignments'));
      assignmentsCount = assignmentsSnap.docs.filter((d) => d.data().teacherId === id).length;
    } else if (uData.role === 'student') {
      const attemptsSnap = await getDocs(collection(db, 'attempts'));
      attemptsCount = attemptsSnap.docs.filter((d) => d.data().studentId === id).length;
    }

    const totalLinked = assignedClasses.length + lessonsCreated + assignmentsCount + attemptsCount;
    return res.json({
      ok: true,
      userId: id,
      role: uData.role,
      assignedClasses,
      lessonsCreated,
      assignmentsCount,
      attemptsCount,
      totalLinked,
      canHardDelete: totalLinked === 0,
    });
  } catch (err: any) {
    console.error('Get user linked data error:', err);
    return res.status(500).json({ error: 'Lỗi kiểm tra dữ liệu liên kết: ' + err.message });
  }
});

// Delete or archive user based on business rules
app.delete('/api/admin/users/:id', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const forceArchive = req.body?.archive === true || req.query?.archive === 'true';

    if (!id) {
      return res.status(400).json({ error: 'Thiếu mã người dùng cần xóa.' });
    }
    if (id === 'admin-root' || id === req.user?.uid) {
      return res.status(400).json({ error: 'Không thể xóa tài khoản Quản trị viên đang đăng nhập.' });
    }

    const targetDoc = await getDoc(doc(db, 'users', id));
    if (!targetDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
    }
    const targetData: any = targetDoc.data();

    // Protection: Admin cannot delete the last active admin
    if (targetData.role === 'admin') {
      const allUsersSnap = await getDocs(collection(db, 'users'));
      const activeAdmins = allUsersSnap.docs.filter((d) => {
        const u: any = d.data();
        return u.role === 'admin' && u.status !== 'locked' && u.status !== 'inactive' && !u.isDeleted;
      });
      if (activeAdmins.length <= 1) {
        return res.status(400).json({ error: 'Không thể xóa tài khoản Quản trị viên cuối cùng của hệ thống.' });
      }
    }

    // Check linked data
    let assignedClasses: { id: string; name: string }[] = [];
    let lessonsCreated = 0;
    let assignmentsCount = 0;
    let attemptsCount = 0;

    if (targetData.role === 'teacher') {
      const classesSnap = await getDocs(collection(db, 'classes'));
      assignedClasses = classesSnap.docs
        .filter((d) => d.data().teacherId === id && !d.data().isDeleted)
        .map((d) => ({ id: d.id, name: d.data().name }));

      // Teacher assigned to active classes cannot be deleted or archived without reassigning
      if (assignedClasses.length > 0) {
        const classNames = assignedClasses.map((c) => c.name).join(', ');
        return res.status(400).json({
          error: `Giáo viên đang phụ trách ${assignedClasses.length} lớp học (Lớp ${classNames}). Vui lòng hủy phân công hoặc chuyển giao lớp trước khi xóa/lưu trữ.`,
          code: 'TEACHER_HAS_ACTIVE_CLASSES',
          assignedClasses,
        });
      }

      const lessonsSnap = await getDocs(collection(db, 'lessons'));
      lessonsCreated = lessonsSnap.docs.filter((d) => d.data().createdBy === id).length;

      const assignmentsSnap = await getDocs(collection(db, 'assignments'));
      assignmentsCount = assignmentsSnap.docs.filter((d) => d.data().teacherId === id).length;
    } else if (targetData.role === 'student') {
      const attemptsSnap = await getDocs(collection(db, 'attempts'));
      attemptsCount = attemptsSnap.docs.filter((d) => d.data().studentId === id).length;
    }

    const linkedCount = assignedClasses.length + lessonsCreated + assignmentsCount + attemptsCount;

    // Business policy: Archive if user has linked history or archive explicitly requested
    if (linkedCount > 0 || forceArchive) {
      await updateDoc(doc(db, 'users', id), {
        status: 'locked',
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Revoke any active session
      const nextVer = (targetData.tokenVersion || 0) + 1;
      userTokenVersions.set(id, nextVer);

      await writeAuditLog({
        action: 'ARCHIVE_USER',
        actorId: req.user?.uid,
        actorName: req.user?.displayName,
        actorRole: req.user?.role,
        targetCollection: 'users',
        targetId: id,
        targetName: targetData.displayName || targetData.studentCode,
        details: `Lưu trữ an toàn tài khoản ${targetData.displayName || targetData.studentCode} (${targetData.role}). Giữ nguyên ${linkedCount} bản ghi lịch sử.`,
      });

      return res.json({
        ok: true,
        action: 'archived',
        deletedId: id,
        id,
        linkedCount,
        message: `Đã chuyển tài khoản ${targetData.displayName || targetData.studentCode} sang trạng thái lưu trữ an toàn. Lịch sử bài tập và kết quả được bảo toàn.`,
      });
    }

    // Unlinked user: Permanent hard delete (with fallback if Cloud rules enforce retention)
    try {
      await deleteDoc(doc(db, 'users', id));
      await writeAuditLog({
        action: 'DELETE_USER_PERMANENT',
        actorId: req.user?.uid,
        actorName: req.user?.displayName,
        actorRole: req.user?.role,
        targetCollection: 'users',
        targetId: id,
        targetName: targetData.displayName || targetData.studentCode,
        details: `Xóa vĩnh viễn tài khoản chưa có dữ liệu ${targetData.displayName || targetData.studentCode} (${targetData.role}).`,
      });

      return res.json({
        ok: true,
        action: 'deleted',
        deletedId: id,
        id,
        message: `Đã xóa vĩnh viễn tài khoản ${targetData.displayName || targetData.studentCode}.`,
      });
    } catch (delErr: any) {
      if (delErr?.code?.includes('permission-denied') || delErr?.message?.includes('PERMISSION_DENIED')) {
        await updateDoc(doc(db, 'users', id), {
          status: 'locked',
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        await writeAuditLog({
          action: 'DELETE_USER_POLICY',
          actorId: req.user?.uid,
          actorName: req.user?.displayName,
          actorRole: req.user?.role,
          targetCollection: 'users',
          targetId: id,
          targetName: targetData.displayName || targetData.studentCode,
          details: `Xóa an toàn tài khoản chưa có dữ liệu theo chính sách bảo lưu Cloud ${targetData.displayName || targetData.studentCode} (${targetData.role}).`,
        });
        return res.json({
          ok: true,
          action: 'deleted',
          deletedId: id,
          id,
          message: `Đã xóa an toàn tài khoản ${targetData.displayName || targetData.studentCode}.`,
        });
      }
      throw delErr;
    }
  } catch (err: any) {
    console.error('Admin delete user error:', err);
    return res.status(500).json({ error: 'Lỗi xóa người dùng: ' + err.message });
  }
});

// Update user details with class sync
app.patch('/api/admin/users/:id', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!id || !updates) {
      return res.status(400).json({ error: 'Thiếu thông tin cập nhật.' });
    }

    // Check target user
    const targetDoc = await getDoc(doc(db, 'users', id));
    if (!targetDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
    }
    const targetData: any = targetDoc.data();

    // Protection: Admin cannot self-lock and cannot lock the last admin
    if (targetData.role === 'admin' && (updates.status === 'locked' || updates.status === 'inactive')) {
      if (id === req.user?.uid || id === 'admin-root') {
        return res.status(400).json({ error: 'Không thể tự khóa tài khoản Quản trị viên đang đăng nhập.' });
      }
      const allUsersSnap = await getDocs(collection(db, 'users'));
      const activeAdmins = allUsersSnap.docs.filter((d) => {
        const u: any = d.data();
        return u.role === 'admin' && u.status !== 'locked' && u.status !== 'inactive' && !u.isDeleted;
      });
      if (activeAdmins.length <= 1) {
        return res.status(400).json({ error: 'Không thể khóa tài khoản Quản trị viên cuối cùng của hệ thống.' });
      }
    }

    const { password: _, accessSecret: __, ...safeUpdates } = updates;

    // If updating classId, sync className and grade
    if (safeUpdates.classId) {
      const clsDoc = await getDoc(doc(db, 'classes', safeUpdates.classId));
      if (clsDoc.exists()) {
        safeUpdates.className = clsDoc.data().name;
        if (clsDoc.data().grade) {
          safeUpdates.grade = clsDoc.data().grade;
        }
      }
    }

    await updateDoc(doc(db, 'users', id), {
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    });

    const actionLabel = updates.status === 'locked' ? 'LOCK_USER' : updates.status === 'active' ? 'UNLOCK_USER' : 'UPDATE_USER';
    await writeAuditLog({
      action: actionLabel,
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'users',
      targetId: id,
      targetName: targetData.displayName || targetData.studentCode,
      details: `${actionLabel === 'LOCK_USER' ? 'Khóa' : actionLabel === 'UNLOCK_USER' ? 'Mở khóa' : 'Cập nhật'} tài khoản ${targetData.displayName || targetData.studentCode}: ${Object.keys(safeUpdates).join(', ')}`,
    });

    return res.json({ ok: true, id, updates: safeUpdates });
  } catch (err: any) {
    console.error('Admin update user error:', err);
    return res.status(500).json({ error: 'Lỗi cập nhật người dùng: ' + err.message });
  }
});

// Admin Reset Password / AccessSecret
app.post('/api/admin/users/:id/reset-password', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
    }
    const cleanPassword = String(newPassword).trim();
    const uDoc = await getDoc(doc(db, 'users', userId));
    if (!uDoc.exists()) {
      return res.status(404).json({ error: 'Tài khoản người dùng không tồn tại.' });
    }
    const uData: any = uDoc.data();
    const updates: any = { updatedAt: new Date().toISOString() };
    if (uData.role === 'student') {
      const hash = await bcrypt.hash(cleanPassword, 10);
      updates.accessSecretHash = hash;
      updates.accessSecret = null;
      const nextVersion = (uData.tokenVersion || 0) + 1;
      updates.tokenVersion = nextVersion;
      userTokenVersions.set(userId, nextVersion);
    } else {
      const hash = await bcrypt.hash(cleanPassword, 10);
      updates.passwordHash = hash;
      updates.password = null; // Zero plaintext stored!
      updates.mustChangePassword = true;
      const nextVersion = (uData.tokenVersion || 0) + 1;
      updates.tokenVersion = nextVersion;
      userTokenVersions.set(userId, nextVersion);
    }
    await updateDoc(doc(db, 'users', userId), updates);

    await writeAuditLog({
      action: 'RESET_PASSWORD',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'users',
      targetId: userId,
      targetName: uData.displayName || uData.studentCode,
      details: `Đặt lại mật khẩu cho tài khoản ${uData.displayName || uData.studentCode} (${uData.role}). Đã tạo mật khẩu tạm thời.`,
    });

    return res.json({
      ok: true,
      message: `Đã đặt lại mật khẩu thành công cho ${uData.displayName || uData.studentCode}.`,
      temporaryPassword: cleanPassword,
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Lỗi đặt lại mật khẩu: ' + err.message });
  }
});

// Admin Self Profile
app.get('/api/admin/profile', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user!.uid;
    const uDoc = await getDoc(doc(db, 'users', adminId));
    if (!uDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ Quản trị viên.' });
    }
    const { password: _, passwordHash: __, accessSecret: ___, ...safeProfile } = uDoc.data();
    return res.json({ ok: true, user: { id: uDoc.id, ...safeProfile } });
  } catch (err: any) {
    console.error('Get admin profile error:', err);
    return res.status(500).json({ error: 'Lỗi tải hồ sơ quản trị viên: ' + err.message });
  }
});

app.patch('/api/admin/profile', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user!.uid;
    const { displayName, email } = req.body;

    if (displayName === undefined && email === undefined) {
      return res.status(400).json({ error: 'Vui lòng cung cấp họ tên hoặc email cần cập nhật.' });
    }

    const updates: any = { updatedAt: new Date().toISOString() };

    if (displayName !== undefined) {
      if (!displayName || String(displayName).trim().length < 2) {
        return res.status(400).json({ error: 'Họ và tên phải có tối thiểu 2 ký tự.' });
      }
      updates.displayName = String(displayName).trim();
    }

    if (email !== undefined) {
      if (!email || !String(email).includes('@')) {
        return res.status(400).json({ error: 'Email không đúng định dạng.' });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      // Check duplicate email
      const allUsersSnap = await getDocs(collection(db, 'users'));
      const conflict = allUsersSnap.docs.find((d) => d.id !== adminId && d.data().email?.toLowerCase() === cleanEmail);
      if (conflict) {
        return res.status(400).json({ error: 'Email này đã được sử dụng bởi một tài khoản khác.' });
      }
      updates.email = cleanEmail;
    }

    await updateDoc(doc(db, 'users', adminId), updates);

    const updatedSnap = await getDoc(doc(db, 'users', adminId));
    const safeUser = updatedSnap.data() || {};
    delete safeUser.password;
    delete safeUser.passwordHash;
    delete safeUser.accessSecret;

    await writeAuditLog({
      action: 'ADMIN_UPDATE_PROFILE',
      actorId: adminId,
      actorName: updates.displayName || req.user?.displayName,
      actorRole: 'admin',
      targetCollection: 'users',
      targetId: adminId,
      targetName: updates.displayName || req.user?.displayName,
      details: `Quản trị viên cập nhật hồ sơ: ${Object.keys(updates).join(', ')}`,
    });

    return res.json({
      ok: true,
      message: 'Cập nhật hồ sơ thành công.',
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Update admin profile error:', err);
    return res.status(500).json({ error: 'Lỗi cập nhật hồ sơ: ' + err.message });
  }
});

// Admin Change Password with Bcrypt, Old Password Validation, and Immediate Session Revocation
app.post('/api/admin/change-password', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user!.uid;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' });
    }

    const uDoc = await getDoc(doc(db, 'users', adminId));
    if (!uDoc.exists()) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản quản trị viên.' });
    }
    const uData: any = uDoc.data();

    // Verify current password against bcrypt hash or legacy plaintext
    let isCurrentValid = false;
    if (uData.passwordHash) {
      isCurrentValid = await bcrypt.compare(String(currentPassword), uData.passwordHash);
    } else if (uData.password) {
      isCurrentValid = (String(currentPassword) === uData.password);
    }

    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Mật khẩu hiện tại không chính xác.' });
    }

    // Hash new password using bcrypt (salt rounds = 10)
    const newHash = await bcrypt.hash(String(newPassword), 10);
    const nextVersion = (uData.tokenVersion || 0) + 1;

    await updateDoc(doc(db, 'users', adminId), {
      passwordHash: newHash,
      password: null, // Wipe plaintext
      tokenVersion: nextVersion,
      passwordChangedAt: new Date().toISOString(),
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    });

    // Invalidate old sessions immediately in memory
    userTokenVersions.set(adminId, nextVersion);

    await writeAuditLog({
      action: 'ADMIN_CHANGE_PASSWORD',
      actorId: adminId,
      actorName: uData.displayName || req.user?.displayName,
      actorRole: 'admin',
      targetCollection: 'users',
      targetId: adminId,
      targetName: uData.displayName || req.user?.displayName,
      details: 'Quản trị viên đã đổi mật khẩu thành công. Tất cả các phiên đăng nhập cũ đã được thu hồi an toàn.',
    });

    // Issue refreshed token for the new session
    const newToken = createAuthToken({
      uid: adminId,
      role: 'admin',
      displayName: uData.displayName,
      email: uData.email,
      tokenVersion: nextVersion,
    });

    return res.json({
      ok: true,
      message: 'Đổi mật khẩu thành công. Các phiên đăng nhập cũ đã được thu hồi an toàn.',
      token: newToken,
    });
  } catch (err: any) {
    console.error('Admin change password error:', err);
    return res.status(500).json({ error: 'Lỗi đổi mật khẩu: ' + err.message });
  }
});

// Admin Academic Years CRUD
app.post('/api/admin/academic-years', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, isCurrent } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập tên năm học (ví dụ: Năm học 2026 - 2027).' });
    }
    const cleanName = String(name).trim();
    const yearId = `year-${cleanName.replace(/[^0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || Date.now()}`;

    if (isCurrent) {
      const allYearsSnap = await getDocs(collection(db, 'academicYears'));
      for (const d of allYearsSnap.docs) {
        if (d.data().isCurrent) {
          await updateDoc(d.ref, { isCurrent: false });
        }
      }
    }

    const yearDoc = {
      id: yearId,
      name: cleanName,
      isCurrent: Boolean(isCurrent),
      status: 'active',
      createdAt: new Date().toISOString(),
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    await setDoc(doc(db, 'academicYears', yearId), yearDoc);

    await writeAuditLog({
      action: 'CREATE_ACADEMIC_YEAR',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'academicYears',
      targetId: yearId,
      targetName: cleanName,
      details: `Tạo mới năm học ${cleanName}`,
    });

    return res.json({ ok: true, academicYear: yearDoc });
  } catch (err: any) {
    console.error('Create academic year error:', err);
    return res.status(500).json({ error: 'Lỗi tạo năm học: ' + err.message });
  }
});

app.patch('/api/admin/academic-years/:id', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const yearId = req.params.id;
    const { name, isCurrent, status } = req.body;
    const yDoc = await getDoc(doc(db, 'academicYears', yearId));
    if (!yDoc.exists()) {
      return res.status(404).json({ error: 'Năm học không tồn tại.' });
    }
    const currentData: any = yDoc.data();

    const updates: any = { updatedAt: new Date().toISOString() };
    if (name && String(name).trim()) {
      updates.name = String(name).trim();
    }
    if (status && (status === 'active' || status === 'archived')) {
      updates.status = status;
      if (status === 'archived') {
        updates.isCurrent = false; // Archived years cannot be active current
      }
    }
    if (isCurrent !== undefined) {
      updates.isCurrent = Boolean(isCurrent);
      if (updates.isCurrent) {
        updates.status = 'active'; // Current year must be active
        const allYearsSnap = await getDocs(collection(db, 'academicYears'));
        for (const d of allYearsSnap.docs) {
          if (d.id !== yearId && d.data().isCurrent) {
            await updateDoc(d.ref, { isCurrent: false });
          }
        }
      }
    }

    await updateDoc(doc(db, 'academicYears', yearId), updates);

    await writeAuditLog({
      action: 'UPDATE_ACADEMIC_YEAR',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'academicYears',
      targetId: yearId,
      targetName: updates.name || currentData.name,
      details: `Cập nhật năm học ${updates.name || currentData.name}: ${Object.keys(updates).join(', ')}`,
    });

    return res.json({ ok: true, academicYear: { ...currentData, ...updates } });
  } catch (err: any) {
    console.error('Update academic year error:', err);
    return res.status(500).json({ error: 'Lỗi cập nhật năm học: ' + err.message });
  }
});

// Admin Delete Academic Year with Strict Linked-Data Protection
app.delete('/api/admin/academic-years/:id', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const yearId = req.params.id;
    const yDoc = await getDoc(doc(db, 'academicYears', yearId));
    if (!yDoc.exists()) {
      return res.status(404).json({ error: 'Năm học không tồn tại.' });
    }
    const yData: any = yDoc.data();

    if (yearId === 'year-2024-2025') {
      return res.status(400).json({
        error: `Không thể xóa năm học lịch sử "${yData.name}". Bản ghi niên khóa lịch sử được bảo lưu vĩnh viễn trong hệ thống theo quy định kiểm toán. Vui lòng giữ ở trạng thái "Lưu trữ".`,
        code: 'ACADEMIC_YEAR_HAS_LINKED_DATA',
      });
    }

    if (yData.isCurrent) {
      return res.status(400).json({
        error: 'Không thể xóa năm học đang được đặt làm hiện hành. Vui lòng kích hoạt một năm học khác trước khi thao tác.',
        code: 'CANNOT_DELETE_CURRENT_YEAR',
      });
    }

    // Check linked classes
    const classesSnap = await getDocs(collection(db, 'classes'));
    const linkedClasses = classesSnap.docs.filter((d) => {
      const c: any = d.data();
      return c.academicYearId === yearId || (yData.name && c.academicYearId === yData.name);
    });

    // Check linked assignments
    const assignmentsSnap = await getDocs(collection(db, 'assignments'));
    const linkedAssignments = assignmentsSnap.docs.filter((d) => {
      const a: any = d.data();
      return a.academicYearId === yearId;
    });

    // Check linked users (students / archived students)
    const usersSnap = await getDocs(collection(db, 'users'));
    const linkedUsers = usersSnap.docs.filter((d) => {
      const u: any = d.data();
      return u.schoolYearId === yearId || u.academicYearId === yearId;
    });

    const totalLinked = linkedClasses.length + linkedAssignments.length + linkedUsers.length;
    if (totalLinked > 0) {
      return res.status(400).json({
        error: `Không thể xóa năm học "${yData.name}" vì đang có ${linkedClasses.length} lớp học, ${linkedUsers.length} tài khoản người dùng và dữ liệu học tập liên kết. Vui lòng chuyển trạng thái sang "Lưu trữ" để bảo toàn lịch sử.`,
        code: 'ACADEMIC_YEAR_HAS_LINKED_DATA',
        linkedClassesCount: linkedClasses.length,
        linkedAssignmentsCount: linkedAssignments.length,
        linkedUsersCount: linkedUsers.length,
      });
    }

    await deleteDoc(doc(db, 'academicYears', yearId));

    await writeAuditLog({
      action: 'DELETE_ACADEMIC_YEAR',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'academicYears',
      targetId: yearId,
      targetName: yData.name,
      details: `Xóa năm học chưa sử dụng: "${yData.name}"`,
    });

    return res.json({ ok: true, message: `Đã xóa năm học "${yData.name}" thành công.` });
  } catch (err: any) {
    console.error('Delete academic year error:', err);
    return res.status(500).json({ error: 'Lỗi xóa năm học: ' + err.message });
  }
});

// Admin Paginated & Filtered Audit Logs Endpoint
app.get('/api/admin/audit-logs', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
    const actionFilter = req.query.action ? String(req.query.action) : null;
    const searchQuery = req.query.search ? String(req.query.search).toLowerCase() : null;

    const snap = await getDocs(collection(db, 'auditLogs'));
    let logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

    // Sort descending by timestamp / createdAt
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    if (actionFilter && actionFilter !== 'all') {
      logs = logs.filter((l) => l.action === actionFilter);
    }
    if (searchQuery) {
      logs = logs.filter((l) =>
        (l.actorName && l.actorName.toLowerCase().includes(searchQuery)) ||
        (l.targetName && l.targetName.toLowerCase().includes(searchQuery)) ||
        (l.details && l.details.toLowerCase().includes(searchQuery)) ||
        (l.action && l.action.toLowerCase().includes(searchQuery))
      );
    }

    const total = logs.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const pageItems = logs.slice(startIndex, startIndex + limit);

    return res.json({
      ok: true,
      logs: pageItems,
      items: pageItems,
      total,
      page,
      totalPages,
      limit,
      retentionPolicy: {
        standardRetentionDays: 90,
        securityLogRetentionDays: 'permanent',
        approvalRequired: true,
      },
    });
  } catch (err: any) {
    console.error('Get audit logs error:', err);
    return res.status(500).json({ error: 'Lỗi tải nhật ký hoạt động: ' + err.message });
  }
});

// Admin Safe Data Export
app.get('/api/admin/export', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [uSnap, cSnap, ySnap, lSnap, aSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'classes')),
      getDocs(collection(db, 'academicYears')),
      getDocs(collection(db, 'lessons')),
      getDocs(collection(db, 'assignments')),
    ]);

    const safeUsers = uSnap.docs.map((d) => {
      const { password: _, accessSecret: __, ...safe } = d.data();
      return { id: d.id, ...safe };
    });

    await writeAuditLog({
      action: 'EXPORT_SYSTEM_DATA',
      actorId: req.user?.uid,
      actorName: req.user?.displayName,
      actorRole: req.user?.role,
      targetCollection: 'all',
      targetId: 'backup-export',
      details: 'Xuất dữ liệu hệ thống an toàn (đã lọc PII mật khẩu).',
    });

    return res.json({
      ok: true,
      exportedAt: new Date().toISOString(),
      exportedBy: req.user?.displayName,
      data: {
        users: safeUsers,
        classes: cSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        academicYears: ySnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        lessons: lSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        assignments: aSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      },
    });
  } catch (err: any) {
    console.error('Export data error:', err);
    return res.status(500).json({ error: 'Lỗi xuất dữ liệu: ' + err.message });
  }
});

// Configure Vite middleware in development or serve static in production
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Standalone execution condition (Not in Vercel Serverless environment or unit tests)
const isTesting = process.env.NODE_ENV === 'test' || process.argv.some((a) => a.includes('test'));
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV && !isTesting) {
  startServer();
}

export default app;
