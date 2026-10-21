import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

async function patchCurriculumDefects() {
  console.log('=== SỬA CÁC LỖI KHO HỌC LIỆU VÀ CÂU HỎI TRONG NAMED FIRESTORE ===');
  const cfgPath = path.resolve('./firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  // 1. Patch lesson-g1-03 Q2: Add missing visualConfig
  console.log('\n1. Đang sửa lesson-g1-03 Câu 2: Thêm visualConfig cho lời dẫn bức tranh...');
  const vG1_03Ref = doc(db, 'lessonVersions', 'version-lesson-g1-03-v1');
  const snapG1_03 = await getDoc(vG1_03Ref);
  if (snapG1_03.exists()) {
    const data = snapG1_03.data();
    const questions = data.questions || [];
    const q2 = questions.find((q: any) => q.order === 2);
    if (q2) {
      q2.visualConfig = {
        type: 'word_story',
        storyText: '🎈 Có 5 quả bóng bay đỏ và 3 quả bóng bay xanh.'
      };
      await updateDoc(vG1_03Ref, { questions });
      console.log('   -> Đã cập nhật visualConfig cho lesson-g1-03 Q2!');
    }
  }

  // 2. Patch lesson-g1-04 Q4: Fix duplicate right value ('4')
  console.log('\n2. Đang sửa lesson-g1-04 Câu 4: Phép tính trùng kết quả 4...');
  const vG1_04Ref = doc(db, 'lessonVersions', 'version-lesson-g1-04-v1');
  const snapG1_04 = await getDoc(vG1_04Ref);
  if (snapG1_04.exists()) {
    const data = snapG1_04.data();
    const questions = data.questions || [];
    const q4 = questions.find((q: any) => q.order === 4);
    if (q4) {
      // Old: 7 - 3 -> 4, 10 - 6 -> 4, 8 - 2 -> 6
      // New: 7 - 3 -> 4, 9 - 4 -> 5, 8 - 2 -> 6 (distinct: 4, 5, 6)
      q4.pairs = [
        { left: '7 - 3', right: '4' },
        { left: '9 - 4', right: '5' },
        { left: '8 - 2', right: '6' }
      ];
      q4.explanation = '7 - 3 = 4, 9 - 4 = 5, 8 - 2 = 6.';
      await updateDoc(vG1_04Ref, { questions });
      console.log('   -> Đã cập nhật pairs phân biệt cho lesson-g1-04 Q4!');
    }
  }

  // 3. Patch lesson-g1-07 Q4: Fix duplicate right value ('16')
  console.log('\n3. Đang sửa lesson-g1-07 Câu 4: Phép tính trùng kết quả 16...');
  const vG1_07Ref = doc(db, 'lessonVersions', 'version-lesson-g1-07-v1');
  const snapG1_07 = await getDoc(vG1_07Ref);
  if (snapG1_07.exists()) {
    const data = snapG1_07.data();
    const questions = data.questions || [];
    const q4 = questions.find((q: any) => q.order === 4);
    if (q4) {
      // Old: 10 + 7 -> 17, 14 + 2 -> 16, 11 + 5 -> 16
      // New: 10 + 7 -> 17, 14 + 2 -> 16, 13 + 5 -> 18 (distinct: 17, 16, 18)
      q4.pairs = [
        { left: '10 + 7', right: '17' },
        { left: '14 + 2', right: '16' },
        { left: '13 + 5', right: '18' }
      ];
      q4.explanation = '10 + 7 = 17, 14 + 2 = 16, 13 + 5 = 18.';
      await updateDoc(vG1_07Ref, { questions });
      console.log('   -> Đã cập nhật pairs phân biệt cho lesson-g1-07 Q4!');
    }
  }

  // 4. Patch lesson-g2-01 Q4: Fix duplicate right value ('13')
  console.log('\n4. Đang sửa lesson-g2-01 Câu 4: Phép tính trùng kết quả 13...');
  const vG2_01Ref = doc(db, 'lessonVersions', 'version-lesson-g2-01-v1');
  const snapG2_01 = await getDoc(vG2_01Ref);
  if (snapG2_01.exists()) {
    const data = snapG2_01.data();
    const questions = data.questions || [];
    const q4 = questions.find((q: any) => q.order === 4);
    if (q4) {
      // Old: 9 + 7 -> 16, 8 + 5 -> 13, 7 + 6 -> 13
      // New: 9 + 7 -> 16, 8 + 5 -> 13, 7 + 8 -> 15 (distinct: 16, 13, 15)
      q4.pairs = [
        { left: '9 + 7', right: '16' },
        { left: '8 + 5', right: '13' },
        { left: '7 + 8', right: '15' }
      ];
      q4.explanation = '9 + 7 = 16, 8 + 5 = 13, 7 + 8 = 15.';
      await updateDoc(vG2_01Ref, { questions });
      console.log('   -> Đã cập nhật pairs phân biệt cho lesson-g2-01 Q4!');
    }
  }

  // 5. Patch lesson-g2-02 Q4: Fix duplicate right value ('7')
  console.log('\n5. Đang sửa lesson-g2-02 Câu 4: Phép tính trùng kết quả 7...');
  const vG2_02Ref = doc(db, 'lessonVersions', 'version-lesson-g2-02-v1');
  const snapG2_02 = await getDoc(vG2_02Ref);
  if (snapG2_02.exists()) {
    const data = snapG2_02.data();
    const questions = data.questions || [];
    const q4 = questions.find((q: any) => q.order === 4);
    if (q4) {
      // Old: 11 - 4 -> 7, 12 - 5 -> 7, 17 - 9 -> 8
      // New: 11 - 4 -> 7, 15 - 9 -> 6, 17 - 9 -> 8 (distinct: 7, 6, 8)
      q4.pairs = [
        { left: '11 - 4', right: '7' },
        { left: '15 - 9', right: '6' },
        { left: '17 - 9', right: '8' }
      ];
      q4.explanation = '11 - 4 = 7, 15 - 9 = 6, 17 - 9 = 8.';
      await updateDoc(vG2_02Ref, { questions });
      console.log('   -> Đã cập nhật pairs phân biệt cho lesson-g2-02 Q4!');
    }
  }

  // 6. Patch lesson-g2-04 Q4: Fix duplicate right value ('64')
  console.log('\n6. Đang sửa lesson-g2-04 Câu 4: Phép tính trùng kết quả 64...');
  const vG2_04Ref = doc(db, 'lessonVersions', 'version-lesson-g2-04-v1');
  const snapG2_04 = await getDoc(vG2_04Ref);
  if (snapG2_04.exists()) {
    const data = snapG2_04.data();
    const questions = data.questions || [];
    const q4 = questions.find((q: any) => q.order === 4);
    if (q4) {
      // Old: 46 + 18 -> 64, 57 + 24 -> 81, 35 + 29 -> 64
      // New: 46 + 18 -> 64, 57 + 24 -> 81, 35 + 38 -> 73 (distinct: 64, 81, 73)
      q4.pairs = [
        { left: '46 + 18', right: '64' },
        { left: '57 + 24', right: '81' },
        { left: '35 + 38', right: '73' }
      ];
      q4.explanation = '46 + 18 = 64, 57 + 24 = 81, 35 + 38 = 73.';
      await updateDoc(vG2_04Ref, { questions });
      console.log('   -> Đã cập nhật pairs phân biệt cho lesson-g2-04 Q4!');
    }
  }

  // 7. Patch lesson-g2-06 Q4: Fix duplicate right value ('Khối cầu')
  console.log('\n7. Đang sửa lesson-g2-06 Câu 4: Phân loại hình học trùng thẻ...');
  const vG2_06Ref = doc(db, 'lessonVersions', 'version-lesson-g2-06-v1');
  const snapG2_06 = await getDoc(vG2_06Ref);
  if (snapG2_06.exists()) {
    const data = snapG2_06.data();
    const questions = data.questions || [];
    const q4 = questions.find((q: any) => q.order === 4);
    if (q4) {
      // Distinct object and matching geometric category
      q4.pairs = [
        { left: 'Viên bi thủy tinh', right: 'Khối cầu (lăn được mọi hướng)' },
        { left: 'Hộp sữa lon hình trụ', right: 'Khối trụ (hai mặt đáy tròn phẳng)' },
        { left: 'Hộp quà vuông', right: 'Khối lập phương (6 mặt vuông bằng nhau)' }
      ];
      q4.explanation = 'Viên bi là khối cầu, hộp sữa lon là khối trụ, hộp quà vuông là khối lập phương.';
      await updateDoc(vG2_06Ref, { questions });
      console.log('   -> Đã cập nhật pairs phân biệt cho lesson-g2-06 Q4!');
    }
  }

  console.log('\n>>> ĐÃ HOÀN TẤT CẬP NHẬT 7 BÀI HỌC VỀ TRẠNG THÁI TOÀN HẢO! <<<');
}

patchCurriculumDefects().catch(err => {
  console.error('Patch failed:', err);
  process.exit(1);
});
