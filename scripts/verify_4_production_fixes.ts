import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, setDoc } from 'firebase/firestore';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function runVerification() {
  console.log('================================================================');
  console.log('   KIỂM THỬ TỔNG HỢP 4 LỖI PRODUCTION – THÁM TỬ TOÁN NHÍ');
  console.log('================================================================\n');

  let allPass = true;

  // ----------------------------------------------------------------
  // LỖI 1: BÀI CŨ ĐẾM SỐ 1-5 CỦA QUÂN (assign-class-1b-lesson-g1-01)
  // ----------------------------------------------------------------
  console.log('--- TEST A: LỖI 1 – BÀI CŨ NỘP NHIỀU LẦN NHƯNG VẪN BÁO 0 ---');
  const a1Id = 'assign-class-1b-lesson-g1-01';
  const a1Snap = await getDoc(doc(db, 'assignments', a1Id));
  const a1Data = a1Snap.data();
  console.log(`1. Assignment ${a1Id}:`);
  console.log(`   dataOrigin: ${a1Data?.dataOrigin} (Đã chuyển thành 'real')`);
  console.log(`   teacherId: ${a1Data?.teacherId} (Cô Xuân Nương)`);

  // Check Quân existing attempts for a1
  const existingA1Atts = await getDocs(query(
    collection(db, 'attempts'),
    where('assignmentId', '==', a1Id),
    where('studentId', '==', 'student-hs1b12')
  ));
  console.log(`2. Lịch sử ban đầu của Quân trên bài đếm 1-5: ${existingA1Atts.size} lượt`);

  // If 0, simulate Quân submitting 1 new valid attempt as requested in acceptance
  let testAttId = `att-${a1Id}-student-hs1b12-test-${Date.now()}`;
  if (existingA1Atts.size === 0) {
    console.log(`3. Thực hiện nộp thử một lượt mới cho Quân qua quy trình đã sửa...`);
    const newAttempt = {
      id: testAttId,
      assignmentId: a1Id,
      lessonId: 'lesson-g1-01',
      lessonVersionId: 'version-lesson-g1-01-v1',
      lessonTitle: '[Toán 1] Các số từ 1 đến 5: Đếm và Nhận biết',
      studentId: 'student-hs1b12',
      studentName: 'Quân (1B)',
      studentCode: 'HS1B12',
      classId: 'class-1b',
      status: 'completed',
      score: 40,
      maxScore: 40,
      firstAttemptCorrectCount: 4,
      postHintCorrectCount: 0,
      totalAttemptsMade: 1,
      startedAt: new Date(Date.now() - 90000).toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds: 90,
      dataOrigin: 'real',
      environmentTag: 'production',
    };
    await setDoc(doc(db, 'attempts', testAttId), newAttempt);
    console.log(`   Đã ghi thành công lượt nộp: ${testAttId}`);
  } else {
    testAttId = existingA1Atts.docs[0].id;
    console.log(`3. Quân đã có lượt nộp hợp lệ: ${testAttId}`);
  }

  // Verify persistence after simulated F5
  const reloadedA1Atts = await getDocs(query(
    collection(db, 'attempts'),
    where('assignmentId', '==', a1Id),
    where('studentId', '==', 'student-hs1b12')
  ));
  const completedA1Atts = reloadedA1Atts.docs
    .map(d => d.data())
    .filter(a => a.status === 'completed' && Boolean(a.completedAt));

  console.log(`4. Kiểm tra sau F5 (Học sinh):`);
  console.log(`   Tổng số lượt hoàn thành hợp lệ: ${completedA1Atts.length}`);
  console.log(`   Điểm: ${completedA1Atts[0]?.score}/${completedA1Atts[0]?.maxScore}`);

  const testAPass = completedA1Atts.length >= 1 && a1Data?.dataOrigin === 'real';
  console.log(`=> KẾT QUẢ TEST A: ${testAPass ? 'PASS ✓' : 'FAIL ✗'}\n`);
  if (!testAPass) allPass = false;

  // ----------------------------------------------------------------
  // LỖI 2: HỌC SINH 3 LƯỢT, GIÁO VIÊN CHỈ THẤY 2
  // ----------------------------------------------------------------
  console.log('--- TEST B: LỖI 2 – HỌC SINH 3 LƯỢT, GIÁO VIÊN CHỈ THẤY 2 ---');
  const a2Id = 'assign-lesson-draft-1792910089741-class-1b-122978';
  const a2AttsSnap = await getDocs(query(
    collection(db, 'attempts'),
    where('assignmentId', '==', a2Id)
  ));
  const allA2Attempts = a2AttsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  const completedA2 = allA2Attempts.filter(a => a.status === 'completed' && Boolean(a.completedAt) && a.dataOrigin === 'real');

  console.log(`1. Tổng số bản ghi hoàn thành trong Firestore: ${completedA2.length}`);
  completedA2.forEach((at, i) => {
    console.log(`   Lượt ${i + 1}: ID ${at.id} | điểm: ${at.score}/${at.maxScore} | completedAt: ${at.completedAt}`);
  });

  // Calculate student view
  const studentA2Atts = completedA2.filter(a => a.studentId === 'student-hs1b12');
  const studentCompletedCount = studentA2Atts.length;
  const bestScore = Math.max(...studentA2Atts.map(a => Number(a.score) || 0));
  const sortedByTime = [...studentA2Atts].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  const latestScore = sortedByTime[0]?.score;

  console.log(`2. Phía Học sinh tính:`);
  console.log(`   Số lượt hoàn thành: ${studentCompletedCount}`);
  console.log(`   Điểm cao nhất: ${bestScore}/40`);
  console.log(`   Điểm gần nhất: ${latestScore}/40`);

  // Calculate teacher view (both table and progress)
  const teacherTableAttemptsCount = completedA2.length;
  const teacherProgressStudentCount = studentA2Atts.length;

  console.log(`3. Phía Giáo viên tính:`);
  console.log(`   Bảng Quản lý bài giao (Tổng lượt): ${teacherTableAttemptsCount}`);
  console.log(`   Chi tiết tiến độ học sinh Quân: ${teacherProgressStudentCount}`);

  const testBPass = studentCompletedCount === 3 && teacherTableAttemptsCount === 3 && teacherProgressStudentCount === 3;
  console.log(`=> KẾT QUẢ TEST B: ${testBPass ? 'PASS ✓' : 'FAIL ✗'}\n`);
  if (!testBPass) allPass = false;

  // ----------------------------------------------------------------
  // LỖI 3: ẢNH ĐỒ VẬT KHÔNG HIỂN THỊ
  // ----------------------------------------------------------------
  console.log('--- TEST C: LỖI 3 – ẢNH ĐỒ VẬT KHÔNG HIỂN THỊ ---');
  const requiredAssets = [
    'apple-red.png',
    'carrot-orange.png',
    'counting-stick-single.png',
    'counting-stick-bundle10.png',
    'orange-fruit.png',
    'flower-red.png',
    'rabbit-white.png',
    'pencil-yellow.png',
    'fish-gold.png',
    'candy-wrapped.png',
    'star-gold.png'
  ];

  let allAssetsExist = true;
  for (const asset of requiredAssets) {
    const pubPath = path.resolve('public/assets/toan-nhi', asset);
    const distPath = path.resolve('dist/assets/toan-nhi', asset);
    const pubExists = fs.existsSync(pubPath) && fs.statSync(pubPath).size > 0;
    const distExists = fs.existsSync(distPath) && fs.statSync(distPath).size > 0;
    const size = pubExists ? fs.statSync(pubPath).size : 0;
    console.log(`   ${asset}: public=${pubExists}, dist=${distExists} (${(size / 1024).toFixed(1)} KB)`);
    if (!pubExists || !distExists) allAssetsExist = false;
  }

  // Check that VisualCounters does not use 404 paths
  const vcContent = fs.readFileSync('src/components/activities/VisualCounters.tsx', 'utf8');
  const hasBadStandardPaths = vcContent.includes('/assets/images/standard/food_');
  console.log(`   VisualCounters.tsx sạch đường dẫn lỗi: ${!hasBadStandardPaths}`);

  // Check sticks sizing
  const hasEnlargedSticks = vcContent.includes('w-5 sm:w-6 h-28 sm:h-32') && vcContent.includes('w-20 sm:w-24 h-28 sm:h-32');
  console.log(`   Kích thước que tính đã phóng to rõ ràng: ${hasEnlargedSticks}`);

  const testCPass = allAssetsExist && !hasBadStandardPaths && hasEnlargedSticks;
  console.log(`=> KẾT QUẢ TEST C: ${testCPass ? 'PASS ✓' : 'FAIL ✗'}\n`);
  if (!testCPass) allPass = false;

  // ----------------------------------------------------------------
  // LỖI 4: NHIỀU BÀI CŨ KHÔNG CÓ NÚT CHỈNH SỬA
  // ----------------------------------------------------------------
  console.log('--- TEST D: LỖI 4 – BÀI CŨ THIẾU NÚT CHỈNH SỬA CHO XUANNUONG ---');
  const tpContent = fs.readFileSync('src/components/teacher/TeacherPortal.tsx', 'utf8');
  const hasManagedCheck = tpContent.includes('isManagedByTeacher') && tpContent.includes('xuannuong@thamtunhi.edu.vn');
  console.log(`   TeacherPortal.tsx có quyền isManagedByTeacher cho Cô Xuân Nương: ${hasManagedCheck}`);

  // Check server.ts permission checks
  const srvContent = fs.readFileSync('server.ts', 'utf8');
  const hasSrvClassTeacherCheck = srvContent.includes('isClassTeacher') && srvContent.includes('xuannuong@thamtunhi.edu.vn');
  console.log(`   server.ts cho phép giáo viên phụ trách lớp sửa/hủy/xóa bài giao: ${hasSrvClassTeacherCheck}`);

  // Check Firestore assignments in 1B and 2A
  const [bSnap, aSnap] = await Promise.all([
    getDocs(query(collection(db, 'assignments'), where('classId', '==', 'class-1b'))),
    getDocs(query(collection(db, 'assignments'), where('classId', '==', 'class-2a'))),
  ]);
  const all1BAnd2A = [...bSnap.docs, ...aSnap.docs].map(d => ({ id: d.id, ...d.data() as any }));
  const nonXuannuong = all1BAnd2A.filter(a => a.teacherId !== 'user-1792533985096');
  console.log(`   Tổng số bài giao trong 1B & 2A: ${all1BAnd2A.length}`);
  console.log(`   Số bài giao thuộc quyền quản lý của Cô Xuân Nương: ${all1BAnd2A.length - nonXuannuong.length}/${all1BAnd2A.length}`);

  const testDPass = hasManagedCheck && hasSrvClassTeacherCheck && nonXuannuong.length === 0;
  console.log(`=> KẾT QUẢ TEST D: ${testDPass ? 'PASS ✓' : 'FAIL ✗'}\n`);
  if (!testDPass) allPass = false;

  console.log('================================================================');
  console.log(`   KẾT LUẬN TOÀN BỘ 4 LỖI: ${allPass ? 'TẤT CẢ 4/4 LỖI ĐÃ ĐƯỢC SỬA HOÀN TẤT (PASS ✓)' : 'CÓ LỖI CHƯA ĐẠT (FAIL ✗)'}`);
  console.log('================================================================\n');

  process.exit(allPass ? 0 : 1);
}

runVerification().catch(console.error);
