import fs from 'fs';

const backup = JSON.parse(fs.readFileSync('./backup/firestore-backup-latest.json', 'utf8'));
const versions = backup.lessonVersions || [];

console.log('=== INSPECTING QUESTION VISUALS & COMPARISONS ===');

const comparisonQuestions: any[] = [];
const allVisuals: any[] = [];

for (const v of versions) {
  for (const q of (v.questions || [])) {
    if (q.interactionType === 'operator_pick' || q.prompt?.includes('so sánh') || q.expectedAnswer === '>' || q.expectedAnswer === '<' || q.expectedAnswer === '=') {
      comparisonQuestions.push({
        lessonId: v.lessonId,
        order: q.order,
        prompt: q.prompt,
        expectedAnswer: q.expectedAnswer,
        options: q.options,
        visualConfig: q.visualConfig,
        interactionType: q.interactionType
      });
    }
    if (q.visualConfig) {
      allVisuals.push({
        lessonId: v.lessonId,
        order: q.order,
        type: q.visualConfig.type,
        visualConfig: q.visualConfig
      });
    }
  }
}

console.log(`Found ${comparisonQuestions.length} comparison questions:`);
comparisonQuestions.forEach(cq => {
  console.log(`[${cq.lessonId} Q${cq.order}] Prompt: "${cq.prompt}"`);
  console.log(`   Type: ${cq.interactionType} | Expected: ${cq.expectedAnswer} | Options:`, cq.options);
  console.log(`   visualConfig:`, cq.visualConfig);
});

console.log('\n=== VISUAL CONFIG TYPES SUMMARY ===');
const typesCount: Record<string, number> = {};
allVisuals.forEach(av => {
  typesCount[av.type || 'none'] = (typesCount[av.type || 'none'] || 0) + 1;
});
console.table(typesCount);

console.log('\n=== ALL COUNTERS QUESTIONS ===');
for (const v of versions) {
  for (const q of (v.questions || [])) {
    if (q.visualConfig?.type === 'counters') {
      console.log(`[${v.lessonId} Q${q.order}] Prompt: "${q.prompt}"`);
      console.log('   visualConfig:', q.visualConfig);
      console.log('   interactionType:', q.interactionType, '| expected:', q.expectedAnswer);
    }
  }
}
