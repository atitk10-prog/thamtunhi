/**
 * THÁM TỬ TOÁN NHÍ - Deterministic Math Engine
 * Precision Integer Engine & Rule-Based Error Pattern Diagnostic
 * Fully decoupled from AI - Exact, verified, and testable.
 */

import { Question, MathErrorPattern } from '../types';

export interface EvaluationResult {
  isCorrect: boolean;
  normalizedUserAnswer: string;
  expectedAnswer: string;
  detectedPattern?: MathErrorPattern;
  hintText?: string;
  visualGuidance?: string;
}

/**
 * Normalizes input string (removes whitespace, lowercases, handles Vietnamese punctuation)
 */
export function normalizeAnswer(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/,/g, '.');
}

/**
 * Pure integer evaluation without float imprecision
 */
export function safeIntegerEval(expression: string): number | null {
  const sanitized = expression.replace(/[^0-9+\-*\/]/g, '');
  if (!sanitized) return null;

  try {
    // Only accept basic arithmetic: a + b, a - b, a * b, a / b
    const match = sanitized.match(/^(\d+)([+\-*\/])(\d+)$/);
    if (!match) return null;

    const a = parseInt(match[1], 10);
    const op = match[2];
    const b = parseInt(match[3], 10);

    if (isNaN(a) || isNaN(b)) return null;

    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? Math.floor(a / b) : null;
      default: return null;
    }
  } catch {
    return null;
  }
}

/**
 * Detects specific math error patterns based on question context and student input
 */
