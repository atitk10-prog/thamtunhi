import fs from 'fs';

export function normalizeMathTextForSpeech(text: string, options?: string[]): string {
  if (!text) return '';
  let s = text;

  // Clean technical markers
  s = s.replace(/\[ĐÃ SỬA BỞI GIÁO VIÊN\]\s*/gi, '');
  s = s.replace(/\[AI SOẠN NHÁP\]\s*/gi, '');
  s = s.replace(/^Khung\s*(?:5|10)\s*ô\s*:\s*/gi, '');
  s = s.replace(/^(?:Trong\s*)?khung\s*(?:5|10)\s*ô\s*(?:có\s*)?/gi, 'Có ');

  // Equations like 2 + 3 = ? or 4 + 4 = ? or 5 - 2 = ?
  s = s.replace(/(\d+)\s*\+\s*(\d+)\s*=\s*(?:\?|\.{2,})/g, '$1 cộng $2 bằng mấy?');
  s = s.replace(/(\d+)\s*-\s*(\d+)\s*=\s*(?:\?|\.{2,})/g, '$1 trừ $2 bằng mấy?');
  s = s.replace(/(\d+)\s*=\s*(?:\?|\.{2,})/g, '$1 bằng mấy?');

  // Fill in comparison: 3 ... 5 -> 3 so với 5
  s = s.replace(/(\d+)\s*\.{2,}\s*(\d+)/g, '$1 so với $2');

  // Replace operator brackets (> , < , =)
  s = s.replace(/\(>\s*,\s*<\s*,\s*=\)/g, '(lớn hơn, bé hơn, hoặc bằng)');
  s = s.replace(/\(>\s*,\s*<\)/g, '(lớn hơn, hoặc bé hơn)');
  s = s.replace(/\(\+\s*,\s*-\)/g, '(cộng, hoặc trừ)');

  // Standalone operators with spaces
  s = s.replace(/\s*>\s*/g, ' lớn hơn ');
  s = s.replace(/\s*<\s*/g, ' bé hơn ');
  s = s.replace(/\s*=\s*/g, ' bằng ');
  s = s.replace(/\s*\+\s*/g, ' cộng ');
  s = s.replace(/(?<=\d)\s*-\s*(?=\d)/g, ' trừ ');

  // Units
  s = s.replace(/(\d+)\s*cm\b/gi, '$1 xăng-ti-mét');
  s = s.replace(/(\d+)\s*kg\b/gi, '$1 ki-lô-gam');
  s = s.replace(/(\d+)\s*l(?![a-zA-Zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ])/gi, '$1 lít');

  // If text options are non-numeric words (e.g. geometric shapes, names), read options to assist early readers
  if (options && Array.isArray(options) && options.length > 0) {
    const isPureNumbers = options.every(o => /^\d+$/.test(String(o).trim()));
    const isPureOperators = options.every(o => /^[><=+\-]+$/.test(String(o).trim()));
    if (!isPureNumbers && !isPureOperators) {
      const cleanOptions = options.map(o => String(o).trim()).filter(Boolean);
      if (cleanOptions.length > 0) {
        s += '. Các lựa chọn: ' + cleanOptions.join(', ') + '.';
      }
    }
  }

  // Clean extra punctuation & spaces
  s = s.replace(/\s+/g, ' ').replace(/\s+([.,?!:])/g, '$1').trim();
  return s;
}

const manifest = JSON.parse(fs.readFileSync('scripts/in_scope_questions_manifest.json', 'utf8'));
console.log('=== TEST ALL 49 IN-SCOPE QUESTIONS NORMALIZATION ===\n');

manifest.slice(0, 15).forEach((q: any, i: number) => {
  console.log(`[Q${i + 1}] Original: "${q.prompt}"`);
  console.log(`     Spoken Prompt: "${normalizeMathTextForSpeech(q.prompt, q.options)}"`);
  if (q.hint) {
    console.log(`     Spoken Hint:   "${normalizeMathTextForSpeech(q.hint)}"`);
  }
  console.log('----------------------------------------------------');
});
