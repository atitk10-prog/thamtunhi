import fs from 'fs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('clean_test_users.ts', 'Xóa tài khoản học sinh thử nghiệm');

const cfg = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = getApps().length === 0 ? initializeApp(cfg) : getApp();
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function clean() {
  const snap = await getDocs(collection(db, 'users'));
  const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const testUsers = users.filter((u: any) => u.role === 'student' && (!u.studentCode || !u.studentCode.match(/^HS(1A|1B|2A|2B)\d{2}$/)));
  console.log('Non-official students found:', testUsers.length);
  for (const u of testUsers) {
    console.log('Deleting test student:', u.id, u.studentCode);
    await deleteDoc(doc(db, 'users', u.id));
  }
  console.log('Done cleaning test students.');
}

clean().catch(err => {
  console.error('Clean failed:', err);
  process.exit(1);
});
