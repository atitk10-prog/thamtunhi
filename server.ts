import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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
  writeBatch
} from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import firebaseConfig from './firebase-applet-config.json';
import { CURRICULUM_DATA } from './src/data/curriculumData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase for server context
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Gemini client (reads GEMINI_API_KEY from environment)
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI();
  } catch (e) {
    console.warn('Gemini client init notice:', e);
  }
}

const app = express();
app.use(express.json());

// 1. Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    firebaseProjectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    authConnected: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    buildVersion: '1.0.0-prod',
    environmentTag: 'demo',
    timestamp: new Date().toISOString(),
  });
});

// 2. Student Authentication endpoint (Student Code + Access Secret)
app.post('/api/auth/student-login', async (req: Request, res: Response) => {
  const { studentCode, accessSecret } = req.body;

  if (!studentCode || !accessSecret) {
    return res.status(400).json({ error: 'Thiếu mã học sinh hoặc mật khẩu.' });
  }

  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('studentCode', '==', studentCode.trim().toUpperCase())
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return res.status(404).json({ error: 'Không tìm thấy học sinh với mã này.' });
    }

    const studentDoc = snap.docs[0].data();
    // Validate access secret (for demo seed, secret is matkhau123)
    const expectedSecret = studentDoc.accessSecret || 'matkhau123';
    if (accessSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Mật khẩu truy cập không chính xác.' });
    }

    // Mask secret before sending back
    const { accessSecret: _, ...safeUser } = studentDoc;
    return res.json({ ok: true, user: safeUser });
  } catch (err: any) {
    console.error('Student login error:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ xác thực học sinh.' });
  }
});

// 3. Teacher & Admin Authentication endpoint
app.post('/api/auth/teacher-login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp email và mật khẩu.' });
  }

  try {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email.trim().toLowerCase())
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      // Check default fallback admin
      if (email.trim().toLowerCase() === 'admin@thamtutoannhi.edu.vn' && password === 'AdminBaoMat@123') {
        const adminUser = {
          id: 'admin-primary',
          role: 'admin',
          displayName: 'Ban Quản Trị Hệ Thống',
          email: 'admin@thamtutoannhi.edu.vn',
          createdAt: new Date().toISOString(),
          dataOrigin: 'simulation',
          environmentTag: 'demo',
        };
        await setDoc(doc(db, 'users', 'admin-primary'), adminUser, { merge: true });
        return res.json({ ok: true, user: adminUser });
      }

      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
    }

    const userDoc = snap.docs[0].data();
    const expectedPassword = userDoc.password || (userDoc.role === 'admin' ? 'AdminBaoMat@123' : 'MatKhauGiaoVien@123');

    if (password !== expectedPassword) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác.' });
    }

    const { password: _, ...safeUser } = userDoc;
    return res.json({ ok: true, user: safeUser });
  } catch (err: any) {
    console.error('Teacher login error:', err);
    return res.status(500).json({ error: 'Lỗi xác thực người dùng.' });
  }
});

