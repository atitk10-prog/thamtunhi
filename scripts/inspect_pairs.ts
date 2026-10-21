import fs from 'fs';

const data = JSON.parse(fs.readFileSync('audit_curriculum_result.json', 'utf8'));

console.log('=== KIỂM TRA TẤT CẢ CÂU EXPRESSION_MATCH ===');
let totalMatches = 0;
let hasDuplicates = 0;

for (const row of data.auditRows) {
  for (const q of row.questions) {
    if (q.interactionType === 'expression_match') {
      totalMatches++;
      const lefts = (q.pairs || []).map((p: any) => p.left);
      const rights = (q.pairs || []).map((p: any) => p.right);
      
      const uniqueLefts = new Set(lefts);
      const uniqueRights = new Set(rights);

      const hasDupLeft = uniqueLefts.size !== lefts.length;
      const hasDupRight = uniqueRights.size !== rights.length;

      if (hasDupLeft || hasDupRight) {
        hasDuplicates++;
        console.log(`[TRÙNG LẶP] ${row.id} C${q.order}:`);
        console.log('  Pairs:', q.pairs);
      } else {
        console.log(`[OK] ${row.id} C${q.order} (${q.pairs.length} cặp): ${lefts.join(' | ')} -> ${rights.join(' | ')}`);
      }
    }
  }
}

console.log(`\nTổng số câu expression_match: ${totalMatches}`);
console.log(`Số câu có thẻ trùng lặp giá trị: ${hasDuplicates}`);
