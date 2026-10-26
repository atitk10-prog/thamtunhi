import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const TARGET_ASSIGNMENTS = [
  'assign-class-1b-lesson-g1-01',
  'assign-class-1b-lesson-g1-02',
  'assign-class-1b-lesson-g1-03',
  'assign-class-1b-lesson-g1-04',
  'assign-class-1b-lesson-g1-05',
  'assign-class-1b-lesson-g1-06',
  'assign-class-2a-lesson-g2-01',
  'assign-class-2a-lesson-g2-02',
  'assign-class-2a-lesson-g2-03',
  'assign-class-2a-lesson-g2-04',
  'assign-class-2a-lesson-g2-05',
  'assign-class-2a-lesson-g2-06',
];

async function alignAssignments() {
  console.log('=== ALIGNING ASSIGNMENTS METADATA FOR 1B AND 2A ===');
  for (const aId of TARGET_ASSIGNMENTS) {
    const aRef = doc(db, 'assignments', aId);
    const snap = await getDoc(aRef);
    if (!snap.exists()) {
      console.log(`Assignment ${aId} does not exist, skipping.`);
      continue;
    }

    const current = snap.data();
    console.log(`Before: ${aId} | teacherId: ${current.teacherId} | dataOrigin: ${current.dataOrigin}`);

    await updateDoc(aRef, {
      teacherId: 'user-1792533985096',
      teacherName: 'Hà Thị Xuân Nương',
      dataOrigin: 'real',
      updatedAt: new Date().toISOString(),
    });

    const updatedSnap = await getDoc(aRef);
    const updated = updatedSnap.data();
    console.log(`After:  ${aId} | teacherId: ${updated?.teacherId} | dataOrigin: ${updated?.dataOrigin} | teacherName: ${updated?.teacherName}`);
  }
}

alignAssignments().then(() => {
  console.log('Finished aligning assignments.');
  process.exit(0);
}).catch(console.error);
