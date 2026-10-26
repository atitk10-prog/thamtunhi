import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { normalizeMathTextForSpeech, getAudioHash, synthesizeVietnameseSpeech } from '../src/lib/vietnameseTtsServer.ts';

const cfg = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = getApps().length === 0 ? initializeApp(cfg) : getApp();
const db = getFirestore(app, cfg.firestoreDatabaseId);

const TARGET_VERSIONS = [
  'version-lesson-g1-01-v1',
  'version-lesson-g1-01-v2',
  'version-lesson-g1-02-v1',
  'version-lesson-g1-03-v1',
  'version-lesson-g1-05-v1',
  'version-lesson-draft-1792910089741-v2',
  'version-lesson-draft-1792910089741-v3'
];

const AUDIO_DIR = path.resolve('public', 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

async function getOrGenerateAudio(normalizedText: string, prefix: 'q' | 'h'): Promise<{ filename: string; audioUrl: string; bytes: number; reused: boolean }> {
  const hash = getAudioHash(normalizedText);
  const filename = `${prefix}_${hash}.mp3`;
  const filePath = path.join(AUDIO_DIR, filename);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.size > 500) {
      return {
        filename,
        audioUrl: `/audio/${filename}`,
        bytes: stats.size,
        reused: true
      };
    }
  }

  // Generate TTS
  console.log(`   [TTS SYNTH] (${prefix.toUpperCase()}) "${normalizedText.substring(0, 50)}..."`);
  const buf = await synthesizeVietnameseSpeech(normalizedText);
  fs.writeFileSync(filePath, buf);
  // Polite pause
  await new Promise(r => setTimeout(r, 120));

  return {
    filename,
    audioUrl: `/audio/${filename}`,
    bytes: buf.length,
    reused: false
  };
}

async function main() {
  console.log('========================================================================');
  console.log('   TẠO TỆP ÂM THANH TIẾNG VIỆT & CẬP NHẬT KHO BÀI HỌC LỚP 1 TUẦN 1–9');
  console.log('========================================================================\n');

  let totalQuestionsCount = 0;
  let totalPromptsSynthesized = 0;
  let totalHintsSynthesized = 0;
  let totalBytesWritten = 0;
  const versionSummary = [];

  for (const vId of TARGET_VERSIONS) {
    console.log(`\n>>> XỬ LÝ PHIÊN BẢN: ${vId}`);
    const vRef = doc(db, 'lessonVersions', vId);
    const vSnap = await getDoc(vRef);

    if (!vSnap.exists()) {
      console.warn(`   [CẢNH BÁO] Không tìm thấy phiên bản ${vId}`);
      continue;
    }

    const vData = vSnap.data();
    const questions = vData.questions || [];
    console.log(`   Tiêu đề bài: "${vData.title}" | Khối: ${vData.grade} | Số câu: ${questions.length}`);

    const updatedQuestions = [];
    let qAudioCount = 0;
    let hAudioCount = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      totalQuestionsCount++;

      // 1. Prompt Audio
      const spokenPrompt = normalizeMathTextForSpeech(q.prompt, q.options);
      const promptAudio = await getOrGenerateAudio(spokenPrompt, 'q');
      if (!promptAudio.reused) totalPromptsSynthesized++;
      totalBytesWritten += promptAudio.bytes;
      qAudioCount++;

      // 2. Hint Audio
      let hintAudioUrl = '';
      const primaryHint = q.ruleHints && q.ruleHints[0] ? q.ruleHints[0].hintText : '';
      if (primaryHint) {
        const spokenHint = normalizeMathTextForSpeech(primaryHint);
        const hintAudio = await getOrGenerateAudio(spokenHint, 'h');
        if (!hintAudio.reused) totalHintsSynthesized++;
        totalBytesWritten += hintAudio.bytes;
        hintAudioUrl = hintAudio.audioUrl;
        hAudioCount++;
      }

      // Update question record
      updatedQuestions.push({
        ...q,
        audioUrl: promptAudio.audioUrl,
        audioHash: getAudioHash(spokenPrompt),
        hintAudioUrl: hintAudioUrl || undefined,
        hintAudioHash: primaryHint ? getAudioHash(normalizeMathTextForSpeech(primaryHint)) : undefined
      });
    }

    // 3. Update lessonVersions in Firestore
    await updateDoc(vRef, {
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    });

    console.log(`   ✓ Đã cập nhật ${updatedQuestions.length} câu hỏi có audioUrl vào Firestore [${vId}]`);
    versionSummary.push({
      versionId: vId,
      title: vData.title,
      grade: vData.grade,
      questionsCount: updatedQuestions.length,
      promptsWithAudio: qAudioCount,
      hintsWithAudio: hAudioCount
    });
  }

  // Summary Report
  console.log('\n========================================================================');
  console.log('   KẾT QUẢ TỔNG KẾT TẠO TỆP ÂM THANH TIẾNG VIỆT TOÀN DIỆN');
  console.log('========================================================================');
  console.table(versionSummary);

  const manifest = {
    generatedAt: new Date().toISOString(),
    totalQuestions: totalQuestionsCount,
    totalAudioFilesOnDisk: fs.readdirSync(AUDIO_DIR).length,
    totalBytes: totalBytesWritten,
    versionSummary
  };
  fs.writeFileSync('scripts/audio_generation_manifest.json', JSON.stringify(manifest, null, 2));

  console.log(`\nTổng số câu hỏi được cấp âm thanh: ${totalQuestionsCount}`);
  console.log(`Tổng tệp âm thanh trong public/audio: ${manifest.totalAudioFilesOnDisk}`);
  console.log('Báo cáo lưu tại: scripts/audio_generation_manifest.json\n');
}

main().catch(console.error);
