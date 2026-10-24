import fs from 'fs';
import bcrypt from 'bcryptjs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('restore_thanh_thanh.ts', 'Khôi phục giáo viên Trần Thanh Thanh');

const cfg = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = getApps().length === 0 ? initializeApp(cfg) : getApp();
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function reset() {
  const hash = await bcrypt.hash('123456', 10);
  await updateDoc(doc(db, 'users', 'user-1792533985096'), {
    displayName: 'Trần Thanh Thanh',
    email: 'thanhthanh@gmail.com',
    passwordHash: hash,
    role: 'teacher',
    status: 'active'
  });
  console.log('Restored teacher user-1792533985096 to Trần Thanh Thanh / thanhthanh@gmail.com / 123456');
  process.exit(0);
}

reset().catch((e) => {
  console.error(e);
  process.exit(1);
});
