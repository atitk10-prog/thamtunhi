import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const cfgPath = path.resolve('./firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspectXuannuongScope() {
  console.log('=== XÁC NHẬN PHÂN CÔNG GIÁO VIÊN XUANNUONG ===\n');

  // 1. Get teacher xuannuong user doc
  const uSnap = await getDoc(doc(db, 'users', 'user-1792533985096'));
  if (uSnap.exists()) {
    const u = uSnap.data();
    console.log('1. Tài khoản giáo viên:');
    console.log(`   - ID: ${uSnap.id}`);
    console.log(`   - Họ và tên: ${u.displayName}`);
    console.log(`   - Email: ${u.email}`);
    console.log(`   - Vai trò: ${u.role}`);
    console.log(`   - assignedClassIds:`, u.assignedClassIds);
  } else {
    console.log('Không tìm thấy user-1792533985096');
  }

  // 2. Get classes
  const cSnap = await getDocs(collection(db, 'classes'));
  console.log('\n2. Danh sách 4 lớp học và giáo viên phụ trách:');
  cSnap.forEach(d => {
    const c = d.data();
    const isXuannuong = c.teacherId === 'user-1792533985096';
    console.log(`   - Lớp [${d.id}] ${c.name}: teacherId = ${c.teacherId} ${isXuannuong ? '--> [PHÂN CÔNG XUANNUONG]' : ''}`);
  });

  // 3. Get assignments for class-1b and class-2a
  const aSnap = await getDocs(collection(db, 'assignments'));
  const allAssignments = aSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  const assign1b = allAssignments.filter(a => a.classId === 'class-1b');
  const assign2a = allAssignments.filter(a => a.classId === 'class-2a');

  console.log(`\n3. Bài tập đã giao vào lớp 1B (class-1b): ${assign1b.length} bài`);
  assign1b.forEach((a, i) => {
    console.log(`   ${i + 1}. [${a.id}] "${a.title}" | Hạn nộp: ${a.dueDate} | Trạng thái: ${a.status} | teacherId: ${a.teacherId}`);
  });

  console.log(`\n4. Bài tập đã giao vào lớp 2A (class-2a): ${assign2a.length} bài`);
  assign2a.forEach((a, i) => {
    console.log(`   ${i + 1}. [${a.id}] "${a.title}" | Hạn nộp: ${a.dueDate} | Trạng thái: ${a.status} | teacherId: ${a.teacherId}`);
  });

  // Check other classes to confirm no unintended xuannuong assignments exist
  const assignOther = allAssignments.filter(a => a.classId !== 'class-1b' && a.classId !== 'class-2a' && a.teacherId === 'user-1792533985096');
  console.log(`\n5. Bài của xuannuong ở lớp khác (ngoài 1B và 2A): ${assignOther.length} bài`);
  assignOther.forEach((a, i) => {
    console.log(`   ${i + 1}. [${a.id}] class: ${a.classId} "${a.title}"`);
  });
}

inspectXuannuongScope().catch(console.error);
