import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspectUnlinkedAttempts() {
  const [attSnap, assSnap] = await Promise.all([
    getDocs(collection(db, 'attempts')),
    getDocs(collection(db, 'assignments'))
  ]);

  const attempts = attSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const assignments = assSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const assignIds = new Set(assignments.map(a => a.id));

  const unlinked = attempts.filter(a => !a.assignmentId || !assignIds.has(a.assignmentId));
  console.log(`Unlinked attempts total: ${unlinked.length}`);

  const statusCount: Record<string, number> = {};
  unlinked.forEach(a => {
    statusCount[a.status || 'unknown'] = (statusCount[a.status || 'unknown'] || 0) + 1;
  });
  console.log('Unlinked status count:', statusCount);

  const completedUnlinked = unlinked.filter(a => a.status === 'completed');
  console.log(`Completed unlinked attempts: ${completedUnlinked.length}`);
  completedUnlinked.slice(0, 10).forEach(a => {
    console.log(`- [${a.id}] assignmentId: "${a.assignmentId}", lessonId: "${a.lessonId}", studentId: "${a.studentId}", completedAt: ${a.completedAt}`);
  });
}

inspectUnlinkedAttempts().catch(console.error);
