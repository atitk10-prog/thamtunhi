import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '..', 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function auditG1() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const classesSnap = await getDocs(collection(db, 'classes'));
  const yearsSnap = await getDocs(collection(db, 'academicYears'));

  console.log('=== ACADEMIC YEARS ===');
  yearsSnap.forEach((doc) => {
    const d = doc.data();
    console.log(`ID: ${doc.id} | Name: ${d.name} | isCurrent: ${d.isCurrent} | status: ${d.status}`);
  });

  console.log('\n=== CLASSES & ASSIGNED TEACHERS ===');
  classesSnap.forEach((doc) => {
    const d = doc.data();
    console.log(`Class ID: ${doc.id} | Name: ${d.name} | Grade: ${d.grade} | Teacher ID: ${d.teacherId} | Teacher Name: ${d.teacherName} | Year: ${d.academicYearId} | isDeleted: ${d.isDeleted}`);
  });

  console.log('\n=== TEACHERS ===');
  usersSnap.forEach((doc) => {
    const d = doc.data();
    if (d.role === 'teacher') {
      console.log(`Teacher ID: ${doc.id} | Name: ${d.displayName} | Email: ${d.email} | Status: ${d.status} | isDeleted: ${d.isDeleted}`);
    }
  });

  console.log('\n=== STUDENTS PER CLASS ===');
  const counts: Record<string, { active: number; archivedOrDeleted: number; total: number; students: string[] }> = {};
  classesSnap.forEach((c) => {
    counts[c.id] = { active: 0, archivedOrDeleted: 0, total: 0, students: [] };
  });

  usersSnap.forEach((doc) => {
    const d = doc.data();
    if (d.role === 'student') {
      const cId = d.classId || (d.className ? `class-${d.className.toLowerCase()}` : 'unassigned');
      if (!counts[cId]) counts[cId] = { active: 0, archivedOrDeleted: 0, total: 0, students: [] };
      counts[cId].total++;
      if (d.isDeleted || d.status === 'archived' || d.status === 'locked') {
        counts[cId].archivedOrDeleted++;
      } else {
        counts[cId].active++;
      }
      counts[cId].students.push(`ID=${doc.id} | Code=${d.studentCode} | Name=${d.displayName} [status=${d.status}, isDeleted=${d.isDeleted}]`);
    }
  });

  console.log('\n=== SERVER.TS ROUTES ===');
  const serverCode = fs.readFileSync(path.resolve(__dirname, '..', 'server.ts'), 'utf8');
  const lines = serverCode.split('\n');
  lines.forEach((line, idx) => {
    const match = line.match(/app\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/);
    if (match) {
      console.log(`${match[1].toUpperCase().padEnd(7)} ${match[2].padEnd(45)} Line ${idx + 1}`);
    }
  });
}

auditG1().catch(console.error);
