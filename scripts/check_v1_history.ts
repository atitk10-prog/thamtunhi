import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(cfg) : getApp();
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function check() {
  const asSnap = await getDocs(query(collection(db, 'assignments'), where('lessonVersionId', '==', 'version-lesson-g1-01-v1')));
  console.log('Assignments count for v1:', asSnap.size);
  const atSnap = await getDocs(query(collection(db, 'attempts'), where('lessonVersionId', '==', 'version-lesson-g1-01-v1')));
  console.log('Attempts count for v1:', atSnap.size);
}
check().catch(console.error);
