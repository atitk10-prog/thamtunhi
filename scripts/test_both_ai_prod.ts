import { makeToken } from './token_helper.ts';

async function testBothAi() {
  console.log('--- KIỂM TRA 2 ENDPOINT AI TRÊN PRODUCTION ---');
  
  // Teacher login
  const loginRes = await fetch('https://thamtunhi.vercel.app/api/auth/teacher-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'giaovien1@thamtutoannhi.edu.vn', password: 'MatKhauGiaoVien@123' })
  });
  const loginData: any = await loginRes.json();
  const token = loginData.token;
  console.log('Login token received:', Boolean(token));

  // 1. Test generate-draft
  console.log('\n1. Test /api/teacher/generate-draft:');
  const draftRes = await fetch('https://thamtunhi.vercel.app/api/teacher/generate-draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      grade: 1,
      topic: 'Phép cộng trong phạm vi 10',
      targetPattern: 'COUNTING_OFF_BY_ONE',
      questionCount: 3,
      difficulty: 'easy'
    })
  });
  console.log('Draft Status:', draftRes.status);
  const draftData = await draftRes.json();
  console.log('Draft Data:', JSON.stringify(draftData, null, 2).slice(0, 400));

  // 2. Test summarize-insights
  console.log('\n2. Test /api/teacher/summarize-insights:');
  const sumRes = await fetch('https://thamtunhi.vercel.app/api/teacher/summarize-insights', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      totalAttempts: 15,
      avgScore: 78,
      hintRecoveryRate: 85,
      patterns: [{ pattern: 'COUNTING_OFF_BY_ONE', count: 6 }],
      dataOrigin: 'real'
    })
  });
  console.log('Summarize Status:', sumRes.status);
  const sumData = await sumRes.json();
  console.log('Summarize Data:', JSON.stringify(sumData, null, 2).slice(0, 400));
}

testBothAi().catch(err => {
  console.error('Test error:', err);
});
