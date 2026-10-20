import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { CURRICULUM_DATA } from './src/data/curriculumData.ts';

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function runSeed() {
  console.log('--- KHỞI TẠO DỮ LIỆU SEED CLOUD FIRESTORE THẬT ---');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Database ID:', firebaseConfig.firestoreDatabaseId);

  // 1. Academic Year
  await setDoc(doc(db, 'academicYears', 'year-2024-2025'), {
    id: 'year-2024-2025',
    name: 'Năm học 2024 - 2025',
    isCurrent: true,
    createdAt: new Date().toISOString(),
    dataOrigin: 'simulation',
    environmentTag: 'demo',
  });

  // 2. Admin
  await setDoc(doc(db, 'users', 'admin-demo'), {
    id: 'admin-demo',
    role: 'admin',
    displayName: 'Ban Quản Trị Hệ Thống',
    email: 'admin@thamtutoannhi.edu.vn',
    password: 'AdminBaoMat@123',
    createdAt: new Date().toISOString(),
    dataOrigin: 'simulation',
    environmentTag: 'demo',
  });

  // 3. 2 Teachers
  const teachersList = [
    { id: 'teacher-1', name: 'Cô Mai Lan (Khối 1)', email: 'giaovien1@thamtutoannhi.edu.vn', pass: 'MatKhauGiaoVien@123' },
    { id: 'teacher-2', name: 'Thầy Quốc Huy (Khối 2)', email: 'giaovien2@thamtutoannhi.edu.vn', pass: 'MatKhauGiaoVien@123' },
  ];
  for (const t of teachersList) {
    await setDoc(doc(db, 'users', t.id), {
      id: t.id,
      role: 'teacher',
      displayName: t.name,
      email: t.email,
      password: t.pass,
      createdAt: new Date().toISOString(),
      dataOrigin: 'simulation',
      environmentTag: 'demo',
    });
  }

  // 4. 4 Classes: 1A, 1B, 2A, 2B
  const classesList = [
    { id: 'class-1a', name: '1A', grade: 1, teacherId: 'teacher-1', studentCount: 12 },
    { id: 'class-1b', name: '1B', grade: 1, teacherId: 'teacher-1', studentCount: 12 },
    { id: 'class-2a', name: '2A', grade: 2, teacherId: 'teacher-2', studentCount: 12 },
    { id: 'class-2b', name: '2B', grade: 2, teacherId: 'teacher-2', studentCount: 12 },
  ];
  for (const c of classesList) {
    await setDoc(doc(db, 'classes', c.id), {
      id: c.id,
      name: c.name,
      grade: c.grade,
      academicYearId: 'year-2024-2025',
      teacherId: c.teacherId,
      studentCount: c.studentCount,
      createdAt: new Date().toISOString(),
      dataOrigin: 'simulation',
      environmentTag: 'demo',
    });
  }

  // 5. 48 Students (12 per class)
  const studentNamesG1 = ['An', 'Bình', 'Châu', 'Dũng', 'Hà', 'Khánh', 'Linh', 'Minh', 'Nam', 'Nhi', 'Phương', 'Quân'];
  const studentNamesG2 = ['Tuấn', 'Hương', 'Đức', 'Trang', 'Phúc', 'Việt', 'Lan', 'Tú', 'Thảo', 'Khoa', 'Yến', 'Long'];

  for (const c of classesList) {
    const names = c.grade === 1 ? studentNamesG1 : studentNamesG2;
    for (let i = 1; i <= 12; i++) {
      const paddedIdx = i < 10 ? `0${i}` : `${i}`;
      const code = `HS${c.name}${paddedIdx}`;
      const sId = `student-${code.toLowerCase()}`;
      await setDoc(doc(db, 'users', sId), {
        id: sId,
        role: 'student',
        displayName: `${names[i - 1]} (${c.name})`,
        studentCode: code,
        accessSecret: 'matkhau123',
        classId: c.id,
        className: c.name,
        grade: c.grade,
        schoolYearId: 'year-2024-2025',
        createdAt: new Date().toISOString(),
        dataOrigin: 'simulation',
        environmentTag: 'demo',
      });
    }
  }

  // 6. 24 Lessons & 192 Questions
  for (const item of CURRICULUM_DATA) {
    const versionId = `version-${item.lesson.id}-v1`;
    await setDoc(doc(db, 'lessonVersions', versionId), {
      id: versionId,
      lessonId: item.lesson.id,
      versionNumber: 1,
      title: item.lesson.title,
      grade: item.lesson.grade,
      topic: item.lesson.topic,
      learningStandard: item.lesson.learningStandard,
      questions: item.questions,
      isPublished: true,
      publishedAt: new Date().toISOString(),
      createdBy: item.lesson.grade === 1 ? 'teacher-1' : 'teacher-2',
      dataOrigin: 'simulation',
      environmentTag: 'demo',
    });

    await setDoc(doc(db, 'lessons', item.lesson.id), {
      ...item.lesson,
      createdBy: item.lesson.grade === 1 ? 'teacher-1' : 'teacher-2',
      createdAt: new Date().toISOString(),
      dataOrigin: 'simulation',
      environmentTag: 'demo',
    });
  }

  // 7. 24 Assignments
  const assignmentsCreated: string[] = [];
  for (let cIdx = 0; cIdx < classesList.length; cIdx++) {
    const cls = classesList[cIdx];
    const classLessons = CURRICULUM_DATA.filter((l) => l.lesson.grade === cls.grade).slice(0, 6);

    for (const lItem of classLessons) {
      const assignId = `assign-${cls.id}-${lItem.lesson.id}`;
      await setDoc(doc(db, 'assignments', assignId), {
        id: assignId,
        title: `[Toán ${cls.grade}] ${lItem.lesson.title}`,
        lessonId: lItem.lesson.id,
        lessonVersionId: `version-${lItem.lesson.id}-v1`,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        teacherId: cls.teacherId,
        dueDate: '2026-12-31',
        status: 'open',
        createdAt: new Date().toISOString(),
        dataOrigin: 'simulation',
        environmentTag: 'demo',
      });
      assignmentsCreated.push(assignId);
    }
  }

  // 8. 144 Attempts & Mistake Insights
  const errorPatternPool = [
    'COUNTING_OFF_BY_ONE',
    'WRONG_OPERATOR',
    'CROSS_TEN_ERROR',
    'PLACE_VALUE_SWAP',
    'COMPARISON_INVERSION',
    'NUMBER_ORDER_CONFUSION',
  ];

  for (let i = 0; i < 144; i++) {
    const classTarget = classesList[i % 4];
    const studentIdx = (i % 12) + 1;
    const code = `HS${classTarget.name}${studentIdx < 10 ? `0${studentIdx}` : studentIdx}`;
    const sId = `student-${code.toLowerCase()}`;
    const assignId = assignmentsCreated[i % assignmentsCreated.length];

    const isHighScorer = i % 3 === 0;
    const score = isHighScorer ? 80 : 60 + (i % 20);
    const firstTry = isHighScorer ? 8 : 5 + (i % 3);
    const postHint = 8 - firstTry;

    const attId = `att-demo-${i + 1}`;
    await setDoc(doc(db, 'attempts', attId), {
      id: attId,
      assignmentId: assignId,
      lessonId: `lesson-g${classTarget.grade}-01`,
      lessonVersionId: `version-lesson-g${classTarget.grade}-01-v1`,
      lessonTitle: `Bài luyện tập Toán Khối ${classTarget.grade}`,
      studentId: sId,
      studentName: `${code} (Học sinh)`,
      studentCode: code,
      classId: classTarget.id,
      status: 'completed',
      currentQuestionIndex: 8,
      score,
      maxScore: 80,
      firstAttemptCorrectCount: firstTry,
      postHintCorrectCount: postHint,
      totalAttemptsMade: 8 + postHint,
      startedAt: new Date(Date.now() - (144 - i) * 3600000).toISOString(),
      completedAt: new Date(Date.now() - (144 - i) * 3600000 + 900000).toISOString(),
      durationSeconds: 650 + (i % 300),
      dataOrigin: 'simulation',
      environmentTag: 'demo',
    });

    const assignedPattern = errorPatternPool[i % errorPatternPool.length];
    const insId = `ins-demo-${i + 1}`;
    await setDoc(doc(db, 'mistakeInsights', insId), {
      id: insId,
      studentId: sId,
      classId: classTarget.id,
      className: classTarget.name,
      grade: classTarget.grade,
      topic: 'Số và Phép tính',
      errorPattern: assignedPattern,
      errorCount: postHint,
      suggestedRemediation: 'Tập trung sử dụng que tính và khung 10 ô.',
      createdAt: new Date().toISOString(),
      dataOrigin: 'simulation',
      environmentTag: 'demo',
    });
  }

  // 9. Audit Log
  await setDoc(doc(db, 'auditLogs', `log-seed-init`), {
    id: 'log-seed-init',
    action: 'INITIAL_CLOUD_SEED',
    actorId: 'admin-demo',
    actorRole: 'admin',
    targetCollection: 'all',
    targetId: 'demo-dataset',
    details: 'Đã hoàn thành khởi tạo 1 Admin, 2 GV, 4 Lớp, 48 HS, 24 Bài GDPT 2018 (192 câu hỏi), 24 Đợt giao, 144 Lượt làm bài lên Cloud Firestore.',
    timestamp: new Date().toISOString(),
    dataOrigin: 'simulation',
    environmentTag: 'demo',
  });

  console.log('✓ HOÀN TẤT KHỞI TẠO 100% DỮ LIỆU LÊN CLOUD FIRESTORE!');
}

runSeed().catch(console.error);
