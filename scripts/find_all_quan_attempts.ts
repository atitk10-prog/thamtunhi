import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function findQuanAttempts() {
  const attSnap = await getDocs(collection(db, 'attempts'));
  console.log('Total attempts in DB:', attSnap.size);

  const matched: any[] = [];
  attSnap.docs.forEach(d => {
    const data = d.data() as any;
    const str = JSON.stringify(data).toLowerCase();
    if (
      str.includes('hs1b12') ||
      str.includes('quân') ||
      str.includes('quan') ||
      data.studentId === 'student-hs1b12' ||
      data.studentCode === 'HS1B12' ||
      data.studentName?.includes('Quân')
    ) {
      matched.push({ id: d.id, ...data });
    }
  });

  console.log(`Found ${matched.length} attempts matching "Quân" or "HS1B12":`);
  for (const m of matched) {
    console.log(`- id: ${m.id}`);
    console.log(`  studentId: ${m.studentId} | studentCode: ${m.studentCode} | studentName: ${m.studentName}`);
    console.log(`  assignmentId: ${m.assignmentId} | lessonId: ${m.lessonId}`);
    console.log(`  status: ${m.status} | score: ${m.score} | startedAt: ${m.startedAt} | completedAt: ${m.completedAt}`);
  }
}

findQuanAttempts().then(() => process.exit(0)).catch(console.error);
