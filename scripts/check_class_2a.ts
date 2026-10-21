import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check2a() {
  const d = await getDoc(doc(db, 'classes', 'class-2a'));
  console.log('Class 2A data:', d.data());
  const cData: any = d.data();
  if (cData && cData.teacherId !== 'teacher-2') {
    console.log(`Updating class-2a teacherId from ${cData.teacherId} to teacher-2...`);
    await updateDoc(doc(db, 'classes', 'class-2a'), {
      teacherId: 'teacher-2',
      teacherName: 'Thầy Quốc Huy',
      updatedAt: new Date().toISOString()
    });
    console.log('Updated class-2a successfully to teacher-2.');
  }
}
check2a();
