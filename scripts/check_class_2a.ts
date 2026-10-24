import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

import { assertSafeEnvironment } from './production_guard.ts';

async function check2a() {
  const d = await getDoc(doc(db, 'classes', 'class-2a'));
  console.log('Class 2A data:', d.data());
  const cData: any = d.data();
  console.log(`Class 2A current assigned teacherId: ${cData?.teacherId || 'none'}, teacherName: ${cData?.teacherName || 'none'}`);
  // [SAFETY] Removed automatic mutation. Class assignment must only be managed by Admin via UI.
}
check2a();
