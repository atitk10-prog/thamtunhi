import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspectLiveAttempts() {
  const snap = await getDocs(collection(db, 'attempts'));
  console.log(`Total attempts in live Firestore: ${snap.size}`);

  const byOrigin: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const realAttempts: any[] = [];

  snap.forEach(d => {
    const a = d.data();
    const origin = a.dataOrigin || 'unknown';
    const status = a.status || 'unknown';
    byOrigin[origin] = (byOrigin[origin] || 0) + 1;
    byStatus[status] = (byStatus[status] || 0) + 1;

    if (origin === 'real' || !d.id.startsWith('att-demo-')) {
      realAttempts.push({ id: d.id, ...a });
    }
  });

  console.log('Attempts by dataOrigin:', byOrigin);
  console.log('Attempts by status:', byStatus);
  console.log('\nReal/non-demo attempts count:', realAttempts.length);
  realAttempts.forEach(a => {
    console.log(`- ID: ${a.id} | student: ${a.studentCode || a.studentId} | class: ${a.classId} | assign: ${a.assignmentId} | status: ${a.status} | score: ${a.score} | completedAt: ${a.completedAt}`);
  });
}

inspectLiveAttempts().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
