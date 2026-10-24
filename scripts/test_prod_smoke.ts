import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('test_prod_smoke.ts', 'Kiểm thử đăng nhập 3 vai trò trên Production');

async function fullProdSmoke() {
  console.log('--- TESTING 3 ROLES ON PRODUCTION (https://thamtunhi.vercel.app) ---');
  
  // 1. Admin Login
  const adminRes = await fetch('https://thamtunhi.vercel.app/api/auth/teacher-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@thamtutoannhi.edu.vn', password: 'AdminBaoMat@123' })
  });
  const adminData = await adminRes.json();
  console.log('1. Admin Login HTTP:', adminRes.status, '| Role:', adminData.user?.role, '| Token:', Boolean(adminData.token));
  if (adminRes.status !== 200 || adminData.user?.role !== 'admin') throw new Error('Admin login failed');

  // 2. Teacher Login ("Trần Thanh Thanh" - thanhthanh@gmail.com)
  const teacherRes = await fetch('https://thamtunhi.vercel.app/api/auth/teacher-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'thanhthanh@gmail.com', password: '123456' })
  });
  const teacherData = await teacherRes.json();
  console.log('2. Teacher Login HTTP:', teacherRes.status, '| Role:', teacherData.user?.role, '| Name:', teacherData.user?.displayName);
  if (teacherRes.status !== 200 || teacherData.user?.role !== 'teacher') throw new Error('Teacher login failed');

  // 3. Student Login (HS1A01)
  const studentRes = await fetch('https://thamtunhi.vercel.app/api/auth/student-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentCode: 'HS1A01', accessSecret: 'matkhau123' })
  });
  const studentData = await studentRes.json();
  console.log('3. Student Login HTTP:', studentRes.status, '| Role:', studentData.user?.role, '| Code:', studentData.user?.studentCode);
  if (studentRes.status !== 200 || studentData.user?.role !== 'student') throw new Error('Student login failed');

  console.log('\n>>> TOÀN BỘ 3 VAI TRÒ ĐĂNG NHẬP THÀNH CÔNG 100% TRÊN PRODUCTION! <<<');
}

fullProdSmoke().catch((err) => {
  console.error('PROD SMOKE TEST FAILED:', err);
  process.exit(1);
});
