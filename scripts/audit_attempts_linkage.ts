import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function auditAttemptsLinkage() {
  const [attSnap, assSnap, lSnap, uSnap] = await Promise.all([
    getDocs(collection(db, 'attempts')),
    getDocs(collection(db, 'assignments')),
    getDocs(collection(db, 'lessons')),
    getDocs(collection(db, 'users'))
  ]);

  const attempts = attSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const assignments = assSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const lessons = lSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const users = uSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  const assignMap = new Map(assignments.map(a => [a.id, a]));
  const lessonMap = new Map(lessons.map(l => [l.id, l]));
  const userMap = new Map(users.map(u => [u.id, u]));

  console.log(`Total attempts: ${attempts.length}`);
  let completed = 0;
  let inProgress = 0;
  let missingAssignment = 0;
  let missingLesson = 0;
  let missingStudent = 0;
  let realAttempts = 0;
  let simAttempts = 0;

  attempts.forEach(a => {
    if (a.status === 'completed') completed++;
    else if (a.status === 'in_progress') inProgress++;

    const isReal = a.dataOrigin === 'real' || (!a.id.startsWith('att-demo-') && a.dataOrigin !== 'simulation');
    if (isReal) realAttempts++;
    else simAttempts++;

    if (!a.assignmentId || !assignMap.has(a.assignmentId)) missingAssignment++;
    if (!a.lessonId || !lessonMap.has(a.lessonId)) missingLesson++;
    if (!a.studentId || !userMap.has(a.studentId)) missingStudent++;
  });

  console.log(`Status breakdown: completed=${completed}, in_progress=${inProgress}, other=${attempts.length - completed - inProgress}`);
  console.log(`Origin breakdown: real=${realAttempts}, simulation=${simAttempts}`);
  console.log(`Linkage check:`);
  console.log(`- Missing or invalid assignmentId: ${missingAssignment}`);
  console.log(`- Missing or invalid lessonId: ${missingLesson}`);
  console.log(`- Missing or invalid studentId: ${missingStudent}`);

  // Check which assignments have completed attempts
  const assignWithCompleted: Record<string, { title: string; count: number; students: Set<string> }> = {};
  attempts.filter(a => a.status === 'completed' && Boolean(a.completedAt)).forEach(a => {
    const aDoc = assignMap.get(a.assignmentId);
    const key = a.assignmentId || `lesson:${a.lessonId}`;
    if (!assignWithCompleted[key]) {
      assignWithCompleted[key] = {
        title: aDoc?.title || a.lessonTitle || a.lessonId,
        count: 0,
        students: new Set()
      };
    }
    assignWithCompleted[key].count++;
    assignWithCompleted[key].students.add(a.studentId);
  });

  console.log('\nAssignments / Lessons with completed attempts:');
  Object.entries(assignWithCompleted).forEach(([k, v]) => {
    console.log(`- [${k}] "${v.title}": ${v.count} submissions, ${v.students.size} students`);
  });
}

auditAttemptsLinkage().catch(console.error);