export function detectErrorPattern(
  question: Question,
  userAnswer: string
): { pattern: MathErrorPattern; hintText: string; visualGuidance?: string } {
  const normUser = normalizeAnswer(userAnswer);
  const normExpected = normalizeAnswer(question.expectedAnswer);

  // Check custom question rule hints first if defined
  for (const rule of question.ruleHints || []) {
    if (rule.pattern) {
      // Check if user answer matches this specific pattern context
    }
  }

  // 1. Off-by-one counting error
  const userNum = parseInt(normUser, 10);
  const expNum = parseInt(normExpected, 10);

  if (!isNaN(userNum) && !isNaN(expNum)) {
    if (Math.abs(userNum - expNum) === 1) {
      return {
        pattern: 'COUNTING_OFF_BY_ONE',
        hintText: userNum > expNum 
          ? 'Em đang đếm thừa 1 đơn vị rồi. Hãy chỉ tay vào từng đồ vật và đếm lại thật chậm nhé!'
          : 'Em đang đếm thiếu 1 đơn vị rồi. Hãy kiểm tra lại xem có bỏ sót đồ vật nào không nhé!',
        visualGuidance: 'Chạm vào từng hình để đếm theo thứ tự từ trái sang phải.'
      };
    }

    // 2. Place value digit swap (e.g., expected 24, student typed 42)
    if (normExpected.length === 2 && normUser.length === 2) {
      if (normExpected[0] === normUser[1] && normExpected[1] === normUser[0]) {
        return {
          pattern: 'PLACE_VALUE_SWAP',
          hintText: `Em có thể đang nhầm giữa hàng chục và hàng đơn vị (${normExpected[0]} chục và ${normExpected[1]} đơn vị khác với ${normUser[0]} chục và ${normUser[1]} đơn vị).`,
          visualGuidance: 'Quan sát que tính: Đếm số bó chục trước rồi mới đếm số que lẻ nhé.'
        };
      }
    }
  }

  // 3. Comparison inversion (> instead of < or vice versa)
  if (['>', '<', '='].includes(normExpected)) {
    if ((normExpected === '>' && normUser === '<') || (normExpected === '<' && normUser === '>')) {
      return {
        pattern: 'COMPARISON_INVERSION',
        hintText: 'Em chú ý: Mũi nhọn luôn quay về phía số bé hơn, miệng mở rộng về phía số lớn hơn nhé!',
        visualGuidance: 'Số lớn hơn ở bên nào thì miệng chú cá sẽ mở rộng về bên đó ăn nhiều hơn.'
      };
    }
  }

  // 4. Operator confusion (+ instead of - or vice versa in calculation)
  const mathMatch = question.prompt ? question.prompt.match(/(\d+)\s*([+\-])\s*(\d+)/) : null;
  if (mathMatch && !isNaN(userNum)) {
    const a = parseInt(mathMatch[1], 10);
    const op = mathMatch[2];
    const b = parseInt(mathMatch[3], 10);

    const oppositeResult = op === '+' ? a - b : a + b;
    if (userNum === oppositeResult) {
      return {
        pattern: 'WRONG_OPERATOR',
        hintText: op === '+' 
          ? 'Bài toán yêu cầu phép cộng (+) để gộp lại, em có thể đã làm phép trừ (-).'
          : 'Bài toán yêu cầu phép trừ (-) để bớt đi, em có thể đã làm phép cộng (+).',
        visualGuidance: op === '+' ? 'Gộp hai nhóm lại và đếm tất cả.' : 'Gạch bớt số lượng cần trừ đi.'
      };
    }

    // 5. Cross ten error (e.g. 8 + 5 = 12 or 15 - 8 = 6)
    if (op === '+' && (a + b >= 10) && a < 10 && b < 10) {
      // Bridging 10 error
      return {
        pattern: 'CROSS_TEN_ERROR',
        hintText: `Mẹo tách số: Hãy tách ${b} thành ${(10 - a)} và ${b - (10 - a)} để gộp với ${a} thành 10 rồi cộng tiếp nhé!`,
        visualGuidance: 'Điền đầy khung 10 ô trước rồi đếm phần dư bên ngoài.'
      };
    }
  }

  // 6. Number order confusion (trục số / sắp xếp)
  if (question.interactionType === 'number_line_order') {
    return {
      pattern: 'NUMBER_ORDER_CONFUSION',
      hintText: 'Quan sát trục số: Các số tăng dần từ trái sang phải. Số đứng liền sau lớn hơn số đứng liền trước 1 đơn vị.',
      visualGuidance: 'Đếm xuôi từ số nhỏ nhất để tìm vị trí còn thiếu.'
    };
  }

  // 7. Word problem wrong operation
  if (question.visualConfig?.type === 'word_story') {
    return {
      pattern: 'WORD_PROBLEM_WRONG_OPERATION',
      hintText: 'Đọc kỹ từ khóa: "thêm vào / tất cả" là phép cộng (+), "bớt đi / còn lại / cho đi" là phép trừ (-).',
      visualGuidance: 'Tóm tắt bài toán: Có ban đầu bao nhiêu? Thêm hay bớt bao nhiêu?'
    };
  }

  // 8. Expression match error (nối sai cặp)
  if (question.interactionType === 'expression_match' || normUser === 'matched_incorrect') {
    return {
      pattern: 'GENERAL_CALCULATION_ERROR',
      hintText: question.explanation
        ? `Gợi ý Thám Tử Cáo: ${question.explanation} Hãy thử nối lại các thẻ chưa chính xác nhé!`
        : 'Có một số cặp nối chưa chính xác. Em hãy kiểm tra lại kết quả từng thẻ và nối lại nhé!',
      visualGuidance: 'Đọc kỹ thẻ ở cột bên trái và so sánh từng thẻ ở cột bên phải.'
    };
  }

  // Default calculation fallback
  return {
    pattern: 'GENERAL_CALCULATION_ERROR',
    hintText: 'Đáp án chưa chính xác. Em hãy quan sát kỹ gợi ý trực quan và thử lại một lần nữa nhé!',
    visualGuidance: question.explanation || 'Hãy kiểm tra lại từng bước tính.'
  };
}

/**
 * Main evaluation function
 */
export function evaluateAnswer(
  question: Question,
  userAnswer: string
): EvaluationResult {
  const normUser = normalizeAnswer(userAnswer);
  const normExpected = normalizeAnswer(question.expectedAnswer);

  // Check acceptable alternate forms
  const allAcceptables = [normExpected, ...(question.acceptableAnswers || []).map(normalizeAnswer)];
  const isCorrect = allAcceptables.includes(normUser);

  if (isCorrect) {
    return {
      isCorrect: true,
      normalizedUserAnswer: normUser,
      expectedAnswer: normExpected,
    };
  }

  const diagnosis = detectErrorPattern(question, userAnswer);

  return {
    isCorrect: false,
    normalizedUserAnswer: normUser,
    expectedAnswer: normExpected,
    detectedPattern: diagnosis.pattern,
    hintText: diagnosis.hintText,
    visualGuidance: diagnosis.visualGuidance,
  };
}

