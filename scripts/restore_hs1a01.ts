import fetch from 'node-fetch';
import { makeToken } from './token_helper.ts';
import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('restore_hs1a01.ts', 'Khôi phục mật khẩu học sinh HS1A01');

const teacher1Token = makeToken({ uid: 'teacher-1', role: 'teacher', displayName: 'Cô Mai Lan' });

async function restoreHS1A01() {
  const res = await fetch('http://localhost:3000/api/teacher/students/student-hs1a01', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${teacher1Token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessSecret: 'matkhau123' }),
  });
  console.log('Restored HS1A01 status:', res.status, await res.json());
}
restoreHS1A01();
