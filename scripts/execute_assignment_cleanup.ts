import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, collection, getDocs, setDoc } from 'firebase/firestore';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const cancelled5Ids = [
  'assign-class-1b-lesson-g1-06',
  'assign-class-2a-lesson-g2-03',
  'assign-class-2a-lesson-g2-04',
  'assign-class-2a-lesson-g2-05',
  'assign-class-2a-lesson-g2-06'
];

const archive1Id = 'assign-class-1b-lesson-g1-04';

const suspectAttemptIds = [
  'att-qa-comp2-1792974301023',
  'att-qa-inprog-1792974300044',
  'att-qa-lifecycle-1792974301613'
];

async function run() {
  console.log('=== 1. SAO LƯU 5 BẢN GHI GIAO BÀI ĐÃ HỦY VÀ BẢN GHI PHÉP TRỪ PHẠM VI 10 ===');
  
  const backupDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const assignmentsBackup: Record<string, any> = {};

  for (const id of [...cancelled5Ids, archive1Id]) {
    const snap = await getDoc(doc(db, 'assignments', id));
    if (snap.exists()) {
      assignmentsBackup[id] = snap.data();
      console.log(`Đã đọc bản ghi ${id}: status=${snap.data().status}, title="${snap.data().title}"`);
    } else {
      console.warn(`Không tìm thấy assignment ${id}`);
    }
  }

  const backupAssignmentsPath = path.join(backupDir, 'backup_assignments_20261026.json');
  fs.writeFileSync(backupAssignmentsPath, JSON.stringify(assignmentsBackup, null, 2), 'utf8');
  console.log(`ĐÃ LƯU BẢN SAO LƯU TẠI: ${backupAssignmentsPath}`);

  console.log('\n=== 2. SAO LƯU 3 ATTEMPTS KHẢ NGHI CỦA student-test-qa-studentportal-10 ===');
  const attemptsBackup: Record<string, any> = {};
  for (const id of suspectAttemptIds) {
    const snap = await getDoc(doc(db, 'attempts', id));
    if (snap.exists()) {
      attemptsBackup[id] = snap.data();
      console.log(`Đã đọc attempt ${id}: studentId=${snap.data().studentId}, score=${snap.data().score}`);
    } else {
      console.warn(`Không tìm thấy attempt ${id}`);
    }
  }
  const backupAttemptsPath = path.join(backupDir, 'backup_qa_3_attempts_20261026.json');
  fs.writeFileSync(backupAttemptsPath, JSON.stringify(attemptsBackup, null, 2), 'utf8');
  console.log(`ĐÃ LƯU BẢN SAO LƯU ATTEMPTS TẠI: ${backupAttemptsPath}`);

  console.log('\n=== 3. CẬP NHẬT LƯU TRỮ (ARCHIVE) ĐỢT GIAO assign-class-1b-lesson-g1-04 (YÊU CẦU A4) ===');
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'assignments', archive1Id), {
    status: 'archived',
    archivedAt: now,
    archiveReason: 'Lưu trữ đợt giao theo yêu cầu A4. Không tính vào tiến độ hiện tại, bảo lưu lịch sử làm bài.',
    updatedAt: now
  });
  console.log(`Đã cập nhật ${archive1Id} -> status: 'archived'`);

  console.log('\n=== 4. XÓA 5 BẢN GHI GIAO BÀI ĐÃ HỦY 0 LƯỢT NỘP KHỎI assignments (YÊU CẦU A3) ===');
  for (const id of cancelled5Ids) {
    await deleteDoc(doc(db, 'assignments', id));
    console.log(`Đã xóa khỏi collection 'assignments': ${id}`);
  }

  console.log('\n=== 5. CÁCH LY 3 ATTEMPTS CỦA student-test-qa-studentportal-10 KHỎI THỐNG KÊ (YÊU CẦU B4) ===');
  for (const id of suspectAttemptIds) {
    await updateDoc(doc(db, 'attempts', id), {
      dataOrigin: 'test',
      isArchivedTest: true,
      isOfficialRoster: false,
      status: 'archived',
      isolatedAt: now,
      isolateReason: 'Tài khoản thử nghiệm ngoài danh sách 12 học sinh chính thức. Cách ly khỏi thống kê theo yêu cầu B4.',
      updatedAt: now
    });
    console.log(`Đã cập nhật cách ly attempt: ${id} -> dataOrigin='test', isArchivedTest=true, status='archived'`);
  }

  console.log('\n=== 6. KIỂM TRA LẠI KHO HỌC LIỆU (YÊU CẦU A5: BẢO TOÀN KHO BÀI HỌC) ===');
  const lessonSnap = await getDocs(collection(db, 'lessons'));
  console.log(`Tổng số bài học trong collection 'lessons': ${lessonSnap.size} (Đảm bảo 100% không bị xóa)`);

  console.log('\n=== 7. GHI AUDIT LOG CHÍNH THỨC ===');
  const auditId = `audit-${Date.now()}-cleanup-assignments-and-roster`;
  await setDoc(doc(db, 'auditLogs', auditId), {
    id: auditId,
    action: 'CLEANUP_ASSIGNMENTS_AND_ROSTER_STATISTICS',
    actorId: 'user-1792533985096',
    actorName: 'Hà Thị Xuân Nương',
    actorRole: 'teacher',
    targetCollection: 'assignments',
    details: 'Chuẩn hóa danh sách giao bài và thống kê: Lưu trữ bài Phép trừ phạm vi 10 (A4), xóa 5 đợt giao 0 lượt nộp (A3), cách ly 3 attempts test (B4).',
    timestamp: now,
    dataOrigin: 'real',
    environmentTag: 'production'
  });
  console.log(`Đã ghi audit log: ${auditId}`);

  console.log('\n=== HOÀN TẤT THỰC HIỆN CÁC BƯỚC FIRESTORE THÀNH CÔNG ===');
}

run().catch(console.error);
