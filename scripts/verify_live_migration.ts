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

async function verifyLive() {
  console.log('================================================================');
  console.log(' KIỂM TRA TRỰC TIẾP FIRESTORE SAU KHI APPLY MIGRATION');
  console.log(' Database ID:', firebaseConfig.firestoreDatabaseId);
  console.log('================================================================\n');

  // Academic Years
  const yearsSnap = await getDocs(collection(db, 'academicYears'));
  console.log(`--- 1. ACADEMIC YEARS (${yearsSnap.docs.length} bản ghi) ---`);
  yearsSnap.docs.forEach(d => {
    console.log(`  + ID="${d.id}" | Name="${d.data().name}" | isCurrent=${d.data().isCurrent} | status="${d.data().status}"`);
  });

  // Classes
  const classesSnap = await getDocs(collection(db, 'classes'));
  console.log(`\n--- 2. CLASSES (${classesSnap.docs.length} bản ghi) ---`);
  classesSnap.docs.forEach(d => {
    console.log(`  + Lớp ${d.data().name} (${d.id}): academicYearId="${d.data().academicYearId}"`);
  });

  // Students with year
  const usersSnap = await getDocs(collection(db, 'users'));
  const students = usersSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter(u => u.role === 'student' && /^(HS1A|HS1B|HS2A|HS2B)\d{2}$/.test(u.studentCode || ''));
  console.log(`\n--- 3. HỌC SINH CHÍNH KHÓA (${students.length} học sinh) ---`);
  const yearCounts: Record<string, number> = {};
  students.forEach(s => {
    const yr = s.schoolYearId || '(none)';
    yearCounts[yr] = (yearCounts[yr] || 0) + 1;
  });
  console.log('Phân bố schoolYearId của 48 học sinh chính khóa:', yearCounts);

  // Overall counts
  console.log('\n--- 4. TỔNG SỐ BẢN GHI CÁC BẢNG (ĐỐI SOÁT KHÔNG MẤT DỮ LIỆU) ---');
  console.log(`- academicYears: ${yearsSnap.docs.length}`);
  console.log(`- classes: ${classesSnap.docs.length}`);
  console.log(`- users: ${usersSnap.docs.length}`);
}

verifyLive().catch(err => {
  console.error('Lỗi verify:', err);
  process.exit(1);
});
