import { makeToken } from './token_helper.ts';

const adminToken = makeToken({ uid: 'admin-1', email: 'admin@thamtunhi.edu.vn', role: 'admin', displayName: 'Quản Trị Viên' });

async function cleanViaApi() {
  const usersRes = await fetch('http://localhost:3000/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const data = await usersRes.json();
  const users = data.users || [];
  const testUsers = users.filter((u: any) => u.role === 'student' && (!u.studentCode || !u.studentCode.match(/^HS(1A|1B|2A|2B)\d{2}$/)));
  console.log('Non-official test students to remove:', testUsers.length);

  for (const u of testUsers) {
    const delRes = await fetch(`http://localhost:3000/api/admin/users/${u.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Deleted test student ${u.id} (${u.studentCode}): HTTP ${delRes.status}`);
  }
  console.log('Finished cleaning test students via Admin API.');
}

cleanViaApi().catch(err => {
  console.error('Clean API failed:', err);
  process.exit(1);
});
