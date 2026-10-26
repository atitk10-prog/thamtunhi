import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function testTeacherAssignmentsCalculation() {
  const [snap, attSnap, usersSnap, classSnap] = await Promise.all([
    getDocs(collection(db, 'assignments')),
    getDocs(collection(db, 'attempts')),
    getDocs(query(collection(db, 'users'), where('role', '==', 'student'))),
    getDocs(collection(db, 'classes')),
  ]);

  const allAttempts = attSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
  const isRealAttempt = (att: any) => att.dataOrigin === 'real' || (!att.id.startsWith('att-demo-') && att.dataOrigin !== 'simulation');
  const targetAttempts = allAttempts.filter(isRealAttempt);

  const targetAssignId = 'assign-lesson-draft-1792910089741-class-1b-122978';
  const aDoc = snap.docs.find(d => d.id === targetAssignId);
  const aData = { id: aDoc?.id, ...aDoc?.data() as any };

  const assignAttempts = targetAttempts.filter((att) =>
    att.assignmentId === aDoc?.id ||
    (Boolean(aData.lessonId) && att.lessonId === aData.lessonId && att.classId === aData.classId)
  );

  console.log('assignAttempts matching targetAssignId:', assignAttempts.length);
  for (const at of assignAttempts) {
    console.log('  id:', at.id, '| status:', at.status, '| completedAt:', at.completedAt, '| studentId:', at.studentId);
  }

  const completedAttempts = assignAttempts.filter((att) => att.status === 'completed' && Boolean(att.completedAt));
  console.log('completedAttempts count:', completedAttempts.length);

  // Now check progress endpoint calculation
  const directAtts = allAttempts.filter(a => a.assignmentId === targetAssignId);
  const lessonAtts = allAttempts.filter(a => a.lessonId === aData.lessonId && a.classId === aData.classId);
  const map = new Map();
  directAtts.forEach(a => map.set(a.id, a));
  lessonAtts.forEach(a => { if (!map.has(a.id)) map.set(a.id, a); });
  const progressAttempts = Array.from(map.values()).filter(isRealAttempt);
  const completedProgress = progressAttempts.filter(a => a.status === 'completed' && Boolean(a.completedAt));
  console.log('Progress completed attempts count:', completedProgress.length);
}

testTeacherAssignmentsCalculation().then(() => process.exit(0)).catch(console.error);
