import fetch from 'node-fetch';
import { makeToken } from './token_helper.ts';

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

setBaseline();
