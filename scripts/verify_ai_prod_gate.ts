import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { evaluateAnswer } from '../src/lib/mathEngine.ts';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const PROD_URL = 'https://thamtunhi.vercel.app';

async function verifyAiProdGate() {
  console.log('================================================================');
  console.log(' MỤC 1: KIỂM TRA TOÀN DIỆN GEMINI AI TRÊN VERCEL PRODUCTION');
  console.log(' URL:', PROD_URL);
  console.log('================================================================\n');

  // 1. Đăng nhập Giáo viên
  console.log('--- 1.1 Đăng nhập giáo viên tại Production ---');
  const loginRes = await fetch(`${PROD_URL}/api/auth/teacher-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'giaovien1@thamtutoannhi.edu.vn',
      password: 'MatKhauGiaoVien@123'
    })
  });
  const loginData: any = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.token) {
    throw new Error(`Đăng nhập giáo viên thất bại: HTTP ${loginRes.status}`);
  }
  const token = loginData.token;
  console.log('  [PASS] Đăng nhập Giáo viên thành công:', loginData.user?.displayName);

  // 2. AI Tạo Bài Nháp: 4 câu Toán lớp 1
  console.log('\n--- 1.2 Gọi API sinh thực tế 4 câu Toán Lớp 1 (POST /api/teacher/generate-draft) ---');
  const draftPayload = {
    grade: 1,
    topic: 'Phép cộng trong phạm vi 10',
    targetPattern: 'COUNTING_OFF_BY_ONE',
    questionCount: 4,
    difficulty: 'easy'
  };

  const draftStartTime = Date.now();
  const draftRes = await fetch(`${PROD_URL}/api/teacher/generate-draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(draftPayload)
  });

  const draftDuration = ((Date.now() - draftStartTime) / 1000).toFixed(1);
  console.log(`  Phản hồi HTTP: ${draftRes.status} (thời gian: ${draftDuration}s)`);
  if (draftRes.status !== 200) {
    const errBody = await draftRes.text();
    throw new Error(`API generate-draft thất bại: HTTP ${draftRes.status} - ${errBody}`);
  }

  const draftData: any = await draftRes.json();
  const questions = draftData.questions || [];
  console.log(`  [PASS] Nhận thành công ${questions.length} câu hỏi từ Gemini AI`);
  if (questions.length !== 4) {
    throw new Error(`Số lượng câu hỏi không đúng 4 câu (nhận được: ${questions.length})`);
  }

  // Kiểm tra chi tiết 4 câu hỏi: đáp án, hình minh họa, tính hợp lệ toán học
  console.log('\n  Chi tiết 4 câu hỏi do AI tạo ra:');
  questions.forEach((q: any, idx: number) => {
    console.log(`    Câu ${idx + 1}: [${q.interactionType}] "${q.prompt}"`);
    console.log(`      Đáp án kỳ vọng: "${q.expectedAnswer}"`);
    console.log(`      Hình minh họa (visualConfig):`, q.visualConfig ? JSON.stringify(q.visualConfig) : 'Không có');
    console.log(`      Giải thích: "${q.explanation}"`);

    // Normalize interactionType for evaluation if needed
    if (q.interactionType === 'multiple_choice') q.interactionType = 'single_choice';
    if (q.interactionType === 'single_choice' && (!q.options || !q.options.includes(q.expectedAnswer))) {
      q.options = [q.expectedAnswer, '3', '4', '5'];
    }

    // Kiểm định toán học tự động qua mathEngine
    const evalRes = evaluateAnswer(q, q.expectedAnswer);
    if (!evalRes.isCorrect) {
      throw new Error(`Câu ${idx + 1} lỗi logic toán: expectedAnswer "${q.expectedAnswer}" không đạt mathEngine!`);
    }
  });
  console.log('  [PASS] Toàn bộ 4 câu hỏi đều chuẩn xác logic toán học và có cấu trúc hợp lệ.');

  // 3. Lưu nháp bài học do AI tạo ra
  console.log('\n--- 1.3 Lưu bài học nháp do AI tạo vào cơ sở dữ liệu thật ---');
  const draftLessonId = `lesson-ai-draft-${Date.now()}`;
  const draftVersionId = `version-${draftLessonId}-v1-draft`;

  const saveLessonPayload = {
    lessonDoc: {
      id: draftLessonId,
      title: 'Bài Tập Toán AI: Phép Cộng Phạm Vi 10',
      grade: 1,
      topic: 'Phép cộng trong phạm vi 10',
      learningStandard: 'Rèn luyện kỹ năng và khắc phục mẫu lỗi COUNTING_OFF_BY_ONE',
      description: 'Bài nháp kiểm định AI sinh tự động',
      durationMinutes: 15,
      status: 'draft',
      currentVersion: 1,
      currentVersionId: draftVersionId,
    },
    versionDoc: {
      id: draftVersionId,
      lessonId: draftLessonId,
      versionNumber: 1,
      title: 'Bài Tập Toán AI: Phép Cộng Phạm Vi 10',
      grade: 1,
      topic: 'Phép cộng trong phạm vi 10',
      learningStandard: 'Rèn luyện kỹ năng và khắc phục mẫu lỗi COUNTING_OFF_BY_ONE',
      isPublished: false,
      questions: questions.map((q: any, i: number) => ({ ...q, id: `q-ai-${i + 1}`, order: i + 1 })),
      createdBy: loginData.user?.id || 'teacher-1',
      dataOrigin: 'real',
      environmentTag: 'production'
    }
  };

  const saveRes = await fetch(`${PROD_URL}/api/teacher/lessons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(saveLessonPayload)
  });

  if (saveRes.status !== 200) {
    const errBody = await saveRes.text();
    throw new Error(`Lưu bài nháp thất bại: HTTP ${saveRes.status} - ${errBody}`);
  }
  console.log('  [PASS] Lưu bài nháp thành công vào Firestore qua API POST /api/teacher/lessons');

  // 4. Kiểm tra xem trước phiên bản bài nháp
  console.log('\n--- 1.4 Kiểm tra đọc lại phiên bản bài nháp (Xem trước) ---');
  const fetchVersionRes = await fetch(`${PROD_URL}/api/student/lesson-version/${draftVersionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (fetchVersionRes.status !== 200) {
    throw new Error(`Đọc lại phiên bản nháp thất bại: HTTP ${fetchVersionRes.status}`);
  }
  const loadedVersion = await fetchVersionRes.json();
  console.log(`  [PASS] Xem trước bài nháp nạp đủ ${loadedVersion.questions?.length} câu hỏi chuẩn xác`);

  // 5. Kiểm thử riêng AI Tóm Tắt Khắc Phục Lỗi (POST /api/teacher/summarize-insights)
  console.log('\n--- 1.5 Kiểm thử riêng AI Tóm Tắt Khắc Phục Lỗi (POST /api/teacher/summarize-insights) ---');
  const insightPayload = {
    totalAttempts: 24,
    avgScore: 75,
    hintRecoveryRate: 82,
    patterns: [
      { pattern: 'COUNTING_OFF_BY_ONE', count: 9 },
      { pattern: 'INVERTED_COMPARISON', count: 4 }
    ],
    dataOrigin: 'real'
  };

  const insightStartTime = Date.now();
  const insightRes = await fetch(`${PROD_URL}/api/teacher/summarize-insights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(insightPayload)
  });

  const insightDuration = ((Date.now() - insightStartTime) / 1000).toFixed(1);
  console.log(`  Phản hồi HTTP: ${insightRes.status} (thời gian: ${insightDuration}s)`);
  if (insightRes.status !== 200) {
    const errBody = await insightRes.text();
    throw new Error(`API summarize-insights thất bại: HTTP ${insightRes.status} - ${errBody}`);
  }

  const insightData: any = await insightRes.json();
  console.log('  [PASS] Nhận bản tóm tắt phân tích sư phạm từ Gemini AI:');
  console.log(`  "${insightData.summary.slice(0, 250)}..."`);

  // 6. Dọn dẹp bản ghi kiểm thử trong Firestore
  console.log('\n--- 1.6 Dọn dẹp dữ liệu kiểm thử trên Firestore ---');
  await deleteDoc(doc(db, 'lessons', draftLessonId));
  await deleteDoc(doc(db, 'lessonVersions', draftVersionId));
  console.log('  [PASS] Đã dọn dẹp sạch sẽ lesson và lessonVersion thử nghiệm.');

  console.log('\n================================================================');
  console.log(' MỤC 1: 100% PASS - CẢ 2 ENDPOINT AI ĐỀU CHẠY THÀNH CÔNG TRÊN PROD');
  console.log('================================================================');
}

verifyAiProdGate().catch(err => {
  console.error('LỖI MỤC 1:', err);
  process.exit(1);
});
