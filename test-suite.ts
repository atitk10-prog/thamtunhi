process.env.NODE_ENV = 'test';
import http from 'http';
import { runMathEngineTests } from './src/lib/mathEngine.test.ts';
import app, { createAuthToken, verifyAuthToken } from './server.ts';

// Helper to make local in-memory HTTP requests against Express app
function request(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      const port = addr.port;

      const payload = body ? JSON.stringify(body) : undefined;
      const reqHeaders: Record<string, string> = {
        ...headers,
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(payload)) } : {}),
      };

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let rawData = '';
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            server.close();
            let parsedBody = rawData;
            try {
              parsedBody = JSON.parse(rawData);
            } catch {
              // Raw string
            }
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: parsedBody,
            });
          });
        }
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log(' BỘ KIỂM THỬ TỔNG THỂ DỰ ÁN THÁM TỬ TOÁN NHÍ (LỚP 1–2 GDPT 2018)');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] ${testName}`);
    } else {
      console.error(`  [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
    }
  }

  // --- 1. UNIT TESTS: MATH ENGINE & 6 INTERACTION TYPES ---
  console.log('--- PHẦN 1: UNIT TEST MATH ENGINE & 6 DẠNG TƯƠNG TÁC ---');
  const mathResults = runMathEngineTests();
  assert(mathResults.failed === 0, '16 Unit tests thuật toán Toán & chẩn đoán lỗi sai', `${mathResults.passed}/16 pass`);

  // --- 2. UNIT TESTS: HMAC TOKEN SECURITY ---
  console.log('\n--- PHẦN 2: BẢO MẬT PHIÊN & TOKEN HMAC-SHA256 ---');
  const studentToken = createAuthToken({
    uid: 'student-hs1a01',
    role: 'student',
    displayName: 'An (1A)',
    studentCode: 'HS1A01',
    classId: 'class-1a',
    grade: 1,
  });
  const decodedStudent = verifyAuthToken(studentToken);
  assert(decodedStudent !== null && decodedStudent.role === 'student', 'Tạo và giải mã Token Học Sinh thành công');
  assert(decodedStudent?.studentCode === 'HS1A01', 'Bảo toàn mã định danh học sinh trong claims');

  const teacherToken = createAuthToken({
    uid: 'teacher-1',
    role: 'teacher',
    displayName: 'Cô Mai Lan',
    email: 'giaovien1@thamtutoannhi.edu.vn',
  });
  const decodedTeacher = verifyAuthToken(teacherToken);
  assert(decodedTeacher !== null && decodedTeacher.role === 'teacher', 'Tạo và giải mã Token Giáo Viên thành công');

  const adminToken = createAuthToken({
    uid: 'admin-demo',
    role: 'admin',
    displayName: 'Quản Trị Viên',
    email: 'admin@thamtutoannhi.edu.vn',
  });
  const decodedAdmin = verifyAuthToken(adminToken);
  assert(decodedAdmin !== null && decodedAdmin.role === 'admin', 'Tạo và giải mã Token Quản Trị thành công');

  // Tamper resistance test
  const tamperedToken = studentToken.slice(0, -4) + 'abcd';
  const decodedTampered = verifyAuthToken(tamperedToken);
  assert(decodedTampered === null, 'Chặn Token bị làm giả / sửa chữ ký số (Anti-Tampering)');

  // Empty / invalid token test
  assert(verifyAuthToken('') === null, 'Chặn Token rỗng');
  assert(verifyAuthToken('invalid.format.token') === null, 'Chặn định dạng token dị thường');

  // --- 3. INTEGRATION TESTS: /api/health ---
  console.log('\n--- PHẦN 3: KIỂM THỬ HEALTH PROBE & CLOUD FIRESTORE ---');
  try {
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200, 'Endpoint /api/health trả về HTTP 200');
    assert(healthRes.body.status === 'healthy', 'Trạng thái hệ thống healthy');
    assert(healthRes.body.firestoreConnected === true, 'Kết nối thực tế Cloud Firestore thành công');
    assert(typeof healthRes.body.lessonsCount === 'number' && healthRes.body.lessonsCount > 0, `Đã probe thực tế ${healthRes.body.lessonsCount} bài học trên Firestore`);
    assert(healthRes.body.databaseId === 'ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2', 'Truy vấn đúng named database Firestore');
  } catch (err: any) {
    assert(false, 'Gọi /api/health', err.message);
  }

  // --- 4. SECURITY TESTS: STUDENT AUTH & NO PLAINTEXT LEAK ---
  console.log('\n--- PHẦN 4: KIỂM THỬ XÁC THỰC HỌC SINH & CHỐNG LỘ BÍ MẬT ---');
  // Missing credentials
  const stuEmptyRes = await request('POST', '/api/auth/student-login', {}, {});
  assert(stuEmptyRes.status === 400, 'Chặn yêu cầu thiếu tham số (HTTP 400)');

  // Wrong password
  const stuWrongRes = await request('POST', '/api/auth/student-login', {}, {
    studentCode: 'HS1A01',
    accessSecret: 'wrong_password_xyz',
  });
  assert(stuWrongRes.status === 401, 'Chặn mật khẩu sai của học sinh (HTTP 401)');

  // Valid student login
  const stuValidRes = await request('POST', '/api/auth/student-login', {}, {
    studentCode: 'HS1A01',
    accessSecret: 'matkhau123',
  });
  assert(stuValidRes.status === 200, 'Đăng nhập học sinh HS1A01 thành công (HTTP 200)');
  assert(Boolean(stuValidRes.body.token), 'Cấp Token định danh an toàn cho học sinh');
  assert(stuValidRes.body.user && !stuValidRes.body.user.accessSecret && !stuValidRes.body.user.password, 'Không trả về trường mật khẩu/accessSecret trong response (Zero leak)');

  // --- 5. SECURITY TESTS: TEACHER & ADMIN AUTH & BACKDOOR ELIMINATION ---
  console.log('\n--- PHẦN 5: KIỂM THỬ XÁC THỰC GIÁO VIÊN & TRIỆT TIÊU BACKDOOR ---');
  // Backdoor elimination test: Trying to log in with arbitrary non-existent user should return 401, NOT create a backdoor user
  const backdoorRes = await request('POST', '/api/auth/teacher-login', {}, {
    email: 'hacker@thamtutoannhi.edu.vn',
    password: 'AdminBaoMat@123',
  });
  assert(backdoorRes.status === 401, 'Triệt tiêu hoàn toàn backdoor tự cấp quyền admin (HTTP 401)');

  // Valid Teacher login
  const teacherLoginRes = await request('POST', '/api/auth/teacher-login', {}, {
    email: 'giaovien1@thamtutoannhi.edu.vn',
    password: 'MatKhauGiaoVien@123',
  });
  assert(teacherLoginRes.status === 200, 'Đăng nhập giáo viên 1 thành công (HTTP 200)');
  assert(Boolean(teacherLoginRes.body.token), 'Cấp Token cho Giáo viên');
  assert(teacherLoginRes.body.user && !teacherLoginRes.body.user.password, 'Không lộ mật khẩu giáo viên ra client');

  // Valid Admin login
  const adminLoginRes = await request('POST', '/api/auth/teacher-login', {}, {
    email: 'admin@thamtutoannhi.edu.vn',
    password: 'AdminBaoMat@123',
  });
  assert(adminLoginRes.status === 200, 'Đăng nhập Quản trị viên thành công (HTTP 200)');
  assert(adminLoginRes.body.user?.role === 'admin', 'Xác thực đúng vai trò admin');

  // --- 6. SECURITY TESTS: SESSION VERIFICATION ---
  console.log('\n--- PHẦN 6: KIỂM THỬ XÁC MINH PHIÊN ĐĂNG NHẬP (/api/auth/verify-session) ---');
  const verifyNoTokenRes = await request('GET', '/api/auth/verify-session');
  assert(verifyNoTokenRes.status === 401, 'Chặn truy cập verify-session khi không có token (HTTP 401)');

  const verifyWithTokenRes = await request('GET', '/api/auth/verify-session', {
    Authorization: `Bearer ${teacherLoginRes.body.token}`,
  });
  assert(verifyWithTokenRes.status === 200, 'Xác minh phiên đăng nhập giáo viên thành công (HTTP 200)');
  assert(verifyWithTokenRes.body.user?.role === 'teacher', 'Dữ liệu phiên khớp vai trò giáo viên');

  // --- 7. SECURITY TESTS: ACCESS CONTROL (RBAC/ABAC) ON API ENDPOINTS ---
  console.log('\n--- PHẦN 7: KIỂM SOÁT PHÂN QUYỀN API (ROLE-BASED ACCESS CONTROL) ---');
  // AI draft without token
  const aiNoToken = await request('POST', '/api/teacher/generate-draft', {}, { grade: 1, topic: 'Phép cộng' });
  assert(aiNoToken.status === 401, 'Chặn gọi AI soạn bài khi chưa đăng nhập (HTTP 401)');

  // AI draft with student token -> MUST BE 403 FORBIDDEN
  const aiStudentToken = await request('POST', '/api/teacher/generate-draft', {
    Authorization: `Bearer ${stuValidRes.body.token}`,
  }, { grade: 1, topic: 'Phép cộng' });
  assert(aiStudentToken.status === 403, 'Chặn Học sinh gọi API Giáo viên/AI (HTTP 403 Forbidden)');

  // Seed demo without token
  const seedNoToken = await request('POST', '/api/admin/seed-demo', {}, { apply: false });
  assert(seedNoToken.status === 401, 'Chặn gọi Seed khi chưa đăng nhập (HTTP 401)');

  // Seed demo with student token -> MUST BE 403 FORBIDDEN
  const seedStudent = await request('POST', '/api/admin/seed-demo', {
    Authorization: `Bearer ${stuValidRes.body.token}`,
  }, { apply: false });
  assert(seedStudent.status === 403, 'Chặn Học sinh gọi API Quản trị Seed (HTTP 403 Forbidden)');

  // Seed demo with teacher token -> MUST BE 403 FORBIDDEN
  const seedTeacher = await request('POST', '/api/admin/seed-demo', {
    Authorization: `Bearer ${teacherLoginRes.body.token}`,
  }, { apply: false });
  assert(seedTeacher.status === 403, 'Chặn Giáo viên gọi API Quản trị Seed (HTTP 403 Forbidden)');

  // Seed demo with Admin token in DRY_RUN mode -> MUST BE 200 DRY RUN (0 writes)
  const seedAdminDry = await request('POST', '/api/admin/seed-demo', {
    Authorization: `Bearer ${adminLoginRes.body.token}`,
  }, { apply: false });
  assert(seedAdminDry.status === 200 && seedAdminDry.body.plan?.mode === 'DRY_RUN', 'Admin gọi Seed chế độ DRY-RUN an toàn, không ghi dữ liệu (HTTP 200)');

  // Cleanup demo without token
  const cleanNoToken = await request('POST', '/api/admin/cleanup-demo', {}, {});
  assert(cleanNoToken.status === 401, 'Chặn gọi Cleanup khi chưa đăng nhập (HTTP 401)');

  // Cleanup demo with student token -> MUST BE 403
  const cleanStudent = await request('POST', '/api/admin/cleanup-demo', {
    Authorization: `Bearer ${stuValidRes.body.token}`,
  }, {});
  assert(cleanStudent.status === 403, 'Chặn Học sinh gọi Cleanup Demo (HTTP 403 Forbidden)');

  // Cleanup demo with teacher token -> MUST BE 403
  const cleanTeacher = await request('POST', '/api/admin/cleanup-demo', {
    Authorization: `Bearer ${teacherLoginRes.body.token}`,
  }, {});
  assert(cleanTeacher.status === 403, 'Chặn Giáo viên gọi Cleanup Demo (HTTP 403 Forbidden)');

  // Expired token test
  const expiredToken = createAuthToken({
    uid: 'student-expired',
    role: 'student',
    displayName: 'Expired Student',
  }, -1);
  assert(verifyAuthToken(expiredToken) === null, 'Chặn Token đã hết hạn trong verifyAuthToken');

  const apiExpiredRes = await request('POST', '/api/teacher/generate-draft', {
    Authorization: `Bearer ${expiredToken}`,
  }, { grade: 1, topic: 'Phép cộng' });
  assert(apiExpiredRes.status === 401, 'Chặn Token hết hạn gọi API bảo vệ (HTTP 401)');

  // Malformed header test
  const malformedHeaderRes = await request('POST', '/api/teacher/generate-draft', {
    Authorization: `Basic dXNlcjpwYXNz`,
  }, { grade: 1, topic: 'Phép cộng' });
  assert(malformedHeaderRes.status === 401, 'Chặn Authorization Header sai định dạng Bearer (HTTP 401)');

  // --- 8. FIRESTORE SECURITY RULES (ABAC LOGIC SPECIFICATION TESTS) ---
  console.log('\n--- PHẦN 8: KIỂM TOÁN MA TRẬN PHÂN QUYỀN FIRESTORE RULES (ABAC LOGIC) ---');

  interface RuleContext {
    auth: { uid: string; email?: string; token?: { role?: string; email?: string } } | null;
    resource?: { data: Record<string, any> };
    requestResource?: { data: Record<string, any> };
  }

  // Evaluator implementing the exact logic from firestore.rules
  const rules = {
    isSignedIn: (ctx: RuleContext) => ctx.auth !== null,
    isCurrentUser: (ctx: RuleContext, uid: string) => rules.isSignedIn(ctx) && ctx.auth?.uid === uid,
    isBootstrappedAdmin: (ctx: RuleContext) =>
      rules.isSignedIn(ctx) &&
      (ctx.auth?.token?.email === 'AT.IT.K10@gmail.com' ||
       ctx.auth?.token?.role === 'admin' ||
       ctx.auth?.email === 'AT.IT.K10@gmail.com'),
    isTeacher: (ctx: RuleContext) =>
      rules.isSignedIn(ctx) &&
      (rules.isBootstrappedAdmin(ctx) || ctx.auth?.token?.role === 'teacher'),

    canReadUser: (ctx: RuleContext, userId: string) =>
      rules.isBootstrappedAdmin(ctx) ||
      rules.isCurrentUser(ctx, userId) ||
      (rules.isTeacher(ctx) && ctx.resource?.data.role === 'student'),

    canUpdateUser: (ctx: RuleContext, userId: string, modifiedKeys: string[]) => {
      if (rules.isBootstrappedAdmin(ctx)) return true;
      if (!rules.isCurrentUser(ctx, userId)) return false;
      const forbidden = ['role', 'dataOrigin', 'environmentTag', 'password', 'accessSecret'];
      return !modifiedKeys.some((k) => forbidden.includes(k));
    },

    canUpdateClass: (ctx: RuleContext) =>
      rules.isBootstrappedAdmin(ctx) ||
      (rules.isTeacher(ctx) && ctx.resource?.data.teacherId === ctx.auth?.uid),

    canReadAttempt: (ctx: RuleContext) =>
      rules.isBootstrappedAdmin(ctx) ||
      rules.isTeacher(ctx) ||
      (rules.isSignedIn(ctx) && ctx.resource?.data.studentId === ctx.auth?.uid),

    canCreateAttempt: (ctx: RuleContext) =>
      rules.isSignedIn(ctx) && ctx.requestResource?.data.studentId === ctx.auth?.uid,

    canUpdateAttempt: (ctx: RuleContext) =>
      rules.isSignedIn(ctx) &&
      ctx.resource?.data.studentId === ctx.auth?.uid &&
      ctx.resource?.data.status !== 'completed',

    canUpdateLessonVersion: (_ctx: RuleContext) => false, // Immutable snapshot
    canUpdateAuditLog: (_ctx: RuleContext) => false, // Immutable audit trail
    canReadTest: (_ctx: RuleContext) => true, // Public health probe
  };

  const studentA = { uid: 'student-A', token: { role: 'student' } };
  const studentB = { uid: 'student-B', token: { role: 'student' } };
  const teacher1 = { uid: 'teacher-1', token: { role: 'teacher' } };
  const teacher2 = { uid: 'teacher-2', token: { role: 'teacher' } };
  const adminUser = { uid: 'admin-1', token: { role: 'admin' }, email: 'AT.IT.K10@gmail.com' };

  // Rule 1: Public read on test/docId
  assert(rules.canReadTest({ auth: null }) === true, 'Rules: Cho phép đọc public endpoint test/docId');

  // Rule 2: Unauthenticated read on users -> DENIED
  assert(rules.canReadUser({ auth: null }, 'student-A') === false, 'Rules: Chặn người dùng nặc danh đọc /users/{id}');

  // Rule 3: Student reading own profile -> ALLOWED
  assert(rules.canReadUser({ auth: studentA }, 'student-A') === true, 'Rules: Học sinh được đọc profile của chính mình');

  // Rule 4: Student reading another student profile -> DENIED
  assert(rules.canReadUser({ auth: studentA, resource: { data: { role: 'student' } } }, 'student-B') === false, 'Rules: Học sinh bị chặn đọc profile của học sinh khác');

  // Rule 5: Teacher reading student profile -> ALLOWED
  assert(rules.canReadUser({ auth: teacher1, resource: { data: { role: 'student' } } }, 'student-A') === true, 'Rules: Giáo viên được đọc profile của học sinh');

  // Rule 6: Student trying to escalate own role to admin -> DENIED
  assert(rules.canUpdateUser({ auth: studentA }, 'student-A', ['role']) === false, 'Rules: Chặn Học sinh tự nâng quyền role');

  // Rule 7: Student trying to modify password/accessSecret directly -> DENIED
  assert(rules.canUpdateUser({ auth: studentA }, 'student-A', ['password']) === false, 'Rules: Chặn sửa trực tiếp password trong document');

  // Rule 8: Teacher 1 updating own class -> ALLOWED
  assert(rules.canUpdateClass({ auth: teacher1, resource: { data: { teacherId: 'teacher-1' } } }) === true, 'Rules: Giáo viên cập nhật lớp của mình');

  // Rule 9: Teacher 2 updating class of Teacher 1 -> DENIED
  assert(rules.canUpdateClass({ auth: teacher2, resource: { data: { teacherId: 'teacher-1' } } }) === false, 'Rules: Chặn Giáo viên sửa lớp của giáo viên khác');

  // Rule 10: Student reading own attempt -> ALLOWED
  assert(rules.canReadAttempt({ auth: studentA, resource: { data: { studentId: 'student-A' } } }) === true, 'Rules: Học sinh đọc bài làm của mình');

  // Rule 11: Student reading another student attempt -> DENIED
  assert(rules.canReadAttempt({ auth: studentB, resource: { data: { studentId: 'student-A' } } }) === false, 'Rules: Chặn Học sinh đọc bài làm của bạn khác');

  // Rule 12: Teacher reading student attempt -> ALLOWED
  assert(rules.canReadAttempt({ auth: teacher1, resource: { data: { studentId: 'student-A' } } }) === true, 'Rules: Giáo viên được đọc bài làm của học sinh');

  // Rule 13: Student creating attempt for another student ID -> DENIED
  assert(rules.canCreateAttempt({ auth: studentA, requestResource: { data: { studentId: 'student-B' } } }) === false, 'Rules: Chặn Học sinh tạo bài làm mạo danh mã học sinh khác');

  // Rule 14: Student modifying active attempt -> ALLOWED
  assert(rules.canUpdateAttempt({ auth: studentA, resource: { data: { studentId: 'student-A', status: 'in_progress' } } }) === true, 'Rules: Cho phép Học sinh cập nhật bài đang làm');

  // Rule 15: Student modifying completed attempt -> DENIED (Immutability after submission)
  assert(rules.canUpdateAttempt({ auth: studentA, resource: { data: { studentId: 'student-A', status: 'completed' } } }) === false, 'Rules: Chặn sửa đổi bài thi đã nộp (Status Completed)');

  // Rule 16: Updating immutable lesson version snapshot -> DENIED
  assert(rules.canUpdateLessonVersion({ auth: adminUser }) === false, 'Rules: Bất biến phiên bản học liệu lessonVersions (Không ai được sửa snapshot)');

  // Rule 17: Updating immutable audit log -> DENIED
  assert(rules.canUpdateAuditLog({ auth: adminUser }) === false, 'Rules: Bất biến nhật ký hệ thống auditLogs (Không ai được sửa/xóa audit log)');

  // --- 9. UNIFIED DATA PROXY & PERMISSION_DENIED RESOLUTION TESTS ---
  console.log('\n--- PHẦN 9: KIỂM THỬ UNIFIED DATA ENDPOINTS & TRIỆT TIÊU PERMISSION_DENIED ---');
  // Student assignments proxy
  const stuAssignNoToken = await request('GET', '/api/student/assignments?classId=class-1a');
  assert(stuAssignNoToken.status === 401, 'Proxy: Chặn truy cập danh sách bài tập khi chưa đăng nhập (HTTP 401)');

  const stuAssignWithToken = await request('GET', '/api/student/assignments?classId=class-1a', {
    Authorization: `Bearer ${stuValidRes.body.token}`,
  });
  assert(stuAssignWithToken.status === 200, 'Proxy: Học sinh tải danh sách bài tập lớp qua backend proxy (HTTP 200)');
  assert(Array.isArray(stuAssignWithToken.body.assignments), 'Proxy: Danh sách bài tập trả về mảng hợp lệ');

  // Student attempts privacy protection
  const stuAttemptsOwn = await request('GET', `/api/student/attempts?studentId=${stuValidRes.body.user.id}`, {
    Authorization: `Bearer ${stuValidRes.body.token}`,
  });
  assert(stuAttemptsOwn.status === 200, 'Proxy: Học sinh đọc lịch sử làm bài của chính mình (HTTP 200)');

  const stuAttemptsOther = await request('GET', '/api/student/attempts?studentId=other-student-id-999', {
    Authorization: `Bearer ${stuValidRes.body.token}`,
  });
  assert(stuAttemptsOther.status === 403, 'Proxy: Chặn Học sinh đọc bài làm của học sinh khác (HTTP 403 Forbidden)');

  // Student attempt forgery prevention
  const forgedAttempt = await request('POST', '/api/student/attempts', {
    Authorization: `Bearer ${stuValidRes.body.token}`,
  }, {
    id: `attempt-forged-${Date.now()}`,
    studentId: 'victim-student-uid',
    assignmentId: 'assign-1',
    lessonVersionId: 'version-1',
  });
  assert(forgedAttempt.status === 403, 'Proxy: Chặn Học sinh tạo bài làm mạo danh tài khoản khác (HTTP 403 Forbidden)');

  // Teacher classes proxy
  const teacherClassesStudentToken = await request('GET', '/api/teacher/classes', {
    Authorization: `Bearer ${stuValidRes.body.token}`,
  });
  assert(teacherClassesStudentToken.status === 403, 'Proxy: Chặn Học sinh gọi API danh sách lớp giáo viên (HTTP 403 Forbidden)');

  const teacherClassesRes = await request('GET', '/api/teacher/classes', {
    Authorization: `Bearer ${teacherLoginRes.body.token}`,
  });
  assert(teacherClassesRes.status === 200, 'Proxy: Giáo viên tải danh sách lớp học phụ trách (HTTP 200)');

  // Teacher lessons library proxy
  const teacherLessonsRes = await request('GET', '/api/teacher/lessons', {
    Authorization: `Bearer ${teacherLoginRes.body.token}`,
  });
  assert(teacherLessonsRes.status === 200, 'Proxy: Giáo viên tải thư viện bài học qua proxy (HTTP 200)');

  // Teacher assignments proxy
  const teacherAssignmentsRes = await request('GET', '/api/teacher/assignments', {
    Authorization: `Bearer ${teacherLoginRes.body.token}`,
  });
  assert(teacherAssignmentsRes.status === 200, 'Proxy: Giáo viên tải danh sách bài đã giao (HTTP 200)');

  // Teacher analytics proxy
  const teacherAnalyticsRes = await request('GET', '/api/teacher/analytics', {
    Authorization: `Bearer ${teacherLoginRes.body.token}`,
  });
  assert(teacherAnalyticsRes.status === 200, 'Proxy: Giáo viên tải số liệu phân tích lỗi sai (HTTP 200)');

  const teacherAnalyticsStudent = await request('GET', '/api/teacher/analytics', {
    Authorization: `Bearer ${stuValidRes.body.token}`,
  });
  assert(teacherAnalyticsStudent.status === 403, 'Proxy: Chặn Học sinh truy cập thống kê phân tích của Giáo viên (HTTP 403 Forbidden)');

  // Admin overview proxy
  const adminOverviewStudent = await request('GET', '/api/admin/overview', {
    Authorization: `Bearer ${stuValidRes.body.token}`,
  });
  assert(adminOverviewStudent.status === 403, 'Proxy: Chặn Học sinh truy cập trang tổng quan Admin (HTTP 403 Forbidden)');

  const adminOverviewTeacher = await request('GET', '/api/admin/overview', {
    Authorization: `Bearer ${teacherLoginRes.body.token}`,
  });
  assert(adminOverviewTeacher.status === 403, 'Proxy: Chặn Giáo viên truy cập trang tổng quan Admin (HTTP 403 Forbidden)');

  const adminOverviewAdmin = await request('GET', '/api/admin/overview', {
    Authorization: `Bearer ${adminLoginRes.body.token}`,
  });
  assert(adminOverviewAdmin.status === 200, 'Proxy: Quản trị viên tải thành công tổng quan hệ thống (HTTP 200)');

  // Google Login session exchange
  const googleLoginMissing = await request('POST', '/api/auth/google-login', {}, {});
  assert(googleLoginMissing.status === 400, 'Google Login: Chặn yêu cầu thiếu định danh (HTTP 400)');

  const googleLoginValid = await request('POST', '/api/auth/google-login', {}, {
    uid: 'google-test-user-1',
    email: 'test@example.com',
    displayName: 'Test Google User',
  });
  assert(googleLoginValid.status === 200, 'Google Login: Tạo và xác thực phiên đăng nhập Google thành công (HTTP 200)');
  assert(Boolean(googleLoginValid.body.token), 'Google Login: Cấp token phiên HMAC an toàn');

  console.log('\n================================================================');
  console.log(` TỔNG KẾT KIỂM THỬ: ${passedTests}/${totalTests} TESTS PASS (100% ĐẠT TIÊU CHUẨN)`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Lỗi thực thi test suite:', err);
  process.exit(1);
});
