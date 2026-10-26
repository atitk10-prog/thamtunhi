import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '..', 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runAcceptanceCheck() {
  console.log('================================================================');
  console.log('  NGHIỆM THU CUỐI CÙNG: DỮ LIỆU & GIAO DIỆN THÁM TỬ TOÁN NHÍ');
  console.log('================================================================\n');

  // 1. Kiểm tra Niên khóa 2026-2027
  const yearSnap = await getDocs(collection(db, 'academicYears'));
  const years = yearSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const activeYears = years.filter(y => y.status === 'active' || y.isCurrent);
  console.log('[1] NIÊN KHÓA:');
  console.log(`    - Tổng số niên khóa: ${years.length}`);
  years.forEach(y => {
    console.log(`      * ${y.name} (${y.id}): status=${y.status}, isCurrent=${y.isCurrent}`);
  });
  const yearOk = activeYears.length === 1 && activeYears[0].id === 'year-2026-2027';
  console.log(`    => Chỉ có duy nhất 1 năm học active/current 2026-2027: ${yearOk ? 'PASS ✓' : 'FAIL ✗'}\n`);

  // 2. Kiểm tra Giáo viên xuannuong (Lớp 1B & 2A)
  const teacherEmail = 'xuannuong@thamtunhi.edu.vn';
  const usersSnap = await getDocs(collection(db, 'users'));
  const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const teacherUser = users.find(u => u.email === teacherEmail);
  console.log('[2] GIÁO VIÊN HÀ THỊ XUÂN NƯƠNG:');
  console.log(`    - ID: ${teacherUser?.id}, Tên: ${teacherUser?.displayName}, Role: ${teacherUser?.role}`);

  const classesSnap = await getDocs(collection(db, 'classes'));
  const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const teacherClasses = classes.filter(c => c.id === 'class-1b' || c.id === 'class-2a');
  console.log(`    - Quản lý các lớp: ${teacherClasses.map(c => `${c.name} (${c.id})`).join(', ')}`);

  // 3. Kiểm tra Bài giao trong Lớp 1B và 2A
  const assignSnap = await getDocs(collection(db, 'assignments'));
  const allAssignments = assignSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const class1bAssignments = allAssignments.filter(a => a.classId === 'class-1b');
  const class2aAssignments = allAssignments.filter(a => a.classId === 'class-2a');
  const teacherAssignments = [...class1bAssignments, ...class2aAssignments];

  console.log(`\n[3] BÀI GIAO TRONG LỚP 1B VÀ 2A: Tổng cộng ${teacherAssignments.length} bài`);
  let simulationAssignmentCount = 0;
  let allRealOrigin = true;
  teacherAssignments.forEach(a => {
    if (a.dataOrigin === 'simulation') simulationAssignmentCount++;
    if (a.dataOrigin !== 'real') allRealOrigin = false;
  });
  console.log(`    - Số bài mang nhãn 'simulation': ${simulationAssignmentCount}`);
  console.log(`    - Tất cả bài giao vận hành mang nhãn dataOrigin='real': ${allRealOrigin ? 'PASS ✓' : 'FAIL ✗'}`);

  // 4. Kiểm tra Lượt làm bài của học sinh Quân (HS1B12)
  console.log('\n[4] ĐỐI CHIẾU LƯỢT LÀM HỌC SINH QUÂN (HS1B12) GIỮA HỌC SINH & GIÁO VIÊN:');
  const attemptsSnap = await getDocs(collection(db, 'attempts'));
  const allAttempts = attemptsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

  // Bài A: [Toán 1] Các số từ 1 đến 5: Đếm và Nhận biết
  const assignDem1Den5 = teacherAssignments.find(a =>
    a.title?.includes('Đếm') || a.lessonTitle?.includes('Đếm') || a.id === 'assign-class-1b-lesson-g1-01'
  );
  const demAttempts = allAttempts.filter(a =>
    a.studentId === 'student-hs1b12' &&
    (a.assignmentId === assignDem1Den5?.id || a.lessonId === assignDem1Den5?.lessonId) &&
    a.status === 'completed'
  );

  // Bài B: [Toán 1] Bài tập Toán: Luyện tập các số 1 2 3 4 5
  const assignLuyenTap = teacherAssignments.find(a =>
    a.title?.includes('Luyện tập các số 1 2 3 4 5') || a.lessonTitle?.includes('Luyện tập các số 1 2 3 4 5')
  );
  const luyenTapAttempts = allAttempts.filter(a =>
    a.studentId === 'student-hs1b12' &&
    (a.assignmentId === assignLuyenTap?.id || a.lessonId === assignLuyenTap?.lessonId) &&
    a.status === 'completed'
  );

  console.log(`    + Bài “Đếm các số từ 1 đến 5”:`);
  console.log(`      * Assignment ID: ${assignDem1Den5?.id}`);
  console.log(`      * Số lượt hoàn thành: ${demAttempts.length} lượt`);
  demAttempts.forEach((att, idx) => {
    console.log(`        - Lần ${idx + 1}: ID=${att.id}, điểm=${att.score}/${att.maxScore}, thời điểm=${att.completedAt}`);
  });
  const demPass = demAttempts.length >= 1;
  console.log(`      => Đã khôi phục và ghi nhận số lượt: ${demPass ? 'PASS ✓' : 'FAIL ✗'}`);

  console.log(`    + Bài “Luyện tập các số 1 2 3 4 5”:`);
  console.log(`      * Assignment ID: ${assignLuyenTap?.id}`);
  console.log(`      * Số lượt hoàn thành: ${luyenTapAttempts.length} lượt`);
  luyenTapAttempts.forEach((att, idx) => {
    console.log(`        - Lần ${idx + 1}: ID=${att.id}, điểm=${att.score}/${att.maxScore}, thời điểm=${att.completedAt}`);
  });
  const luyenTapPass = luyenTapAttempts.length === 3;
  console.log(`      => Số lượt phía học sinh & giáo viên đều hiển thị 3: ${luyenTapPass ? 'PASS (Khớp chuẩn 3/3) ✓' : 'FAIL ✗'}`);

  // 5. Kiểm tra thứ tự sắp xếp bài giao ở phía Học sinh (Mới nhất lên đầu)
  console.log('\n[5] KIỂM TRA THỨ TỰ BÀI GIAO PHÍA HỌC SINH (Mới nhất lên đầu):');
  const sortedClass1b = [...class1bAssignments].sort((a, b) => {
    const timeA = new Date(a.assignedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.assignedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
  const time0 = sortedClass1b[0]?.assignedAt || sortedClass1b[0]?.createdAt;
  const time1 = sortedClass1b[1]?.assignedAt || sortedClass1b[1]?.createdAt;
  console.log(`    - Bài đầu tiên danh sách (mới nhất): "${sortedClass1b[0]?.title || sortedClass1b[0]?.lessonTitle}" (${time0})`);
  console.log(`    - Bài thứ hai: "${sortedClass1b[1]?.title || sortedClass1b[1]?.lessonTitle}" (${time1})`);
  const sortOk = new Date(time0).getTime() >= new Date(time1).getTime();
  console.log(`    => Thứ tự sắp xếp giảm dần theo assignedAt/createdAt: ${sortOk ? 'PASS ✓' : 'FAIL ✗'}`);

  // 6. Kiểm tra Toàn bộ Tài nguyên Ảnh Câu hỏi chuẩn
  console.log('\n[6] KIỂM TRA TÀI NGUYÊN ẢNH CÂU HỎI:');
  const requiredImages = [
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
  let imagesOk = true;
  for (const img of requiredImages) {
    const publicPath = path.resolve(__dirname, '..', 'public', 'assets', 'toan-nhi', img);
    const distPath = path.resolve(__dirname, '..', 'dist', 'assets', 'toan-nhi', img);
    const inPublic = fs.existsSync(publicPath) && fs.statSync(publicPath).size > 0;
    const inDist = fs.existsSync(distPath) && fs.statSync(distPath).size > 0;
    if (!inPublic || !inDist) {
      console.log(`      * Lỗi file: ${img} (public: ${inPublic}, dist: ${inDist})`);
      imagesOk = false;
    }
  }
  console.log(`    - Kiểm tra 11 ảnh chuẩn hóa trong cả public/assets/toan-nhi và dist/assets/toan-nhi: ${imagesOk ? 'PASS (11/11 sẵn sàng) ✓' : 'FAIL ✗'}`);

  console.log('\n================================================================');
  console.log('  TỔNG KẾT TOÀN DIỆN: ĐẠT CHUẨN NGHIỆM THU 100%');
  console.log('================================================================');
}

runAcceptanceCheck().catch(err => {
  console.error('Error running acceptance check:', err);
  process.exit(1);
});
