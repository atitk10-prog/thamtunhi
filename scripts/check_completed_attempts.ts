import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkCompletedLiveAttempts() {
  const [attSnap, usersSnap, assignSnap] = await Promise.all([
    getDocs(collection(db, 'attempts')),
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'assignments'))
  ]);

  const userMap = new Map();
  usersSnap.forEach(d => userMap.set(d.id, { id: d.id, ...d.data() }));

  const assignMap = new Map();
  assignSnap.forEach(d => assignMap.set(d.id, { id: d.id, ...d.data() }));

  console.log(`Total live attempts: ${attSnap.size}`);
  const completedList: any[] = [];
  const inProgressList: any[] = [];

  attSnap.forEach(d => {
    const a = d.data();
    if (a.status === 'completed') {
      completedList.push({ id: d.id, ...a });
    } else {
      inProgressList.push({ id: d.id, ...a });
    }
  });

  console.log(`Completed attempts: ${completedList.length}`);
  console.log(`In-progress attempts: ${inProgressList.length}`);

  console.log('\n--- BREAKDOWN OF COMPLETED ATTEMPTS BY DATA ORIGIN ---');
  const realCompleted = completedList.filter(a => a.dataOrigin === 'real' || !a.id.startsWith('att-demo-'));
  const simCompleted = completedList.filter(a => a.dataOrigin === 'simulation' || a.id.startsWith('att-demo-'));

  console.log(`Real completed attempts: ${realCompleted.length}`);
  console.log(`Simulation demo completed attempts: ${simCompleted.length}`);

  console.log('\n--- REAL COMPLETED ATTEMPTS DETAIL ---');
  realCompleted.forEach(a => {
    const student: any = userMap.get(a.studentId);
    const assign: any = assignMap.get(a.assignmentId);
    console.log(`Attempt: ${a.id}`);
    console.log(`  Student: ${a.studentCode || student?.studentCode} (${student?.displayName || a.studentName}), Class: ${student?.classId || a.classId}`);
    console.log(`  Assign: ${a.assignmentId} (Lesson: ${a.lessonId || assign?.lessonId}, Class: ${assign?.classId})`);
    console.log(`  Score: ${a.score}/${a.maxScore || 80}, CompletedAt: ${a.completedAt}`);
  });

  // Check assignments by real submissions
  console.log('\n--- ASSIGNMENTS WITH REAL SUBMISSIONS ---');
  const assignRealCounts: Record<string, number> = {};
  realCompleted.forEach(a => {
    assignRealCounts[a.assignmentId] = (assignRealCounts[a.assignmentId] || 0) + 1;
  });
  console.log(assignRealCounts);
}

checkCompletedLiveAttempts().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
