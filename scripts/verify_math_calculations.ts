import fs from 'fs';

const data = JSON.parse(fs.readFileSync('audit_curriculum_result.json', 'utf8'));

console.log('=== TOÀN DIỆN KIỂM ĐỊNH TOÁN HỌC 24 BÀI (192 CÂU) ===\n');

let totalQuestions = 0;
const mathAnomalies: any[] = [];

for (const row of data.auditRows) {
  for (const q of row.questions) {
    totalQuestions++;
    const qLabel = `[${row.id} C${q.order}] (${q.interactionType})`;

    // 1. Check prompt calculation vs expectedAnswer for number_input
    if (q.interactionType === 'number_input') {
      // Find simple expressions like "3 + 4 = ?" or "15 - 7 = ?"
      const match = q.prompt.match(/(\d+)\s*([+\-×:])\s*(\d+)\s*=/);
      if (match) {
        const a = parseInt(match[1], 10);
        const op = match[2];
        const b = parseInt(match[3], 10);
        let expectedNum: number | null = null;
        if (op === '+') expectedNum = a + b;
        if (op === '-') expectedNum = a - b;
        if (op === '×') expectedNum = a * b;
        if (op === ':') expectedNum = Math.floor(a / b);

        const expAns = parseInt(q.expectedAnswer, 10);
        if (expectedNum !== null && !isNaN(expAns) && expectedNum !== expAns) {
          mathAnomalies.push({
            qLabel,
            prompt: q.prompt,
            calculated: expectedNum,
            expectedAnswer: q.expectedAnswer,
            type: 'ARITHMETIC_MISMATCH'
          });
        }
      }
    }

    // 2. Check operator_pick (comparison or calculation)
    if (q.interactionType === 'operator_pick') {
      // Check if prompt has "a ... b"
      const compMatch = q.prompt.match(/(\d+)\s*\.{2,}\s*(\d+)/);
      if (compMatch) {
        const a = parseInt(compMatch[1], 10);
        const b = parseInt(compMatch[2], 10);
        let correctOp = '=';
        if (a > b) correctOp = '>';
        if (a < b) correctOp = '<';

        if (['>', '<', '='].includes(q.expectedAnswer) && q.expectedAnswer !== correctOp) {
          mathAnomalies.push({
            qLabel,
            prompt: q.prompt,
            calculated: correctOp,
            expectedAnswer: q.expectedAnswer,
            type: 'OPERATOR_MISMATCH'
          });
        }
      }
    }

    // 3. Check single_choice expectedAnswer
    if (q.interactionType === 'single_choice') {
      if (!q.options || !q.options.includes(q.expectedAnswer)) {
        mathAnomalies.push({
          qLabel,
          prompt: q.prompt,
          expectedAnswer: q.expectedAnswer,
          options: q.options,
          type: 'OPTION_NOT_FOUND'
        });
      }
    }

    // 4. Check expression_match pairs calculations
    if (q.interactionType === 'expression_match' && q.pairs) {
      for (const pair of q.pairs) {
        // Test if pair.left has arithmetic like "6 + 2" and pair.right has "8"
        const leftMath = pair.left.match(/^(\d+)\s*([+\-×:])\s*(\d+)$/);
        if (leftMath) {
          const a = parseInt(leftMath[1], 10);
          const op = leftMath[2];
          const b = parseInt(leftMath[3], 10);
          let calc: number | null = null;
          if (op === '+') calc = a + b;
          if (op === '-') calc = a - b;
          if (op === '×') calc = a * b;
          if (op === ':') calc = Math.floor(a / b);

          const rNum = parseInt(pair.right, 10);
          if (calc !== null && !isNaN(rNum) && calc !== rNum) {
            mathAnomalies.push({
              qLabel,
              pair,
              calculated: calc,
              type: 'PAIR_CALCULATION_MISMATCH'
            });
          }
        }
      }
    }
  }
}

console.log(`Đã kiểm tra ${totalQuestions} câu hỏi.`);
console.log(`Số lỗi toán học phát hiện: ${mathAnomalies.length}`);
if (mathAnomalies.length > 0) {
  console.log(JSON.stringify(mathAnomalies, null, 2));
} else {
  console.log('100% các phép tính khớp hoàn toàn với expectedAnswer!');
}
