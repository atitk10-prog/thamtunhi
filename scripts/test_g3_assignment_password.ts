import fetch from 'node-fetch';
import { makeToken } from './token_helper.ts';
import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('test_g3_assignment_password.ts', 'Kiểm thử đổi mật khẩu & giao bài (Có ghi dữ liệu)');

const BASE_URL = 'http://localhost:3000';

async function runG3Tests() {
  console.log('================================================================');
  console.log('   P0 - BỘ KIỂM THỬ G3: TỰ ĐỔI MẬT KHẨU & GIAO BÀI THẬT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // PHẦN A: KIỂM THỬ TỰ ĐỔI MẬT KHẨU (TEACHER & STUDENT)
    // -------------------------------------------------------------
    console.log('--- PHẦN A.1: GIÁO VIÊN 1 ĐỔI MẬT KHẨU & ĐĂNG NHẬP LẠI ---');
    const teacherEmail = 'giaovien1@thamtutoannhi.edu.vn';
    const originalTeacherPass = 'MatKhauGiaoVien@123';
    const tempTeacherPass = 'MatKhauMoi@456';

    // 1. Teacher 1 Initial Login
    const t1LoginRes = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherEmail, password: originalTeacherPass }),
    });
    const t1LoginData: any = await t1LoginRes.json();
    assert(t1LoginRes.status === 200 && Boolean(t1LoginData.token), '1.1 Giáo viên 1 đăng nhập ban đầu thành công');
    const initialTeacherToken = t1LoginData.token;

    // 2. Reject change password if wrong current password
    const wrongPassRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initialTeacherToken}`,
      },
      body: JSON.stringify({ currentPassword: 'SaiMatKhau@999', newPassword: tempTeacherPass }),
    });
    assert(wrongPassRes.status === 401, '1.2 Từ chối đổi mật khẩu khi sai mật khẩu hiện tại (401 Unauthorized)');

    // 3. Reject weak password for teacher (< 8 chars or no mixed case)
    const weakPassRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initialTeacherToken}`,
      },
      body: JSON.stringify({ currentPassword: originalTeacherPass, newPassword: 'weak' }),
    });
    assert(weakPassRes.status === 400, '1.3 Từ chối mật khẩu giáo viên không đủ độ phức tạp (400 Bad Request)');

    // 4. Perform valid password change for Teacher 1
    const t1ChangeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initialTeacherToken}`,
      },
      body: JSON.stringify({ currentPassword: originalTeacherPass, newPassword: tempTeacherPass }),
    });
    const t1ChangeData: any = await t1ChangeRes.json();
    assert(t1ChangeRes.status === 200 && Boolean(t1ChangeData.token), '1.4 Giáo viên 1 đổi mật khẩu mới thành công');
    const refreshedTeacherToken = t1ChangeData.token;

    // 5. Verify old token is REVOKED
    const oldTokenProbe = await fetch(`${BASE_URL}/api/teacher/classes`, {
      headers: { Authorization: `Bearer ${initialTeacherToken}` },
    });
    const oldProbeData: any = await oldTokenProbe.json();
    assert(
      oldTokenProbe.status === 401 && oldProbeData.code === 'TOKEN_REVOKED',
      '1.5 Phiên đăng nhập cũ của giáo viên bị thu hồi ngay lập tức (TOKEN_REVOKED)'
    );

    // 6. Verify old password is now REJECTED
    const t1OldLoginRes = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherEmail, password: originalTeacherPass }),
    });
    assert(t1OldLoginRes.status === 401, '1.6 Mật khẩu cũ bị từ chối khi đăng nhập lại');

    // 7. Verify new password LOGS IN successfully
    const t1NewLoginRes = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherEmail, password: tempTeacherPass }),
    });
    const t1NewLoginData: any = await t1NewLoginRes.json();
    assert(t1NewLoginRes.status === 200 && Boolean(t1NewLoginData.token), '1.7 Mật khẩu mới của giáo viên đăng nhập thành công');

    // 8. Restore Teacher 1 password back to baseline
    const restoreT1Res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t1NewLoginData.token}`,
      },
      body: JSON.stringify({ currentPassword: tempTeacherPass, newPassword: originalTeacherPass }),
    });
    assert(restoreT1Res.status === 200, '1.8 Khôi phục an toàn mật khẩu gốc của Giáo viên 1');

    // Re-acquire standard baseline token for teacher 1
    const t1FinalLogin = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherEmail, password: originalTeacherPass }),
    });
    const t1FinalData: any = await t1FinalLogin.json();
    const activeTeacher1Token = t1FinalData.token;

    console.log('\n--- PHẦN A.2: HỌC SINH HS1A01 ĐỔI MÃ BÍ MẬT (PIN) & ĐĂNG NHẬP LẠI ---');
    const studentCode = 'HS1A01';
    const originalStudentSecret = 'matkhau123';
    const tempStudentSecret = 'pinmoi456';

    // 1. HS1A01 Initial Login
    const s1LoginRes = await fetch(`${BASE_URL}/api/auth/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode, accessSecret: originalStudentSecret }),
    });
    const s1LoginData: any = await s1LoginRes.json();
    assert(s1LoginRes.status === 200 && Boolean(s1LoginData.token), '2.1 Học sinh HS1A01 đăng nhập ban đầu thành công');
    const initialStudentToken = s1LoginData.token;

    // 2. Reject change PIN if wrong current secret
    const wrongPinRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initialStudentToken}`,
      },
      body: JSON.stringify({ currentPassword: 'sai123', newPassword: tempStudentSecret }),
    });
    assert(wrongPinRes.status === 401, '2.2 Từ chối đổi mã PIN khi sai mã hiện tại (401 Unauthorized)');

    // 3. Reject invalid PIN length (< 4 chars)
    const shortPinRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initialStudentToken}`,
      },
      body: JSON.stringify({ currentPassword: originalStudentSecret, newPassword: '12' }),
    });
    assert(shortPinRes.status === 400, '2.3 Từ chối mã PIN học sinh quá ngắn < 4 ký tự (400 Bad Request)');

    // 4. Valid PIN Change for HS1A01
    const s1ChangeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${initialStudentToken}`,
      },
      body: JSON.stringify({ currentPassword: originalStudentSecret, newPassword: tempStudentSecret }),
    });
    const s1ChangeData: any = await s1ChangeRes.json();
    assert(s1ChangeRes.status === 200 && Boolean(s1ChangeData.token), '2.4 Học sinh HS1A01 đổi mã bí mật mới thành công');

    // 5. Old token revoked
    const oldStudentProbe = await fetch(`${BASE_URL}/api/student/assignments`, {
      headers: { Authorization: `Bearer ${initialStudentToken}` },
    });
    const oldStudentProbeData: any = await oldStudentProbe.json();
    assert(
      oldStudentProbe.status === 401 && oldStudentProbeData.code === 'TOKEN_REVOKED',
      '2.5 Phiên đăng nhập cũ của học sinh bị thu hồi ngay lập tức (TOKEN_REVOKED)'
    );

    // 6. Old secret rejected
    const s1OldLoginRes = await fetch(`${BASE_URL}/api/auth/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode, accessSecret: originalStudentSecret }),
    });
    assert(s1OldLoginRes.status === 401, '2.6 Mã bí mật cũ của học sinh bị từ chối');

    // 7. New secret logs in successfully (with bcrypt verification!)
    const s1NewLoginRes = await fetch(`${BASE_URL}/api/auth/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode, accessSecret: tempStudentSecret }),
    });
    const s1NewLoginData: any = await s1NewLoginRes.json();
    assert(s1NewLoginRes.status === 200 && Boolean(s1NewLoginData.token), '2.7 Mã bí mật mới đăng nhập thành công với bcrypt hash');

    // 8. Restore HS1A01 PIN back to original
    const restoreS1Res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${s1NewLoginData.token}`,
      },
      body: JSON.stringify({ currentPassword: tempStudentSecret, newPassword: originalStudentSecret }),
    });
    assert(restoreS1Res.status === 200, '2.8 Khôi phục an toàn mã bí mật gốc của học sinh HS1A01');

    // Re-acquire fresh baseline token for HS1A01
    const s1FinalLogin = await fetch(`${BASE_URL}/api/auth/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode, accessSecret: originalStudentSecret }),
    });
    const s1FinalData: any = await s1FinalLogin.json();
    const activeStudent1Token = s1FinalData.token;

    // Login HS1A02
    const s2Login = await fetch(`${BASE_URL}/api/auth/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode: 'HS1A02', accessSecret: 'matkhau123' }),
    });
    const s2Data: any = await s2Login.json();
    assert(s2Login.status === 200 && Boolean(s2Data.token), '2.9 Học sinh HS1A02 đăng nhập thành công');
    const activeStudent2Token = s2Data.token;

    console.log('\n--- PHẦN A.3: CHẶN ĐỔI MẬT KHẨU TÀI KHOẢN GOOGLE OAUTH ---');
    const googleToken = makeToken({
      uid: 'google-oauth-user-test',
      email: 'teacher.google@thamtutoannhi.edu.vn',
      role: 'teacher',
      displayName: 'Teacher Google',
    });
    // Create temp user with authProvider: 'google'
    await fetch(`${BASE_URL}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: 'google-oauth-user-test',
        email: 'teacher.google@thamtutoannhi.edu.vn',
        displayName: 'Teacher Google',
      }),
    });
    const googleChangeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${googleToken}`,
      },
      body: JSON.stringify({ currentPassword: 'SomePass@123', newPassword: 'NewPass@456' }),
    });
    const googleChangeData: any = await googleChangeRes.json();
    assert(
      googleChangeRes.status === 400 && googleChangeData.code === 'GOOGLE_AUTH_ACCOUNT',
      '3.1 Chặn tài khoản Google tự đổi mật khẩu nội bộ (GOOGLE_AUTH_ACCOUNT)'
    );

    // -------------------------------------------------------------
    // PHẦN B: KIỂM THỬ SỬA DỨT ĐIỂM CHỨC NĂNG GIAO BÀI
    // -------------------------------------------------------------
    console.log('\n--- PHẦN B.1: KIỂM TRA TỪ CHỐI GIAO SAI KHỐI, SAI LỚP, THIẾU PHIÊN BẢN ---');

    // 1. Assign Grade 2 lesson to Class 1A -> Rejection
    const mismatchGradeRes = await fetch(`${BASE_URL}/api/teacher/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeTeacher1Token}`,
      },
      body: JSON.stringify({
        classId: 'class-1a',
        lessonId: 'lesson-g2-01', // Grade 2
        lessonVersionId: 'version-lesson-g2-01-v1',
      }),
    });
    const mismatchGradeData: any = await mismatchGradeRes.json();
    assert(
      mismatchGradeRes.status === 400 && mismatchGradeData.code === 'GRADE_MISMATCH',
      '4.1 Backend từ chối giao bài sai khối lớp (Khối 2 vào lớp Khối 1)'
    );

    // 2. Teacher 1 attempts to assign to Class 2A (Assigned to Teacher 2) -> 403 Forbidden
    const wrongClassTeacherRes = await fetch(`${BASE_URL}/api/teacher/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeTeacher1Token}`,
      },
      body: JSON.stringify({
        classId: 'class-2a',
        lessonId: 'lesson-g1-01',
        lessonVersionId: 'version-lesson-g1-01-v2',
      }),
    });
    assert(wrongClassTeacherRes.status === 403, '4.2 Backend từ chối khi giáo viên không được phân công phụ trách lớp (403 Forbidden)');

    // 3. Assign with non-existent lesson version -> 404
    const badVersionRes = await fetch(`${BASE_URL}/api/teacher/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeTeacher1Token}`,
      },
      body: JSON.stringify({
        classId: 'class-1a',
        lessonId: 'lesson-g1-01',
        lessonVersionId: 'version-non-existent-999',
      }),
    });
    assert(badVersionRes.status === 404, '4.3 Backend từ chối giao phiên bản bài học không có thật (404 Not Found)');

    // 4. Assign to a student not belonging to the classroom -> 400
    const foreignStudentRes = await fetch(`${BASE_URL}/api/teacher/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeTeacher1Token}`,
      },
      body: JSON.stringify({
        classId: 'class-1a',
        studentId: 'student-hs2a01', // Student in 2A
        lessonId: 'lesson-g1-01',
        lessonVersionId: 'version-lesson-g1-01-v2',
      }),
    });
    assert(foreignStudentRes.status === 400, '4.4 Backend từ chối khi học sinh được giao không thuộc lớp học được chọn');

    console.log('\n--- PHẦN B.2: GIAO BÀI 8 CÂU ĐÃ XUẤT BẢN RIÊNG CHO HS1A01 ---');
    const privateAssignmentId = `qa-assign-hs1a01-${Date.now()}`;
    const assignPrivateRes = await fetch(`${BASE_URL}/api/teacher/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeTeacher1Token}`,
      },
      body: JSON.stringify({
        id: privateAssignmentId,
        classId: 'class-1a',
        lessonId: 'lesson-g1-02', // 8 questions
        lessonVersionId: 'version-lesson-g1-02-v1',
        title: '[Toán 1] Các số từ 6 đến 10 và Tách - Gộp số (Bài giao riêng)',
        studentId: 'student-hs1a01',
        studentName: 'An (1A)',
        dueDate: '2026-11-01',
        allowReassign: true,
      }),
    });
    const assignPrivateData: any = await assignPrivateRes.json();
    const actualPrivateId = assignPrivateData.assignment?.id;
    assert(assignPrivateRes.status === 200 && Boolean(actualPrivateId), '5.1 Giáo viên 1 giao bài 8 câu đã xuất bản riêng cho HS1A01 thành công');

    // 5. Verify HS1A01 receives this private assignment
    const hs1a01AssignmentsRes = await fetch(`${BASE_URL}/api/student/assignments`, {
      headers: { Authorization: `Bearer ${activeStudent1Token}` },
    });
    const hs1a01AssignmentsData: any = await hs1a01AssignmentsRes.json();
    assert(hs1a01AssignmentsRes.status === 200, '5.2 HS1A01 lấy danh sách bài tập thành công');
    const hs1a01HasPrivate = hs1a01AssignmentsData.assignments?.some((a: any) => a.id === actualPrivateId);
    assert(hs1a01HasPrivate, '5.3 Học sinh HS1A01 NHẬN ĐƯỢC bài giao riêng');

    // 6. Verify HS1A02 DOES NOT receive this private assignment (ABAC verification!)
    const hs1a02AssignmentsRes = await fetch(`${BASE_URL}/api/student/assignments`, {
      headers: { Authorization: `Bearer ${activeStudent2Token}` },
    });
    const hs1a02AssignmentsData: any = await hs1a02AssignmentsRes.json();
    assert(hs1a02AssignmentsRes.status === 200, '5.4 HS1A02 lấy danh sách bài tập thành công');
    const hs1a02HasPrivate = hs1a02AssignmentsData.assignments?.some((a: any) => a.id === actualPrivateId);
    assert(!hs1a02HasPrivate, '5.5 Học sinh HS1A02 KHÔNG THẤY bài giao riêng của HS1A01 (ABAC an toàn)');

    console.log('\n--- PHẦN B.3: GIAO BÀI CHO CẢ LỚP 1A ---');
    const assignClassRes = await fetch(`${BASE_URL}/api/teacher/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeTeacher1Token}`,
      },
      body: JSON.stringify({
        classId: 'class-1a',
        lessonId: 'lesson-g1-03', // 8 questions Phép cộng trong phạm vi 10
        lessonVersionId: 'version-lesson-g1-03-v1',
        title: '[Toán 1] Phép cộng trong phạm vi 10 (Giao cả lớp)',
        dueDate: '2026-11-05',
        allowReassign: true,
      }),
    });
    const assignClassData: any = await assignClassRes.json();
    const actualClassId = assignClassData.assignment?.id;
    assert(assignClassRes.status === 200 && Boolean(actualClassId), '6.1 Giáo viên 1 giao bài cho cả lớp 1A thành công');

    // HS1A01 & HS1A02 both receive the class assignment
    const s1ClassCheck = await fetch(`${BASE_URL}/api/student/assignments`, {
      headers: { Authorization: `Bearer ${activeStudent1Token}` },
    });
    const s1ClassData: any = await s1ClassCheck.json();
    const s1HasClassAssign = s1ClassData.assignments?.some((a: any) => a.id === actualClassId);
    assert(s1HasClassAssign, '6.2 HS1A01 nhận được bài giao cả lớp');

    const s2ClassCheck = await fetch(`${BASE_URL}/api/student/assignments`, {
      headers: { Authorization: `Bearer ${activeStudent2Token}` },
    });
    const s2ClassData: any = await s2ClassCheck.json();
    const s2HasClassAssign = s2ClassData.assignments?.some((a: any) => a.id === actualClassId);
    assert(s2HasClassAssign, '6.3 HS1A02 nhận được bài giao cả lớp');

    console.log('\n--- PHẦN B.4: HỌC SINH LÀM BÀI, NỘP ĐIỂM, GIÁO VIÊN XEM KẾT QUẢ ---');
    const attemptId = `attempt-${Date.now()}`;

    // Student HS1A01 starts attempt
    const startAttemptRes = await fetch(`${BASE_URL}/api/student/attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeStudent1Token}`,
      },
      body: JSON.stringify({
        id: attemptId,
        assignmentId: actualClassId,
        lessonId: 'lesson-g1-03',
        lessonVersionId: 'version-lesson-g1-03-v1',
        lessonTitle: '[Toán 1] Phép cộng trong phạm vi 10 (Giao cả lớp)',
        studentName: 'An (1A)',
        totalQuestions: 8,
      }),
    });
    assert(startAttemptRes.status === 200, '7.1 Học sinh bắt đầu làm bài tập đã giao');

    // Student completes attempt with score 80/80
    const completeRes = await fetch(`${BASE_URL}/api/student/attempts/${attemptId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeStudent1Token}`,
      },
      body: JSON.stringify({
        score: 80,
        completedAt: new Date().toISOString(),
        firstAttemptCorrectCount: 8,
        postHintCorrectCount: 0,
        misconceptionsDetected: [],
      }),
    });
    const completeData: any = await completeRes.json();
    assert(completeRes.status === 200 && completeData.attempt?.score === 80, '7.2 Học sinh nộp bài, điểm 80/80 được lưu thành công');

    // Teacher views student attempts
    const teacherAttemptsRes = await fetch(`${BASE_URL}/api/student/attempts?studentId=student-hs1a01`, {
      headers: { Authorization: `Bearer ${activeTeacher1Token}` },
    });
    const teacherAttemptsData: any = await teacherAttemptsRes.json();
    const foundAttempt = teacherAttemptsData.attempts?.find((att: any) => att.id === attemptId);
    assert(Boolean(foundAttempt && foundAttempt.score === 80), '7.3 Giáo viên xem đúng kết quả bài làm và điểm số của học sinh');

    // Re-assign duplicate check & deliberate re-assignment test
    console.log('\n--- PHẦN B.5: CẢNH BÁO TRÙNG ĐỢT GIAO & GIAO LẠI CÓ CHỦ ĐÍCH ---');
    const duplicateRes = await fetch(`${BASE_URL}/api/teacher/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeTeacher1Token}`,
      },
      body: JSON.stringify({
        classId: 'class-1a',
        lessonId: 'lesson-g1-03',
        lessonVersionId: 'version-lesson-g1-03-v1',
        title: '[Toán 1] Phép cộng trong phạm vi 10 (Giao cả lớp)',
      }),
    });
    const duplicateData: any = await duplicateRes.json();
    assert(
      duplicateRes.status === 409 && duplicateData.code === 'ASSIGNMENT_DUPLICATE',
      '8.1 Phát hiện và cảnh báo trùng đợt giao bài khi giao lại cùng bài học (409 ASSIGNMENT_DUPLICATE)'
    );

    // Deliberate re-assignment with allowReassign: true
    const reassignRes = await fetch(`${BASE_URL}/api/teacher/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeTeacher1Token}`,
      },
      body: JSON.stringify({
        classId: 'class-1a',
        lessonId: 'lesson-g1-03',
        lessonVersionId: 'version-lesson-g1-03-v1',
        title: '[Toán 1] Phép cộng trong phạm vi 10 (Giao đợt 2)',
        allowReassign: true,
      }),
    });
    const reassignData: any = await reassignRes.json();
    assert(
      reassignRes.status === 200 && reassignData.assignment?.id !== actualClassId,
      '8.2 Giao lại có chủ đích thành công với ID mới, không ghi đè đợt bài cũ hoặc lịch sử kết quả'
    );

    console.log('\n================================================================');
    console.log(`   KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runG3Tests();
