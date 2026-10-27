/**
 * Pure Isomorphic Vietnamese Math TTS Utility
 * Compatible with both Node.js server and Client Browser (Chrome, Safari, Firefox, Mobile).
 */

function md5(string: string): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX: number, lY: number) {
    const lX4 = (lX & 0x40000000);
    const lY4 = (lY & 0x40000000);
    const lX8 = (lX & 0x80000000);
    const lY8 = (lY & 0x80000000);
    const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    } else return (lResult ^ lX8 ^ lY8);
  }
  function F(x: number, y: number, z: number) { return (x & y) | ((~x) & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & (~z)); }
  function H(x: number, y: number, z: number) { return (x ^ y ^ z); }
  function I(x: number, y: number, z: number) { return (y ^ (x | (~z))); }
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function convertToWordArray(string: string) {
    let lWordCount;
    const lMessageLength = string.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function wordToHex(lValue: number) {
    let WordToHexValue = '', WordToHexValue_temp = '', lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = '0' + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }
  const utf8 = unescape(encodeURIComponent(string));
  const x = convertToWordArray(utf8);
  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;
  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = GG(d, a, b, c, x[k + 10], S22, 0x02441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x04881D05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

/**
 * Normalizes Vietnamese math questions & hints into natural spoken Vietnamese for Grade 1 pupils (6-7 years old).
 * Converts symbols (+, -, =, >, <, ?) into accurate spoken words and clarifies text choices.
 */
export function normalizeMathTextForSpeech(text: string, options?: (string | number)[]): string {
  if (!text) return '';
  let s = String(text);

  // 1. Remove internal teacher editing & tech markers
  s = s.replace(/\[ĐÃ SỬA BỞI GIÁO VIÊN\]\s*/gi, '');
  s = s.replace(/\[AI SOẠN NHÁP\]\s*/gi, '');
  s = s.replace(/^Khung\s*(?:5|10)\s*ô\s*:\s*/gi, '');
  s = s.replace(/^(?:Trong\s*)?khung\s*(?:5|10)\s*ô\s*(?:có\s*)?/gi, 'Có ');

  // 2. Format basic equations like "2 + 3 = ?" or "4 + 4 = ..." into natural spoken questions
  s = s.replace(/(\d+)\s*\+\s*(\d+)\s*=\s*(?:\?|\.{2,})/g, '$1 cộng $2 bằng mấy?');
  s = s.replace(/(\d+)\s*-\s*(\d+)\s*=\s*(?:\?|\.{2,})/g, '$1 trừ $2 bằng mấy?');
  s = s.replace(/(\d+)\s*=\s*(?:\?|\.{2,})/g, '$1 bằng mấy?');

  // 3. Fill-in comparison like "3 ... 5" -> "3 so với 5"
  s = s.replace(/(\d+)\s*\.{2,}\s*(\d+)/g, '$1 so với $2');

  // 4. Operator brackets in prompts: (> , < , =)
  s = s.replace(/\(>\s*,\s*<\s*,\s*=\)/g, '(lớn hơn, bé hơn, hoặc bằng)');
  s = s.replace(/\(>\s*,\s*<\)/g, '(lớn hơn, hoặc bé hơn)');
  s = s.replace(/\(\+\s*,\s*-\)/g, '(cộng, hoặc trừ)');

  // 5. Standalone comparison operators
  s = s.replace(/\s*>\s*/g, ' lớn hơn ');
  s = s.replace(/\s*<\s*/g, ' bé hơn ');
  s = s.replace(/\s*=\s*/g, ' bằng ');
  s = s.replace(/\s*\+\s*/g, ' cộng ');
  s = s.replace(/(?<=\d)\s*-\s*(?=\d)/g, ' trừ ');

  // 6. Units: 5 cm -> 5 xăng-ti-mét, 2 kg -> 2 ki-lô-gam, 3 l -> 3 lít
  s = s.replace(/(\d+)\s*cm\b/gi, '$1 xăng-ti-mét');
  s = s.replace(/(\d+)\s*kg\b/gi, '$1 ki-lô-gam');
  s = s.replace(/(\d+)\s*l(?![a-zA-Zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ])/gi, '$1 lít');

  // 7. If text options are non-numeric words (e.g. geometric shapes, objects), append them for Grade 1 non-readers
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

  // 8. Clean doubled punctuation, quotes & extra whitespaces
  s = s.replace(/""/g, '"');
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/\s+([.,?!:])/g, '$1');
  return s.trim();
}

/**
 * Computes deterministic MD5 hash for cached audio files (16 hex chars)
 */
export function getAudioHash(text: string): string {
  return md5(text.trim()).substring(0, 16);
}

/**
 * Returns the effective spoken text for a question, using teacher custom override if provided
 */
export function getQuestionSpokenText(q: { prompt: string; options?: (string | number)[]; customSpokenPrompt?: string }): string {
  if (q.customSpokenPrompt && q.customSpokenPrompt.trim()) {
    return q.customSpokenPrompt.trim();
  }
  return normalizeMathTextForSpeech(q.prompt, q.options);
}

/**
 * Returns the effective spoken text for a hint, using teacher custom override if provided
 */
export function getHintSpokenText(q: { ruleHints?: { hintText?: string }[]; customSpokenHint?: string }): string {
  if (q.customSpokenHint && q.customSpokenHint.trim()) {
    return q.customSpokenHint.trim();
  }
  const hint = q.ruleHints && q.ruleHints[0] ? q.ruleHints[0].hintText || '' : '';
  return normalizeMathTextForSpeech(hint);
}

/**
 * Deterministically checks if a lesson or assignment belongs to Grade 1 Weeks 1-9.
 * Strictly excludes Grade 2, and Grade 1 Week 10+.
 */
export function isGrade1Weeks1To9(lessonOrVersion: {
  id?: string;
  lessonId?: string;
  grade?: number;
  week?: number;
  title?: string;
  topic?: string;
}): boolean {
  if (!lessonOrVersion) return false;

  // 1. Grade check: MUST be Grade 1
  const grade = Number(lessonOrVersion.grade);
  if (grade !== 1) {
    return false;
  }

  const id = String(lessonOrVersion.id || lessonOrVersion.lessonId || '').toLowerCase();
  const title = String(lessonOrVersion.title || '').toLowerCase();
  const topic = String(lessonOrVersion.topic || '').toLowerCase();
  const week = typeof lessonOrVersion.week === 'number' ? lessonOrVersion.week : undefined;

  // Strictly exclude QA/E2E test lessons or reinforcement drafts
  if (id.includes('qa-e2e') || id.includes('reinforce')) {
    return false;
  }

  // Exclude Grade 2 lessons explicitly
  if (id.includes('g2') || id.includes('grade2') || title.includes('lớp 2')) {
    return false;
  }

  // 2. Known Grade 1 repository lessons mapping
  if (id === 'lesson-g1-01' || id.includes('lesson-g1-01')) return true; // Week 5
  if (id === 'lesson-g1-02' || id.includes('lesson-g1-02')) return true; // Week 8
  if (id === 'lesson-g1-03' || id.includes('lesson-g1-03')) return true; // Week 9
  if (id === 'lesson-g1-05' || id.includes('lesson-g1-05')) return true; // Week 4/6
  if (id === 'lesson-draft-1792910089741' || id.includes('1792910089741')) return true; // Class 1B Assigned Draft

  // Strictly exclude Week 10+ standard lessons
  if (
    id === 'lesson-g1-04' ||
    id.includes('lesson-g1-04') ||
    id === 'lesson-g1-06' ||
    id.includes('lesson-g1-06') ||
    id === 'lesson-g1-07' ||
    id.includes('lesson-g1-07') ||
    id === 'lesson-g1-08' ||
    id.includes('lesson-g1-08') ||
    id === 'lesson-g1-09' ||
    id.includes('lesson-g1-09') ||
    id === 'lesson-g1-10' ||
    id.includes('lesson-g1-10') ||
    id === 'lesson-g1-11' ||
    id.includes('lesson-g1-11') ||
    id === 'lesson-g1-12' ||
    id.includes('lesson-g1-12')
  ) {
    return false;
  }

  // 3. Week number check if specified
  if (typeof week === 'number') {
    return week >= 1 && week <= 9;
  }

  // 4. Topic/Title keyword analysis for Grade 1 Weeks 1-9 curriculum
  const inScopeKeywords = [
    'các số 1, 2, 3',
    'các số 1 2 3',
    'các số 1, 2, 3, 4, 5',
    'các số 1 2 3 4 5',
    'số 6, 7, 8, 9, 10',
    'số 0',
    'nhiều hơn, ít hơn',
    'so sánh số',
    'dấu lớn',
    'dấu bé',
    'dấu bằng',
    'lớn hơn, bé hơn',
    'mấy và mấy',
    'tách - gộp số',
    'tách gộp',
    'hình vuông, hình tròn',
    'hình tam giác',
    'phép cộng trong phạm vi 10',
    'phép cộng trong phạm vi 5',
    'phép cộng trong phạm vi 6',
    'phép cộng trong phạm vi 7',
    'phép cộng trong phạm vi 8',
    'phép cộng trong phạm vi 9',
    'làm quen với phép cộng',
    'bảng cộng',
  ];

  const outOfScopeKeywords = [
    'phép trừ',
    'bảng trừ',
    'các số đến 20',
    'phép cộng có nhớ',
    'phép trừ có nhớ',
    'xăng-ti-mét',
    'tuần 10',
    'tuần 11',
    'tuần 12',
    'tuần 13',
    'tuần 14',
    'tuần 15',
    'tuần 16',
    'tuần 17',
    'tuần 18',
    'tuần 19',
    'học kỳ 2',
  ];

  const fullText = `${title} ${topic}`;
  for (const outK of outOfScopeKeywords) {
    if (fullText.includes(outK)) return false;
  }

  for (const inK of inScopeKeywords) {
    if (fullText.includes(inK)) return true;
  }

  // If created via AI draft for Grade 1 and topic matches basic addition/counting
  if (id.includes('ai') || id.includes('draft') || id.includes('custom')) {
    return true;
  }

  return false;
}
