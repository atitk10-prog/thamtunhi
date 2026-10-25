import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspectAssignments() {
  const [aSnap, uSnap, attSnap] = await Promise.all([
    getDocs(collection(db, 'assignments')),
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'attempts'))
  ]);
  const userMap = new Map();
  uSnap.forEach(d => userMap.set(d.id, d.data()));

  const allAttempts = attSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const completedAttempts = allAttempts.filter(a => a.status === 'completed' && Boolean(a.completedAt));

  console.log('Total assignments in DB: ' + aSnap.size);
  const rows: any[] = [];
  aSnap.forEach(d => {
    const a: any = d.data();
    const teacher: any = userMap.get(a.teacherId);

    // direct match
    const directCompleted = completedAttempts.filter(att => att.assignmentId === d.id);
    // lesson + class match
    const lessonClassCompleted = completedAttempts.filter(att =>
      att.assignmentId === d.id || (att.lessonId === a.lessonId && att.classId === a.classId)
    );

    const directStudents = new Set(directCompleted.map(att => att.studentId));
    const lessonClassStudents = new Set(lessonClassCompleted.map(att => att.studentId));

    rows.push({
      id: d.id,
      title: a.title,
      classId: a.classId,
      lessonId: a.lessonId,
      teacher: teacher ? teacher.displayName : a.teacherId,
      status: a.status,
      assignedAt: a.assignedAt || a.createdAt,
      directCompletedCount: directCompleted.length,
      directStudentsCount: directStudents.size,
      linkedCompletedCount: lessonClassCompleted.length,
      linkedStudentsCount: lessonClassStudents.size,
    });
  });

  console.log(JSON.stringify(rows, null, 2));
}

inspectAssignments().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
