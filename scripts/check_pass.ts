import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const quan = allUsers.find(u => u.studentCode === 'HS1B12');
  console.log('QUAN HS1B12:', {
    id: quan?.id,
    studentCode: quan?.studentCode,
    displayName: quan?.displayName,
    accessSecret: quan?.accessSecret,
    password: quan?.password,
    hasHash: !!quan?.passwordHash,
  });

  const admins = allUsers.filter(u => u.role === 'admin');
  console.log('ADMINS:');
  admins.forEach(a => {
    console.log({
      id: a.id,
      email: a.email,
      displayName: a.displayName,
      hasHash: !!a.passwordHash,
      hasPlain: !!a.password,
    });
  });
}
check().then(() => process.exit(0)).catch(console.error);
