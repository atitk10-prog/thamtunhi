import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '..', 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function cleanTestStudent() {
  const targetId = 'student-test6382-6614';
  const d = await getDoc(doc(db, 'users', targetId));
  if (d.exists()) {
    await updateDoc(doc(db, 'users', targetId), {
      isDeleted: true,
      status: 'inactive'
    });
    console.log('Successfully archived test student TEST6382:', targetId);
  } else {
    console.log('Doc not found:', targetId);
  }
}

cleanTestStudent().catch(console.error);
