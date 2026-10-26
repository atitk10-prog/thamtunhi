import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkAdmin() {
  const q = query(collection(db, 'users'), where('role', '==', 'admin'));
  const snap = await getDocs(q);
  console.log('Total admin docs:', snap.size);
  for (const d of snap.docs) {
    const data = d.data();
    console.log('Admin:', {
      id: d.id,
      email: data.email,
      displayName: data.displayName,
      hasHash: Boolean(data.passwordHash),
      match123: data.passwordHash ? await bcrypt.compare('AdminBaoMat@123', data.passwordHash) : false,
      match123456: data.passwordHash ? await bcrypt.compare('123456', data.passwordHash) : false,
    });
  }
}

checkAdmin().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
