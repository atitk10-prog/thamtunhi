import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkStudent() {
  const q = query(collection(db, 'users'), where('studentCode', '==', 'HS1B12'));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.log('No student found with HS1B12 in users collection');
    // Check doc directly
    const directDoc = await getDoc(doc(db, 'users', 'student-hs1b12'));
    if (directDoc.exists()) {
      console.log('Direct doc exists student-hs1b12:', directDoc.data());
    } else {
      console.log('Direct doc student-hs1b12 does not exist either');
    }
  } else {
    for (const d of snap.docs) {
      console.log('Student doc found:', d.id);
      const data = d.data();
      console.log('Data:', {
        id: data.id,
        studentCode: data.studentCode,
        displayName: data.displayName,
        classId: data.classId,
        hasHash: Boolean(data.accessSecretHash),
        hashPreview: data.accessSecretHash ? data.accessSecretHash.substring(0, 10) : null,
        legacySecret: data.accessSecret,
        status: data.status,
      });
    }
  }
}

checkStudent().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
