import { WEEKS_1_TO_9_SUPPLEMENTARY } from '../src/data/weeks1to9Curriculum';

console.log('=== CURRENT WEEKS 1 TO 9 SUPPLEMENTARY ===');
WEEKS_1_TO_9_SUPPLEMENTARY.forEach((item, idx) => {
  console.log(`${idx + 1}. [${item.lesson.id}] Grade ${item.lesson.grade} - Week ${item.lesson.week}: "${item.lesson.title}" (${item.questions.length} questions)`);
});
