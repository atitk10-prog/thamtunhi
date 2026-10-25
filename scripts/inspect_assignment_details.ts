import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const d = await getDoc(doc(db, 'assignments', 'assign-class-1b-lesson-g1-01'));
  console.log('assign-class-1b-lesson-g1-01 data:', JSON.stringify(d.data(), null, 2));
  const c = await getDoc(doc(db, 'classes', 'class-1b'));
  console.log('class-1b data:', JSON.stringify(c.data(), null, 2));
  const c2a = await getDoc(doc(db, 'classes', 'class-2a'));
  console.log('class-2a data:', JSON.stringify(c2a.data(), null, 2));
  const u = await getDoc(doc(db, 'users', 'user-1792533985096'));
  console.log('user-1792533985096 (xuannuong):', JSON.stringify(u.data(), null, 2));
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
