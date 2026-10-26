import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function checkTeacher() {
  const s = await getDocs(query(collection(db, 'users'), where('email', '==', 'xuannuong@thamtunhi.edu.vn')));
  s.docs.forEach(d => console.log('Teacher docId:', d.id, d.data()));

  const classesSnap = await getDocs(collection(db, 'classes'));
  console.log('Classes:');
  classesSnap.docs.forEach(d => console.log('  class:', d.id, d.data()));
}

checkTeacher().then(() => process.exit(0)).catch(console.error);
