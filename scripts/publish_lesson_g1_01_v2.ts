import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { assertSafeEnvironment } from './production_guard.ts';

// PRODUCTION GUARD: Strictly blocks execution against production database
assertSafeEnvironment('publish_lesson_g1_01_v2.ts', 'Tạo và xuất bản phiên bản bài học v2');

const cfgPath = path.resolve('./firebase-applet-config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(cfg) : getApp();
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function publishV2() {
  console.log('--- TẠO BẢN SỬA CÓ KIỂM SOÁT: version-lesson-g1-01-v2 ---');
  
  // 1. Read v1 untouched
  const v1Snap = await getDoc(doc(db, 'lessonVersions', 'version-lesson-g1-01-v1'));
  if (!v1Snap.exists()) {
    throw new Error('version-lesson-g1-01-v1 does not exist');
  }
  const v1Data = v1Snap.data();

  // Clone questions with pedadogical fixes
  const questionsV2 = v1Data.questions.map((q: any) => {
    // Q1: Count apples
    if (q.order === 1) {
      return {
        ...q,
        prompt: 'Thám tử Cáo nhìn thấy có bao nhiêu quả táo đỏ trên cây?',
        expectedAnswer: '4',
        explanation: 'Đếm lần lượt từng quả táo: 1, 2, 3, 4. Có tất cả 4 quả táo đỏ.',
        visualConfig: {
          type: 'counters',
          count: 4,
          iconName: 'apple'
        }
      };
    }

    // Q3: Comparison 4 stars vs 2 stars (No number in label to prevent answer disclosure)
    if (q.order === 3) {
      return {
        ...q,
        prompt: 'Quan sát hai nhóm ngôi sao và chọn dấu thích hợp (> , < , =) để so sánh:',
        expectedAnswer: '>',
        explanation: 'Nhóm bên trái có 4 ngôi sao, nhóm bên phải có 2 ngôi sao. Vì 4 nhiều hơn 2 nên 4 > 2.',
        visualConfig: {
          type: 'comparison',
          iconName: 'star',
          leftCount: 4,
          rightCount: 2,
          leftLabel: 'Nhóm A',
          rightLabel: 'Nhóm B'
        }
      };
    }

    // Q4: Match pairs with real object icons & no numbers in left labels
    if (q.order === 4) {
      return {
        ...q,
        prompt: 'Nối nhóm hình có số lượng tương ứng với chữ số đúng:',
        expectedAnswer: 'MATCHED_ALL',
        explanation: 'Đếm số lượng: 2 quả cam nối số 2, 5 bông hoa nối số 5, 1 chú thỏ nối số 1.',
        pairs: [
          { left: '🍊 🍊 (Quả cam)', right: 'Số 2' },
          { left: '🌸 🌸 🌸 🌸 🌸 (Bông hoa)', right: 'Số 5' },
          { left: '🐰 (Chú thỏ)', right: 'Số 1' }
        ]
      };
    }

    // Q5: Five frame with blue dots
    if (q.order === 5) {
      return {
        ...q,
        prompt: 'Khung 5 ô: Có mấy chấm tròn màu xanh đang có trong khung?',
        expectedAnswer: '5',
        explanation: 'Khung 5 ô đã được điền đầy đủ cả 5 chấm tròn màu xanh.',
        visualConfig: {
          type: 'ten_frame',
          count: 5,
          gridSize: 5,
          dotColor: 'blue',
          tens: 0,
          ones: 5
        }
      };
    }

    // Q6: Number line ordering with scrambled options
    if (q.order === 6) {
      return {
        ...q,
        prompt: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 3, 1, 4, 2',
        options: ['3', '1', '4', '2'],
        expectedAnswer: '1,2,3,4',
        explanation: 'Thứ tự từ bé đến lớn là: 1, 2, 3, 4.'
      };
    }

    return q;
  });

  const v2DocId = 'version-lesson-g1-01-v2';
  const v2DocData = {
    ...v1Data,
    id: v2DocId,
    versionNumber: 2,
    isPublished: true,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: questionsV2
  };

  // Write new version v2
  await setDoc(doc(db, 'lessonVersions', v2DocId), v2DocData);
  console.log('✓ Đã tạo thành công phiên bản mới:', v2DocId);

  // Update lesson-g1-01 pointer to v2
  await updateDoc(doc(db, 'lessons', 'lesson-g1-01'), {
    currentVersion: 2,
    currentVersionId: v2DocId,
    totalQuestions: 8,
    status: 'published',
    updatedAt: new Date().toISOString()
  });
  console.log('✓ Đã cập nhật bài học lesson-g1-01 trỏ sang currentVersionId:', v2DocId);
  console.log('✓ Phiên bản v1 (version-lesson-g1-01-v1) được giữ nguyên vẹn 100% để bảo toàn 133 attempts lịch sử.');
}

publishV2().catch(console.error);
