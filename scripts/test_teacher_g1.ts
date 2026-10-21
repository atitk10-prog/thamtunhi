import fetch from 'node-fetch';
import { makeToken } from './token_helper.ts';

const BASE_URL = 'http://localhost:3000';

const adminToken = makeToken({ uid: 'admin-1', email: 'admin@thamtunhi.edu.vn', role: 'admin', displayName: 'Quản Trị Viên' });
const teacher1Token = makeToken({ uid: 'teacher-1', email: 'coulan@thamtunhi.edu.vn', role: 'teacher', displayName: 'Cô Mai Lan' });
const teacher2Token = makeToken({ uid: 'teacher-2', email: 'thayhuy@thamtunhi.edu.vn', role: 'teacher', displayName: 'Thầy Quốc Huy' });
const thanhThanhToken = makeToken({ uid: 'user-1792533985096', email: 'thanhthanh@gmail.com', role: 'teacher', displayName: 'Trần Thanh Thanh' });

async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ PHÂN HỆ GIÁO VIÊN G1 (LỚP HỌC & HỌC SINH) ===\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failCount++;
    }
  }

  try {
    // 1. Teacher 1 Classes & Rosters
    console.log('--- 1. Kiểm tra Giáo viên 1 (Cô Mai Lan - teacher-1) ---');
    const t1Res = await fetch(`${BASE_URL}/api/teacher/classes`, {
      headers: { Authorization: `Bearer ${teacher1Token}` },
    });
    const t1Data: any = await t1Res.json();
    assert(t1Res.status === 200, 'Teacher 1 GET /api/teacher/classes returns 200 OK');
    assert(Array.isArray(t1Data.classes), 'Teacher 1 classes is an array');
    const t1ClassNames = t1Data.classes.map((c: any) => c.name).sort();
    assert(JSON.stringify(t1ClassNames) === JSON.stringify(['1A', '1B']), `Teacher 1 assigned exactly 1A and 1B (got: ${t1ClassNames.join(', ')})`);

    const c1a = t1Data.classes.find((c: any) => c.name === '1A');
    const c1b = t1Data.classes.find((c: any) => c.name === '1B');
    assert(c1a && c1a.studentCount === 12, `Class 1A studentCount is 12 (got: ${c1a?.studentCount})`);
    assert(c1b && c1b.studentCount === 12, `Class 1B studentCount is 12 (got: ${c1b?.studentCount})`);

    // Teacher 1 accesses 1A roster
    const r1aRes = await fetch(`${BASE_URL}/api/teacher/classes/class-1a/students`, {
      headers: { Authorization: `Bearer ${teacher1Token}` },
    });
    const r1aData: any = await r1aRes.json();
    assert(r1aRes.status === 200, 'Teacher 1 access class-1a roster returns 200 OK');
    assert(r1aData.students.length === 12, `Class 1A roster has exactly 12 active students (got: ${r1aData.students.length})`);
    const hasSecretIn1A = r1aData.students.some((s: any) => s.accessSecret || s.passwordHash || s.password);
    assert(!hasSecretIn1A, 'Zero password or accessSecret leakage in student roster');

    // Teacher 1 accesses 1B roster
    const r1bRes = await fetch(`${BASE_URL}/api/teacher/classes/class-1b/students`, {
      headers: { Authorization: `Bearer ${teacher1Token}` },
    });
    const r1bData: any = await r1bRes.json();
    assert(r1bRes.status === 200, 'Teacher 1 access class-1b roster returns 200 OK');
    assert(r1bData.students.length === 12, `Class 1B roster has exactly 12 active students (got: ${r1bData.students.length})`);

    // 2. Teacher 1 unauthorized access to 2A and 2B
    console.log('\n--- 2. Kiểm tra Bảo mật ABAC: Giáo viên 1 truy cập trái quyền lớp 2A/2B ---');
    const t1Access2a = await fetch(`${BASE_URL}/api/teacher/classes/class-2a/students`, {
      headers: { Authorization: `Bearer ${teacher1Token}` },
    });
    assert(t1Access2a.status === 403, `Teacher 1 accessing class-2a returns 403 Forbidden (got: ${t1Access2a.status})`);

    const t1Access2b = await fetch(`${BASE_URL}/api/teacher/classes/class-2b/students`, {
      headers: { Authorization: `Bearer ${teacher1Token}` },
    });
    assert(t1Access2b.status === 403, `Teacher 1 accessing class-2b returns 403 Forbidden (got: ${t1Access2b.status})`);

    // Teacher 1 attempts to add student to class-2a
    const t1Add2a = await fetch(`${BASE_URL}/api/teacher/classes/class-2a/students`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${teacher1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Hacker Student', studentCode: 'HACK01', accessSecret: 'pass' }),
    });
    assert(t1Add2a.status === 403, `Teacher 1 adding student to class-2a returns 403 Forbidden (got: ${t1Add2a.status})`);

    // 3. Teacher 2 Classes & Rosters
    console.log('\n--- 3. Kiểm tra Giáo viên 2 (Thầy Quốc Huy - teacher-2) ---');
    const t2Res = await fetch(`${BASE_URL}/api/teacher/classes`, {
      headers: { Authorization: `Bearer ${teacher2Token}` },
    });
    const t2Data: any = await t2Res.json();
    assert(t2Res.status === 200, 'Teacher 2 GET /api/teacher/classes returns 200 OK');
    const t2ClassNames = t2Data.classes.map((c: any) => c.name).sort();
    assert(JSON.stringify(t2ClassNames) === JSON.stringify(['2A', '2B']), `Teacher 2 assigned exactly 2A and 2B (got: ${t2ClassNames.join(', ')})`);

    const c2a = t2Data.classes.find((c: any) => c.name === '2A');
    const c2b = t2Data.classes.find((c: any) => c.name === '2B');
    assert(c2a && c2a.studentCount === 12, `Class 2A studentCount is 12 (got: ${c2a?.studentCount})`);
    assert(c2b && c2b.studentCount === 12, `Class 2B studentCount is 12 (got: ${c2b?.studentCount})`);

    const r2aRes = await fetch(`${BASE_URL}/api/teacher/classes/class-2a/students`, {
      headers: { Authorization: `Bearer ${teacher2Token}` },
    });
    const r2aData: any = await r2aRes.json();
    assert(r2aRes.status === 200, 'Teacher 2 access class-2a roster returns 200 OK');
    assert(r2aData.students && r2aData.students.length === 12, `Class 2A roster has exactly 12 active students (got: ${r2aData.students?.length})`);

    const r2bRes = await fetch(`${BASE_URL}/api/teacher/classes/class-2b/students`, {
      headers: { Authorization: `Bearer ${teacher2Token}` },
    });
    const r2bData: any = await r2bRes.json();
    assert(r2bRes.status === 200, 'Teacher 2 access class-2b roster returns 200 OK');
    assert(r2bData.students && r2bData.students.length === 12, `Class 2B roster has exactly 12 active students (got: ${r2bData.students?.length})`);

    // Teacher 2 unauthorized access to 1A/1B
    const t2Access1a = await fetch(`${BASE_URL}/api/teacher/classes/class-1a/students`, {
      headers: { Authorization: `Bearer ${teacher2Token}` },
    });
    assert(t2Access1a.status === 403, `Teacher 2 accessing class-1a returns 403 Forbidden (got: ${t2Access1a.status})`);

    const t2Access1b = await fetch(`${BASE_URL}/api/teacher/classes/class-1b/students`, {
      headers: { Authorization: `Bearer ${teacher2Token}` },
    });
    assert(t2Access1b.status === 403, `Teacher 2 accessing class-1b returns 403 Forbidden (got: ${t2Access1b.status})`);

    // 4. Teacher Trần Thanh Thanh (user-1792533985096) - 0 assigned classes
    console.log('\n--- 4. Kiểm tra Giáo viên Trần Thanh Thanh (Chưa có phân công lớp) ---');
    const ttRes = await fetch(`${BASE_URL}/api/teacher/classes`, {
      headers: { Authorization: `Bearer ${thanhThanhToken}` },
    });
    const ttData: any = await ttRes.json();
    assert(ttRes.status === 200, 'Trần Thanh Thanh GET /api/teacher/classes returns 200 OK');
    assert(ttData.classes.length === 0, `Trần Thanh Thanh has 0 classes initially (got: ${ttData.classes.length})`);

    const ttAccess1a = await fetch(`${BASE_URL}/api/teacher/classes/class-1a/students`, {
      headers: { Authorization: `Bearer ${thanhThanhToken}` },
    });
    assert(ttAccess1a.status === 403, `Trần Thanh Thanh accessing class-1a returns 403 Forbidden (got: ${ttAccess1a.status})`);

    const ttAccess2a = await fetch(`${BASE_URL}/api/teacher/classes/class-2a/students`, {
      headers: { Authorization: `Bearer ${thanhThanhToken}` },
    });
    assert(ttAccess2a.status === 403, `Trần Thanh Thanh accessing class-2a returns 403 Forbidden (got: ${ttAccess2a.status})`);

    // 5. Admin Dynamic Reassignment & Instant Revocation
    console.log('\n--- 5. Kiểm thử Liên thông Admin Phân công động & Thu hồi quyền tức thì ---');
    // Step A: Admin reassigns class-1b to Trần Thanh Thanh
    const reassignRes = await fetch(`${BASE_URL}/api/admin/classes/class-1b/teacher`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: 'user-1792533985096' }),
    });
    assert(reassignRes.status === 200, 'Admin reassigns class-1b to Trần Thanh Thanh returns 200 OK');

    // Step B: Trần Thanh Thanh now sees 1B
    const ttClassesAfter: any = await (await fetch(`${BASE_URL}/api/teacher/classes`, {
      headers: { Authorization: `Bearer ${thanhThanhToken}` },
    })).json();
    assert(ttClassesAfter.classes.length === 1 && ttClassesAfter.classes[0].id === 'class-1b', 'Trần Thanh Thanh now has class-1b in assigned classes list');

    // Step C: Trần Thanh Thanh can access 1B roster
    const ttRoster1b = await fetch(`${BASE_URL}/api/teacher/classes/class-1b/students`, {
      headers: { Authorization: `Bearer ${thanhThanhToken}` },
    });
    assert(ttRoster1b.status === 200, 'Trần Thanh Thanh accessing class-1b roster returns 200 OK');

    // Step D: Teacher 1 instantly loses access to 1B (HTTP 403 Forbidden)
    const t1Lost1b = await fetch(`${BASE_URL}/api/teacher/classes/class-1b/students`, {
      headers: { Authorization: `Bearer ${teacher1Token}` },
    });
    assert(t1Lost1b.status === 403, `Teacher 1 accessing class-1b now returns 403 Forbidden (got: ${t1Lost1b.status})`);

    // Step E: Reassign class-1b back to Teacher 1 to restore pristine baseline
    const restoreRes = await fetch(`${BASE_URL}/api/admin/classes/class-1b/teacher`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: 'teacher-1' }),
    });
    assert(restoreRes.status === 200, 'Admin restored class-1b back to teacher-1');

    const t1Restored1b = await fetch(`${BASE_URL}/api/teacher/classes/class-1b/students`, {
      headers: { Authorization: `Bearer ${teacher1Token}` },
    });
    assert(t1Restored1b.status === 200, 'Teacher 1 access to class-1b restored successfully');

    // 6. Student Operations (Lock & Unlock, Password Reset)
    console.log('\n--- 6. Thao tác Quản trị Học sinh trong lớp phân công ---');
    // Lock student in 1A
    const student1 = r1aData.students[0];
    const lockRes = await fetch(`${BASE_URL}/api/teacher/students/${student1.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${teacher1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'locked' }),
    });
    assert(lockRes.status === 200, `Teacher 1 locks student ${student1.studentCode} returns 200 OK`);

    // Unlock student in 1A
    const unlockRes = await fetch(`${BASE_URL}/api/teacher/students/${student1.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${teacher1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    });
    assert(unlockRes.status === 200, `Teacher 1 unlocks student ${student1.studentCode} returns 200 OK`);

    // Reset password
    const resetRes = await fetch(`${BASE_URL}/api/teacher/students/${student1.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${teacher1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessSecret: 'matkhau2026' }),
    });
    assert(resetRes.status === 200, `Teacher 1 resets password for student ${student1.studentCode} returns 200 OK`);

    // Restore student password to preserve baseline
    await fetch(`${BASE_URL}/api/teacher/students/${student1.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${teacher1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessSecret: 'matkhau123' }),
    });

    // Unauthorized student update: Teacher 1 tries to lock a student in 2A
    const student2a = r2aData.students[0];
    const unauthLock = await fetch(`${BASE_URL}/api/teacher/students/${student2a.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${teacher1Token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'locked' }),
    });
    assert(unauthLock.status === 403, `Teacher 1 locking student in class 2A returns 403 Forbidden (got: ${unauthLock.status})`);

    console.log(`\n=== TỔNG KẾT KIỂM THỬ G1: ${passCount} PASS / ${failCount} FAIL ===`);
    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Lỗi thực thi kiểm thử G1:', err);
    process.exit(1);
  }
}

runTests();
