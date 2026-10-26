import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';
import { normalizeMathTextForSpeech, getAudioHash } from '../src/lib/vietnameseTts.js';
import { synthesizeVietnameseSpeech } from '../src/lib/vietnameseTtsServer.js';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const audioDir = path.resolve('public', 'audio');
const distAudioDir = path.resolve('dist', 'audio');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
if (!fs.existsSync(distAudioDir)) fs.mkdirSync(distAudioDir, { recursive: true });

async function ensureAudio(text: string, prefix: 'q' | 'h', options?: (string | number)[]): Promise<{ audioUrl: string; audioHash: string }> {
  const spoken = normalizeMathTextForSpeech(text, options);
  const hash = getAudioHash(spoken);
  const filename = `${prefix}_${hash}.mp3`;
  const pPath = path.join(audioDir, filename);
  const dPath = path.join(distAudioDir, filename);

  if (!fs.existsSync(pPath) || fs.statSync(pPath).size < 1000) {
    console.log(`Synthesizing audio for: "${spoken.substring(0, 50)}..." -> ${filename}`);
    const buf = await synthesizeVietnameseSpeech(spoken);
    fs.writeFileSync(pPath, buf);
    fs.writeFileSync(dPath, buf);
  } else if (!fs.existsSync(dPath)) {
    fs.copyFileSync(pPath, dPath);
  }

  return {
    audioUrl: `/audio/${filename}`,
    audioHash: hash,
  };
}

