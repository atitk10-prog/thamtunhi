import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function findStudentPassword() {
  const d = await getDoc(doc(db, 'users', 'student-hs1b12'));
  const hash = d.data()?.accessSecretHash;
  console.log('Hash:', hash);

  const candidates = [
    '123456',
    'matkhau123',
    'HS1B12',
    'hs1b12',
    'Quan123',
    'quan123',
    '12345678',
    '1234',
    'matkhau',
    'thamtunhi',
    'hocsinh123',
    'hs123',
    'hs123456',
    'AdminBaoMat@123',
    'quan',
    'Quân',
    '1',
    'password',
    'default'
  ];

  for (const c of candidates) {
    if (await bcrypt.compare(c, hash)) {
      console.log('MATCH FOUND! Password is:', c);
      return;
    }
  }
  console.log('None of the simple candidates matched.');
}

findStudentPassword().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
