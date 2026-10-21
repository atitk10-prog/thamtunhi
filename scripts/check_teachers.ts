import fetch from 'node-fetch';
import { makeToken } from './token_helper.ts';

const adminToken = makeToken({ uid: 'admin-1', role: 'admin', displayName: 'Admin' });

async function checkTeachers() {
  const res = await fetch('http://localhost:3000/api/admin/overview', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data: any = await res.json();
  const teachers = data.users.filter((u: any) => u.role === 'teacher');
  console.log('Teachers in users collection:');
  teachers.forEach((t: any) => {
    console.log(`- ID: ${t.id}, Name: ${t.displayName}, Email: ${t.email}`);
  });
}
checkTeachers();
