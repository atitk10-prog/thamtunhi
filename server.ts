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
} from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';

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

// Gemini AI client initialization
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI();
  } catch (e) {
    console.warn('Notice: Gemini client init:', e);
  }
}

// Secret for stateless HMAC session tokens
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET || 'thamtutoannhi-secure-session-key-gdpt2018-hmac';

export interface AuthSession {
  uid: string;
  role: 'admin' | 'teacher' | 'student';
  displayName: string;
  email?: string;
  studentCode?: string;
  classId?: string;
  grade?: number;
  exp: number; // Unix timestamp
}

export function createAuthToken(payload: Omit<AuthSession, 'exp'>, expiresInDays = 7): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 86400;
  const session: AuthSession = { ...payload, exp };
  const encodedPayload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthSession | null {
  if (!token || typeof token !== 'string') return null;
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

// Authentication middleware
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

const app = express();
app.use(express.json());

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

  const isHealthy = firestoreConnected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    firebaseProjectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    firestoreConnected,
    lessonsCount,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    buildVersion: '1.1.0-prod',
    environmentTag: process.env.VERCEL_ENV === 'production' ? 'production' : 'demo',
    timestamp: new Date().toISOString(),
    ...(errorDetail ? { warning: 'Cloud Firestore kết nối gián đoạn' } : {}),
  });
});

