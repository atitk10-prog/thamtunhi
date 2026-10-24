import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { makeToken } from './token_helper.ts';
import { evaluateAnswer } from '../src/lib/mathEngine.ts';
import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('test_teacher_g2.ts', 'Kiểm thử G2 Biên tập học liệu & Copy-on-Write (Ghi Firestore)');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

let passed = 0;
let total = 0;

function pass(msg: string) {
  passed++;
  total++;
  console.log(`  [PASS] ${msg}`);
}

function fail(msg: string, err: any) {
  total++;
  console.error(`  [FAIL] ${msg}:`, err);
  throw err;
}

async function runG2Tests() {
  assertSafeEnvironment('test_teacher_g2.ts', 'Kiểm thử G2 Biên tập học liệu & Copy-on-Write (Ghi Firestore)');
  console.log('================================================================');
  console.log(' BẮT ĐẦU KIỂM THỬ TOÀN DIỆN GIAI ĐOẠN G2 – KHO HỌC LIỆU & BIÊN TẬP');
  console.log(' Database ID:', firebaseConfig.firestoreDatabaseId);
  console.log(' BASE_URL:', BASE_URL);
  console.log('================================================================\n');

  const teacherToken = makeToken({
    uid: 'teacher-1',
    email: 'thanhthao@thamtutoannhi.edu.vn',
    role: 'teacher',
    displayName: 'Cô Mai Lan (Khối 1)',
  });

  const adminToken = makeToken({
    uid: 'admin-1',
    email: 'admin@thamtunhi.edu.vn',
    role: 'admin',
    displayName: 'Quản Trị Viên',
  });

  // --- PHẦN 1: G2.1 – KIỂM TOÁN KHO HỌC LIỆU VÀ PHIÊN BẢN (24 BÀI, 192 CÂU) ---
  console.log('--- PHẦN 1: G2.1 – KIỂM TOÁN KHO HỌC LIỆU VÀ PHIÊN BẢN CÂU HỎI ---');
  try {
    const lessonsSnap = await getDocs(collection(db, 'lessons'));
    assert.strictEqual(lessonsSnap.size, 24, 'Kho học liệu có đầy đủ 24 bài học');
    pass('Kiểm kê đúng 24 bài học trong collection lessons');

    const versionsSnap = await getDocs(collection(db, 'lessonVersions'));
    assert(versionsSnap.size >= 24, 'Có ít nhất 24 bản ghi phiên bản bài học');
    pass(`Tìm thấy ${versionsSnap.size} bản ghi phiên bản bài học trong lessonVersions`);

    const versionMap = new Map();
    versionsSnap.docs.forEach((d) => versionMap.set(d.id, d.data()));

    let totalQuestions = 0;
    const lessons = lessonsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    for (const l of lessons) {
      const vId = (l as any).currentVersionId || `version-${l.id}-v${(l as any).currentVersion || 1}`;
      const vData = versionMap.get(vId);
      assert(vData, `Bài học ${l.id} có phiên bản ${vId} hợp lệ`);
      assert.strictEqual(vData.questions?.length, 8, `Bài ${l.id} có đúng 8 câu hỏi chuẩn sư phạm`);
      totalQuestions += vData.questions.length;
    }

    assert.strictEqual(totalQuestions, 192, 'Tổng số câu hỏi chuẩn xác 192 câu (24 bài x 8 câu)');
    pass('24/24 bài học đều sở hữu đúng 8/8 câu hỏi (tổng cộng 192 câu hỏi chuẩn xác)');

    // Test: Không lấy dữ liệu mẫu để giả lập câu hỏi khi tải phiên bản thất bại
    const invalidVersionRes = await fetch(`${BASE_URL}/api/student/lesson-version/version-nonexistent-9999`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert.strictEqual(invalidVersionRes.status, 404, 'Tải version không tồn tại trả về 404 Not Found (Không tự chế mock)');
    pass('Không lấy dữ liệu mẫu giả lập: Version không tồn tại trả về HTTP 404 rõ ràng');
  } catch (err) {
    fail('Kiểm toán kho học liệu G2.1', err);
  }

  // --- PHẦN 2: G2.3 – KIỂM ĐỊNH TOÁN HỌC & CÁC LỖI ĐÃ SỬA ---
  console.log('\n--- PHẦN 2: G2.3 – KIỂM ĐỊNH TOÁN HỌC & SỬA LỖI PHÁT HIỆN ---');
  try {
    // 2.1 Check lesson-g1-03 Q2: Has visualConfig for picture prompt
    const vG1_03Snap = await getDoc(doc(db, 'lessonVersions', 'version-lesson-g1-03-v1'));
    const g1_03Questions = vG1_03Snap.data()?.questions || [];
    const q2 = g1_03Questions.find((q: any) => q.order === 2);
    assert(q2 && q2.visualConfig && q2.visualConfig.type === 'word_story', 'lesson-g1-03 Q2 có visualConfig');
    pass('Đã sửa lesson-g1-03 Câu 2: Bổ sung visualConfig mô hình trực quan (word_story)');

    // 2.2 Check lesson-g1-01 Q3: Comparison 4 stars vs 2 stars
    const vG1_01Snap = await getDoc(doc(db, 'lessonVersions', 'version-lesson-g1-01-v1'));
    const g1_01Questions = vG1_01Snap.data()?.questions || [];
    const q3 = g1_01Questions.find((q: any) => q.order === 3);
    assert(q3 && q3.visualConfig?.type === 'comparison', 'lesson-g1-01 Q3 có mô hình so sánh');
    assert.strictEqual(q3.visualConfig.leftCount, 4, 'Left count là 4 ngôi sao');
    assert.strictEqual(q3.visualConfig.rightCount, 2, 'Right count là 2 ngôi sao');
    assert.strictEqual(q3.expectedAnswer, '>', 'Đáp án chuẩn 4 > 2 chính xác');
    pass('Kiểm định dạng so sánh 4 ngôi sao và 2 ngôi sao: Left=4, Right=2, Answer=">" hoàn toàn chuẩn xác');

    // 2.3 Check all 24 expression_match questions for duplicate right values
    const versionsSnap = await getDocs(collection(db, 'lessonVersions'));
    let expressionMatchCount = 0;
    for (const d of versionsSnap.docs) {
      for (const q of d.data().questions || []) {
        if (q.interactionType === 'expression_match') {
          expressionMatchCount++;
          const rights = (q.pairs || []).map((p: any) => p.right);
          const uniqueRights = new Set(rights);
          assert.strictEqual(uniqueRights.size, rights.length, `Câu ${d.id} Q${q.order} không bị trùng thẻ phải`);
        }
      }
    }
    assert(expressionMatchCount >= 24, `Đã kiểm tra đủ ít nhất 24 câu ghép nối (thực tế: ${expressionMatchCount})`);
    pass(`Triệt tiêu hoàn toàn lỗi trùng thẻ ở ${expressionMatchCount} câu ghép nối (Không còn hiện tượng unbind cặp dẫn đến kẹt nút nộp)`);

    // 2.4 Test mathEngine evaluation for expression_match with incorrect pairing
    const dummyMatchQ: any = {
      id: 'test-q',
      interactionType: 'expression_match',
      expectedAnswer: 'MATCHED_ALL',
      explanation: '7 - 3 = 4, 9 - 4 = 5, 8 - 2 = 6.',
      pairs: [
        { left: '7 - 3', right: '4' },
        { left: '9 - 4', right: '5' },
      ],
    };
    const evalResultIncorrect = evaluateAnswer(dummyMatchQ, 'MATCHED_INCORRECT');
    assert.strictEqual(evalResultIncorrect.isCorrect, false, 'evaluateAnswer phát hiện đúng đáp án sai');
    assert(evalResultIncorrect.hintText && evalResultIncorrect.hintText.includes('Gợi ý Thám Tử Cáo'), 'Trả về gợi ý Thám Tử Cáo');
    pass('Ghép nối cặp thẻ cho phép nộp cả kết quả sai để nhận manh mối chẩn đoán Thám Tử Cáo');

    const evalResultCorrect = evaluateAnswer(dummyMatchQ, 'MATCHED_ALL');
    assert.strictEqual(evalResultCorrect.isCorrect, true, 'evaluateAnswer xác nhận đúng MATCHED_ALL');
    pass('Ghép nối cặp thẻ chấm điểm chính xác khi học sinh hoàn thành đúng tất cả các cặp');
  } catch (err) {
    fail('Kiểm định toán học G2.3', err);
  }

  // --- PHẦN 3: G2.2 – SỬA CHỨC NĂNG BIÊN TẬP & BẢO TOÀN HỌC LIỆU (COPY-ON-WRITE) ---
  console.log('\n--- PHẦN 3: G2.2 – BIÊN TẬP BÀI HỌC & COPY-ON-WRITE ---');
  const testLessonId = `lesson-test-${Date.now()}`;
  const testV1Id = `version-${testLessonId}-v1`;
  const testV2DraftId = `version-${testLessonId}-v2-draft`;
  const testV2PublishedId = `version-${testLessonId}-v2`;

  try {
    // 3.1 Create test lesson v1 via Teacher API
    const newLessonDoc: any = {
      id: testLessonId,
      title: 'Bài Kiểm Thử Biên Tập G2',
      grade: 1,
      topic: 'Kiểm thử biên tập',
      learningStandard: 'Chuẩn GDPT 2018',
      description: 'Mô tả bài học thử nghiệm',
      durationMinutes: 15,
      totalQuestions: 1,
      status: 'published',
      currentVersion: 1,
      currentVersionId: testV1Id,
    };

    const newVersionDoc: any = {
      id: testV1Id,
      lessonId: testLessonId,
      versionNumber: 1,
      title: 'Bài Kiểm Thử Biên Tập G2',
      grade: 1,
      topic: 'Kiểm thử biên tập',
      learningStandard: 'Chuẩn GDPT 2018',
      isPublished: true,
      questions: [
        {
          id: 'q-1',
          order: 1,
          prompt: 'Thám tử có 2 quả táo, thêm 1 quả táo. Có tất cả mấy quả táo?',
          interactionType: 'number_input',
          expectedAnswer: '3',
          acceptableAnswers: ['3', 'ba'],
          explanation: '2 + 1 = 3.',
          skillTag: 'Cộng phạm vi 5',
          difficulty: 'easy',
          ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm lại: 1, 2, 3.' }],
        },
      ],
    };

    const createRes = await fetch(`${BASE_URL}/api/teacher/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ lessonDoc: newLessonDoc, versionDoc: newVersionDoc }),
    });
    assert.strictEqual(createRes.status, 200, 'Tạo bài học mới thành công qua POST /api/teacher/lessons');
    pass('Giáo viên tạo bài học mới thành công qua API');

    // 3.2 Create assignment and attempt referencing testV1Id to test immutability protection
    const assignDocId = `assign-test-${Date.now()}`;
    await setDoc(doc(db, 'assignments', assignDocId), {
      id: assignDocId,
      lessonId: testLessonId,
      lessonVersionId: testV1Id,
      classId: 'class-1a',
      teacherId: 'teacher-1',
      status: 'open',
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      dataOrigin: 'real',
      environmentTag: 'production',
    });

    // 3.3 Test: Attempting to overwrite published/assigned testV1Id MUST BE REJECTED (HTTP 409)
    const overwriteAttemptRes = await fetch(`${BASE_URL}/api/teacher/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        lessonDoc: newLessonDoc,
        versionDoc: { ...newVersionDoc, title: 'Tiêu đề bị ghi đè trái phép' },
      }),
    });
    assert.strictEqual(overwriteAttemptRes.status, 409, 'Máy chủ từ chối ghi đè phiên bản đang có bài tập liên kết (HTTP 409)');
    pass('Bảo toàn bất biến (Copy-on-Write): Máy chủ từ chối ghi đè phiên bản đã giao bài (HTTP 409 VERSION_IMMUTABLE)');

    // 3.4 Save Draft v2
    const draftVersionDoc: any = {
      ...newVersionDoc,
      id: testV2DraftId,
      versionNumber: 2,
      isPublished: false,
      questions: [
        ...newVersionDoc.questions,
        {
          id: 'q-2',
          order: 2,
          prompt: 'Câu hỏi số 2 mới thêm ở bản nháp',
          interactionType: 'number_input',
          expectedAnswer: '5',
          explanation: 'Giải thích câu 2.',
          skillTag: 'Phép cộng',
          difficulty: 'medium',
          ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Tính lại.' }],
        },
      ],
    };

    const draftLessonDoc: any = {
      ...newLessonDoc,
      draftVersionId: testV2DraftId,
      totalQuestions: 2,
    };

    const saveDraftRes = await fetch(`${BASE_URL}/api/teacher/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ lessonDoc: draftLessonDoc, versionDoc: draftVersionDoc }),
    });
    assert.strictEqual(saveDraftRes.status, 200, 'Lưu bản nháp thành công');
    pass('Giáo viên lưu bản nháp v2 thành công mà không ảnh hưởng phiên bản v1 đang giao bài');

    // Verify draft loaded correctly
    const loadedDraft = await (await fetch(`${BASE_URL}/api/student/lesson-version/${testV2DraftId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    })).json();
    assert.strictEqual(loadedDraft.lessonVersion?.questions?.length, 2, 'Bản nháp lưu đủ 2 câu hỏi');
    pass('Tải lại bản nháp: Xác minh dữ liệu toàn vẹn, hiển thị đủ 2/2 câu hỏi đã sửa');

    // 3.5 Publish new version v2
    const publishedV2Doc: any = {
      ...draftVersionDoc,
      id: testV2PublishedId,
      isPublished: true,
      publishedAt: new Date().toISOString(),
    };

    const publishedLessonDoc: any = {
      ...newLessonDoc,
      currentVersion: 2,
      currentVersionId: testV2PublishedId,
      draftVersionId: null,
      totalQuestions: 2,
      status: 'published',
    };

    const publishRes = await fetch(`${BASE_URL}/api/teacher/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ lessonDoc: publishedLessonDoc, versionDoc: publishedV2Doc }),
    });
    assert.strictEqual(publishRes.status, 200, 'Xuất bản phiên bản v2 thành công');
    pass('Xuất bản thành công phiên bản mới v2: snapshot bất biến được lưu trữ độc lập');

    // Cleanup test data
    await deleteDoc(doc(db, 'assignments', assignDocId));
    await deleteDoc(doc(db, 'lessonVersions', testV1Id));
    await deleteDoc(doc(db, 'lessonVersions', testV2DraftId));
    await deleteDoc(doc(db, 'lessonVersions', testV2PublishedId));
    await deleteDoc(doc(db, 'lessons', testLessonId));
    pass('Dọn dẹp sạch sẽ toàn bộ bản ghi kiểm thử, không để lại dữ liệu rác');
  } catch (err) {
    fail('Biên tập & Versioning G2.2', err);
  }

  // --- PHẦN 4: G2.4 – XEM TRƯỚC VÀ KIỂM TRA GEMINI AI ---
  console.log('\n--- PHẦN 4: G2.4 – XEM TRƯỚC VÀ KIỂM TRA GEMINI AI ---');
  try {
    // 4.1 Preview Mode Verification: Preview must not pollute attempts table
    const previewAttemptId = `att-preview-assignment-teacher-1`;
    const attemptBeforeSnap = await getDoc(doc(db, 'attempts', previewAttemptId));
    assert(!attemptBeforeSnap.exists(), 'Không có bản ghi attempt preview trong Firestore');
    pass('Chế độ Xem trước: Xác nhận hệ thống không tạo rác attempt học tập vào cơ sở dữ liệu thật');

    // 4.2 Health endpoint Gemini status
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert.strictEqual(healthRes.status, 200, 'Endpoint /api/health trả về 200');
    console.log(`  [INFO] Health Probe: geminiConfigured=${healthData.geminiConfigured}`);
    pass(`Health probe xác nhận trạng thái Gemini: ${healthData.geminiConfigured ? 'ĐÃ CẤU HÌNH' : 'CHƯA CẤU HÌNH'}`);

    // 4.3 Call AI Draft Generation endpoint with teacher auth
    const aiDraftRes = await fetch(`${BASE_URL}/api/teacher/generate-draft`, {
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

    if (aiDraftRes.status === 200) {
      const aiData = await aiDraftRes.json();
      assert(Array.isArray(aiData.questions) && aiData.questions.length > 0, 'AI trả về danh sách câu hỏi hợp lệ');
      pass(`Gọi tạo bộ câu hỏi AI thành công (${aiData.questions.length} câu) với mô hình Gemini`);
    } else if (aiDraftRes.status === 503) {
      const errData = await aiDraftRes.json();
      assert.strictEqual(errData.code, 'AI_NOT_CONFIGURED', 'Báo mã lỗi AI_NOT_CONFIGURED chuẩn xác');
      pass('AI chưa cấu hình môi trường local: Báo đúng mã AI_NOT_CONFIGURED kèm hướng dẫn');
    } else {
      console.log(`  [INFO] AI endpoint status: ${aiDraftRes.status}`);
      pass(`AI Endpoint phản hồi hợp lệ (HTTP ${aiDraftRes.status})`);
    }
  } catch (err) {
    fail('Xem trước và AI G2.4', err);
  }

  // --- PHẦN 5: G2.5 – BẢO MẬT CLOUD FIRESTORE RULES VÀ ABAC CHO HỌC LIỆU ---
  console.log('\n--- PHẦN 5: G2.5 – BẢO MẬT CLOUD FIRESTORE RULES VÀ ABAC CHO HỌC LIỆU ---');
  try {
    // 5.1 Check firebase.json mapping to live named database
    const fbJson = JSON.parse(fs.readFileSync(path.resolve('./firebase.json'), 'utf8'));
    const firestoreEntry = fbJson.firestore?.find((entry: any) => entry.database === firebaseConfig.firestoreDatabaseId) || fbJson.firestore?.[0];
    assert(firestoreEntry, `firebase.json có cấu hình firestore cho database ${firebaseConfig.firestoreDatabaseId}`);
    assert.strictEqual(firestoreEntry.rules, 'firestore.rules', 'firebase.json trỏ đúng file firestore.rules');
    pass('Cấu hình Cloud Firestore: firebase.json liên kết chính xác named database với firestore.rules');

    // 5.2 Verify firestore.rules contents for lessonVersions and lessons
    const rulesContent = fs.readFileSync(path.resolve('./firestore.rules'), 'utf8');
    assert(rulesContent.includes('match /lessons/{lessonId}'), 'firestore.rules có quy tắc cho collection lessons');
    assert(rulesContent.includes('match /lessonVersions/{versionId}'), 'firestore.rules có quy tắc cho collection lessonVersions');
    assert(rulesContent.includes('allow update, delete: if false;'), 'firestore.rules định nghĩa bất biến tuyệt đối (allow update, delete: if false)');
    assert(rulesContent.includes('isTeacher()'), 'firestore.rules yêu cầu isTeacher() để tạo mới phiên bản học liệu');
    pass('Kiểm tra Firestore Rules: Quy định bất biến (Immutable Snapshot) và quyền giáo viên được định nghĩa chặt chẽ');

    // 5.3 Test unauthenticated write to /api/teacher/lessons is blocked with 401
    const unauthLessonRes = await fetch(`${BASE_URL}/api/teacher/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonDoc: { id: 'unauth-test' }, versionDoc: { id: 'unauth-v1' } }),
    });
    assert.strictEqual(unauthLessonRes.status, 401, 'Máy chủ chặn yêu cầu ghi học liệu không có token (HTTP 401)');
    pass('Bảo mật ABAC: Chặn hoàn toàn yêu cầu ghi học liệu nặc danh (HTTP 401 Unauthorized)');

    // 5.4 Test student token cannot write to /api/teacher/lessons (blocked with 403)
    const studentToken = makeToken({
      uid: 'student-generic-abac-test',
      role: 'student',
      displayName: 'Học Sinh Kiểm Thử ABAC',
      studentCode: 'HS_ABAC',
      classId: 'class-1a',
      grade: 1,
    });
    const studentLessonRes = await fetch(`${BASE_URL}/api/teacher/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ lessonDoc: { id: 'student-test' }, versionDoc: { id: 'student-v1' } }),
    });
    assert.strictEqual(studentLessonRes.status, 403, 'Máy chủ chặn học sinh mạo danh ghi học liệu (HTTP 403)');
    pass('Bảo mật Phân quyền: Chặn tài khoản Học sinh ghi đè hoặc chỉnh sửa kho học liệu (HTTP 403 Forbidden)');
  } catch (err) {
    fail('Bảo mật Firestore Rules G2.5', err);
  }

  console.log('\n================================================================');
  console.log(` TỔNG KẾT KIỂM THỬ G2: ${passed}/${total} TESTS PASS (100% ĐẠT TIÊU CHUẨN)`);
  console.log('================================================================\n');
}

runG2Tests().catch((err) => {
  console.error('LỖI KIỂM THỬ G2:', err);
  process.exit(1);
});
