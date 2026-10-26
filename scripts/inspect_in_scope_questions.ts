import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function main() {
  console.log('=== INSPECTING IN-SCOPE QUESTIONS & HINTS ===\n');
  const inventory = [];

  for (const vId of TARGET_VERSIONS) {
    const vSnap = await getDoc(doc(db, 'lessonVersions', vId));
    if (!vSnap.exists()) {
      console.log(`[NOT FOUND] ${vId}`);
      continue;
    }
    const data = vSnap.data();
    console.log(`\n======================================================`);
    console.log(`VERSION: ${vId} | Title: "${data.title}" | Grade: ${data.grade} | Questions: ${data.questions?.length}`);
    console.log(`======================================================`);

    const qList = data.questions || [];
    qList.forEach((q, idx) => {
      const hint = q.ruleHints && q.ruleHints[0] ? q.ruleHints[0].hintText : '';
      console.log(`  [Q${idx + 1}] (${q.interactionType}) Prompt: "${q.prompt}"`);
      if (q.options) console.log(`       Options: ${JSON.stringify(q.options)}`);
      console.log(`       Expected: "${q.expectedAnswer}"`);
      console.log(`       Hint: "${hint}"`);
      inventory.push({
        versionId: vId,
        order: q.order || (idx + 1),
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        expectedAnswer: q.expectedAnswer,
        hint
      });
    });
  }

  fs.writeFileSync('scripts/in_scope_questions_manifest.json', JSON.stringify(inventory, null, 2));
  console.log(`\nTotal questions inventoried: ${inventory.length}`);
  console.log('Saved to scripts/in_scope_questions_manifest.json');
}

main().catch(console.error);
