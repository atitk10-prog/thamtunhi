import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function investigate() {
  console.log('=== ĐIỀU TRA LỖI 1 & LỖI 2 ===\n');

  // 1. Find user Quân (HS1B12)
  const uSnap = await getDocs(query(collection(db, 'users'), where('studentCode', '==', 'HS1B12')));
  console.log('Found users with studentCode HS1B12:', uSnap.size);
  let quanUser: any = null;
  uSnap.docs.forEach(d => {
    quanUser = { id: d.id, ...d.data() as any };
    console.log('  User docId:', d.id, 'data:', quanUser);
  });

  // Also search by displayName if not found or if multiple
  if (!quanUser) {
    const allUsers = await getDocs(collection(db, 'users'));
    allUsers.docs.forEach(d => {
      const data = d.data() as any;
      if (data.displayName?.includes('Quân') || data.studentCode?.includes('1B12')) {
        console.log('  Candidate user:', d.id, data);
        quanUser = { id: d.id, ...data };
      }
    });
  }

  // 2. Find assignments for class-1b:
  // - [Toán 1] Các số từ 1 đến 5: Đếm và Nhận biết
  // - [Toán 1] Bài tập Toán: Luyện tập các số 1 2 3 4 5
  const aSnap = await getDocs(query(collection(db, 'assignments'), where('classId', '==', 'class-1b')));
  console.log('\nTotal assignments in class-1b:', aSnap.size);
  const assignments = aSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  for (const a of assignments) {
    console.log(`  Assign: ${a.id} | title: "${a.title}" | lessonId: ${a.lessonId} | versionId: ${a.lessonVersionId}`);
  }

  // 3. Find attempts for Quân under all possible student IDs
  const possibleIds = [
    quanUser?.id,
    'HS1B12',
    'hs1b12',
    'student-hs1b12',
    'student-HS1B12',
    quanUser?.studentCode
  ].filter(Boolean);

  console.log('\nSearching attempts with studentId in:', possibleIds);
  const allAttSnap = await getDocs(collection(db, 'attempts'));
  const allAttempts = allAttSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

  const quanAttempts = allAttempts.filter(a => possibleIds.includes(a.studentId));
  console.log(`Found ${quanAttempts.length} attempts matching Quân:`);
  for (const att of quanAttempts) {
    console.log(`  Attempt: ${att.id}`);
    console.log(`    studentId: ${att.studentId}`);
    console.log(`    assignmentId: ${att.assignmentId}`);
    console.log(`    lessonId: ${att.lessonId}`);
    console.log(`    lessonVersionId: ${att.lessonVersionId}`);
    console.log(`    status: ${att.status} | score: ${att.score}/${att.maxScore}`);
    console.log(`    startedAt: ${att.startedAt}`);
    console.log(`    completedAt: ${att.completedAt}`);
    console.log(`    dataOrigin: ${att.dataOrigin}`);
  }

  // 4. Also check all attempts for the lesson "[Toán 1] Bài tập Toán: Luyện tập các số 1 2 3 4 5"
  const luyenTapAssign = assignments.find(a => a.title.includes('Luyện tập các số 1 2 3 4 5'));
  console.log('\n--- LỖI 2: ATTEMPTS FOR BÀI LUYỆN TẬP 1 2 3 4 5 ---');
  if (luyenTapAssign) {
    console.log('Assignment:', luyenTapAssign.id, 'lessonId:', luyenTapAssign.lessonId);
    const assignAtts = allAttempts.filter(a => a.assignmentId === luyenTapAssign.id || a.lessonId === luyenTapAssign.lessonId);
    console.log(`Total attempts for this assignment/lesson: ${assignAtts.length}`);
    for (const at of assignAtts) {
      console.log(`  id: ${at.id} | studentId: ${at.studentId} | status: ${at.status} | score: ${at.score} | completedAt: ${at.completedAt} | dataOrigin: ${at.dataOrigin}`);
    }
  }

  // 5. Also check all attempts for the lesson "[Toán 1] Các số từ 1 đến 5: Đếm và Nhận biết"
  const demAssign = assignments.find(a => a.title.includes('Đếm và Nhận biết') || a.id.includes('lesson-g1-01'));
  console.log('\n--- LỖI 1: ATTEMPTS FOR BÀI ĐẾM VÀ NHẬN BIẾT 1-5 ---');
  if (demAssign) {
    console.log('Assignment:', demAssign.id, 'lessonId:', demAssign.lessonId);
    const demAtts = allAttempts.filter(a => a.assignmentId === demAssign.id || a.lessonId === demAssign.lessonId);
    console.log(`Total attempts for this assignment/lesson: ${demAtts.length}`);
    const quanDemAtts = demAtts.filter(a => possibleIds.includes(a.studentId));
    console.log(`Of which for Quân: ${quanDemAtts.length}`);
    for (const at of quanDemAtts) {
      console.log(`  id: ${at.id} | studentId: ${at.studentId} | status: ${at.status} | score: ${at.score} | completedAt: ${at.completedAt}`);
    }
  }
}

investigate().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
