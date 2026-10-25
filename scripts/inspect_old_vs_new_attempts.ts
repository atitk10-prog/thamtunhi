import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function inspectAttempts() {
  const [attSnap, assSnap, lesSnap] = await Promise.all([
    getDocs(collection(db, 'attempts')),
    getDocs(collection(db, 'assignments')),
    getDocs(collection(db, 'lessons')),
  ]);

  const attempts = attSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const assignments = assSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const lessons = lesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  console.log(`Total attempts: ${attempts.length}`);
  console.log(`Total assignments: ${assignments.length}`);
  console.log(`Total lessons: ${lessons.length}`);

  const assMap = new Map<string, any>(assignments.map(a => [a.id, a]));
  const lesMap = new Map<string, any>(lessons.map(l => [l.id, l]));

  // Completed attempts:
  const completed = attempts.filter(a => a.status === 'completed');
  console.log(`\nCompleted attempts: ${completed.length}`);

  let linkedToAssignment = 0;
  let linkedToLessonDirectly = 0;
  let unlinked = 0;

  const sampleCompleted = completed.slice(0, 15);
  for (const a of sampleCompleted) {
    const hasAss = assMap.has(a.assignmentId);
    const hasLes = lesMap.has(a.lessonId);
    console.log(`Attempt: ${a.id}`);
    console.log(`  studentId: ${a.studentId}, classId: ${a.classId}, status: ${a.status}`);
    console.log(`  assignmentId: "${a.assignmentId}" (found: ${hasAss})`);
    console.log(`  lessonId: "${a.lessonId}" (found: ${hasLes})`);
    console.log(`  completedAt: ${a.completedAt}, score: ${a.score}/${a.maxScore}`);
    console.log(`  dataOrigin: ${a.dataOrigin}`);
    console.log('---');
  }

  // Group attempts by assignmentId and lessonId
  const byAssignment: Record<string, number> = {};
  const byLesson: Record<string, number> = {};

  for (const a of completed) {
    if (a.assignmentId) {
      byAssignment[a.assignmentId] = (byAssignment[a.assignmentId] || 0) + 1;
    }
    if (a.lessonId) {
      byLesson[a.lessonId] = (byLesson[a.lessonId] || 0) + 1;
    }
  }

  console.log('\nTop 10 assignmentIds by completed attempts:');
  console.table(
    Object.entries(byAssignment)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([assId, count]) => {
        const ass = assMap.get(assId);
        return {
          assignmentId: assId,
          count,
          title: ass?.title || 'NOT_FOUND',
          classId: ass?.classId,
          lessonId: ass?.lessonId,
        };
      })
  );

  console.log('\nTop 10 lessonIds by completed attempts:');
  console.table(
    Object.entries(byLesson)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([lesId, count]) => {
        const les = lesMap.get(lesId);
        return {
          lessonId: lesId,
          count,
          title: les?.title || 'NOT_FOUND',
        };
      })
  );
}

inspectAttempts().catch(console.error);
