import { makeToken } from './token_helper.ts';

const token = makeToken({ uid: 'teacher-1', role: 'teacher', displayName: 'Cô Mai Lan' });

async function check() {
  const res = await fetch('http://localhost:3000/api/teacher/classes/class-1a/students', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Students in 1A (' + data.students?.length + '):');
  data.students?.forEach((s: any) => {
    console.log(`  - [${s.id}] Code: "${s.studentCode}", Name: "${s.displayName}", isDeleted: ${s.isDeleted}, status: "${s.status}"`);
  });
}

check().catch(err => {
  console.error(err);
});
