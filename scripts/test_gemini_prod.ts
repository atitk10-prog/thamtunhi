import { makeToken } from './token_helper.ts';

async function testGeminiDraftOnProd() {
  console.log('--- TESTING GEMINI DRAFT GENERATION ON PRODUCTION ---');

  // 1. Generate teacher auth token
  const teacherToken = makeToken({
    uid: 'user-1792533985096',
    email: 'thanhthanh@gmail.com',
    role: 'teacher',
    displayName: 'Trần Thanh Thanh'
  });
  console.log('Teacher token generated successfully.');

  // 2. Call /api/teacher/generate-draft
  const payload = {
    grade: 1,
    topic: 'Phép cộng trong phạm vi 10',
    targetPattern: 'COUNTING_OFF_BY_ONE',
    questionCount: 3,
    difficulty: 'easy'
  };

  console.log('Calling POST https://thamtunhi.vercel.app/api/teacher/generate-draft ...');
  const draftRes = await fetch('https://thamtunhi.vercel.app/api/teacher/generate-draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify(payload)
  });

  const draftData = await draftRes.json();
  console.log('HTTP Status:', draftRes.status);
  console.log('Draft response:', JSON.stringify(draftData, null, 2).slice(0, 500) + '...');

  if (draftRes.status === 200 && Array.isArray(draftData.questions) && draftData.questions.length > 0) {
    console.log('\n>>> GEMINI AI IS FULLY OPERATIONAL ON PRODUCTION! <<<');
    console.log(`Generated ${draftData.questions.length} questions successfully.`);
    draftData.questions.forEach((q: any, i: number) => {
      console.log(`  Question ${i + 1}: [${q.interactionType}] "${q.prompt}" -> Answer: "${q.expectedAnswer}"`);
    });
  } else {
    console.log('\n>>> GEMINI STATUS:', draftData);
  }
}

testGeminiDraftOnProd().catch(err => {
  console.error('Test Gemini failed:', err);
  process.exit(1);
});