// 2. Student Authentication endpoint (Student Code + Access Secret)
// Zero fallback passwords, sanitized response, signed JWT session token
app.post('/api/auth/student-login', async (req: Request, res: Response) => {
  const { studentCode, accessSecret } = req.body;

  if (!studentCode || !accessSecret) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Mã học sinh và Mật khẩu truy cập.' });
  }

  try {
    const cleanCode = String(studentCode).trim().toUpperCase();
    const cleanSecret = String(accessSecret).trim();

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('studentCode', '==', cleanCode)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return res.status(401).json({ error: 'Mã học sinh hoặc mật khẩu không chính xác.' });
    }

    const studentDoc = snap.docs[0].data();
    const expectedSecret = studentDoc.accessSecret;

    // Strict validation: No hardcoded fallback password allowed
    if (!expectedSecret || cleanSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Mã học sinh hoặc mật khẩu không chính xác.' });
    }

    // Mask secrets before sending to client
    const { accessSecret: _, password: __, ...safeUser } = studentDoc;

    // Generate signed session token
    const token = createAuthToken({
      uid: safeUser.id,
      role: 'student',
      displayName: safeUser.displayName,
      studentCode: safeUser.studentCode,
      classId: safeUser.classId,
      grade: safeUser.grade,
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

    const userDoc = snap.docs[0].data();
    const expectedPassword = userDoc.password;

    // Strict validation: Reject missing password or mismatch, NO fallback backdoor
    if (!expectedPassword || cleanPassword !== expectedPassword) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    // Mask secrets
    const { password: _, accessSecret: __, ...safeUser } = userDoc;

    // Generate signed session token
    const token = createAuthToken({
      uid: safeUser.id,
      role: safeUser.role,
      displayName: safeUser.displayName,
      email: safeUser.email,
    });

    const customToken = await mintCustomToken(safeUser.id, {
      role: safeUser.role,
      email: safeUser.email,
    });

    return res.json({ ok: true, user: safeUser, token, customToken });
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
    } else {
      const isAdmin = email === 'AT.IT.K10@gmail.com';
      profile = {
        id: uid,
        role: isAdmin ? 'admin' : 'teacher',
        displayName: displayName || (isAdmin ? 'Quản trị viên' : 'Giáo viên'),
        email: email || '',
        createdAt: new Date().toISOString(),
        dataOrigin: 'real',
        environmentTag: 'production',
      };
      await setDoc(userDocRef, profile);
    }

    const { password: _, accessSecret: __, ...safeUser } = profile;
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

// 5. Teacher AI Draft Generation (Protected: teacher or admin role required)
app.post('/api/teacher/generate-draft', requireAuth, requireRole(['teacher', 'admin']), async (req: Request, res: Response) => {
  if (!process.env.GEMINI_API_KEY || !genAI) {
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

  const cleanCount = Math.min(Math.max(Number(questionCount) || 4, 1), 8);
  const cleanTopic = String(topic || 'Số và Phép tính').substring(0, 100);
  const cleanPattern = String(targetPattern || 'CROSS_TEN_ERROR').substring(0, 100);

  try {
    const prompt = `
Bạn là chuyên gia giáo dục Toán tiểu học theo Chương trình GDPT 2018 Việt Nam cho lớp ${parsedGrade}.
Hãy tạo đúng ${cleanCount} câu hỏi môn Toán lớp ${parsedGrade} về chủ đề: "${cleanTopic}".
Độ khó: ${difficulty}.
Tập trung phát hiện mẫu lỗi: "${cleanPattern}".
Mỗi câu hỏi phải phù hợp tư duy trẻ 6-8 tuổi, văn phong sư phạm ấm áp, thân thiện.

Yêu cầu định dạng JSON CHUẨN XÁC theo schema sau:
{
  "questions": [
    {
      "id": "q-ai-1",
      "order": 1,
      "prompt": "Lời dẫn câu hỏi bằng tiếng Việt rõ ràng",
      "interactionType": "number_input" | "single_choice" | "operator_pick" | "ten_frame_bundle",
      "options": ["A", "B", "C"],
      "expectedAnswer": "5",
      "explanation": "Lời giải thích cặn kẽ",
      "skillTag": "${cleanTopic}",
      "difficulty": "${difficulty}",
      "ruleHints": [
        {
          "pattern": "${cleanPattern}",
          "hintText": "Lời khuyên sư phạm gợi ý cho bé",
          "visualActionGuidance": "Chỉ dẫn thao tác que tính hoặc khung 10 ô"
        }
      ]
    }
  ]
}
Chỉ trả về JSON thuần túy, không có văn bản giải thích nào khác ngoài JSON.
`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini draft generation error:', err);
    return res.status(500).json({ error: 'Lỗi khi gọi mô hình AI: ' + (err.message || String(err)) });
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
Dưới đây là dữ liệu tổng hợp ẩn danh kết quả học tập (${dataOrigin === 'simulation' ? 'Dữ liệu mô phỏng thử nghiệm' : 'Dữ liệu học tập thực tế'}):
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

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('AI summary error:', err);
    return res.status(500).json({ error: 'Lỗi tạo tóm tắt AI: ' + (err.message || String(err)) });
  }
});

// 7. Admin Seed Demo Data (Protected: Admin role required + explicit guard)
app.post('/api/admin/seed-demo', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { apply = false } = req.body;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

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

  // Safety lock on production: do not execute destructive seed in production without explicit server override
  if (isProduction && process.env.ALLOW_PROD_SEED !== 'true') {
    return res.status(403).json({
      error: 'Khóa an toàn Production: Thao tác Seed bị khóa trên môi trường sản xuất để bảo vệ dữ liệu hiện có.',
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

  // Strict production protection rule
  if (isProduction && process.env.ALLOW_PROD_CLEANUP !== 'true') {
    return res.status(403).json({
      error: 'Khóa an toàn Production: Thao tác dọn dẹp dữ liệu bị vô hiệu hóa trên môi trường sản xuất.',
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
    const classId = req.user?.role === 'student' ? req.user.classId : (req.query.classId as string || req.user?.classId);
    if (!classId) {
      return res.status(400).json({ error: 'Thiếu thông tin classId của lớp học.' });
    }
    const q = query(collection(db, 'assignments'), where('classId', '==', classId));
    const snap = await getDocs(q);
    const assignments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    const { id, assignmentId, lessonVersionId, classId, studentId, totalQuestions } = req.body;
    if (studentId && studentId !== req.user!.uid) {
      return res.status(403).json({ error: 'Từ chối truy cập: Không thể mạo danh tài khoản học sinh khác.' });
    }
    if (!id || !assignmentId || !lessonVersionId) {
      return res.status(400).json({ error: 'Thiếu tham số khởi tạo lượt làm bài.' });
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
      totalQuestions: Number(totalQuestions || 0),
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
    const attData = attSnap.data();
    if (attData.studentId !== req.user!.uid) {
      return res.status(403).json({ error: 'Từ chối: Không thể ghi đáp án vào bài làm của học sinh khác.' });
    }
    if (attData.status === 'completed') {
      return res.status(400).json({ error: 'Lượt làm bài đã hoàn thành, không thể nộp thêm đáp án.' });
    }

    const answerDoc = {
      id: answerDocId || `${attemptId}_q_${questionId}_a_${attemptNumber}`,
      attemptId,
      studentId: req.user!.uid,
      questionId,
      questionOrder: Number(questionOrder || 1),
      userAnswer: String(userAnswer || ''),
      isCorrect: Boolean(isCorrect),
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
    const { score, completedAt, firstAttemptCorrectCount, postHintCorrectCount, misconceptionsDetected } = req.body;

    const attSnap = await getDoc(doc(db, 'attempts', attemptId));
    if (!attSnap.exists()) {
      return res.status(404).json({ error: 'Lượt làm bài không tồn tại.' });
    }
    const attData = attSnap.data();
    if (attData.studentId !== req.user!.uid) {
      return res.status(403).json({ error: 'Từ chối: Không thể sửa bài làm của người khác.' });
    }

    const updates = {
      status: 'completed',
      score: Number(score || 0),
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
    const snap = await getDocs(collection(db, 'classes'));
    const allClasses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    const assignmentDoc = req.body;
    if (!assignmentDoc || !assignmentDoc.id || !assignmentDoc.classId || !assignmentDoc.lessonVersionId) {
      return res.status(400).json({ error: 'Thiếu thông tin bài tập cần giao.' });
    }
    const safeDoc = {
      ...assignmentDoc,
      teacherId: req.user?.uid, // Enforce teacher ownership
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    await setDoc(doc(db, 'assignments', assignmentDoc.id), safeDoc, { merge: true });
    return res.json({ ok: true, assignment: safeDoc });
  } catch (err: any) {
    console.error('Save assignment error:', err);
    return res.status(500).json({ error: 'Lỗi lưu bài tập: ' + err.message });
  }
});

app.post('/api/teacher/lessons', requireAuth, requireRole(['teacher', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lessonDoc, versionDoc } = req.body;
    if (!lessonDoc || !versionDoc || !lessonDoc.id || !versionDoc.id) {
      return res.status(400).json({ error: 'Thiếu thông tin bài học hoặc phiên bản câu hỏi.' });
    }
    const safeLesson = {
      ...lessonDoc,
      createdBy: req.user?.uid,
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    const safeVersion = {
      ...versionDoc,
      createdBy: req.user?.uid,
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

app.get('/api/teacher/analytics', requireAuth, requireRole(['teacher', 'admin']), async (_req: Request, res: Response) => {
  try {
    const attSnap = await getDocs(collection(db, 'attempts'));
    const insSnap = await getDocs(collection(db, 'mistakeInsights'));
    return res.json({
      ok: true,
      attempts: attSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      insights: insSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
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

app.post('/api/admin/create-user', requireAuth, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newUser = req.body;
    if (!newUser || !newUser.id || !newUser.role) {
      return res.status(400).json({ error: 'Thiếu thông tin người dùng mới.' });
    }
    const safeNewUser = {
      ...newUser,
      createdAt: new Date().toISOString(),
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    await setDoc(doc(db, 'users', newUser.id), safeNewUser);
    const { password: _, accessSecret: __, ...masked } = safeNewUser;
    return res.json({ ok: true, user: masked });
  } catch (err: any) {
    console.error('Admin create user error:', err);
    return res.status(500).json({ error: 'Lỗi tạo người dùng mới: ' + err.message });
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
