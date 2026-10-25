import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function checkTeacher() {
  const usersSnap = await getDocs(query(collection(db, 'users'), where('username', '==', 'xuannuong')));
  if (usersSnap.empty) {
    console.error('xuannuong user not found!');
    return;
  }
  const teacher = { id: usersSnap.docs[0].id, ...usersSnap.docs[0].data() } as any;
  console.log('Teacher:', teacher.id, teacher.displayName, 'username:', teacher.username);
  console.log('assignedClassIds on user doc:', teacher.assignedClassIds);

  const classesSnap = await getDocs(collection(db, 'classes'));
  const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const assignedClasses = classes.filter(c => c.teacherId === teacher.id || (teacher.assignedClassIds && teacher.assignedClassIds.includes(c.id)));
  console.log('\nAssigned classes for xuannuong:');
  console.table(assignedClasses.map(c => ({ id: c.id, name: c.name, grade: c.grade, teacherId: c.teacherId, teacherName: c.teacherName })));

  const assignSnap = await getDocs(query(collection(db, 'assignments'), where('teacherId', '==', teacher.id)));
  const teacherAssignments = assignSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  console.log(`\nTotal assignments created by xuannuong: ${teacherAssignments.length}`);
  const byClass: Record<string, number> = {};
  for (const a of teacherAssignments) {
    byClass[a.classId] = (byClass[a.classId] || 0) + 1;
  }
  console.log('Assignments by class:', byClass);
}

checkTeacher().catch(console.error);
