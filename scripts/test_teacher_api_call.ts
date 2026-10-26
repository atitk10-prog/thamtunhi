import { makeToken } from './token_helper';

// Generate token for teacher xuannuong (user-1792533985096)
const token = makeToken({
  uid: 'user-1792533985096',
  role: 'teacher',
  displayName: 'Hà Thị Xuân Nương',
  email: 'xuannuong@thamtunhi.edu.vn',
});

async function testApi() {
  const prodUrl = 'https://thamtunhi.vercel.app/api/teacher/assignments?dataOrigin=real';
  const res = await fetch(prodUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Production Status:', res.status);
  const data = await res.json();
  const assign = (data.assignments || []).find((a: any) => a.id === 'assign-lesson-draft-1792910089741-class-1b-122978');
  console.log('Target assignment on production:');
  console.log({
    id: assign?.id,
    title: assign?.title,
    submittedCount: assign?.submittedCount,
    totalAttemptsCount: assign?.totalAttemptsCount,
  });
}

testApi().catch(console.error);
