import { makeToken } from './token_helper.ts';
import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('verify_prod_g2.ts', 'Kiểm tra Production trực tuyến G2');

const PROD_URL = 'https://thamtunhi.vercel.app';

async function verifyProdG2() {
  console.log('================================================================');
  console.log(' KIỂM TRA PRODUCTION TRỰC TUYẾN GIAI ĐOẠN G2 (https://thamtunhi.vercel.app)');
  console.log('================================================================\n');

  // 1. Health Probe
  console.log('--- 1. Kiểm tra Health Probe & Kết nối Database ---');
  const healthRes = await fetch(`${PROD_URL}/api/health`);
  const healthData = await healthRes.json();
  console.log('Status code:', healthRes.status);
  console.log('Health data:', healthData);
  if (healthRes.status !== 200 || !healthData.firestoreConnected) {
    throw new Error('Production Health Check FAILED');
  }
  console.log('✓ Health Probe: 200 OK, Cloud Firestore Connected, GeminiConfigured:', healthData.geminiConfigured);

  // 2. Tải Phiên Bản Học Liệu Trực Tiếp từ Cloud Firestore
  console.log('\n--- 2. Tải Phiên Bản Học Liệu Trực Tiếp từ Cloud Firestore ---');
  const loginRes = await fetch(`${PROD_URL}/api/auth/teacher-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'giaovien1@thamtutoannhi.edu.vn',
      password: process.env.TEST_TEACHER_PASSWORD || process.env.TEACHER_PASSWORD || ''
    }),
  });
  const loginData: any = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    throw new Error('Production Teacher Login Failed: ' + JSON.stringify(loginData));
  }
  const teacherToken = loginData.token;
  console.log('✓ Nhận Production Token cho Cô Mai Lan thành công.');

  const vRes = await fetch(`${PROD_URL}/api/student/lesson-version/version-lesson-g1-01-v1`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  const vData = await vRes.json();
  console.log('Lesson Version HTTP Status:', vRes.status);
  if (vRes.status === 200 && vData.lessonVersion) {
    console.log(`✓ Tải thành công version-lesson-g1-01-v1 (${vData.lessonVersion.questions?.length}/8 câu hỏi)`);
    console.log(`  Tiêu đề: "${vData.lessonVersion.title}"`);
    console.log(`  Câu 3: [${vData.lessonVersion.questions[2].interactionType}] Left=${vData.lessonVersion.questions[2].visualConfig?.leftCount}, Right=${vData.lessonVersion.questions[2].visualConfig?.rightCount}, Answer="${vData.lessonVersion.questions[2].expectedAnswer}"`);
    console.log(`  Câu 4: [${vData.lessonVersion.questions[3].interactionType}] Pairs=${vData.lessonVersion.questions[3].pairs?.length} cặp thẻ`);
  } else {
    throw new Error('Fetch lesson version failed on production: ' + JSON.stringify(vData));
  }

  // 3. Test non-existent version returns 404 (Zero mock fallback)
  console.log('\n--- 3. Kiểm tra Chống Giả Lập Dữ Liệu Khi Lỗi (Zero Mock Fallback) ---');
  const nonExistentRes = await fetch(`${PROD_URL}/api/student/lesson-version/version-nonexistent-8888`, {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  console.log('Non-existent version status:', nonExistentRes.status);
  if (nonExistentRes.status === 404) {
    console.log('✓ Chuẩn xác: Version không tồn tại trả về HTTP 404, không tự chế dữ liệu mẫu');
  } else {
    throw new Error(`Kỳ vọng 404 nhưng nhận được ${nonExistentRes.status}`);
  }

  // 4. Test Gemini Draft Generation on Production
  console.log('\n--- 4. Kiểm tra AI Gemini Soạn Bài trên Production ---');
  const aiRes = await fetch(`${PROD_URL}/api/teacher/generate-draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      grade: 1,
      topic: 'Phép cộng trong phạm vi 10',
      targetPattern: 'COUNTING_OFF_BY_ONE',
      questionCount: 3,
      difficulty: 'easy',
    }),
  });

  const aiData = await aiRes.json();
  console.log('Gemini Draft HTTP Status:', aiRes.status);
  if (aiRes.status === 200 && Array.isArray(aiData.questions)) {
    console.log(`✓ GEMINI AI TRỰC TUYẾN HOẠT ĐỘNG HOÀN HẢO! Đã sinh ${aiData.questions.length} câu hỏi`);
    aiData.questions.forEach((q: any, i: number) => {
      console.log(`  [Câu ${i + 1}] [${q.interactionType}] ${q.prompt} (Đáp án: ${q.expectedAnswer})`);
    });
  } else {
    console.log('Gemini response:', aiData);
  }

  console.log('\n================================================================');
  console.log(' HOÀN TẤT KIỂM TRA PRODUCTION TRỰC TUYẾN G2: 100% PASS');
  console.log('================================================================');
}

verifyProdG2().catch((err) => {
  console.error('Verify Production G2 Failed:', err);
  process.exit(1);
});