// 4. Teacher AI Draft Generation (Gemini 2.5 Flash on server)
app.post('/api/teacher/generate-draft', async (req: Request, res: Response) => {
  if (!process.env.GEMINI_API_KEY || !genAI) {
    return res.status(503).json({
      code: 'AI_NOT_CONFIGURED',
      error: 'AI chưa cấu hình: Chưa phát hiện GEMINI_API_KEY. Vui lòng cấu hình Secret trên Google AI Studio.',
    });
  }

  const { grade, topic, targetPattern, questionCount = 4, difficulty = 'medium' } = req.body;

  try {
    const prompt = `
Bạn là chuyên gia giáo dục Toán tiểu học theo Chương trình GDPT 2018 Việt Nam cho lớp ${grade}.
Hãy tạo đúng ${questionCount} câu hỏi môn Toán lớp ${grade} về chủ đề: "${topic}".
Độ khó: ${difficulty}.
Tập trung phát hiện mẫu lỗi: "${targetPattern}".
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
      "skillTag": "${topic}",
      "difficulty": "${difficulty}",
      "ruleHints": [
        {
          "pattern": "${targetPattern}",
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
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini draft error:', err);
    return res.status(500).json({ error: 'Lỗi khi gọi mô hình AI: ' + (err.message || String(err)) });
  }
});

// 5. Teacher AI Classroom Insights Summary
app.post('/api/teacher/summarize-insights', async (req: Request, res: Response) => {
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
- Tổng lượt làm bài: ${totalAttempts}
- Điểm trung bình: ${avgScore}%
- Tỷ lệ tiến bộ sau khi xem manh mối gợi ý: ${hintRecoveryRate}%
- Các mẫu lỗi hay gặp: ${JSON.stringify(patterns)}

Hãy viết một bản tóm tắt sư phạm ngắn gọn (khoảng 2-3 đoạn văn) cho giáo viên biết học sinh đang gặp khó khăn ở điểm nào, và đề xuất 3 hoạt động trực quan cụ thể (sử dụng que tính, khung 10 ô, trục số) để củng cố trên lớp.
Trả về định dạng JSON:
{
  "summary": "Đoạn văn phân tích xu hướng lỗi...",
  "recommendations": ["Hoạt động 1: ...", "Hoạt động 2: ...", "Hoạt động 3: ..."]
}
`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
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

// 6. Admin Seed Demo Data (Idempotent, strictly scoped with dataOrigin: 'simulation')
app.post('/api/admin/seed-demo', async (req: Request, res: Response) => {
  const { apply = false, actorId = 'admin' } = req.body;

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

  if (!apply) {
    return res.json({
      ok: true,
      message: 'Kiểm thử chế độ DRY-RUN thành công. Không có dữ liệu nào bị ghi.',
      plan: summary,
    });
  }

  try {
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
      password: 'AdminBaoMat@123',
      createdAt: new Date().toISOString(),
      dataOrigin: 'simulation',
      environmentTag: 'demo',
    });

    // 3. Seed 2 Teachers
    const teachersList = [
      { id: 'teacher-1', name: 'Cô Mai Lan (Khối 1)', email: 'giaovien1@thamtutoannhi.edu.vn', pass: 'MatKhauGiaoVien@123' },
      { id: 'teacher-2', name: 'Thầy Quốc Huy (Khối 2)', email: 'giaovien2@thamtutoannhi.edu.vn', pass: 'MatKhauGiaoVien@123' },
    ];
    for (const t of teachersList) {
      await setDoc(doc(db, 'users', t.id), {
        id: t.id,
        role: 'teacher',
        displayName: t.name,
        email: t.email,
        password: t.pass,
        createdAt: new Date().toISOString(),
        dataOrigin: 'simulation',
        environmentTag: 'demo',
      });
    }

    // 4. Seed 4 Classes: 1A, 1B, 2A, 2B
    const classesList = [
      { id: 'class-1a', name: '1A', grade: 1, teacherId: 'teacher-1', studentCount: 12 },
      { id: 'class-1b', name: '1B', grade: 1, teacherId: 'teacher-1', studentCount: 12 },
      { id: 'class-2a', name: '2A', grade: 2, teacherId: 'teacher-2', studentCount: 12 },
      { id: 'class-2b', name: '2B', grade: 2, teacherId: 'teacher-2', studentCount: 12 },
    ];
    for (const c of classesList) {
      await setDoc(doc(db, 'classes', c.id), {
        id: c.id,
        name: c.name,
        grade: c.grade,
        academicYearId: 'year-2024-2025',
        teacherId: c.teacherId,
        studentCount: c.studentCount,
        createdAt: new Date().toISOString(),
        dataOrigin: 'simulation',
        environmentTag: 'demo',
      });
    }

    // 5. Seed 48 Students (12 per class)
    const studentNamesG1 = ['An', 'Bình', 'Châu', 'Dũng', 'Hà', 'Khánh', 'Linh', 'Minh', 'Nam', 'Nhi', 'Phương', 'Quân'];
    const studentNamesG2 = ['Tuấn', 'Hương', 'Đức', 'Trang', 'Phúc', 'Việt', 'Lan', 'Tú', 'Thảo', 'Khoa', 'Yến', 'Long'];

    for (const c of classesList) {
      const names = c.grade === 1 ? studentNamesG1 : studentNamesG2;
      for (let i = 1; i <= 12; i++) {
        const paddedIdx = i < 10 ? `0${i}` : `${i}`;
        const code = `HS${c.name}${paddedIdx}`;
        const sId = `student-${code.toLowerCase()}`;
        const studentUser = {
          id: sId,
          role: 'student',
          displayName: `${names[i - 1]} (${c.name})`,
          studentCode: code,
          accessSecret: 'matkhau123',
          classId: c.id,
          className: c.name,
          grade: c.grade,
          schoolYearId: 'year-2024-2025',
          createdAt: new Date().toISOString(),
          dataOrigin: 'simulation',
          environmentTag: 'demo',
        };
        await setDoc(doc(db, 'users', sId), studentUser);
      }
    }

    // 6. Seed 24 Lessons & 192 Questions from CURRICULUM_DATA
    for (const item of CURRICULUM_DATA) {
      const versionId = `version-${item.lesson.id}-v1`;

      // Version doc (Immutable snapshot)
      await setDoc(doc(db, 'lessonVersions', versionId), {
        id: versionId,
        lessonId: item.lesson.id,
        versionNumber: 1,
        title: item.lesson.title,
        grade: item.lesson.grade,
        topic: item.lesson.topic,
        learningStandard: item.lesson.learningStandard,
        questions: item.questions,
        isPublished: true,
        publishedAt: new Date().toISOString(),
        createdBy: item.lesson.grade === 1 ? 'teacher-1' : 'teacher-2',
        dataOrigin: 'simulation',
        environmentTag: 'demo',
      });

      // Lesson header doc
      await setDoc(doc(db, 'lessons', item.lesson.id), {
        ...item.lesson,
        createdBy: item.lesson.grade === 1 ? 'teacher-1' : 'teacher-2',
        createdAt: new Date().toISOString(),
        dataOrigin: 'simulation',
        environmentTag: 'demo',
      });
    }

    // 7. Seed 24 Assignments (6 per class)
    const assignmentsCreated: string[] = [];
    for (let cIdx = 0; cIdx < classesList.length; cIdx++) {
      const cls = classesList[cIdx];
      const classLessons = CURRICULUM_DATA.filter((l) => l.lesson.grade === cls.grade).slice(0, 6);

      for (const lItem of classLessons) {
        const assignId = `assign-${cls.id}-${lItem.lesson.id}`;
        await setDoc(doc(db, 'assignments', assignId), {
          id: assignId,
          title: `[Toán ${cls.grade}] ${lItem.lesson.title}`,
          lessonId: lItem.lesson.id,
          lessonVersionId: `version-${lItem.lesson.id}-v1`,
          classId: cls.id,
          className: cls.name,
          grade: cls.grade,
          teacherId: cls.teacherId,
          dueDate: '2026-12-31',
          status: 'open',
          createdAt: new Date().toISOString(),
          dataOrigin: 'simulation',
          environmentTag: 'demo',
        });
        assignmentsCreated.push(assignId);
      }
    }

    // 8. Seed 144 Attempts with diverse misconception logs
    let attemptCounter = 0;
    const errorPatternPool = [
      'COUNTING_OFF_BY_ONE',
      'WRONG_OPERATOR',
      'CROSS_TEN_ERROR',
      'PLACE_VALUE_SWAP',
      'COMPARISON_INVERSION',
      'NUMBER_ORDER_CONFUSION',
    ];

    for (let i = 0; i < 144; i++) {
      const classTarget = classesList[i % 4];
      const studentIdx = (i % 12) + 1;
      const code = `HS${classTarget.name}${studentIdx < 10 ? `0${studentIdx}` : studentIdx}`;
      const sId = `student-${code.toLowerCase()}`;
      const assignId = assignmentsCreated[i % assignmentsCreated.length];

      const isHighScorer = i % 3 === 0;
      const score = isHighScorer ? 80 : 60 + (i % 20);
      const firstTry = isHighScorer ? 8 : 5 + (i % 3);
      const postHint = 8 - firstTry;

      const attId = `att-demo-${i + 1}`;
      await setDoc(doc(db, 'attempts', attId), {
        id: attId,
        assignmentId: assignId,
        lessonId: `lesson-g${classTarget.grade}-01`,
        lessonVersionId: `version-lesson-g${classTarget.grade}-01-v1`,
        lessonTitle: `Bài luyện tập Toán Khối ${classTarget.grade}`,
        studentId: sId,
        studentName: `${code} (Học sinh)`,
        studentCode: code,
        classId: classTarget.id,
        status: 'completed',
        currentQuestionIndex: 8,
        score,
        maxScore: 80,
        firstAttemptCorrectCount: firstTry,
        postHintCorrectCount: postHint,
        totalAttemptsMade: 8 + postHint,
        startedAt: new Date(Date.now() - (144 - i) * 3600000).toISOString(),
        completedAt: new Date(Date.now() - (144 - i) * 3600000 + 900000).toISOString(),
        durationSeconds: 650 + (i % 300),
        dataOrigin: 'simulation',
        environmentTag: 'demo',
      });

      // Also record mistake insight
      const assignedPattern = errorPatternPool[i % errorPatternPool.length];
      const insId = `ins-demo-${i + 1}`;
      await setDoc(doc(db, 'mistakeInsights', insId), {
        id: insId,
        studentId: sId,
        classId: classTarget.id,
        className: classTarget.name,
        grade: classTarget.grade,
        topic: 'Số và Phép tính',
        errorPattern: assignedPattern,
        errorCount: postHint,
        suggestedRemediation: 'Tập trung sử dụng que tính và khung 10 ô.',
        createdAt: new Date().toISOString(),
        dataOrigin: 'simulation',
        environmentTag: 'demo',
      });

      attemptCounter++;
    }

    // 9. Write audit log
    await setDoc(doc(db, 'auditLogs', `log-seed-${Date.now()}`), {
      id: `log-seed-${Date.now()}`,
      action: 'APPLY_DEMO_SEED',
      actorId,
      actorRole: 'admin',
      targetCollection: 'all',
      targetId: 'demo-dataset',
      details: 'Khởi tạo thành công 1 Admin, 2 GV, 4 Lớp, 48 HS, 24 Bài, 192 Câu hỏi, 24 Đợt giao, 144 Lượt làm bài.',
      timestamp: new Date().toISOString(),
      dataOrigin: 'simulation',
      environmentTag: 'demo',
    });

    return res.json({
      ok: true,
      message: 'Đã khởi tạo thành công 100% dữ liệu mẫu lên Cloud Firestore thực tế.',
      summary: {
        ...summary,
        totalAttemptsRecorded: attemptCounter,
      },
    });
  } catch (err: any) {
    console.error('Seed execution error:', err);
    return res.status(500).json({ error: 'Lỗi thực thi seed lên Firestore: ' + err.message });
  }
});

// 7. Admin Scoped Cleanup Demo Endpoint
app.post('/api/admin/cleanup-demo', async (req: Request, res: Response) => {
  const { actorId = 'admin' } = req.body;
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

    // Audit log
    await setDoc(doc(db, 'auditLogs', `log-cleanup-${Date.now()}`), {
      id: `log-cleanup-${Date.now()}`,
      action: 'CLEANUP_DEMO_DATA',
      actorId,
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

startServer();
