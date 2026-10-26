import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function inspectAllLessons() {
  const lSnap = await getDocs(collection(db, 'lessons'));
  console.log('Total lessons:', lSnap.size);
  lSnap.docs.forEach(d => {
    const l = d.data() as any;
    console.log(`- ${d.id} | title: "${l.title}" | currVer: ${l.currentVersion} | currVerId: ${l.currentVersionId} | draftVerId: ${l.draftVersionId} | createdBy: ${l.createdBy}`);
  });
}

inspectAllLessons().then(() => process.exit(0)).catch(console.error);
