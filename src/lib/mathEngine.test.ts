/**
 * Unit Tests for Deterministic Math Engine
 * Validates integer precision, error pattern diagnosis, and input normalization
 */

import { evaluateAnswer, safeIntegerEval, normalizeAnswer, sanitizeLessonQuestions } from './mathEngine';
import { Question } from '../types';

export function runMathEngineTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`FAIL: ${testName}`);
      console.error(`FAIL: ${testName}`);
    }
  };

  // Test 1: safeIntegerEval
  assert(safeIntegerEval('3+4') === 7, 'safeIntegerEval: 3+4 === 7');
  assert(safeIntegerEval('15 - 8') === 7, 'safeIntegerEval: 15-8 === 7');
  assert(safeIntegerEval('2 * 6') === 12, 'safeIntegerEval: 2*6 === 12');
  assert(safeIntegerEval('18 / 2') === 9, 'safeIntegerEval: 18/2 === 9');

  // Test 2: normalizeAnswer
  assert(normalizeAnswer(' 42 ') === '42', 'normalizeAnswer removes whitespace');
  assert(normalizeAnswer('3,5') === '3.5', 'normalizeAnswer replaces comma with dot');
  assert(normalizeAnswer('TÁM') === 'tám', 'normalizeAnswer lowercases Vietnamese text');

  // Test 3: Off-by-one counting error detection
  const qCounting: Question = {
    id: 'q-test-1',
    order: 1,
    prompt: 'Đếm số lượng quả táo:',
    interactionType: 'single_choice',
    expectedAnswer: '5',
    explanation: 'Có 5 quả táo',
    skillTag: 'Đếm',
    difficulty: 'easy',
    ruleHints: []
  };

  const resOffByOne = evaluateAnswer(qCounting, '6');
  assert(!resOffByOne.isCorrect, 'evaluateAnswer: 6 is wrong for expected 5');
  assert(resOffByOne.detectedPattern === 'COUNTING_OFF_BY_ONE', 'Pattern detected: COUNTING_OFF_BY_ONE');

  // Test 4: Place value digit swap error detection
  const qPlaceValue: Question = {
    id: 'q-test-2',
    order: 2,
    prompt: '2 chục và 4 đơn vị là số nào?',
    interactionType: 'number_input',
    expectedAnswer: '24',
    explanation: '24',
    skillTag: 'Chục đơn vị',
    difficulty: 'easy',
    ruleHints: []
  };

  const resPlaceValue = evaluateAnswer(qPlaceValue, '42');
  assert(!resPlaceValue.isCorrect, 'evaluateAnswer: 42 is wrong for 24');
  assert(resPlaceValue.detectedPattern === 'PLACE_VALUE_SWAP', 'Pattern detected: PLACE_VALUE_SWAP');

  // Test 5: Comparison inversion error detection
  const qComparison: Question = {
    id: 'q-test-3',
    order: 3,
    prompt: 'So sánh: 8 ... 5',
    interactionType: 'operator_pick',
    expectedAnswer: '>',
    explanation: '8 > 5',
    skillTag: 'So sánh',
    difficulty: 'easy',
    ruleHints: []
  };

  const resComparison = evaluateAnswer(qComparison, '<');
  assert(!resComparison.isCorrect, 'evaluateAnswer: < is wrong for >');
  assert(resComparison.detectedPattern === 'COMPARISON_INVERSION', 'Pattern detected: COMPARISON_INVERSION');

  // Test 6: Wrong operator confusion
  const qOperator: Question = {
    id: 'q-test-4',
    order: 4,
    prompt: 'Tính: 9 - 4 = ?',
    interactionType: 'number_input',
    expectedAnswer: '5',
    explanation: '9 - 4 = 5',
    skillTag: 'Phép trừ',
    difficulty: 'easy',
    ruleHints: []
  };

  const resOperator = evaluateAnswer(qOperator, '13'); // 9 + 4 instead of 9 - 4
  assert(!resOperator.isCorrect, 'evaluateAnswer: 13 is wrong for 9 - 4');
  assert(resOperator.detectedPattern === 'WRONG_OPERATOR', 'Pattern detected: WRONG_OPERATOR');

  // Test 7: Correct answer verification
  const resCorrect = evaluateAnswer(qOperator, '5');
  assert(resCorrect.isCorrect, 'evaluateAnswer: 5 is correct');

  // Test 8: Zero evaluation and safe normalization
  assert(safeIntegerEval('3 - 3') === 0, 'safeIntegerEval: 3 - 3 === 0');
  assert(normalizeAnswer('0') === '0', 'normalizeAnswer: "0" stays "0"');
  assert(normalizeAnswer(0 as any) === '0', 'normalizeAnswer: 0 stays "0"');

  const qZero: Question = {
    id: 'q-test-zero',
    order: 5,
    prompt: '5 - 5 = ?',
    interactionType: 'number_input',
    expectedAnswer: '0',
    explanation: '5 - 5 = 0',
    skillTag: 'Phép trừ',
    difficulty: 'easy',
    ruleHints: []
  };

  const resZeroCorrect = evaluateAnswer(qZero, '0');
  assert(resZeroCorrect.isCorrect, 'evaluateAnswer: 0 is correct for expected 0');

  const resZeroEmpty = evaluateAnswer(qZero, '');
  assert(!resZeroEmpty.isCorrect, 'evaluateAnswer: empty string is NOT correct for expected 0');

  // Test 9: Question Sanitizer - Carrot visual configuration
  const rawCarrotQ: Question = {
    id: 'q-g1-04-2',
    order: 2,
    prompt: 'Có 8 củ cà rốt, chú thỏ đã ăn mất 3 củ. Hỏi còn lại bao nhiêu củ cà rốt?',
    interactionType: 'single_choice',
    options: ['4', '5', '6', '11'],
    expectedAnswer: '5',
    explanation: '8 - 3 = 5 củ cà rốt.',
    skillTag: 'Phép trừ có lời văn',
    difficulty: 'easy',
    ruleHints: []
  };
  const [sanitizedCarrot] = sanitizeLessonQuestions([rawCarrotQ]);
  assert(sanitizedCarrot.visualConfig?.type === 'subtraction', 'Carrot subtraction has type: subtraction');
  assert(sanitizedCarrot.visualConfig?.iconName === 'carrot', 'Carrot question has iconName: carrot');
  assert(sanitizedCarrot.visualConfig?.leftCount === 8, 'Carrot initial count is 8');
  assert(sanitizedCarrot.visualConfig?.rightCount === 3, 'Carrot subtracted count is 3');

  // Test 10: Question Sanitizer - Counting sticks (que tính)
  const rawBundleQ: Question = {
    id: 'q-g1-02-1',
    order: 1,
    prompt: 'Đếm số lượng que tính màu vàng:',
    interactionType: 'single_choice',
    expectedAnswer: '7',
    explanation: 'Có 7 que tính.',
    skillTag: 'Đếm số lượng',
    difficulty: 'easy',
    ruleHints: []
  };
  const [sanitizedBundle] = sanitizeLessonQuestions([rawBundleQ]);
  assert(sanitizedBundle.visualConfig?.type === 'bundles', 'Que tính uses bundles SVG');
  assert(sanitizedBundle.visualConfig?.ones === 7, 'Que tính shows 7 individual sticks');

  // Test 11: Question Sanitizer - Removal of 5-frame / 10-frame prefixes and preservation of dots
  const rawFrameQ: Question = {
    id: 'q-g1-01-5',
    order: 5,
    prompt: 'Khung 5 ô: Có mấy chấm tròn màu xanh đang có?',
    interactionType: 'ten_frame_bundle',
    expectedAnswer: '5',
    explanation: '',
    skillTag: '',
    difficulty: 'easy',
    ruleHints: []
  };
  const [sanitizedFrame] = sanitizeLessonQuestions([rawFrameQ]);
  assert(!sanitizedFrame.prompt.includes('Khung 5 ô:'), 'Frame prefix removed from prompt');
  assert(sanitizedFrame.prompt === 'Có mấy chấm tròn màu xanh?', 'Clean prompt for dot counting');
  assert(sanitizedFrame.visualConfig?.dotColor === 'blue', 'Dot color is blue for dots question');

  // Test 12: Question Sanitizer - Dual-colored dots on ten frame
  const rawDualDotQ: Question = {
    id: 'q-g1-03-5',
    order: 5,
    prompt: 'Khung 10 ô: 5 chấm đỏ và 4 chấm xanh. Có tất cả mấy chấm tròn?',
    interactionType: 'ten_frame_bundle',
    expectedAnswer: '9',
    explanation: '',
    skillTag: '',
    difficulty: 'easy',
    ruleHints: []
  };
  const [sanitizedDualDot] = sanitizeLessonQuestions([rawDualDotQ]);
  assert(sanitizedDualDot.visualConfig?.dotColor === 'dual', 'Dual dots configured for red and blue dots');
  assert(sanitizedDualDot.visualConfig?.leftCount === 5, 'Left count is 5 red dots');
  assert(sanitizedDualDot.visualConfig?.rightCount === 4, 'Right count is 4 blue dots');

  // Test 13: Question Sanitizer - Flagging missing teacher illustrations
  const rawWordStoryQ: Question = {
    id: 'q-test-story',
    order: 6,
    prompt: 'Mai có 5 bông hoa, Lan cho Mai thêm 3 bông hoa. Hỏi Mai có tất cả bao nhiêu bông hoa?',
    interactionType: 'number_input',
    visualConfig: { type: 'word_story' },
    expectedAnswer: '8',
    explanation: '5 + 3 = 8 bông hoa.',
    skillTag: 'Toán có lời văn',
    difficulty: 'easy',
    ruleHints: []
  };
  const [sanitizedWordStory] = sanitizeLessonQuestions([rawWordStoryQ]);
  assert(sanitizedWordStory.requiresTeacherIllustration === true, 'Missing image flagged for teacher illustration');

  return { passed, failed, errors };
}
