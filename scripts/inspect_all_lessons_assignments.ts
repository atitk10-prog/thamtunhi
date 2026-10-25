import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspectLessons() {
  const [lSnap, aSnap] = await Promise.all([
    getDocs(collection(db, 'lessons')),
    getDocs(collection(db, 'assignments'))
  ]);

  console.log(`=== LESSONS IN FIRESTORE (${lSnap.size}) ===`);
  const lessons = lSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  lessons.sort((a, b) => (a.grade || 0) - (b.grade || 0) || (a.week || 0) - (b.week || 0) || a.id.localeCompare(b.id));

  lessons.forEach((l, idx) => {
    console.log(`${idx + 1}. [${l.id}] Grade ${l.grade} - Week ${l.week || 'N/A'}: "${l.title}" (topic: ${l.topic})`);
  });

  console.log(`\n=== ASSIGNMENTS IN FIRESTORE (${aSnap.size}) ===`);
  const assignments = aSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const assignByClass: Record<string, number> = {};
  assignments.forEach(a => {
    assignByClass[a.classId] = (assignByClass[a.classId] || 0) + 1;
  });
  console.log('Assignments count by classId:', assignByClass);
}

inspectLessons().catch(console.error);
