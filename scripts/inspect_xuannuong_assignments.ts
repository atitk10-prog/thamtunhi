import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspectXuannuong() {
  const [aSnap, uSnap, attSnap] = await Promise.all([
    getDocs(collection(db, 'assignments')),
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'attempts'))
  ]);
  const userMap = new Map();
  uSnap.forEach(d => userMap.set(d.id, d.data()));

  const xuannuongTeacherId = 'user-1792533985096';
  const allAttempts = attSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const completedAttempts = allAttempts.filter(a => a.status === 'completed' && Boolean(a.completedAt));

  console.log(`Checking teacher xuannuong (${xuannuongTeacherId}):`);

  const teacherAssignments: any[] = [];
  aSnap.forEach(d => {
    const a: any = d.data();
    if (a.teacherId === xuannuongTeacherId || a.classId === 'class-1b' || a.classId === 'class-2a') {
      const directCompleted = completedAttempts.filter(att => att.assignmentId === d.id);
      const lessonClassCompleted = completedAttempts.filter(att =>
        att.assignmentId === d.id || (att.lessonId === a.lessonId && att.classId === a.classId)
      );

      teacherAssignments.push({
        id: d.id,
        title: a.title,
        teacherId: a.teacherId,
        classId: a.classId,
        lessonId: a.lessonId,
        directCompletedCount: directCompleted.length,
        directAttempts: directCompleted.map(att => ({ id: att.id, studentId: att.studentId, score: att.score, completedAt: att.completedAt })),
        linkedCompletedCount: lessonClassCompleted.length,
        linkedAttempts: lessonClassCompleted.map(att => ({ id: att.id, studentId: att.studentId, score: att.score, completedAt: att.completedAt }))
      });
    }
  });

  console.log(JSON.stringify(teacherAssignments, null, 2));
}

inspectXuannuong().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