/**
 * Diagnostic pattern labels in friendly Vietnamese for teachers & reports
 */
export const ERROR_PATTERN_LABELS: Record<MathErrorPattern, { label: string; description: string; advice: string }> = {
  COUNTING_OFF_BY_ONE: {
    label: 'Đếm lệch 1 đơn vị',
    description: 'Học sinh đếm thừa hoặc thiếu 1 khi đếm đồ vật hoặc đếm bước trên trục số.',
    advice: 'Rèn luyện kỹ năng chỉ tay từng vật và đếm đồng bộ nhịp nhàng.'
  },
  WRONG_OPERATOR: {
    label: 'Nhầm dấu phép tính (+ / −)',
    description: 'Học sinh lấy cộng thay cho trừ hoặc ngược lại trong tình huống toán học.',
    advice: 'Nhấn mạnh ý nghĩa hành động "gộp lại" (cộng) và "tách ra / bớt đi" (trừ).'
  },
  CROSS_TEN_ERROR: {
    label: 'Sai bước qua 10 (cộng/trừ có nhớ)',
    description: 'Khó khăn khi tách số để tạo thành 1 chục tròn rồi cộng/trừ tiếp.',
    advice: 'Tăng cường hoạt động khung 10 ô (Ten-Frame) để nhìn thấy trực quan nhóm 10.'
  },
  PLACE_VALUE_SWAP: {
    label: 'Đảo vị trí Chục và Đơn vị',
    description: 'Nhầm lẫn thứ tự viết chữ số hàng chục và hàng đơn vị (vd: 35 viết thành 53).',
    advice: 'Thực hành với mô hình bó chục que tính và thẻ số cấu tạo thập phân.'
  },
  COMPARISON_INVERSION: {
    label: 'Đảo chiều dấu so sánh (> / <)',
    description: 'Nhận biết đúng số lượng nhưng quay nhầm hướng mũi nhọn dấu so sánh.',
    advice: 'Sử dụng hình ảnh miệng cá sấu / chú chim luôn hướng về bên nhiều hơn.'
  },
  WORD_PROBLEM_WRONG_OPERATION: {
    label: 'Chọn sai phép tính bài toán có lời văn',
    description: 'Chưa phân tích đúng mối quan hệ đại lượng trong ngữ cảnh thực tế.',
    advice: 'Dạy học sinh gạch chân từ khóa ngữ cảnh và vẽ sơ đồ đoạn thẳng đơn giản.'
  },
  NUMBER_ORDER_CONFUSION: {
    label: 'Nhầm thứ tự trên trục số',
    description: 'Nhầm lẫn vị trí số liền trước, số liền sau hoặc thứ tự tăng/giảm.',
    advice: 'Thực hành bước nhảy trên thước kẻ và trục số có mốc 5, 10.'
  },
  GEOMETRY_MISIDENTIFICATION: {
    label: 'Nhầm nhận dạng hình phẳng/hình khối',
    description: 'Nhầm lẫn giữa hình vuông và chữ nhật, hoặc hình tròn và khối cầu.',
    advice: 'Cho học sinh sờ nắm vật thật và đếm số cạnh, số đỉnh hoặc mặt lăn được.'
  },
  MEASUREMENT_UNIT_ERROR: {
    label: 'Nhầm đơn vị đo độ dài/thời gian',
    description: 'Chưa căn đúng vạch 0 cm trên thước hoặc nhầm kim giờ và kim phút.',
    advice: 'Thực hành đo trực tiếp đồ dùng học tập bằng thước có vạch chia xăng-ti-mét.'
  },
  GENERAL_CALCULATION_ERROR: {
    label: 'Lỗi tính toán cơ bản',
    description: 'Tính toán chưa chuẩn xác trong phạm vi bài học.',
    advice: 'Khuyến khích học sinh dùng bảng cộng trừ hoặc tính nhẩm từng bước.'
  }
};
