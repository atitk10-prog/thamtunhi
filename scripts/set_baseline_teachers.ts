import fetch from 'node-fetch';
import { makeToken } from './token_helper.ts';
import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('set_baseline_teachers.ts', 'Tự động phân công giáo viên 4 lớp mặc định');

const adminToken = makeToken({ uid: 'admin-1', email: 'admin@thamtunhi.edu.vn', role: 'admin', displayName: 'Quản Trị Viên' });

async function setBaseline() {
  const assignments = [
    { classId: 'class-1a', teacherId: 'teacher-1' },
    { classId: 'class-1b', teacherId: 'teacher-1' },
    { classId: 'class-2a', teacherId: 'teacher-2' },
    { classId: 'class-2b', teacherId: 'teacher-2' },
  ];

  for (const a of assignments) {
    const res = await fetch(`http://localhost:3000/api/admin/classes/${a.classId}/teacher`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: a.teacherId }),
    });
    const d = await res.json();
    console.log(`Assigned ${a.classId} -> ${a.teacherId}: status ${res.status}`, d);
  }
}

// Neutralized: only run if explicitly called directly
if (process.argv[1]?.includes('set_baseline_teachers')) {
  setBaseline();
}
