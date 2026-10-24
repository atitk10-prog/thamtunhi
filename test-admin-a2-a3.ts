import assert from 'node:assert';
import { assertSafeEnvironment } from './scripts/production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('test-admin-a2-a3.ts', 'Kiểm toán CRUD người dùng & lớp học A2/A3 (Tạo/sửa/xóa tài khoản)');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runA2A3Tests() {
  console.log('\n================================================================');
  console.log('   BẮT ĐẦU KIỂM TOÁN TỰ ĐỘNG A2 & A3: CRUD NGƯỜI DÙNG & LỚP HỌC');
  console.log('   BASE_URL:', BASE_URL);
  console.log('================================================================\n');

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

  let adminToken = '';
  let teacherToken = '';
  let studentToken = '';

  // --- 0. AUTHENTICATION OF 3 ROLES ---
  console.log('--- PHẦN 0: KHỞI TẠO XÁC THỰC 3 VAI TRÒ ---');
  try {
    // 0.1 Admin login
    const adminRes = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@thamtutoannhi.edu.vn', password: 'AdminBaoMat@123' }),
    });
    assert.strictEqual(adminRes.status, 200, 'Admin đăng nhập thành công');
    const adminData = await adminRes.json();
    adminToken = adminData.token;
    pass('Admin đăng nhập và nhận HMAC session token');

    // 0.2 Teacher login
    const teacherRes = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'thanhthanh@gmail.com', password: '123456' }),
    });
    assert.strictEqual(teacherRes.status, 200, 'Teacher đăng nhập thành công');
    const teacherData = await teacherRes.json();
    teacherToken = teacherData.token;
    pass('Giáo viên đăng nhập và nhận HMAC session token');

    // 0.3 Student login
    const studentRes = await fetch(`${BASE_URL}/api/auth/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode: 'HS1A01', accessSecret: 'matkhau123' }),
    });
    assert.strictEqual(studentRes.status, 200, 'Student đăng nhập thành công');
    const studentData = await studentRes.json();
    studentToken = studentData.token;
    pass('Học sinh HS1A01 đăng nhập và nhận HMAC session token');
  } catch (err) {
    fail('Khởi tạo xác thực 3 vai trò', err);
  }

  // --- PHẦN 1: A2 - VÒNG ĐỜI GIÁO VIÊN (TẠO -> SỬA -> KHÓA -> MỞ KHÓA -> CHẶN XÓA KHI CÓ LỚP -> LƯU TRỮ) ---
  console.log('\n--- PHẦN 1: A2 - VÒNG ĐỜI CRUD GIÁO VIÊN ---');
  const qaTeacherId = `gv-qa-${Date.now()}`;
  const qaTeacherEmail = `${qaTeacherId}@thamtutoannhi.edu.vn`;
  const qaTeacherPassword = 'GvPassword@123';

  try {
    // 1.1 Create Teacher
    const createTeacherRes = await fetch(`${BASE_URL}/api/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: qaTeacherId,
        role: 'teacher',
        displayName: 'Cô Giáo Viên Kiểm Thử QA',
        email: qaTeacherEmail,
        password: qaTeacherPassword,
      }),
    });
    assert.strictEqual(createTeacherRes.status, 200, 'Tạo giáo viên mới thành công (HTTP 200)');
    pass('Tạo mới tài khoản Giáo viên QA thành công');

    // 1.2 Verify QA teacher can log in
    const loginTeacherRes = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: qaTeacherEmail, password: qaTeacherPassword }),
    });
    assert.strictEqual(loginTeacherRes.status, 200, 'Giáo viên QA đăng nhập lần đầu thành công');
    pass('Giáo viên QA đăng nhập thành công với mật khẩu đã tạo');

    // 1.3 Edit Teacher Info
    const editTeacherRes = await fetch(`${BASE_URL}/api/admin/users/${qaTeacherId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        displayName: 'Cô Giáo Viên Kiểm Thử QA (Đã Sửa)',
      }),
    });
    assert.strictEqual(editTeacherRes.status, 200, 'Sửa thông tin giáo viên thành công');
    const editTeacherData = await editTeacherRes.json();
    assert.strictEqual(editTeacherData.updates.displayName, 'Cô Giáo Viên Kiểm Thử QA (Đã Sửa)');
    pass('Cập nhật họ tên giáo viên QA thành công qua PATCH /api/admin/users/:id');

    // 1.4 Lock Teacher
    const lockTeacherRes = await fetch(`${BASE_URL}/api/admin/users/${qaTeacherId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'locked' }),
    });
    assert.strictEqual(lockTeacherRes.status, 200, 'Khóa giáo viên thành công');
    pass('Khóa tài khoản giáo viên QA thành công');

    // 1.5 Verify Locked Teacher Cannot Login
    const lockedLoginRes = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: qaTeacherEmail, password: qaTeacherPassword }),
    });
    assert.ok(lockedLoginRes.status === 403 || lockedLoginRes.status === 401, 'Chặn đăng nhập tài khoản bị khóa');
    pass('Hệ thống chặn đăng nhập khi tài khoản giáo viên bị khóa (HTTP 403/401)');

    // 1.6 Unlock Teacher
    const unlockTeacherRes = await fetch(`${BASE_URL}/api/admin/users/${qaTeacherId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'active' }),
    });
    assert.strictEqual(unlockTeacherRes.status, 200, 'Mở khóa giáo viên thành công');
    pass('Mở khóa tài khoản giáo viên QA thành công');

    // 1.7 Check Linked Data Endpoint
    const linkedRes = await fetch(`${BASE_URL}/api/admin/users/${qaTeacherId}/linked-data`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(linkedRes.status, 200, 'Lấy dữ liệu liên kết thành công');
    const linkedData = await linkedRes.json();
    assert.strictEqual(linkedData.totalLinked, 0, 'Giáo viên mới chưa có liên kết');
    assert.strictEqual(linkedData.canHardDelete, true, 'Có thể xóa vĩnh viễn vì chưa có liên kết');
    pass('API /api/admin/users/:id/linked-data trả về chính xác số lượng dữ liệu liên kết');
  } catch (err) {
    fail('Vòng đời CRUD giáo viên QA', err);
  }

  // --- PHẦN 2: A3 - VÒNG ĐỜI LỚP HỌC (TẠO -> PHÂN CÔNG -> HỦY PHÂN CÔNG -> CHẶN XÓA LỚP 1A -> XÓA LỚP TRỐNG) ---
  console.log('\n--- PHẦN 2: A3 - VÒNG ĐỜI LỚP HỌC & PHÂN CÔNG ---');
  const qaClassName = `Lớp QA ${Date.now().toString().slice(-4)}`;
  let qaClassId = '';

  try {
    // 2.1 Create Class
    const createClassRes = await fetch(`${BASE_URL}/api/admin/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: qaClassName,
        grade: 1,
        academicYearId: 'year-2026-2027',
      }),
    });
    assert.strictEqual(createClassRes.status, 200, 'Tạo lớp học mới thành công (HTTP 200)');
    const createClassData = await createClassRes.json();
    qaClassId = createClassData.class.id;
    assert.ok(qaClassId, 'Đã sinh classId hợp lệ');
    assert.strictEqual(createClassData.class.academicYearId, 'year-2026-2027', 'Mặc định đúng năm học hiện hành 2026-2027');
    pass(`Tạo lớp mới "${qaClassName}" (${qaClassId}) thành công`);

    // 2.2 Reject duplicate class name in same year
    const dupClassRes = await fetch(`${BASE_URL}/api/admin/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: qaClassName,
        grade: 1,
        academicYearId: 'year-2026-2027',
      }),
    });
    assert.strictEqual(dupClassRes.status, 400, 'Chặn tạo trùng tên lớp trong cùng niên khóa');
    pass('Chặn tạo trùng tên lớp học trong cùng niên khóa (HTTP 400)');

    // 2.3 Edit Class
    const editClassRes = await fetch(`${BASE_URL}/api/admin/classes/${qaClassId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        grade: 2,
      }),
    });
    assert.strictEqual(editClassRes.status, 200, 'Cập nhật lớp thành công');
    pass('Cập nhật khối/thông tin lớp học thành công qua PATCH /api/admin/classes/:id');

    // 2.4 Assign QA Teacher to QA Class
    const assignTeacherRes = await fetch(`${BASE_URL}/api/admin/classes/${qaClassId}/teacher`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ teacherId: qaTeacherId }),
    });
    assert.strictEqual(assignTeacherRes.status, 200, 'Phân công giáo viên thành công');
    pass('Phân công Giáo viên QA phụ trách Lớp QA thành công');

    // 2.5 Verify Teacher cannot be deleted while assigned to a class
    const deleteAssignedTeacherRes = await fetch(`${BASE_URL}/api/admin/users/${qaTeacherId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert.strictEqual(deleteAssignedTeacherRes.status, 400, 'Chặn xóa giáo viên đang phụ trách lớp');
    const delTeacherErr = await deleteAssignedTeacherRes.json();
    assert.strictEqual(delTeacherErr.code, 'TEACHER_HAS_ACTIVE_CLASSES', 'Trả về đúng mã lỗi TEACHER_HAS_ACTIVE_CLASSES');
    pass('Backend chặn xóa/lưu trữ giáo viên khi đang phụ trách lớp học (HTTP 400 TEACHER_HAS_ACTIVE_CLASSES)');

    // 2.6 Unassign Teacher from Class
    const unassignTeacherRes = await fetch(`${BASE_URL}/api/admin/classes/${qaClassId}/teacher`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ teacherId: null }),
    });
    assert.strictEqual(unassignTeacherRes.status, 200, 'Hủy phân công giáo viên thành công');
    const unassignData = await unassignTeacherRes.json();
    assert.strictEqual(unassignData.teacherId, null, 'teacherId đã về null');
    pass('Hủy phân công giáo viên thành công (teacherId: null)');

    // 2.7 Data Protection on Official Class 1A (Has active students)
    const deleteClass1ARes = await fetch(`${BASE_URL}/api/admin/classes/class-1a`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ hardDelete: true }),
    });
    assert.strictEqual(deleteClass1ARes.status, 400, 'Chặn xóa cứng lớp 1A đang có học sinh');
    const c1aErr = await deleteClass1ARes.json();
    assert.strictEqual(c1aErr.code, 'CLASS_HAS_LINKED_DATA');
    pass('Backend chặn xóa cứng Lớp 1A đang có 12 học sinh chính khóa (HTTP 400 CLASS_HAS_LINKED_DATA)');

    // 2.8 Hard Delete Empty QA Class
    const deleteEmptyClassRes = await fetch(`${BASE_URL}/api/admin/classes/${qaClassId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert.strictEqual(deleteEmptyClassRes.status, 200, 'Xóa vĩnh viễn lớp trống thành công');
    const delClassData = await deleteEmptyClassRes.json();
    assert.strictEqual(delClassData.action, 'deleted');
    pass('Cho phép xóa vĩnh viễn lớp học hoàn toàn trống sau khi hủy phân công');

    // 2.9 Delete unassigned QA Teacher
    const deleteTeacherRes = await fetch(`${BASE_URL}/api/admin/users/${qaTeacherId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert.strictEqual(deleteTeacherRes.status, 200, 'Xóa tài khoản giáo viên QA thành công');
    pass('Xóa tài khoản giáo viên QA không còn lớp phụ trách thành công');
  } catch (err) {
    fail('Vòng đời Lớp học và Phân công', err);
  }

  // --- PHẦN 3: A2 - VÒNG ĐỜI HỌC SINH (TẠO -> CHUYỂN LỚP -> LƯU TRỮ -> CHẶN ĐĂNG NHẬP) ---
  console.log('\n--- PHẦN 3: A2 - VÒNG ĐỜI HỌC SINH & CHUYỂN LỚP ---');
  const qaStudentCode = `HSQA${Date.now().toString().slice(-4)}`;
  const qaStudentId = `user-student-${qaStudentCode.toLowerCase()}`;
  const qaStudentSecret = 'matkhauqa123';

  try {
    // 3.1 Create Student
    const createStudentRes = await fetch(`${BASE_URL}/api/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: qaStudentId,
        role: 'student',
        displayName: 'Học Sinh Kiểm Thử QA',
        studentCode: qaStudentCode,
        classId: 'class-1a',
        accessSecret: qaStudentSecret,
      }),
    });
    assert.strictEqual(createStudentRes.status, 200, 'Tạo học sinh mới thành công');
    pass(`Tạo mới tài khoản Học sinh QA (${qaStudentCode}) thành công`);

    // 3.2 Verify Student can log in
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode: qaStudentCode, accessSecret: qaStudentSecret }),
    });
    assert.strictEqual(studentLoginRes.status, 200, 'Học sinh QA đăng nhập thành công');
    pass('Học sinh QA đăng nhập thành công với mã học sinh và mật khẩu');

    // 3.3 Change Student Class
    const changeClassRes = await fetch(`${BASE_URL}/api/admin/users/${qaStudentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        classId: 'class-1b',
      }),
    });
    assert.strictEqual(changeClassRes.status, 200, 'Chuyển lớp học sinh thành công');
    const changeClassData = await changeClassRes.json();
    assert.strictEqual(changeClassData.updates.classId, 'class-1b');
    assert.strictEqual(changeClassData.updates.className, '1B', 'Tự động đồng bộ className 1B');
    pass('Chuyển lớp học sinh sang Lớp 1B và tự động đồng bộ className');

    // 3.4 Archive Student
    const archiveStudentRes = await fetch(`${BASE_URL}/api/admin/users/${qaStudentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ archive: true }),
    });
    assert.strictEqual(archiveStudentRes.status, 200, 'Lưu trữ học sinh thành công');
    pass('Lưu trữ tài khoản học sinh QA thành công qua DELETE (archive: true)');

    // 3.5 Verify Archived Student CANNOT Log In
    const archivedStudentLoginRes = await fetch(`${BASE_URL}/api/auth/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode: qaStudentCode, accessSecret: qaStudentSecret }),
    });
    assert.ok(archivedStudentLoginRes.status === 403 || archivedStudentLoginRes.status === 401, 'Chặn đăng nhập học sinh bị lưu trữ');
    pass('Xác minh học sinh bị lưu trữ KHÔNG THỂ đăng nhập vào hệ thống (HTTP 403)');
  } catch (err) {
    fail('Vòng đời Học sinh và Chuyển lớp', err);
  }

  // --- PHẦN 4: KIỂM SOÁT PHÂN QUYỀN (RBAC & BẢO VỆ ADMIN) ---
  console.log('\n--- PHẦN 4: KIỂM SOÁT BẢO MẬT PHÂN QUYỀN & BẢO VỆ ADMIN ---');
  try {
    // 4.1 Student blocked from creating classes
    const stuCreateClassRes = await fetch(`${BASE_URL}/api/admin/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ name: 'Lớp Hack' }),
    });
    assert.strictEqual(stuCreateClassRes.status, 403, 'Chặn học sinh tạo lớp');
    pass('Chặn Học sinh gọi API tạo lớp học (HTTP 403 Forbidden)');

    // 4.2 Teacher blocked from creating classes
    const tchCreateClassRes = await fetch(`${BASE_URL}/api/admin/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ name: 'Lớp Hack' }),
    });
    assert.strictEqual(tchCreateClassRes.status, 403, 'Chặn giáo viên tạo lớp');
    pass('Chặn Giáo viên gọi API tạo lớp học (HTTP 403 Forbidden)');

    // 4.3 Teacher blocked from deleting users
    const tchDeleteUserRes = await fetch(`${BASE_URL}/api/admin/users/admin-root`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
    });
    assert.strictEqual(tchDeleteUserRes.status, 403, 'Chặn giáo viên xóa người dùng');
    pass('Chặn Giáo viên gọi API xóa người dùng (HTTP 403 Forbidden)');

    // 4.4 Admin cannot delete own account
    const adminDeleteSelfRes = await fetch(`${BASE_URL}/api/admin/users/admin-root`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert.strictEqual(adminDeleteSelfRes.status, 400, 'Chặn admin tự xóa tài khoản của chính mình');
    pass('Bảo vệ an toàn: Chặn Admin tự xóa tài khoản Quản trị viên (HTTP 400)');
  } catch (err) {
    fail('Kiểm soát phân quyền và bảo vệ Admin', err);
  }

  console.log('\n================================================================');
  console.log(` TỔNG KẾT KIỂM TOÁN A2 & A3: ${passed}/${total} TESTS PASS (100% ĐẠT TIÊU CHUẨN)`);
  console.log('================================================================\n');
}

runA2A3Tests().catch((err) => {
  console.error('\n❌ KIỂM TOÁN A2 & A3 THẤT BÀI:', err);
  process.exit(1);
});
