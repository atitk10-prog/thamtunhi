/**
 * Unit Tests for Deterministic Math Engine
 * Validates integer precision, error pattern diagnosis, and input normalization
 */

import { evaluateAnswer, safeIntegerEval, normalizeAnswer } from './mathEngine';
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

  return { passed, failed, errors };
}
