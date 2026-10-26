import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function inspectV1() {
  const v1Snap = await getDoc(doc(db, 'lessonVersions', 'version-lesson-g1-01-v1'));
  if (!v1Snap.exists()) {
    console.log('version-lesson-g1-01-v1 does not exist');
    return;
  }
  const v1 = v1Snap.data();
  console.log('=== QUESTIONS IN version-lesson-g1-01-v1 ===');
  v1.questions?.forEach((q: any, i: number) => {
    console.log(`Q${i+1}: prompt: "${q.prompt}" | type: ${q.interactionType} | visualSupport: ${q.visualSupportType} | img: ${q.imageUrl} | ans: ${q.expectedAnswer}`);
  });
}

inspectV1().then(() => process.exit(0)).catch(console.error);
