import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { assertSafeEnvironment } from './production_guard.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '..', 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const isApply = process.argv.includes('--apply');
if (isApply) {
  assertSafeEnvironment('migrate_academic_year_2026_2027.ts', 'Thực thi migration ghi niên khóa');
}

async function runMigration() {
  console.log('================================================================');
  console.log(` PHA 2: MIGRATION CHUẨN HÓA NIÊN KHÓA 2026–2027 (${isApply ? 'APPLY CHÍNH THỨC' : 'DRY-RUN AN TOÀN'})`);
  console.log(' Database ID:', firebaseConfig.firestoreDatabaseId);
  console.log('================================================================\n');

  // 1. Verify Backup exists
  const backupDir = path.resolve(__dirname, '..', 'backups');
  const backupFiles = fs.readdirSync(backupDir).filter(f => f.startsWith('backup-before-p0-sync-'));
  backupFiles.sort().reverse();
  if (backupFiles.length === 0) {
    throw new Error('Chưa có file sao lưu an toàn! Dừng migration ngay lập tức.');
  }
  const latestBackupPath = path.join(backupDir, backupFiles[0]);
  console.log(`✓ Đã xác minh file sao lưu dự phòng: ${latestBackupPath}`);
  const backupData = JSON.parse(fs.readFileSync(latestBackupPath, 'utf8'));

  // 2. Plan updates
  console.log('\n--- KẾ HOẠCH CẬP NHẬT (MIGRATION PLAN) ---');

  // 2.1 Academic Year 2026 - 2027
  const year2026Doc = {
    id: 'year-2026-2027',
    name: 'Năm học 2026 - 2027',
    isCurrent: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataOrigin: 'real',
    environmentTag: 'production'
  };
  console.log('1. Tạo/Cập nhật document [academicYears/year-2026-2027]:', year2026Doc);

  // 2.2 Revert Academic Year 2024 - 2025 to original name and archive
  const year2024Update = {
    name: 'Năm học 2024 - 2025',
    isCurrent: false,
    status: 'archived',
    updatedAt: new Date().toISOString()
  };
  console.log('2. Cập nhật document [academicYears/year-2024-2025] (Lưu trữ lịch sử):', year2024Update);

  // 2.3 Update 4 official classes to year-2026-2027
  const classIds = ['class-1a', 'class-1b', 'class-2a', 'class-2b'];
  console.log(`3. Cập nhật trường academicYearId -> "year-2026-2027" cho ${classIds.length} lớp học: ${classIds.join(', ')}`);

  // 2.4 Update 48 official students' schoolYearId
  const officialStudents = backupData.users.filter((u: any) =>
    u.role === 'student' && /^(HS1A|HS1B|HS2A|HS2B)\d{2}$/.test(u.studentCode || '')
  );
  console.log(`4. Cập nhật trường schoolYearId -> "year-2026-2027" cho ${officialStudents.length} học sinh chính khóa`);

  if (!isApply) {
    console.log('\n----------------------------------------------------------------');
    console.log(' KẾT QUẢ DRY-RUN: HỢP LỆ VÀ SẴN SÀNG THI HÀNH.');
    console.log(' Để thực hiện ghi dữ liệu, hãy chạy lại với tham số: --apply');
    console.log('----------------------------------------------------------------\n');
    return;
  }

  // --- APPLY WRITES ---
  assertSafeEnvironment('migrate_academic_year_2026_2027.ts', 'Thực thi migration ghi niên khóa');
  console.log('\n--- THỰC THI GHI DỮ LIỆU CLOUD FIRESTORE ---');
  const batch = writeBatch(db);

  // Write year-2026-2027
  batch.set(doc(db, 'academicYears', 'year-2026-2027'), year2026Doc, { merge: true });

  // Update year-2024-2025
  batch.update(doc(db, 'academicYears', 'year-2024-2025'), year2024Update);

  // Update classes
  for (const cid of classIds) {
    batch.update(doc(db, 'classes', cid), {
      academicYearId: 'year-2026-2027',
      updatedAt: new Date().toISOString()
    });
  }

  // Update 48 students in batch
  for (const st of officialStudents) {
    const studentDocId = st.id || st._id;
    batch.update(doc(db, 'users', studentDocId), {
      schoolYearId: 'year-2026-2027',
      updatedAt: new Date().toISOString()
    });
  }

  // Write migration record into auditLogs
  const migrationLog = {
    id: `log-migration-${Date.now()}`,
    action: 'MIGRATE_ACADEMIC_YEAR_2026_2027',
    actorId: 'admin-migration-script',
    actorName: 'Chủ sở hữu hệ thống',
    actorRole: 'admin',
    targetCollection: 'academicYears',
    targetId: 'year-2026-2027',
    targetName: 'Năm học 2026 - 2027',
    details: `Chuẩn hóa năm học 2026–2027 hiện hành, lưu trữ năm 2024–2025, cập nhật 4 lớp và 48 học sinh`,
    timestamp: new Date().toISOString(),
    dataOrigin: 'real',
    environmentTag: 'production',
    metadata: {
      version: 1,
      classesUpdated: classIds.length,
      studentsUpdated: officialStudents.length,
      backupSource: latestBackupPath,
    }
  };
  batch.set(doc(db, 'auditLogs', migrationLog.id), migrationLog);

  await batch.commit();
  console.log('✓ BATCH COMMIT THÀNH CÔNG! Đã cập nhật xong Cloud Firestore.');

  // Verify post-migration state
  console.log('\n--- XÁC THỰC SAU MIGRATION ---');
  const y26Snap = await getDoc(doc(db, 'academicYears', 'year-2026-2027'));
  const y24Snap = await getDoc(doc(db, 'academicYears', 'year-2024-2025'));
  console.log('Academic Year 2026-2027:', y26Snap.data());
  console.log('Academic Year 2024-2025:', y24Snap.data());
}

runMigration().catch(err => {
  console.error('Lỗi Migration:', err);
  process.exit(1);
});
