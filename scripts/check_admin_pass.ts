import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '..', 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function check() {
  const d = await getDoc(doc(db, 'users', 'admin-demo'));
  const data = d.data();
  console.log('Admin document:', {
    id: data?.id,
    email: data?.email,
    displayName: data?.displayName,
    role: data?.role,
    passwordHash: data?.passwordHash,
    tokenVersion: data?.tokenVersion,
  });

  const isMatch = bcrypt.compareSync('AdminBaoMat@123', data?.passwordHash || '');
  console.log('Matches AdminBaoMat@123:', isMatch);

  if (!isMatch) {
    console.log('Resetting passwordHash to bcrypt of AdminBaoMat@123...');
    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync('AdminBaoMat@123', salt);
    await updateDoc(doc(db, 'users', 'admin-demo'), {
      passwordHash: newHash,
      tokenVersion: (data?.tokenVersion || 0) + 1,
      updatedAt: new Date().toISOString(),
    });
    console.log('Updated passwordHash to AdminBaoMat@123 successfully!');
  }
}

check().catch(console.error);
