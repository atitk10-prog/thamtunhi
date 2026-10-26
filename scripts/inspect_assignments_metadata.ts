import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function checkAssignments() {
  const [bSnap, aSnap] = await Promise.all([
    getDocs(query(collection(db, 'assignments'), where('classId', '==', 'class-1b'))),
    getDocs(query(collection(db, 'assignments'), where('classId', '==', 'class-2a'))),
  ]);

  console.log('=== CLASS 1B ASSIGNMENTS ===');
  bSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id} | teacherId: ${data.teacherId} | teacherName: ${data.teacherName} | dataOrigin: ${data.dataOrigin} | status: ${data.status} | title: ${data.title}`);
  });

  console.log('\n=== CLASS 2A ASSIGNMENTS ===');
  aSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id} | teacherId: ${data.teacherId} | teacherName: ${data.teacherName} | dataOrigin: ${data.dataOrigin} | status: ${data.status} | title: ${data.title}`);
  });
}

checkAssignments().then(() => process.exit(0)).catch(console.error);
