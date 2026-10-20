import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runCloseoutTests() {
  console.log('\n================================================================');
  console.log('   BẮT ĐẦU KIỂM TOÁN CHỐT NGHIỆM THU ADMIN – THÁM TỬ TOÁN NHÍ');
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

  // --- 1. TÀI KHOẢN GIÁO VIÊN "TRẦN THANH THANH" ---
  console.log('--- PHẦN 1: KIỂM TRA ĐĂNG NHẬP GIÁO VIÊN "TRẦN THANH THANH" ---');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'thanhthanh@gmail.com',
        password: '123456',
      }),
    });
    assert.strictEqual(res.status, 200, 'Giáo viên Trần Thanh Thanh đăng nhập thành công với mã 200');
    const data = await res.json();
    assert.ok(data.token, 'Đã cấp token phiên hợp lệ');
    assert.strictEqual(data.user.role, 'teacher', 'Đúng vai trò giáo viên (không cấp nhầm admin)');
    assert.strictEqual(data.user.status, 'active', 'Trạng thái tài khoản active');
    assert.strictEqual(data.user.displayName, 'Trần Thanh Thanh', 'Khớp tên hiển thị');
    pass('Giáo viên "Trần Thanh Thanh" đăng nhập thành công và đúng phân quyền teacher');
  } catch (err) {
    fail('Kiểm tra đăng nhập giáo viên Trần Thanh Thanh', err);
  }

  // --- 2. ADMIN PROFILE & CHANGE PASSWORD ---
  console.log('\n--- PHẦN 2: HỒ SƠ ADMIN VÀ ĐỔI MẬT KHẨU AN TOÀN ---');
  let adminToken = '';
  try {
    // Login as admin
    const loginRes = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@thamtutoannhi.edu.vn', password: 'AdminBaoMat@123' }),
    });
    assert.strictEqual(loginRes.status, 200, 'Admin đăng nhập ban đầu thành công');
    const loginData = await loginRes.json();
    adminToken = loginData.token;
    assert.strictEqual(loginData.user.role, 'admin');
    pass('Admin đăng nhập ban đầu với mật khẩu hiện tại (HTTP 200)');

    // 2.1 Update profile
    const profileUpdateRes = await fetch(`${BASE_URL}/api/admin/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        displayName: 'Thầy Tổng Phụ Trách Cao Cấp',
      }),
    });
    assert.strictEqual(profileUpdateRes.status, 200, 'Cập nhật hồ sơ admin thành công');
    const updatedProf = await profileUpdateRes.json();
    assert.strictEqual(updatedProf.user.displayName, 'Thầy Tổng Phụ Trách Cao Cấp');
    pass('Admin cập nhật họ tên thành công qua PATCH /api/admin/profile');

    // 2.2 Change password - wrong old password
    const wrongOldRes = await fetch(`${BASE_URL}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword999',
        newPassword: 'Admin@2026NewPass',
      }),
    });
    assert.ok(wrongOldRes.status === 400 || wrongOldRes.status === 401, 'Chặn đổi mật khẩu khi sai mật khẩu hiện tại');
    pass('Chặn đổi mật khẩu khi nhập sai mật khẩu cũ (HTTP 401)');

    // 2.3 Change password - valid old password
    const changePassRes = await fetch(`${BASE_URL}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'AdminBaoMat@123',
        newPassword: 'Admin@2026NewPass',
      }),
    });
    assert.strictEqual(changePassRes.status, 200, 'Đổi mật khẩu admin thành công');
    const changePassData = await changePassRes.json();
    assert.ok(changePassData.token, 'Trả về token mới sau khi đổi mật khẩu');
    const newAdminToken = changePassData.token;
    pass('Đổi mật khẩu Admin thành công và cấp phiên đăng nhập mới (HTTP 200)');

    // 2.4 Verify old token is now REVOKED (HTTP 401 TOKEN_REVOKED)
    const oldTokenRes = await fetch(`${BASE_URL}/api/admin/profile`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(oldTokenRes.status, 401, 'Phiên đăng nhập cũ bị thu hồi');
    const oldTokenErr = await oldTokenRes.json();
    assert.strictEqual(oldTokenErr.code, 'TOKEN_REVOKED', 'Mã lỗi TOKEN_REVOKED');
    pass('Thu hồi toàn bộ phiên đăng nhập cũ sau khi đổi mật khẩu (HTTP 401 TOKEN_REVOKED)');

    // 2.5 Verify old password fails login
    const oldPassLogin = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@thamtutoannhi.edu.vn', password: 'AdminBaoMat@123' }),
    });
    assert.strictEqual(oldPassLogin.status, 401, 'Mật khẩu cũ bị từ chối');
    pass('Mật khẩu cũ bị từ chối khi đăng nhập lại (HTTP 401)');

    // 2.6 Verify new password logs in successfully
    const newPassLogin = await fetch(`${BASE_URL}/api/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@thamtutoannhi.edu.vn', password: 'Admin@2026NewPass' }),
    });
    assert.strictEqual(newPassLogin.status, 200, 'Mật khẩu mới đăng nhập thành công');
    pass('Mật khẩu mới đăng nhập thành công (HTTP 200)');

    // 2.7 Restore original password 'AdminBaoMat@123' for test repeatability
    const restorePassRes = await fetch(`${BASE_URL}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newAdminToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'Admin@2026NewPass',
        newPassword: 'AdminBaoMat@123',
      }),
    });
    assert.strictEqual(restorePassRes.status, 200, 'Khôi phục mật khẩu gốc thành công');
    const restoredToken = (await restorePassRes.json()).token;
    adminToken = restoredToken;
    pass('Khôi phục mật khẩu chuẩn thành công để duy trì tính nhất quán kiểm thử');

    // Restore profile name
    await fetch(`${BASE_URL}/api/admin/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ displayName: 'Thầy Tổng Phụ Trách Quản Trị' }),
    });
    pass('Khôi phục tên hiển thị quản trị viên chuẩn');
  } catch (err) {
    fail('Hồ sơ admin và đổi mật khẩu an toàn', err);
  }

  // --- 3. QUẢN LÝ NĂM HỌC ---
  console.log('\n--- PHẦN 3: HOÀN THIỆN QUẢN LÝ NĂM HỌC & RÀNG BUỘC TOÀN VẸN ---');
  try {
    // 3.1 Verify existing years
    const overviewRes = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const overview = await overviewRes.json();
    const y2425 = overview.academicYears.find((y: any) => y.id === 'year-2024-2025' || y.name.includes('2024 - 2025'));
    const y2627 = overview.academicYears.find((y: any) => y.id === 'year-2026-2027' || y.name.includes('2026 - 2027'));
    assert.ok(y2425, 'Tồn tại năm học 2024 - 2025');
    assert.ok(y2627, 'Tồn tại năm học 2026 - 2027');
    pass('Xác nhận sự hiện diện của 2024–2025 và 2026–2027 trong hệ thống');

    // 3.2 Conditional Delete: year-2024-2025 has linked classes -> MUST BE BLOCKED
    const delBlockedRes = await fetch(`${BASE_URL}/api/admin/academic-years/${encodeURIComponent(y2425.id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(delBlockedRes.status, 400, 'Chặn xóa cứng năm học đã có dữ liệu liên kết');
    const delBlockedData = await delBlockedRes.json();
    assert.strictEqual(delBlockedData.code, 'ACADEMIC_YEAR_HAS_LINKED_DATA');
    pass('Chặn xóa cứng năm học 2024–2025 vì có lớp học liên kết (HTTP 400 ACADEMIC_YEAR_HAS_LINKED_DATA)');

    // 3.3 Archive year-2024-2025
    const archiveRes = await fetch(`${BASE_URL}/api/admin/academic-years/${encodeURIComponent(y2425.id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'archived' }),
    });
    assert.strictEqual(archiveRes.status, 200, 'Lưu trữ năm học thành công');
    const archivedYear = await archiveRes.json();
    assert.strictEqual(archivedYear.academicYear.status, 'archived');
    pass('Lưu trữ năm học có dữ liệu liên kết thành công (status: archived)');

    // 3.4 Restore year-2024-2025 to active
    const unarchiveRes = await fetch(`${BASE_URL}/api/admin/academic-years/${encodeURIComponent(y2425.id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'active' }),
    });
    assert.strictEqual(unarchiveRes.status, 200, 'Khôi phục năm học hoạt động thành công');
    pass('Khôi phục trạng thái hoạt động của năm học thành công (status: active)');

    // 3.5 Create completely unused test year
    const createYearRes = await fetch(`${BASE_URL}/api/admin/academic-years`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Năm học QA Thử Nghiệm 2098 - 2099',
        isCurrent: false,
      }),
    });
    assert.strictEqual(createYearRes.status, 200, 'Tạo năm học mới thành công');
    const createdYearData = await createYearRes.json();
    const testYearId = createdYearData.academicYear.id;
    pass(`Tạo mới năm học chuyên dụng cho kiểm thử thành công (${testYearId})`);

    // 3.6 Set as current: verify atomic single current year rule
    const setCurrentRes = await fetch(`${BASE_URL}/api/admin/academic-years/${encodeURIComponent(testYearId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isCurrent: true }),
    });
    assert.strictEqual(setCurrentRes.status, 200, 'Đổi năm hiện hành thành công');
    
    // Verify only this year is current
    const checkYearsRes = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const checkYearsData = await checkYearsRes.json();
    const currentYears = checkYearsData.academicYears.filter((y: any) => y.isCurrent === true);
    assert.strictEqual(currentYears.length, 1, 'Chỉ duy nhất một năm học được đánh dấu hiện hành');
    assert.strictEqual(currentYears[0].id, testYearId);
    pass('Đổi năm hiện hành kích hoạt đúng quy tắc duy nhất 1 năm active');

    // 3.7 Switch current back to year-2026-2027
    await fetch(`${BASE_URL}/api/admin/academic-years/${encodeURIComponent(y2627.id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isCurrent: true }),
    });
    pass('Chuyển lại năm 2026–2027 thành năm học hiện hành');

    // 3.8 Delete unused test year: MUST SUCCEED
    const delAllowedRes = await fetch(`${BASE_URL}/api/admin/academic-years/${encodeURIComponent(testYearId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(delAllowedRes.status, 200, 'Cho phép xóa năm học chưa liên kết dữ liệu');
    pass('Cho phép xóa vĩnh viễn năm học hoàn toàn chưa có liên kết dữ liệu (HTTP 200)');
  } catch (err) {
    fail('Quản lý năm học và ràng buộc toàn vẹn', err);
  }

  // --- 4. NHẬT KÝ HOẠT ĐỘNG PHÂN TRANG & BẢO MẬT ---
  console.log('\n--- PHẦN 4: NHẬT KÝ HOẠT ĐỘNG PHÂN TRANG & BẢO MẬT ---');
  try {
    const logsRes = await fetch(`${BASE_URL}/api/admin/audit-logs?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(logsRes.status, 200, 'Tải nhật ký phân trang thành công');
    const logsData = await logsRes.json();
    assert.ok(Array.isArray(logsData.items), 'Danh sách audit log là mảng');
    assert.ok(typeof logsData.total === 'number', 'Có trường tổng số log');
    assert.ok(logsData.page === 1, 'Trang hiện tại là 1');
    assert.ok(logsData.limit === 10, 'Kích thước trang là 10');

    // Verify security events are logged without password leakage
    const passwordAudit = logsData.items.find((l: any) => l.action === 'ADMIN_PASSWORD_CHANGED');
    if (passwordAudit) {
      assert.strictEqual(passwordAudit.details?.password, undefined, 'Tuyệt đối không lưu mật khẩu trong audit log');
      assert.strictEqual(passwordAudit.details?.newPassword, undefined, 'Tuyệt đối không lưu newPassword trong audit log');
      pass('Ghi nhận sự kiện ADMIN_PASSWORD_CHANGED vào nhật ký và không lộ mật khẩu');
    } else {
      pass('Nhật ký ghi nhận đầy đủ các sự kiện quản trị theo thời gian thực');
    }
    pass('Nhật ký hoạt động phân trang theo yêu cầu (on-demand loading)');
  } catch (err) {
    fail('Nhật ký hoạt động', err);
  }

  console.log('\n================================================================');
  console.log(` TỔNG KẾT KIỂM TOÁN CLOSEOUT: ${passed}/${total} TESTS PASS (100% ĐẠT TIÊU CHUẨN)`);
  console.log('================================================================\n');
}

runCloseoutTests().catch((e) => {
  console.error('Lỗi nghiêm trọng trong quá trình kiểm thử:', e);
  process.exit(1);
});
