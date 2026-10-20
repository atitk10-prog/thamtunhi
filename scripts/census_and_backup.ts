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

async function runCensusAndBackup() {
  console.log('================================================================');
  console.log(' PHA 1: KIỂM KÊ DỮ LIỆU & SAO LƯU AN TOÀN TRƯỚC THAY ĐỔI');
  console.log(' Database ID:', firebaseConfig.firestoreDatabaseId);
  console.log('================================================================\n');

  const collectionsToInspect = [
    'academicYears',
    'classes',
    'users',
    'assignments',
    'attempts',
    'lessons',
    'auditLogs'
  ];

  const backupData: Record<string, any[]> = {};
  const counts: Record<string, number> = {};

  for (const colName of collectionsToInspect) {
    const snap = await getDocs(collection(db, colName));
    backupData[colName] = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    counts[colName] = backupData[colName].length;
    console.log(`- Collection [${colName}]: ${counts[colName]} bản ghi`);
  }

  // 1. Save Backup
  const backupDir = path.resolve(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-before-p0-sync-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n✓ ĐÃ SAO LƯU AN TOÀN: ${backupFile}`);

  // 2. Academic Years Census
  console.log('\n--- 2. CHI TIẾT ACADEMIC YEARS ---');
  console.table(backupData.academicYears.map(y => ({
    id: y.id || y._id,
    name: y.name,
    isCurrent: y.isCurrent,
    status: y.status,
    dataOrigin: y.dataOrigin,
    createdAt: y.createdAt
  })));

  // 3. Classes Census
  console.log('\n--- 3. CHI TIẾT CLASSES & LIÊN KẾT NĂM HỌC ---');
  console.table(backupData.classes.map(c => ({
    id: c.id || c._id,
    name: c.name,
    grade: c.grade,
    academicYearId: c.academicYearId,
    teacherName: c.teacherName,
    studentCount: c.studentCount
  })));

  // 4. Assignments Census
  console.log('\n--- 4. CHI TIẾT ASSIGNMENTS & LIÊN KẾT NĂM HỌC ---');
  const assignmentsByYear: Record<string, number> = {};
  backupData.assignments.forEach(a => {
    const yr = a.academicYearId || '(none)';
    assignmentsByYear[yr] = (assignmentsByYear[yr] || 0) + 1;
  });
  console.log('Assignments count by academicYearId:', assignmentsByYear);

  // 5. Users Census - Explain 101 vs 52
  console.log('\n--- 5. GIẢI MÃ SỐ LƯỢNG NGƯỜI DÙNG (101 vs 52) ---');
  const users = backupData.users;
  console.log(`Tổng số user document trong Firestore: ${users.length}`);

  const byRole: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byOrigin: Record<string, number> = {};
  let deletedCount = 0;
  let qaCount = 0;
  let officialStudents = 0; // HS1Axx, HS1Bxx, HS2Axx, HS2Bxx
  let teachers = 0;
  let admins = 0;

  users.forEach(u => {
    byRole[u.role || 'unknown'] = (byRole[u.role || 'unknown'] || 0) + 1;
    byStatus[u.status || 'unknown'] = (byStatus[u.status || 'unknown'] || 0) + 1;
    byOrigin[u.dataOrigin || 'unknown'] = (byOrigin[u.dataOrigin || 'unknown'] || 0) + 1;

    if (u.isDeleted) deletedCount++;
    const isQA = (u.studentCode && u.studentCode.startsWith('QA-')) ||
                 (u.id && (u.id.includes('test') || u.id.includes('qa'))) ||
                 (u.email && (u.email.includes('test') || u.email.includes('qa')));
    if (isQA) qaCount++;

    if (u.role === 'student' && /^(HS1A|HS1B|HS2A|HS2B)\d{2}$/.test(u.studentCode || '')) {
      officialStudents++;
    }
    if (u.role === 'teacher') teachers++;
    if (u.role === 'admin') admins++;
  });

  console.log('Phân bố theo Role:', byRole);
  console.log('Phân bố theo Status:', byStatus);
  console.log('Phân bố theo DataOrigin:', byOrigin);
  console.log(`- Tài khoản bị đánh dấu isDeleted: true: ${deletedCount}`);
  console.log(`- Tài khoản QA / Test nhận diện được: ${qaCount}`);
  console.log(`- Học sinh chính khóa 4 lớp (HS1A/1B/2A/2B): ${officialStudents}`);
  console.log(`- Giáo viên: ${teachers}`);
  console.log(`- Quản trị viên: ${admins}`);

  // List all users with id, displayName, email, role, studentCode, isDeleted, status
  console.log('\n--- TOÀN BỘ DANH SÁCH USER (Tóm tắt để đối soát) ---');
  users.forEach((u, i) => {
    console.log(`[${i+1}] id=${u.id || u._id} | name=${u.displayName} | role=${u.role} | code=${u.studentCode || '-'} | status=${u.status} | del=${u.isDeleted} | orig=${u.dataOrigin}`);
  });

  console.log('\n================================================================');
  console.log(' HOÀN TẤT KIỂM KÊ (DRY-RUN / NO WRITES PERFORMED)');
  console.log('================================================================');
}

runCensusAndBackup().catch(err => {
  console.error('Lỗi kiểm kê:', err);
  process.exit(1);
});
