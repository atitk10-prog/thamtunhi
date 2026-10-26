import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function checkAssignmentsDataOrigin() {
  const aSnap = await getDocs(query(collection(db, 'assignments'), where('classId', '==', 'class-1b')));
  console.log('Class 1B assignments:');
  aSnap.docs.forEach(d => {
    const a = d.data() as any;
    console.log(`- ${d.id}: dataOrigin=${a.dataOrigin}, teacherId=${a.teacherId}, createdBy=${a.createdBy}, lessonId=${a.lessonId}`);
  });
}

checkAssignmentsDataOrigin().then(() => process.exit(0)).catch(console.error);
