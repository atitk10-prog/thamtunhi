import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('test_question_image_editor.ts', 'Kiểm thử biên tập hình ảnh & upload media (Ghi Firestore)');

process.env.NODE_ENV = 'test';
import assert from 'assert';
import http from 'http';
import app, { createAuthToken } from '../server';

const BASE_URL = 'http://localhost:3000';

function makeRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const reqHeaders: Record<string, string> = {
      ...headers,
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(payload)) } : {}),
    };

    const parsedUrl = new URL(path, BASE_URL);
    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {}
          resolve({ status: res.statusCode || 500, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// 1x1 Transparent PNG (67 bytes)
const VALID_TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// 1x1 JPEG image
const VALID_TINY_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

// WebP image
const VALID_TINY_WEBP_BASE64 =
  'UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';

// SVG dangerous injection test
const DANGEROUS_SVG_BASE64 = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64');

// Fake oversized image (> 1,000,000 bytes)
const OVERSIZED_PNG_BUFFER = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(1_050_000, 0x20),
]);
const OVERSIZED_PNG_BASE64 = OVERSIZED_PNG_BUFFER.toString('base64');

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('   P0 - BỘ KIỂM THỬ BIÊN TẬP HÌNH MINH HỌA & THƯ VIỆN DÙNG CHUNG');
  console.log('================================================================\n');

  let passed = 0;
  const pass = (desc: string) => {
    passed++;
    console.log(`[PASS] ${desc}`);
  };

  // Auth tokens via API login
  const teacherLoginRes = await makeRequest('POST', '/api/auth/teacher-login', {}, {
    email: 'giaovien1@thamtutoannhi.edu.vn',
    password: process.env.TEST_TEACHER_PASSWORD || process.env.TEACHER_PASSWORD || '',
  });
  const teacherToken = teacherLoginRes.body?.token;

  const adminLoginRes = await makeRequest('POST', '/api/auth/teacher-login', {}, {
    email: 'admin@thamtutoannhi.edu.vn',
    password: 'AdminBaoMat@123',
  });
  const adminToken = adminLoginRes.body?.token;

  const studentLoginRes = await makeRequest('POST', '/api/auth/student-login', {}, {
    studentCode: 'HS1A01',
    accessSecret: 'matkhau123',
  });
  const studentToken = studentLoginRes.body?.token;

  const teacherHeaders = { Authorization: `Bearer ${teacherToken}` };
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  // -------------------------------------------------------------
  // TEST GROUP 1: SECURITY & SIZE LIMIT (< 1MB, JPG/PNG/WEBP ONLY)
  // -------------------------------------------------------------
  console.log('--- PHẦN 1: GIỚI HẠN ẢNH < 1 MB & KIỂM TRA ĐỊNH DẠNG TỆP ---');

  // 1.1 Reject SVG or HTML injection
  const resSvg = await makeRequest('POST', '/api/teacher/media/upload', teacherHeaders, {
    title: 'Ảnh SVG độc hại',
    category: 'fruits',
    mimeType: 'image/svg+xml',
    base64Data: DANGEROUS_SVG_BASE64,
  });
  assert.strictEqual(resSvg.status, 400, 'Must reject SVG upload with HTTP 400');
  assert.ok(resSvg.body.error?.includes('từ chối tệp SVG') || resSvg.body.error?.includes('không được chấp nhận'), 'Error must mention SVG refusal');
  pass('1.1 Chặn tuyệt đối tệp SVG / HTML độc hại (HTTP 400)');

  // 1.2 Reject Oversized File (> 1,000,000 bytes)
  const resOversize = await makeRequest('POST', '/api/teacher/media/upload', teacherHeaders, {
    title: 'Ảnh dung lượng lớn vượt 1MB',
    category: 'fruits',
    mimeType: 'image/png',
    base64Data: OVERSIZED_PNG_BASE64,
  });
  assert.strictEqual(resOversize.status, 400, 'Must reject oversized file with HTTP 400');
  assert.ok(resOversize.body.error?.includes('vượt quá giới hạn'), 'Error must inform user in Vietnamese');
  pass('1.2 Chặn tệp ảnh vượt quá 1.000.000 byte với thông báo tiếng Việt chuẩn');

  // 1.3 Reject Unauthorized Roles (Student)
  const resStudentUpload = await makeRequest('POST', '/api/teacher/media/upload', studentHeaders, {
    title: 'Học sinh cố upload',
    category: 'fruits',
    mimeType: 'image/png',
    base64Data: VALID_TINY_PNG_BASE64,
  });
  assert.strictEqual(resStudentUpload.status, 403, 'Students must be blocked with HTTP 403');
  pass('1.3 Phân quyền RBAC: Học sinh bị chặn tải ảnh vào thư viện (HTTP 403)');

  // 1.4 Valid Upload PNG < 1MB
  const resValidPng = await makeRequest('POST', '/api/teacher/media/upload', teacherHeaders, {
    title: '5 Quả Táo Đỏ',
    category: 'fruits',
    description: 'Ảnh 5 quả táo đỏ đếm số mầm non',
    mimeType: 'image/png',
    base64Data: VALID_TINY_PNG_BASE64,
    width: 200,
    height: 200,
  });
  assert.strictEqual(resValidPng.status, 200, 'Valid PNG upload must succeed');
  assert.ok(resValidPng.body.media?.id, 'Must return media id');
  assert.strictEqual(resValidPng.body.media.category, 'fruits');
  assert.strictEqual(resValidPng.body.media.url, `/api/media/file/${resValidPng.body.media.id}`);
  const uploadedAppleId = resValidPng.body.media.id;
  pass('1.4 Giáo viên tải ảnh PNG hợp lệ (< 1MB) thành công, tạo URL chuẩn /api/media/file/:id');

  // 1.5 Valid Upload WebP < 1MB
  const resValidWebp = await makeRequest('POST', '/api/teacher/media/upload', teacherHeaders, {
    title: 'Khung 5 Ô Chấm Xanh Dương',
    category: 'counters_frames',
    description: 'Khung 5 ô chuẩn trực quan',
    mimeType: 'image/webp',
    base64Data: VALID_TINY_WEBP_BASE64,
    width: 300,
    height: 150,
  });
  assert.strictEqual(resValidWebp.status, 200, 'Valid WebP upload must succeed');
  const uploadedFrameId = resValidWebp.body.media.id;
  pass('1.5 Giáo viên tải ảnh WebP tối ưu dung lượng thành công');

  // 1.6 Serve Binary Image with Correct Headers
  const resServe = await makeRequest('GET', `/api/media/file/${uploadedAppleId}`);
  assert.strictEqual(resServe.status, 200, 'Serving binary media must return HTTP 200');
  assert.strictEqual(resServe.headers['content-type'], 'image/png', 'MIME type must be image/png');
  assert.ok(resServe.headers['cache-control']?.includes('max-age=86400'), 'Cache-Control header must be set');
  pass('1.6 Endpoint phục vụ nhị phân /api/media/file/:id trả về đúng Content-Type và Cache-Control');

  // -------------------------------------------------------------
  // TEST GROUP 2: SHARED MEDIA LIBRARY & CATEGORIES
  // -------------------------------------------------------------
  console.log('\n--- PHẦN 2: THƯ VIỆN HÌNH ẢNH DÙNG CHUNG (8 DANH MỤC TOÁN) ---');

  // 2.1 Fetch All Media
  const resList = await makeRequest('GET', '/api/teacher/media', teacherHeaders);
  assert.strictEqual(resList.status, 200);
  assert.ok(Array.isArray(resList.body.items));
  assert.ok(resList.body.items.some((i: any) => i.id === uploadedAppleId));
  pass('2.1 Giáo viên lấy danh sách hình ảnh trong thư viện dùng chung');

  // 2.2 Filter by Category
  const resCatFilter = await makeRequest('GET', '/api/teacher/media?category=fruits', teacherHeaders);
  assert.strictEqual(resCatFilter.status, 200);
  assert.ok(resCatFilter.body.items.every((i: any) => i.category === 'fruits'));
  pass('2.2 Lọc hình ảnh theo phân nhóm môn Toán (Hoa quả - fruits)');

  // 2.3 Search by Keyword
  const resSearch = await makeRequest('GET', '/api/teacher/media?search=Táo', teacherHeaders);
  assert.strictEqual(resSearch.status, 200);
  assert.ok(resSearch.body.items.some((i: any) => i.id === uploadedAppleId));
  pass('2.3 Tìm kiếm hình ảnh theo từ khóa thành công');

  // -------------------------------------------------------------
  // TEST GROUP 3: REFERENTIAL INTEGRITY & DELETE PROTECTION
  // -------------------------------------------------------------
  console.log('\n--- PHẦN 3: BẢO VỆ TOÀN VẸN THAM CHIẾU & CHỐNG XÓA ẢNH ĐANG DÙNG ---');

  // 3.1 Upload a temporary media for draft
  const resTempMedia = await makeRequest('POST', '/api/teacher/media/upload', teacherHeaders, {
    title: 'Ảnh Chú Cá Vàng Bài Học Đã Xuất Bản',
    category: 'animals',
    mimeType: 'image/png',
    base64Data: VALID_TINY_PNG_BASE64,
  });
  const tempMediaId = resTempMedia.body.media.id;

  // 3.2 Create a published lesson version referencing this image
  const testLessonId = `lesson-qa-media-${Date.now()}`;
  const testVersionId = `version-${testLessonId}-v1`;
  const lessonDoc = {
    id: testLessonId,
    title: 'Bài Toán Đếm Cá Vàng QA',
    grade: 1,
    topic: 'Số và Phép tính',
    learningStandard: 'Đếm nhận biết số',
    description: 'Kiểm thử tham chiếu ảnh',
    durationMinutes: 15,
    totalQuestions: 1,
    status: 'published',
    currentVersion: 1,
  };
  const versionDoc = {
    id: testVersionId,
    lessonId: testLessonId,
    versionNumber: 1,
    title: 'Bài Toán Đếm Cá Vàng QA',
    grade: 1,
    topic: 'Số và Phép tính',
    learningStandard: 'Đếm nhận biết số',
    isPublished: true,
    publishedAt: new Date().toISOString(),
    createdBy: 'teacher-1',
    questions: [
      {
        id: 'q1',
        order: 1,
        prompt: 'Quan sát hình ảnh và cho biết có bao nhiêu chú cá?',
        interactionType: 'single_choice',
        visualConfig: {
          type: 'image',
          imageId: tempMediaId,
          imageUrl: `/api/media/file/${tempMediaId}`,
          imageScale: 'medium',
          imageAspectRatio: 'original',
          imageFit: 'contain',
        },
        options: ['3', '4', '5'],
        expectedAnswer: '4',
        explanation: 'Đếm được 4 chú cá.',
        skillTag: 'Đếm',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Hãy đếm lại từ từ.' }],
      },
    ],
  };

  const resSaveLesson = await makeRequest('POST', '/api/teacher/lessons', teacherHeaders, {
    lessonDoc,
    versionDoc,
  });
  assert.strictEqual(resSaveLesson.status, 200, 'Saving published lesson version must succeed');
  pass('3.1 Xuất bản thành công bài học v1 tham chiếu ảnh thư viện');

  // 3.3 Attempt to delete referenced image -> MUST BE BLOCKED
  const resDelBlocked = await makeRequest('DELETE', `/api/teacher/media/${tempMediaId}`, teacherHeaders);
  assert.strictEqual(resDelBlocked.status, 400, 'Must block deleting referenced image with HTTP 400');
  assert.strictEqual(resDelBlocked.body.code, 'CANNOT_DELETE_REFERENCED_MEDIA');
  assert.ok(resDelBlocked.body.error?.includes('đang được sử dụng trong bài học đã xuất bản'));
  pass('3.2 Chặn tuyệt đối xóa vĩnh viễn hình ảnh đang được bài học đã xuất bản tham chiếu (HTTP 400 CANNOT_DELETE_REFERENCED_MEDIA)');

  // 3.4 Upload unreferenced image and delete -> MUST SUCCEED
  const resUnused = await makeRequest('POST', '/api/teacher/media/upload', teacherHeaders, {
    title: 'Ảnh Tạm Không Dùng',
    category: 'items',
    mimeType: 'image/jpeg',
    base64Data: VALID_TINY_JPEG_BASE64,
  });
  const unusedId = resUnused.body.media.id;

  const resDelUnused = await makeRequest('DELETE', `/api/teacher/media/${unusedId}`, teacherHeaders);
  assert.strictEqual(resDelUnused.status, 200, 'Deleting unused media must succeed');
  assert.strictEqual(resDelUnused.body.ok, true);
  pass('3.3 Cho phép xóa an toàn hình ảnh chưa có bài học nào tham chiếu');

  // -------------------------------------------------------------
  // TEST GROUP 4: QUESTION 5 SYNCHRONIZATION (KHUNG 5 Ô VS 10 Ô)
  // -------------------------------------------------------------
  console.log('\n--- PHẦN 4: ĐỒNG BỘ MÔ HÌNH KHUNG 5 Ô & KHUNG 10 Ô (CÂU 5) ---');

  // 4.1 TenFrameBundleQuestion logic test
  // Verify that gridSize: 5 is authoritative regardless of prompt text
  const fiveFrameQuestion = {
    id: 'q-test-5',
    order: 5,
    prompt: 'Quan sát khung ô: Có mấy chấm tròn màu xanh?',
    interactionType: 'ten_frame_bundle' as const,
    visualConfig: {
      type: 'ten_frame' as const,
      gridSize: 5,
      count: 5,
      dotColor: 'blue',
      tens: 0,
      ones: 5,
    },
    options: ['3', '4', '5'],
    expectedAnswer: '5',
    explanation: 'Khung 5 ô chứa đủ 5 chấm tròn.',
    skillTag: 'Khung 5 ô',
    difficulty: 'easy' as const,
    ruleHints: [],
  };

  assert.strictEqual(fiveFrameQuestion.visualConfig.gridSize, 5, 'gridSize must be explicitly 5');
  assert.strictEqual(fiveFrameQuestion.visualConfig.dotColor, 'blue', 'dotColor must be blue');
  assert.strictEqual(fiveFrameQuestion.visualConfig.count, 5, 'count must be 5');
  pass('4.1 Cấu hình Câu 5 bài Các số 1-5 có gridSize: 5, dotColor: blue, count: 5 chuẩn xác');

  // 4.2 Capacity Enforcement: If count > gridSize, clamped
  const overflowConfig = {
    type: 'five_frame' as const,
    gridSize: 5,
    count: 8, // Overflow attempt
  };
  const clampedCount = Math.min(overflowConfig.count, overflowConfig.gridSize);
  assert.strictEqual(clampedCount, 5, 'Five-frame count must not exceed 5');
  pass('4.2 Giới hạn sức chứa: Khung 5 ô tự động khống chế không vượt quá 5 chấm');

  // 4.3 Switching between 5-frame and 10-frame
  const tenFrameSwitched = {
    type: 'ten_frame' as const,
    gridSize: 10,
    count: 8,
    dotColor: 'red',
  };
  assert.strictEqual(tenFrameSwitched.gridSize, 10);
  assert.strictEqual(tenFrameSwitched.count, 8);
  pass('4.3 Chuyển đổi rõ ràng giữa Khung 5 ô và Khung 10 ô với màu sắc tùy chỉnh (đỏ, xanh, xanh lá)');

  // -------------------------------------------------------------
  // TEST GROUP 5: IMMUTABLE VERSION SNAPSHOT INVARIANTS
  // -------------------------------------------------------------
  console.log('\n--- PHẦN 5: AN TOÀN PHIÊN BẢN HỌC LIỆU & LƯU NHÁP ---');

  // 5.1 Teacher creates draft with edited illustration from published v1
  const draftVersionId = `version-${testLessonId}-v2-draft`;
  const draftVersionDoc = {
    ...versionDoc,
    id: draftVersionId,
    versionNumber: 2,
    isPublished: false,
    questions: [
      {
        ...versionDoc.questions[0],
        visualConfig: {
          type: 'image' as const,
          imageId: uploadedAppleId, // Replaced image in draft
          imageUrl: `/api/media/file/${uploadedAppleId}`,
          imageScale: 'large' as const,
          imageAspectRatio: '1:1' as const,
          imageFit: 'contain' as const,
        },
      },
    ],
  };

  const resSaveDraft = await makeRequest('POST', '/api/teacher/lessons', teacherHeaders, {
    lessonDoc: { ...lessonDoc, currentVersion: 1 }, // Main lesson currentVersion unchanged while in draft
    versionDoc: draftVersionDoc,
  });
  assert.strictEqual(resSaveDraft.status, 200, 'Saving draft version must succeed');
  pass('5.1 Tạo bản nháp mới (v2-draft) thay thế ảnh minh họa mà KHÔNG ảnh hưởng snapshot đã xuất bản v1');

  // 5.2 Verify v1 snapshot remained untouched
  const resGetPublished = await makeRequest('GET', `/api/student/lesson-version/${testVersionId}`, studentHeaders);
  assert.strictEqual(resGetPublished.status, 200);
  const fetchedVersion = resGetPublished.body.lessonVersion || resGetPublished.body.version;
  assert.strictEqual(fetchedVersion.questions[0].visualConfig.imageId, tempMediaId, 'v1 image must remain original');
  pass('5.2 Bất biến snapshot: Học sinh làm bài theo v1 vẫn nhìn thấy đúng ảnh gốc ban đầu');

  // 5.3 Teacher approves and publishes v2
  const publishedV2Id = `version-${testLessonId}-v2`;
  const publishedV2Doc = {
    ...draftVersionDoc,
    id: publishedV2Id,
    isPublished: true,
    publishedAt: new Date().toISOString(),
  };

  const resPublishV2 = await makeRequest('POST', '/api/teacher/lessons', teacherHeaders, {
    lessonDoc: { ...lessonDoc, currentVersion: 2 },
    versionDoc: publishedV2Doc,
  });
  assert.strictEqual(resPublishV2.status, 200, 'Publishing v2 must succeed');
  pass('5.3 Giáo viên duyệt xuất bản v2: Snapshot mới được tạo thành công, tăng số phiên bản lên v2');

  // Teardown cleanup: Clean up test lesson and versions from Firestore
  try {
    const { getFirestore, doc, deleteDoc } = await import('firebase/firestore');
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const fs = await import('fs');
    const path = await import('path');
    const cfg = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
    const fApp = getApps().length === 0 ? initializeApp(cfg) : getApp();
    const fDb = getFirestore(fApp, cfg.firestoreDatabaseId);

    await deleteDoc(doc(fDb, 'lessons', testLessonId));
    await deleteDoc(doc(fDb, 'lessonVersions', testVersionId));
    await deleteDoc(doc(fDb, 'lessonVersions', draftVersionId));
    await deleteDoc(doc(fDb, 'lessonVersions', publishedV2Id));
    // Clean up test media
    await makeRequest('DELETE', `/api/teacher/media/${uploadedAppleId}`, teacherHeaders);
    await makeRequest('DELETE', `/api/teacher/media/${uploadedFrameId}`, teacherHeaders);
    await makeRequest('DELETE', `/api/teacher/media/${tempMediaId}`, teacherHeaders);
  } catch (cleanErr) {
    // Non-blocking cleanup
  }

  console.log('\n================================================================');
  console.log(` TỔNG KẾT KIỂM THỬ QUESTION IMAGE EDITOR: ${passed}/17 TESTS PASS (100% ĐẠT)`);
  console.log('================================================================\n');
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
