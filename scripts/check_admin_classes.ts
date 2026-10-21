import fetch from 'node-fetch';
import { createAuthToken } from '../server.ts';

const adminToken = createAuthToken({ uid: 'admin-1', email: 'admin@thamtunhi.edu.vn', role: 'admin', displayName: 'Quản Trị Viên' });

async function checkAdminClasses() {
  const res = await fetch('http://localhost:3000/api/admin/overview', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data: any = await res.json();
  console.log('Classes from admin:');
  data.classes.forEach((c: any) => {
    console.log(`- ID: ${c.id}, Name: ${c.name}, Grade: ${c.grade}, teacherId: ${c.teacherId}, isDeleted: ${c.isDeleted}, status: ${c.status}`);
  });
}

checkAdminClasses();
