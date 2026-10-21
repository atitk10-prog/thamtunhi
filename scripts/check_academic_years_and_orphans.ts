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

async function checkDataIntegrity() {
  console.log('================================================================');
  console.log(' KIỂM TRA ĐỘ TOÀN VẸN DỮ LIỆU NIÊN KHÓA VÀ LIÊN KẾT CLOUD');
  console.log(' Database ID:', firebaseConfig.firestoreDatabaseId);
  console.log('================================================================\n');

  // 1. Academic Years
  const yearsSnap = await getDocs(collection(db, 'academicYears'));
  const years = yearsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  console.log(`[1] ACADEMIC YEARS: Tổng cộng ${years.length} bản ghi`);
  const currentYears = years.filter(y => y.isCurrent === true);
  console.log(`  - Số năm hiện hành (isCurrent: true): ${currentYears.length}`);
  years.forEach(y => {
    console.log(`    + ID: "${y.id}", Tên: "${y.name}", isCurrent: ${y.isCurrent}, status: "${y.status}"`);
  });

  const isSingleCurrentYear = currentYears.length === 1 && currentYears[0].id === 'year-2026-2027';
  console.log(`  => Kết luận năm học hiện hành duy nhất: ${isSingleCurrentYear ? 'PASS (year-2026-2027)' : 'FAIL'}`);

  // 2. Classes
  const classesSnap = await getDocs(collection(db, 'classes'));
  const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  console.log(`\n[2] CLASSES: Tổng cộng ${classes.length} lớp học`);
  let classesAll2026 = true;
  classes.forEach(c => {
    const isYear2026 = c.academicYearId === 'year-2026-2027';
    if (!isYear2026) classesAll2026 = false;
    console.log(`    + Lớp ${c.name} (${c.id}): academicYearId="${c.academicYearId}" [${isYear2026 ? 'OK' : 'MISMATCH'}]`);
  });
  console.log(`  => 4 Lớp đều trỏ về year-2026-2027: ${classesAll2026 && classes.length === 4 ? 'PASS' : 'FAIL'}`);

  // 3. Official Students
  const usersSnap = await getDocs(collection(db, 'users'));
  const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const officialStudents = users.filter(u => u.role === 'student' && /^(HS1A|HS1B|HS2A|HS2B)\d{2}$/.test(u.studentCode || ''));
  console.log(`\n[3] HỌC SINH CHÍNH KHÓA: Tìm thấy ${officialStudents.length}/48 học sinh`);
  
  let studentsYearMismatch = 0;
  let studentsClassMismatch = 0;
  const classIds = new Set(classes.map(c => c.id));

  officialStudents.forEach(s => {
    if (s.schoolYearId !== 'year-2026-2027') {
      studentsYearMismatch++;
    }
    if (!classIds.has(s.classId)) {
      studentsClassMismatch++;
    }
  });

  console.log(`  - Số học sinh không đúng schoolYearId 'year-2026-2027': ${studentsYearMismatch}`);
  console.log(`  - Số học sinh trỏ tới classId không tồn tại: ${studentsClassMismatch}`);
  console.log(`  => 48 học sinh liên kết chính xác: ${officialStudents.length === 48 && studentsYearMismatch === 0 && studentsClassMismatch === 0 ? 'PASS' : 'FAIL'}`);

  // 4. Assignments & Orphans
  const assignmentsSnap = await getDocs(collection(db, 'assignments'));
  const assignments = assignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  console.log(`\n[4] BÀI GIAO (ASSIGNMENTS): ${assignments.length} bài`);
  let orphanedAssignments = 0;
  assignments.forEach(a => {
    if (a.classId && !classIds.has(a.classId)) {
      orphanedAssignments++;
      console.log(`    ⚠️ Assignment ${a.id} có classId ${a.classId} không tồn tại`);
    }
  });
  console.log(`  - Số bài giao mồ côi (không thuộc lớp nào): ${orphanedAssignments}`);
  console.log(`  => Kiểm tra bài giao không mồ côi: ${orphanedAssignments === 0 ? 'PASS' : 'FAIL'}`);

  // 5. Attempts & Orphans
  const attemptsSnap = await getDocs(collection(db, 'attempts'));
  const attempts = attemptsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  console.log(`\n[5] LƯỢT LÀM BÀI (ATTEMPTS): ${attempts.length} lượt`);
  const userIds = new Set(users.map(u => u.id));
  const assignmentIds = new Set(assignments.map(a => a.id));
  let orphanedAttempts = 0;
  attempts.forEach(att => {
    const hasValidStudent = att.studentId ? userIds.has(att.studentId) : false;
    const hasValidAssignment = att.assignmentId ? assignmentIds.has(att.assignmentId) : true;
    if (!hasValidStudent) {
      orphanedAttempts++;
    }
  });
  console.log(`  - Số lượt làm bài mồ côi (studentId không tồn tại trong users): ${orphanedAttempts}`);
  console.log(`  => Kiểm tra kết quả làm bài không mồ côi: ${orphanedAttempts === 0 ? 'PASS' : 'FAIL'}`);

  console.log('\n================================================================');
  console.log(' TỔNG KẾT KIỂM TRA MỤC 3:');
  const allPass = isSingleCurrentYear && classesAll2026 && (officialStudents.length === 48) && (studentsYearMismatch === 0) && (orphanedAssignments === 0);
  console.log(` KẾT QUẢ MỤC 3: ${allPass ? 'PASS 100%' : 'FAIL'}`);
  console.log('================================================================');
}

checkDataIntegrity().catch(err => {
  console.error('Error during data check:', err);
  process.exit(1);
});
