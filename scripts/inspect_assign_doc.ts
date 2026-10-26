import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function inspectDoc() {
  const dSnap = await getDoc(doc(db, 'assignments', 'assign-lesson-draft-1792910089741-class-1b-122978'));
  console.log('Assignment document in Firestore:');
  console.log(dSnap.data());
}

inspectDoc().then(() => process.exit(0)).catch(console.error);
