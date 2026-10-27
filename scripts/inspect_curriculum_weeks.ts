import path from 'path';
import fs from 'fs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { CURRICULUM_DATA } from '../src/data/curriculumData.ts';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspect() {
  console.log('================================================================');
  console.log('RÀ SOÁT PHÂN LOẠI BÀI HỌC VÀ TIẾN ĐỘ DẠY HỌC LỚP 1 NĂM 2026-2027');
  console.log('================================================================\n');

  // 1. Phân tích CURRICULUM_DATA cục bộ (toàn bộ các bài Lớp 1)
  console.log('--- 1. DANH SÁCH BÀI HỌC LỚP 1 TRONG CURRICULUM_DATA ---');
  CURRICULUM_DATA.forEach(item => {
    if (item.lesson.grade === 1) {
      console.log(`[${item.lesson.id}] Week: ${item.lesson.week} | Title: "${item.lesson.title}" | Topic: "${item.lesson.topic}" | Questions: ${item.questions.length}`);
    }
  });

  // 2. Phân tích Firestore Lessons
  console.log('\n--- 2. DANH SÁCH BÀI HỌC LỚP 1 TRONG CLOUD FIRESTORE ---');
  const lessonsSnap = await getDocs(collection(db, 'lessons'));
  const lessonsMap = new Map<string, any>();
  lessonsSnap.forEach(d => {
    const data = d.data();
    lessonsMap.set(d.id, data);
    if (data.grade === 1 || data.grade === '1' || d.id.startsWith('lesson-g1-') || d.id === 'lesson-draft-1792910089741') {
      console.log(`[${d.id}] Week: ${data.week} | Title: "${data.title}" | Topic: "${data.topic}" | ActiveVersion: ${data.activeVersionId}`);
    }
  });

  // 3. Phân tích các đợt giao bài (Assignments)
  console.log('\n--- 3. TOÀN BỘ ĐỢT GIAO BÀI TRONG FIRESTORE ---');
  const assignmentsSnap = await getDocs(collection(db, 'assignments'));
  console.log(`Tổng số assignments: ${assignmentsSnap.size}`);

  const assignmentsList: any[] = [];
  assignmentsSnap.forEach(d => {
    const asg = d.data();
    const l = lessonsMap.get(asg.lessonId);
    assignmentsList.push({
      id: d.id,
      classId: asg.classId || asg.assignedTo,
      lessonId: asg.lessonId,
      lessonTitle: l?.title || 'Unknown',
      lessonWeek: l?.week,
      status: asg.status,
      dueDate: asg.dueDate,
      assignedAt: asg.assignedAt,
      assignedBy: asg.assignedBy || asg.teacherId
    });
  });

  console.log('\n* Danh sách bài giao cho LỚP 1B (Cô Hà Thị Xuân Nương):');
  const b1Assignments = assignmentsList.filter(a => a.classId === 'class-1b');
  b1Assignments.forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.id}] Bài: "${a.lessonTitle}" (${a.lessonId}) | Tuần bài học: ${a.lessonWeek} | Hạn: ${a.dueDate} | Trạng thái: ${a.status}`);
  });

  console.log('\n* Danh sách bài giao cho các lớp Lớp 1 khác (class-1a, v.v.):');
  const otherG1 = assignmentsList.filter(a => a.classId !== 'class-1b' && (a.classId?.includes('1') || a.lessonTitle.includes('Lớp 1') || a.lessonId.startsWith('lesson-g1')));
  otherG1.forEach((a, i) => {
    console.log(`  ${i + 1}. Lớp: ${a.classId} | [${a.id}] Bài: "${a.lessonTitle}" (${a.lessonId}) | Tuần: ${a.lessonWeek} | Trạng thái: ${a.status}`);
  });

  // 4. Kiểm tra các phiên bản bài học mà script sanitize_all_hints đã tác động
  console.log('\n--- 4. KIỂM TRA TÁC ĐỘNG CỦA SCRIPT CHỈNH GỢI Ý ---');
  const TARGET_VERSIONS = [
    'version-lesson-g1-01-v1',
    'version-lesson-g1-01-v2',
    'version-lesson-g1-01-v2-draft',
    'version-lesson-g1-02-v1',
    'version-lesson-g1-02-v1-draft',
    'version-lesson-g1-03-v1',
    'version-lesson-g1-03-v1-draft',
    'version-lesson-g1-04-v1',
    'version-lesson-g1-07-v1',
    'version-lesson-g1-08-v1',
    'version-lesson-g1-09-v1',
    'version-lesson-draft-1792910089741-v4',
  ];

  const attemptsSnap = await getDocs(collection(db, 'attempts'));
  const attemptsByVersion = new Map<string, number>();
  attemptsSnap.forEach(d => {
    const vId = d.data().lessonVersionId;
    attemptsByVersion.set(vId, (attemptsByVersion.get(vId) || 0) + 1);
  });

  for (const vId of TARGET_VERSIONS) {
    const snap = await getDoc(doc(db, 'lessonVersions', vId));
    const attCount = attemptsByVersion.get(vId) || 0;
    console.log(`Phiên bản [${vId}]: Tồn tại = ${snap.exists()}, Số bài nộp của học sinh = ${attCount}`);
  }

  // Kiểm tra phiên bản gốc v2 của bài tập 1-5 lớp 1B
  const v2Snap = await getDoc(doc(db, 'lessonVersions', 'version-lesson-draft-1792910089741-v2'));
  console.log(`Phiên bản gốc v2 [version-lesson-draft-1792910089741-v2]: Tồn tại = ${v2Snap.exists()}, Số bài nộp của học sinh = ${attemptsByVersion.get('version-lesson-draft-1792910089741-v2') || 0}`);
}

inspect().catch(console.error);