async function deployV4() {
  console.log('--- BẮT ĐẦU TẠO PHIÊN BẢN V4 CHO BÀI TẬP TOÁN: LUYỆN TẬP CÁC SỐ 1 2 3 4 5 ---');

  // Question 1: Đếm số lượng quả táo (4 quả)
  const q1Prompt = 'Bé hãy đếm xem có tất cả bao nhiêu quả táo trong hình nhé?';
  const q1Options = ['2', '3', '4', '5'];
  const q1Hint = 'Em hãy chỉ tay vào từng quả táo trên màn hình và đếm lần lượt thật cẩn thận, đừng bỏ sót quả nào nhé!';
  const q1Audio = await ensureAudio(q1Prompt, 'q', q1Options);
  const q1HintAudio = await ensureAudio(q1Hint, 'h');

  // Question 2: Bài toán chim trên cành (2 chim + 3 chim = 5 chim)
  const q2Prompt = 'Trên cành có 2 con chim, có thêm 3 con chim bay đến nữa. Hỏi có tất cả bao nhiêu con chim?';
  const q2Options = ['3', '4', '5', '2'];
  const q2Hint = 'Em hãy đếm số con chim ở nhóm thứ nhất, sau đó đếm tiếp nhóm thứ hai để biết có tất cả bao nhiêu con chim nhé!';
  const q2Audio = await ensureAudio(q2Prompt, 'q', q2Options);
  const q2HintAudio = await ensureAudio(q2Hint, 'h');

  // Question 3: So sánh 3 ... 5 (Dấu <)
  const q3Prompt = 'Bé hãy điền dấu thích hợp vào ô trống: 3 ... 5';
  const q3Options = ['>', '<', '='];
  const q3Hint = 'Nhóm bên trái có 3 ngôi sao, nhóm bên phải có 5 ngôi sao. Em hãy xem nhóm nào có ít ngôi sao hơn để chọn dấu phù hợp nhé!';
  const q3Audio = await ensureAudio(q3Prompt, 'q', q3Options);
  const q3HintAudio = await ensureAudio(q3Hint, 'h');

  // Question 4: Đếm củ cà rốt (5 củ cà rốt)
  const q4Prompt = 'Bé hãy đếm số lượng củ cà rốt có trong khung năm ô dưới đây nhé!';
  const q4Options = ['2', '3', '4', '5'];
  const q4Hint = 'Em hãy quan sát khung và đếm lần lượt từng củ cà rốt từ trái sang phải thật cẩn thận nhé!';
  const q4Audio = await ensureAudio(q4Prompt, 'q', q4Options);
  const q4HintAudio = await ensureAudio(q4Hint, 'h');

  const questions = [
    {
      id: 'q-math-1',
      order: 1,
      prompt: q1Prompt,
      options: q1Options,
      expectedAnswer: '4',
      acceptableAnswers: ['4'],
      interactionType: 'single_choice',
      difficulty: 'easy',
      skillTag: 'Luyện tập các số 1 2 3 4 5',
      visualConfig: {
        type: 'counters',
        iconName: 'apple',
        count: 4,
      },
      explanation: 'Bé đếm lần lượt từng quả táo từ trái qua phải: 1, 2, 3, 4. Vậy có tất cả 4 quả táo.',
      ruleHints: [
        {
          pattern: 'COUNTING_OFF_BY_ONE',
          hintText: q1Hint,
          visualActionGuidance: 'Chạm vào từng quả táo trên màn hình để đếm từ 1 trở đi.',
        },
      ],
      audioUrl: q1Audio.audioUrl,
      audioHash: q1Audio.audioHash,
      hintAudioUrl: q1HintAudio.audioUrl,
      hintAudioHash: q1HintAudio.audioHash,
    },
    {
      id: 'q-math-2',
      order: 2,
      prompt: q2Prompt,
      options: q2Options,
      expectedAnswer: '5',
      acceptableAnswers: ['5'],
      interactionType: 'single_choice',
      difficulty: 'medium',
      skillTag: 'Luyện tập các số 1 2 3 4 5',
      visualConfig: {
        type: 'addition',
        iconName: 'bird',
        leftCount: 2,
        rightCount: 3,
      },
      explanation: 'Nhóm thứ nhất có 2 con chim, nhóm thứ hai có 3 con chim. Gộp 2 và 3 được tất cả 5 con chim. Phép tính là: 2 + 3 = 5.',
      ruleHints: [
        {
          pattern: 'WORD_PROBLEM_WRONG_OPERATION',
          hintText: q2Hint,
          visualActionGuidance: 'Đếm số chim ở nhóm bên trái rồi đếm tiếp số chim ở nhóm bên phải.',
        },
      ],
      audioUrl: q2Audio.audioUrl,
      audioHash: q2Audio.audioHash,
      hintAudioUrl: q2HintAudio.audioUrl,
      hintAudioHash: q2HintAudio.audioHash,
    },
    {
      id: 'q-math-3',
      order: 3,
      prompt: q3Prompt,
      options: q3Options,
      expectedAnswer: '<',
      acceptableAnswers: ['<'],
      interactionType: 'operator_pick',
      difficulty: 'medium',
      skillTag: 'Luyện tập các số 1 2 3 4 5',
      visualConfig: {
        type: 'comparison',
        iconName: 'star',
        leftCount: 3,
        rightCount: 5,
      },
      explanation: 'Số 3 bé hơn số 5 vì 3 đứng trước 5 khi đếm số. Ta điền dấu bé hơn (<).',
      ruleHints: [
        {
          pattern: 'COMPARISON_INVERSION',
          hintText: q3Hint,
          visualActionGuidance: 'So sánh số lượng ngôi sao ở nhóm trái và nhóm phải.',
        },
      ],
      audioUrl: q3Audio.audioUrl,
      audioHash: q3Audio.audioHash,
      hintAudioUrl: q3HintAudio.audioUrl,
      hintAudioHash: q3HintAudio.audioHash,
    },
    {
      id: 'q-math-4',
      order: 4,
      prompt: q4Prompt,
      options: q4Options,
      expectedAnswer: '5',
      acceptableAnswers: ['5'],
      interactionType: 'single_choice',
      difficulty: 'medium',
      skillTag: 'Luyện tập các số 1 2 3 4 5',
      visualConfig: {
        type: 'counters',
        iconName: 'carrot',
        count: 5,
        gridSize: 5,
        dotColor: 'orange',
      },
      explanation: 'Khung có 5 ô và đều có củ cà rốt xếp ngay ngắn. Vậy có tất cả 5 củ cà rốt.',
      ruleHints: [
        {
          pattern: 'COUNTING_OFF_BY_ONE',
          hintText: q4Hint,
          visualActionGuidance: 'Đếm lần lượt từng ô trong khung từ trái sang phải.',
        },
      ],
      audioUrl: q4Audio.audioUrl,
      audioHash: q4Audio.audioHash,
      hintAudioUrl: q4HintAudio.audioUrl,
      hintAudioHash: q4HintAudio.audioHash,
    },
  ];

  // 1. Create version v4 doc in Firestore
  const v4Id = 'version-lesson-draft-1792910089741-v4';
  const v4Doc = {
    id: v4Id,
    lessonId: 'lesson-draft-1792910089741',
    versionNumber: 4,
    title: 'Bài tập Toán: Luyện tập các số 1 2 3 4 5',
    grade: 1,
    topic: 'Luyện tập các số 1 2 3 4 5',
    learningStandard: 'Rèn luyện kỹ năng nhận biết, đếm và so sánh các số trong phạm vi 5 theo chuẩn GDPT 2018',
    questions,
    isPublished: true,
    publishedAt: new Date().toISOString(),
    createdBy: 'user-1792533985096',
    dataOrigin: 'real',
    environmentTag: 'production',
  };

  await setDoc(doc(db, 'lessonVersions', v4Id), v4Doc);
  console.log(`[PASS] Đã tạo thành công phiên bản [${v4Id}] trong Firestore.`);

  // 2. Update lesson document
  await updateDoc(doc(db, 'lessons', 'lesson-draft-1792910089741'), {
    title: 'Bài tập Toán: Luyện tập các số 1 2 3 4 5',
    currentVersion: 4,
    currentVersionId: v4Id,
    totalQuestions: 4,
    topic: 'Luyện tập các số 1 2 3 4 5',
    description: 'Bài tập Toán rèn luyện nhận biết, đếm và so sánh các số từ 1 đến 5 chuẩn GDPT 2018.',
    updatedAt: new Date().toISOString(),
  });
  console.log(`[PASS] Đã cập nhật bài học [lesson-draft-1792910089741] sang currentVersion: 4 (${v4Id}).`);

  // 3. Update assignment
  await updateDoc(doc(db, 'assignments', 'assign-lesson-draft-1792910089741-class-1b-122978'), {
    title: '[Toán 1] Bài tập Toán: Luyện tập các số 1 2 3 4 5',
    lessonVersionId: v4Id,
    updatedAt: new Date().toISOString(),
  });
  console.log(`[PASS] Đã cập nhật bài giao [assign-lesson-draft-1792910089741-class-1b-122978] sang lessonVersionId: ${v4Id}.`);

  console.log('\n=== HOÀN TẤT TRIỂN KHAI PHIÊN BẢN V4: BẢO TOÀN V2, V3 VÀ KẾT QUẢ CŨ ===');
}

deployV4().catch(console.error);
