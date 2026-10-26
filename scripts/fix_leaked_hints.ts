import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { normalizeMathTextForSpeech, getAudioHash } from '../src/lib/vietnameseTts.js';
import { synthesizeVietnameseSpeech } from '../src/lib/vietnameseTtsServer.js';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const audioDir = path.resolve('public', 'audio');
const distAudioDir = path.resolve('dist', 'audio');

async function synthesizeHintAudio(text: string): Promise<{ audioUrl: string; audioHash: string }> {
  const spoken = normalizeMathTextForSpeech(text);
  const hash = getAudioHash(spoken);
  const filename = `h_${hash}.mp3`;
  const pPath = path.join(audioDir, filename);
  const dPath = path.join(distAudioDir, filename);

  if (!fs.existsSync(pPath) || fs.statSync(pPath).size < 1000) {
    console.log(`Synthesizing hint audio: "${spoken}" -> ${filename}`);
    const buf = await synthesizeVietnameseSpeech(spoken);
    fs.writeFileSync(pPath, buf);
    fs.writeFileSync(dPath, buf);
  } else if (!fs.existsSync(dPath)) {
    fs.copyFileSync(pPath, dPath);
  }

  return { audioUrl: `/audio/${filename}`, audioHash: hash };
}

async function fixHints() {
  console.log('--- BẮT ĐẦU SỬA CÁC MANH MỐI CÓ NGUY CƠ LỘ ĐÁP ÁN ---');

  const updates = [
    {
      versionIds: ['version-lesson-g1-01-v1', 'version-lesson-g1-01-v2'],
      questionId: 'q-g1-01-7',
      newHint: '"Thêm vào" tức là chúng mình gộp lại để làm phép tính cộng. Em hãy lấy 2 viên kẹo cộng thêm 1 viên kẹo nữa nhé!',
      visualGuidance: 'Đếm số kẹo ban đầu rồi đếm thêm số kẹo được tặng.',
    },
    {
      versionIds: ['version-lesson-g1-02-v1'],
      questionId: 'q-g1-02-7',
      newHint: 'Chim bay đi tức là bớt đi, chúng mình cần làm phép tính trừ. Em hãy lấy 7 chú chim bớt đi 2 chú chim nhé!',
      visualGuidance: 'Đếm số chim còn đậu trên cành sau khi 2 chú chim bay đi.',
    },
    {
      versionIds: ['version-lesson-g1-03-v1'],
      questionId: 'q-g1-03-8',
      newHint: 'Được tặng thêm tức là gộp lại để làm phép tính cộng. Em hãy lấy số hoa của Mai cộng với số hoa của Lan nhé!',
      visualGuidance: 'Đếm nhóm hoa thứ nhất rồi đếm tiếp nhóm hoa thứ hai.',
    },
    {
      versionIds: ['version-lesson-g1-05-v1'],
      questionId: 'q-g1-05-8',
      newHint: 'Ngôi nhà gồm có phần mái và phần thân. Em hãy đếm lần lượt từng hình xem có tất cả mấy hình nhé!',
      visualGuidance: 'Chỉ vào mái nhà hình tam giác rồi chỉ vào thân nhà hình vuông để đếm.',
    },
  ];

  for (const item of updates) {
    const audioRes = await synthesizeHintAudio(item.newHint);

    for (const vId of item.versionIds) {
      const snap = await getDoc(doc(db, 'lessonVersions', vId));
      if (!snap.exists()) continue;
      const data = snap.data();
      const questions: any[] = data.questions || [];

      let modified = false;
      questions.forEach((q) => {
        if (q.id === item.questionId) {
          if (!q.ruleHints || q.ruleHints.length === 0) {
            q.ruleHints = [{}];
          }
          q.ruleHints[0].hintText = item.newHint;
          if (item.visualGuidance) {
            q.ruleHints[0].visualActionGuidance = item.visualGuidance;
          }
          q.hintAudioUrl = audioRes.audioUrl;
          q.hintAudioHash = audioRes.audioHash;
          modified = true;
          console.log(`[PASS] Đã cập nhật manh mối cho câu [${q.id}] trong version [${vId}].`);
        }
      });

      if (modified) {
        await updateDoc(doc(db, 'lessonVersions', vId), { questions });
      }
    }
  }

  console.log('\n=== HOÀN TẤT CẬP NHẬT MANH MỐI: TUYỆT ĐỐI KHÔNG LỘ ĐÁP ÁN ===');
}

fixHints().catch(console.error);
