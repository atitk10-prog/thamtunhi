/**
 * THÁM TỬ TOÁN NHÍ - Chương trình GDPT 2018 Môn Toán Lớp 1 & Lớp 2
 * 24 Bài học chuẩn mực, 192 Câu hỏi thực chứng, 6 Dạng tương tác trực quan
 */

import { Lesson, Question } from '../types';

export interface CurriculumSeedItem {
  lesson: Omit<Lesson, 'id' | 'createdAt' | 'createdBy' | 'dataOrigin' | 'environmentTag'> & { id: string };
  questions: Question[];
}

export const CURRICULUM_DATA: CurriculumSeedItem[] = [
  // ==================== LỚP 1 (12 BÀI) ====================
  {
    lesson: {
      id: 'lesson-g1-01',
      title: 'Các số từ 1 đến 5: Đếm và Nhận biết',
      grade: 1,
      topic: 'Số và Phép tính trong phạm vi 10',
      learningStandard: 'Đếm, đọc, viết được các số từ 1 đến 5; nhận biết số lượng đồ vật trong phạm vi 5.',
      description: 'Làm quen với các số tự nhiên từ 1 đến 5 qua đồ vật trực quan quen thuộc.',
      durationMinutes: 15,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-01-1',
        order: 1,
        prompt: 'Thám tử Cáo nhìn thấy có bao nhiêu quả táo đỏ trên cây?',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 4, iconName: 'apple' },
        options: ['3', '4', '5', '6'],
        expectedAnswer: '4',
        explanation: 'Đếm lần lượt từng quả táo: 1, 2, 3, 4. Có tất cả 4 quả táo.',
        skillTag: 'Đếm số lượng đến 5',
        difficulty: 'easy',
        ruleHints: [
          { pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Hãy chỉ tay vào từng quả táo và đếm lại thật chậm: 1, 2, 3, 4 nhé!' }
        ]
      },
      {
        id: 'q-g1-01-2',
        order: 2,
        prompt: 'Đếm số chú cá bơi trong bể và điền số thích hợp vào ô trống:',
        interactionType: 'number_input',
        visualConfig: { type: 'counters', count: 3, iconName: 'fish' },
        expectedAnswer: '3',
        acceptableAnswers: ['3', 'ba'],
        explanation: 'Có 3 chú cá đang bơi vui vẻ trong bể.',
        skillTag: 'Đếm và viết số',
        difficulty: 'easy',
        ruleHints: [
          { pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm từng chú cá một: 1, 2, 3 chú cá nhé!' }
        ]
      },
      {
        id: 'q-g1-01-3',
        order: 3,
        prompt: 'So sánh số lượng: 4 ngôi sao và 2 ngôi sao. Chọn dấu thích hợp (> , < , =):',
        interactionType: 'operator_pick',
        visualConfig: { type: 'counters', count: 4, iconName: 'star' },
        options: ['>', '<', '='],
        expectedAnswer: '>',
        explanation: 'Vì 4 nhiều hơn 2 nên 4 > 2.',
        skillTag: 'So sánh các số đến 5',
        difficulty: 'medium',
        ruleHints: [
          { pattern: 'COMPARISON_INVERSION', hintText: 'Mũi nhọn luôn chĩa về số nhỏ hơn (2), miệng mở rộng về số lớn hơn (4) nhé!' }
        ]
      },
      {
        id: 'q-g1-01-4',
        order: 4,
        prompt: 'Nối hình có số lượng tương ứng với chữ số đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '2 quả cam', right: 'Số 2' },
          { left: '5 bông hoa', right: 'Số 5' },
          { left: '1 chú thỏ', right: 'Số 1' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '2 quả cam nối số 2, 5 bông hoa nối số 5, 1 chú thỏ nối số 1.',
        skillTag: 'Ghép cặp số lượng',
        difficulty: 'medium',
        ruleHints: [
          { pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Hãy đếm lại từng nhóm đồ vật trước khi chọn số tương ứng nhé.' }
        ]
      },
      {
        id: 'q-g1-01-5',
        order: 5,
        prompt: 'Khung 5 ô: Có mấy chấm tròn màu xanh đang có trong khung?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'ten_frame', count: 5, tens: 0, ones: 5 },
        options: ['3', '4', '5'],
        expectedAnswer: '5',
        explanation: 'Khung 5 ô đã được điền đầy đủ cả 5 chấm tròn.',
        skillTag: 'Khung 5 ô',
        difficulty: 'easy',
        ruleHints: [
          { pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Khung 5 ô được lấp đầy tức là có đúng 5 chấm tròn em nhé.' }
        ]
      },
      {
        id: 'q-g1-01-6',
        order: 6,
        prompt: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 3, 1, 4, 2',
        interactionType: 'number_line_order',
        options: ['1', '2', '3', '4'],
        expectedAnswer: '1,2,3,4',
        explanation: 'Thứ tự từ bé đến lớn là: 1, 2, 3, 4.',
        skillTag: 'Thứ tự các số đến 5',
        difficulty: 'medium',
        ruleHints: [
          { pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Bắt đầu từ số nhỏ nhất là 1, tiếp theo là 2, rồi đến 3, lớn nhất là 4.' }
        ]
      },
      {
        id: 'q-g1-01-7',
        order: 7,
        prompt: 'Thám tử có 2 viên kẹo, được tặng thêm 1 viên kẹo. Hỏi có tất cả mấy viên kẹo?',
        interactionType: 'number_input',
        visualConfig: { type: 'word_story', storyText: 'Có 2 viên kẹo, thêm 1 viên kẹo nữa.' },
        expectedAnswer: '3',
        explanation: '2 thêm 1 là 3 viên kẹo (2 + 1 = 3).',
        skillTag: 'Toán thêm bớt lời văn',
        difficulty: 'easy',
        ruleHints: [
          { pattern: 'WRONG_OPERATOR', hintText: '"Thêm vào" là làm phép tính cộng: 2 + 1 = 3 nhé!' }
        ]
      },
      {
        id: 'q-g1-01-8',
        order: 8,
        prompt: 'Số nào đứng liền sau số 4?',
        interactionType: 'single_choice',
        options: ['3', '4', '5', '6'],
        expectedAnswer: '5',
        explanation: 'Số liền sau số 4 lớn hơn 4 một đơn vị, đó là số 5.',
        skillTag: 'Số liền trước liền sau',
        difficulty: 'easy',
        ruleHints: [
          { pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Số liền sau là số đứng ngay phía sau khi đếm xuôi: 3, 4 rồi đến 5.' }
        ]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g1-02',
      title: 'Các số từ 6 đến 10 và Tách - Gộp số',
      grade: 1,
      topic: 'Số và Phép tính trong phạm vi 10',
      learningStandard: 'Nhận biết, đọc, viết số từ 6 đến 10; thực hiện thao tác tách - gộp số trong phạm vi 10.',
      description: 'Mở rộng phạm vi số đến 10, cấu tạo số và kỹ năng tách gộp trực quan.',
      durationMinutes: 15,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-02-1',
        order: 1,
        prompt: 'Đếm số lượng que tính màu vàng:',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 7, iconName: 'block' },
        options: ['6', '7', '8', '9'],
        expectedAnswer: '7',
        explanation: 'Có tất cả 7 que tính.',
        skillTag: 'Đếm đến 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm lại từng que: 1, 2, 3, 4, 5, 6, 7 que tính.' }]
      },
      {
        id: 'q-g1-02-2',
        order: 2,
        prompt: 'Gộp 4 và 3 được mấy? Điền số vào ô trống:',
        interactionType: 'number_input',
        expectedAnswer: '7',
        explanation: 'Gộp 4 và 3 được 7 (4 + 3 = 7).',
        skillTag: 'Tách gộp số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '4 que thêm 3 que nữa là 7 que tính nhé.' }]
      },
      {
        id: 'q-g1-02-3',
        order: 3,
        prompt: 'Chọn dấu thích hợp để điền vào chỗ chấm: 8 ... 10',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '8 bé hơn 10 nên 8 < 10.',
        skillTag: 'So sánh số đến 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '8 ít hơn 10 nên mũi nhọn chĩa về số 8 nhé: 8 < 10.' }]
      },
      {
        id: 'q-g1-02-4',
        order: 4,
        prompt: 'Nối sơ đồ tách gộp với kết quả tương ứng:',
        interactionType: 'expression_match',
        pairs: [
          { left: 'Gộp 5 và 5', right: 'Được 10' },
          { left: 'Gộp 6 và 2', right: 'Được 8' },
          { left: 'Tách 9 thành 5 và', right: '4' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '5 gộp 5 thành 10, 6 gộp 2 thành 8, 9 tách 5 còn 4.',
        skillTag: 'Tách gộp số',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Hãy đếm que tính để kiểm tra lại sơ đồ tách gộp nhé.' }]
      },
      {
        id: 'q-g1-02-5',
        order: 5,
        prompt: 'Khung 10 ô: Cần thêm mấy chấm tròn nữa để khung 10 ô được lấp đầy (hiện có 8 chấm)?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'ten_frame', count: 8, tens: 0, ones: 8 },
        options: ['1', '2', '3'],
        expectedAnswer: '2',
        explanation: 'Khung có 10 ô, hiện có 8 chấm tròn, còn trống 2 ô. Vậy cần thêm 2 chấm tròn nữa.',
        skillTag: 'Khung 10 ô bổ sung',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Quan sát các ô còn trống trong khung 10: có đúng 2 ô trắng.' }]
      },
      {
        id: 'q-g1-02-6',
        order: 6,
        prompt: 'Trên trục số từ 0 đến 10, số nào đứng ngay liền trước số 9?',
        interactionType: 'number_input',
        visualConfig: { type: 'number_line', min: 0, max: 10, target: 8 },
        expectedAnswer: '8',
        explanation: 'Số đứng liền trước số 9 là số 8.',
        skillTag: 'Trục số đến 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Số liền trước là số nhỏ hơn 1 đơn vị: 9 bớt 1 còn 8.' }]
      },
      {
        id: 'q-g1-02-7',
        order: 7,
        prompt: 'Cành cây có 7 chú chim, bay đi 2 chú chim. Hỏi còn lại bao nhiêu chú chim?',
        interactionType: 'single_choice',
        visualConfig: { type: 'word_story', storyText: 'Có 7 con chim, 2 con bay đi.' },
        options: ['4', '5', '6', '9'],
        expectedAnswer: '5',
        explanation: '7 bớt 2 còn 5 (7 - 2 = 5 chú chim).',
        skillTag: 'Toán bớt có lời văn',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Chim bay đi là phép trừ bớt đi: 7 - 2 = 5 chứ không phải 7 + 2 đâu nhé.' }]
      },
      {
        id: 'q-g1-02-8',
        order: 8,
        prompt: 'Sắp xếp dãy số sau theo thứ tự giảm dần (từ lớn đến bé): 6, 10, 8, 7',
        interactionType: 'number_line_order',
        options: ['10', '8', '7', '6'],
        expectedAnswer: '10,8,7,6',
        explanation: 'Thứ tự từ lớn đến bé là: 10, 8, 7, 6.',
        skillTag: 'Sắp xếp giảm dần',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Số lớn nhất là 10, rồi đến 8, đến 7, bé nhất là 6.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g1-03',
      title: 'Phép cộng trong phạm vi 10',
      grade: 1,
      topic: 'Phép cộng và phép trừ phạm vi 10',
      learningStandard: 'Thực hiện được phép cộng trong phạm vi 10; tính nhẩm trong phạm vi 10.',
      description: 'Học sinh làm quen với dấu cộng (+) và bảng cộng trong phạm vi 10.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-03-1',
        order: 1,
        prompt: 'Tính kết quả: 3 + 4 = ?',
        interactionType: 'number_input',
        expectedAnswer: '7',
        explanation: '3 cộng 4 bằng 7.',
        skillTag: 'Cộng phạm vi 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm tiếp từ 3 thêm 4 bước: 4, 5, 6, 7 nhé!' }]
      },
      {
        id: 'q-g1-03-2',
        order: 2,
        prompt: 'Chọn phép tính thích hợp cho bức tranh: Có 5 quả bóng bay đỏ và 3 quả bóng bay xanh.',
        interactionType: 'single_choice',
        options: ['5 + 3 = 8', '5 - 3 = 2', '5 + 2 = 7', '3 + 3 = 6'],
        expectedAnswer: '5 + 3 = 8',
        explanation: 'Gộp bóng đỏ và bóng xanh: 5 + 3 = 8.',
        skillTag: 'Nhận biết phép tính',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Cần gộp cả hai loại bóng lại nên ta dùng phép cộng: 5 + 3 = 8.' }]
      },
      {
        id: 'q-g1-03-3',
        order: 3,
        prompt: 'Điền dấu so sánh thích hợp vào chỗ chấm: 4 + 2 ... 7',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '4 + 2 = 6, mà 6 < 7 nên 4 + 2 < 7.',
        skillTag: 'So sánh biểu thức',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Tính 4 + 2 = 6 trước. Vì 6 bé hơn 7 nên 6 < 7.' }]
      },
      {
        id: 'q-g1-03-4',
        order: 4,
        prompt: 'Nối phép tính với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '6 + 2', right: '8' },
          { left: '4 + 5', right: '9' },
          { left: '7 + 3', right: '10' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '6 + 2 = 8, 4 + 5 = 9, 7 + 3 = 10.',
        skillTag: 'Bảng cộng 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Đếm que tính hoặc ngón tay để nhẩm từng phép tính.' }]
      },
      {
        id: 'q-g1-03-5',
        order: 5,
        prompt: 'Khung 10 ô: 5 chấm đỏ và 4 chấm xanh. Có tất cả mấy chấm tròn?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'ten_frame', count: 9, tens: 0, ones: 9 },
        options: ['8', '9', '10'],
        expectedAnswer: '9',
        explanation: '5 + 4 = 9 chấm tròn.',
        skillTag: 'Cộng trên khung 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Khung 10 ô chỉ còn thiếu 1 ô trống duy nhất, tức là có 9 chấm!' }]
      },
      {
        id: 'q-g1-03-6',
        order: 6,
        prompt: 'Điền số còn thiếu vào chỗ chấm: 6 + ... = 9',
        interactionType: 'number_input',
        expectedAnswer: '3',
        explanation: 'Vì 6 + 3 = 9 nên số cần điền là 3.',
        skillTag: 'Tìm số hạng còn thiếu',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Từ 6 đếm tiếp mấy bước để đến 9? 7, 8, 9 (3 bước).' }]
      },
      {
        id: 'q-g1-03-7',
        order: 7,
        prompt: 'Chú thỏ nhảy từ vạch 2 sang phải 5 bước trên trục số. Thỏ dừng lại ở số mấy?',
        interactionType: 'number_input',
        visualConfig: { type: 'number_line', min: 0, max: 10, target: 7 },
        expectedAnswer: '7',
        explanation: '2 + 5 = 7.',
        skillTag: 'Cộng trên trục số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: '2 nhảy thêm 5 bước: 3, 4, 5, 6, 7.' }]
      },
      {
        id: 'q-g1-03-8',
        order: 8,
        prompt: 'Mai có 4 bông hoa, Lan tặng Mai 4 bông hoa nữa. Hỏi Mai có tất cả bao nhiêu bông hoa?',
        interactionType: 'single_choice',
        options: ['6', '7', '8', '9'],
        expectedAnswer: '8',
        explanation: '4 + 4 = 8 bông hoa.',
        skillTag: 'Bài toán thêm vào',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '4 bông hoa thêm 4 bông hoa nữa: 4 + 4 = 8.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g1-04',
      title: 'Phép trừ trong phạm vi 10',
      grade: 1,
      topic: 'Phép cộng và phép trừ phạm vi 10',
      learningStandard: 'Thực hiện được phép trừ trong phạm vi 10; tính nhẩm thành thạo.',
      description: 'Làm quen với dấu trừ (-) và ý nghĩa của việc bớt đi, tách số.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-04-1',
        order: 1,
        prompt: 'Tính: 9 - 4 = ?',
        interactionType: 'number_input',
        expectedAnswer: '5',
        explanation: '9 bớt 4 còn 5.',
        skillTag: 'Trừ phạm vi 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Đây là phép trừ (-) bớt đi nhé, 9 - 4 = 5 chứ không phải cộng đâu.' }]
      },
      {
        id: 'q-g1-04-2',
        order: 2,
        prompt: 'Có 8 củ cà rốt, chú thỏ đã ăn mất 3 củ. Hỏi còn lại bao nhiêu củ cà rốt?',
        interactionType: 'single_choice',
        options: ['4', '5', '6', '11'],
        expectedAnswer: '5',
        explanation: '8 - 3 = 5 củ cà rốt.',
        skillTag: 'Toán bớt đi',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Thỏ ăn mất tức là bớt đi: 8 - 3 = 5.' }]
      },
      {
        id: 'q-g1-04-3',
        order: 3,
        prompt: 'Chọn dấu thích hợp điền vào ô trống: 10 - 2 ... 8',
        interactionType: 'operator_pick',
        options: ['=', '>', '<'],
        expectedAnswer: '=',
        explanation: '10 - 2 = 8, vậy 10 - 2 = 8.',
        skillTag: 'So sánh giá trị',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '10 - 2 bằng 8, hai bên bằng nhau nên điền dấu =.' }]
      },
      {
        id: 'q-g1-04-4',
        order: 4,
        prompt: 'Nối phép trừ với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '7 - 3', right: '4' },
          { left: '10 - 6', right: '4' },
          { left: '8 - 2', right: '6' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '7 - 3 = 4, 10 - 6 = 4, 8 - 2 = 6.',
        skillTag: 'Bảng trừ 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm lùi từ số bị trừ để tìm kết quả chính xác.' }]
      },
      {
        id: 'q-g1-04-5',
        order: 5,
        prompt: 'Khung 10 ô có 7 chấm tròn. Gạch bớt đi 3 chấm tròn thì còn lại mấy chấm?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'ten_frame', count: 4, tens: 0, ones: 4 },
        options: ['3', '4', '5'],
        expectedAnswer: '4',
        explanation: '7 - 3 = 4 chấm tròn.',
        skillTag: 'Trừ trên khung 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '7 chấm bớt 3 chấm còn lại 4 chấm tròn.' }]
      },
      {
        id: 'q-g1-04-6',
        order: 6,
        prompt: 'Điền số thích hợp vào chỗ chấm: 8 - ... = 6',
        interactionType: 'number_input',
        expectedAnswer: '2',
        explanation: 'Vì 8 - 2 = 6 nên số cần điền là 2.',
        skillTag: 'Tìm số trừ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: '8 bớt đi mấy để còn 6? 8 bớt 2 còn 6.' }]
      },
      {
        id: 'q-g1-04-7',
        order: 7,
        prompt: 'Chú sóc đứng ở số 9 trên trục số và lùi lại 4 bước. Sóc đang ở số mấy?',
        interactionType: 'number_input',
        visualConfig: { type: 'number_line', min: 0, max: 10, target: 5 },
        expectedAnswer: '5',
        explanation: '9 lùi 4 bước: 9 - 4 = 5.',
        skillTag: 'Trừ trên trục số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Đếm lùi từ 9: 8, 7, 6, 5.' }]
      },
      {
        id: 'q-g1-04-8',
        order: 8,
        prompt: 'Hộp có 10 chiếc bút chì, Nam lấy ra 5 chiếc. Trong hộp còn lại bao nhiêu chiếc?',
        interactionType: 'single_choice',
        options: ['4', '5', '6', '15'],
        expectedAnswer: '5',
        explanation: '10 - 5 = 5 chiếc bút.',
        skillTag: 'Bài toán bớt có lời văn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Lấy ra là phép trừ: 10 - 5 = 5.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g1-05',
      title: 'Hình vuông, Hình tròn, Hình tam giác, Hình chữ nhật',
      grade: 1,
      topic: 'Hình học trực quan',
      learningStandard: 'Nhận biết được hình vuông, hình tròn, hình tam giác, hình chữ nhật qua mô hình và vật thật.',
      description: 'Khám phá các hình hình học cơ bản trong đời sống xung quanh.',
      durationMinutes: 15,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-05-1',
        order: 1,
        prompt: 'Biển báo giao thông hình gì có 3 cạnh và 3 góc nhọn?',
        interactionType: 'single_choice',
        options: ['Hình tam giác', 'Hình vuông', 'Hình tròn', 'Hình chữ nhật'],
        expectedAnswer: 'Hình tam giác',
        explanation: 'Hình tam giác có 3 cạnh.',
        skillTag: 'Nhận biết hình tam giác',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Tam giác có 3 cạnh nối với nhau tạo thành 3 góc.' }]
      },
      {
        id: 'q-g1-05-2',
        order: 2,
        prompt: 'Đồng hồ treo tường hình tròn không có cạnh nào. Đúng hay Sai?',
        interactionType: 'single_choice',
        options: ['Đúng', 'Sai'],
        expectedAnswer: 'Đúng',
        explanation: 'Hình tròn là đường cong khép kín, không có các cạnh thẳng hay góc.',
        skillTag: 'Đặc điểm hình tròn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Hình tròn cong tròn đều, lăn được và không có góc nhọn.' }]
      },
      {
        id: 'q-g1-05-3',
        order: 3,
        prompt: 'Khung ảnh có 4 cạnh dài bằng nhau là hình gì?',
        interactionType: 'single_choice',
        options: ['Hình vuông', 'Hình chữ nhật', 'Hình tam giác', 'Hình tròn'],
        expectedAnswer: 'Hình vuông',
        explanation: 'Hình vuông có 4 cạnh đều dài bằng nhau.',
        skillTag: 'Đặc điểm hình vuông',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Hình vuông có 4 cạnh dài bằng nhau, còn hình chữ nhật có 2 cạnh dài và 2 cạnh ngắn.' }]
      },
      {
        id: 'q-g1-05-4',
        order: 4,
        prompt: 'Nối tên hình với đồ vật quen thuộc trong lớp học:',
        interactionType: 'expression_match',
        pairs: [
          { left: 'Bảng lớp', right: 'Hình chữ nhật' },
          { left: 'Mặt trống đồng', right: 'Hình tròn' },
          { left: 'Khăn quàng đỏ', right: 'Hình tam giác' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: 'Bảng lớp là hình chữ nhật, mặt trống là hình tròn, khăn quàng là hình tam giác.',
        skillTag: 'Hình học thực tế',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Quan sát hình dạng viền ngoài của đồ vật.' }]
      },
      {
        id: 'q-g1-05-5',
        order: 5,
        prompt: 'Một hình chữ nhật có bao nhiêu cạnh?',
        interactionType: 'number_input',
        expectedAnswer: '4',
        explanation: 'Hình chữ nhật có 4 cạnh (2 cạnh dài và 2 cạnh ngắn).',
        skillTag: 'Số cạnh hình chữ nhật',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm 4 cạnh xung quanh hình chữ nhật nhé!' }]
      },
      {
        id: 'q-g1-05-6',
        order: 6,
        prompt: 'Ghép 2 hình tam giác nhỏ bằng nhau có thể tạo thành hình gì?',
        interactionType: 'single_choice',
        options: ['Hình vuông', 'Hình tròn'],
        expectedAnswer: 'Hình vuông',
        explanation: 'Hai hình tam giác vuông cân ghép lại tạo thành một hình vuông.',
        skillTag: 'Ghép hình sáng tạo',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Hình tròn không thể ghép từ các hình tam giác có cạnh thẳng được.' }]
      },
      {
        id: 'q-g1-05-7',
        order: 7,
        prompt: 'Bánh xe đạp có hình gì để lăn tròn được trên đường?',
        interactionType: 'single_choice',
        options: ['Hình tròn', 'Hình vuông', 'Hình tam giác'],
        expectedAnswer: 'Hình tròn',
        explanation: 'Hình tròn không có góc gồ ghề nên lăn được trơn tru.',
        skillTag: 'Ứng dụng hình tròn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Chỉ có hình tròn mới lăn được bon bon trên đường.' }]
      },
      {
        id: 'q-g1-05-8',
        order: 8,
        prompt: 'Một ngôi nhà được vẽ bằng: 1 hình tam giác (mái nhà) và 1 hình vuông (thân nhà). Có tất cả mấy hình?',
        interactionType: 'number_input',
        expectedAnswer: '2',
        explanation: '1 + 1 = 2 hình.',
        skillTag: 'Đếm hình',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '1 mái nhà + 1 thân nhà = 2 hình.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g1-06',
      title: 'Các số trong phạm vi 20 và Số Mười (1 chục)',
      grade: 1,
      topic: 'Số và Phép tính trong phạm vi 20',
      learningStandard: 'Đọc, viết, so sánh các số từ 10 đến 20; nhận biết 1 chục = 10 đơn vị.',
      description: 'Làm quen với khái niệm chục và cấu tạo số có hai chữ số từ 10 đến 20.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-06-1',
        order: 1,
        prompt: '1 bó que tính gồm 10 que rời được gọi là gì?',
        interactionType: 'single_choice',
        options: ['1 chục', '1 trăm', '2 chục', '1 đơn vị'],
        expectedAnswer: '1 chục',
        explanation: '1 chục = 10 đơn vị.',
        skillTag: 'Khái niệm 1 chục',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: '10 đơn vị bó lại thành đúng 1 chục que tính.' }]
      },
      {
        id: 'q-g1-06-2',
        order: 2,
        prompt: '1 chục và 4 đơn vị là số mấy? Điền số vào ô trống:',
        interactionType: 'number_input',
        expectedAnswer: '14',
        explanation: '1 chục (10) và 4 đơn vị là 14.',
        skillTag: 'Cấu tạo số phạm vi 20',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Chữ số hàng chục viết trước (1), chữ số hàng đơn vị viết sau (4): 14.' }]
      },
      {
        id: 'q-g1-06-3',
        order: 3,
        prompt: 'Chọn dấu so sánh đúng: 15 ... 18',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '15 bé hơn 18 vì hàng đơn vị 5 < 8.',
        skillTag: 'So sánh số phạm vi 20',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Cả hai số đều có 1 chục, so sánh hàng đơn vị: 5 bé hơn 8 nên 15 < 18.' }]
      },
      {
        id: 'q-g1-06-4',
        order: 4,
        prompt: 'Nối số với cách đọc tương ứng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '11', right: 'Mười một' },
          { left: '15', right: 'Mười lăm' },
          { left: '20', right: 'Hai mươi' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '11: Mười một, 15: Mười lăm, 20: Hai mươi (2 chục).',
        skillTag: 'Đọc số phạm vi 20',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Chú ý số 15 đọc là mười lăm chứ không đọc là mười năm.' }]
      },
      {
        id: 'q-g1-06-5',
        order: 5,
        prompt: 'Mô hình que tính: 1 bó chục và 7 que rời là số nào?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'bundles', tens: 1, ones: 7 },
        options: ['17', '71', '10'],
        expectedAnswer: '17',
        explanation: '1 chục và 7 que lẻ ghép lại là số 17.',
        skillTag: 'Mô hình que tính chục đơn vị',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: '1 bó chục viết số 1 trước, 7 que rời viết số 7 sau: số 17 (không phải 71).' }]
      },
      {
        id: 'q-g1-06-6',
        order: 6,
        prompt: 'Sắp xếp các số sau theo thứ tự tăng dần: 14, 11, 19, 16',
        interactionType: 'number_line_order',
        options: ['11', '14', '16', '19'],
        expectedAnswer: '11,14,16,19',
        explanation: 'Thứ tự tăng dần: 11, 14, 16, 19.',
        skillTag: 'Thứ tự số đến 20',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'So sánh hàng đơn vị: 1 < 4 < 6 < 9.' }]
      },
      {
        id: 'q-g1-06-7',
        order: 7,
        prompt: 'Số liền sau của số 19 là số nào?',
        interactionType: 'number_input',
        expectedAnswer: '20',
        explanation: '19 thêm 1 là 20 (hai mươi).',
        skillTag: 'Số liền sau',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm tiếp sau 19 là 20 (2 chục).' }]
      },
      {
        id: 'q-g1-06-8',
        order: 8,
        prompt: 'Số 16 gồm mấy chục và mấy đơn vị?',
        interactionType: 'single_choice',
        options: ['1 chục và 6 đơn vị', '6 chục và 1 đơn vị', '1 chục và 0 đơn vị'],
        expectedAnswer: '1 chục và 6 đơn vị',
        explanation: '16 = 10 + 6, gồm 1 chục và 6 đơn vị.',
        skillTag: 'Cấu tạo số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Số 1 đứng ở hàng chục (1 chục), số 6 đứng ở hàng đơn vị (6 đơn vị).' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g1-07',
      title: 'Phép cộng không nhớ trong phạm vi 20',
      grade: 1,
      topic: 'Số và Phép tính trong phạm vi 20',
      learningStandard: 'Thực hiện cộng số có hai chữ số với số có một chữ số dạng 14 + 3 không nhớ.',
      description: 'Phương pháp cộng bằng cách giữ nguyên hàng chục và cộng các số ở hàng đơn vị.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-07-1',
        order: 1,
        prompt: 'Tính: 12 + 3 = ?',
        interactionType: 'number_input',
        expectedAnswer: '15',
        explanation: '2 + 3 = 5, giữ 1 chục ta được 15.',
        skillTag: 'Cộng dạng 12 + 3',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Cộng hàng đơn vị trước: 2 + 3 = 5, ghép với 1 chục là 15.' }]
      },
      {
        id: 'q-g1-07-2',
        order: 1,
        prompt: 'Tính: 15 + 4 = ?',
        interactionType: 'single_choice',
        options: ['18', '19', '20', '17'],
        expectedAnswer: '19',
        explanation: '5 + 4 = 9, ghép 1 chục là 19.',
        skillTag: 'Cộng dạng 15 + 4',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '5 cộng 4 bằng 9, thêm 1 chục phía trước là 19.' }]
      },
      {
        id: 'q-g1-07-3',
        order: 3,
        prompt: 'So sánh: 13 + 2 ... 16',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '13 + 2 = 15, mà 15 < 16.',
        skillTag: 'So sánh biểu thức',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '13 + 2 = 15. 15 bé hơn 16 nên điền dấu <.' }]
      },
      {
        id: 'q-g1-07-4',
        order: 4,
        prompt: 'Nối phép tính với kết quả thích hợp:',
        interactionType: 'expression_match',
        pairs: [
          { left: '10 + 7', right: '17' },
          { left: '14 + 2', right: '16' },
          { left: '11 + 5', right: '16' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '10 + 7 = 17, 14 + 2 = 16, 11 + 5 = 16.',
        skillTag: 'Cộng không nhớ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Cộng các số hàng đơn vị lại với nhau trước.' }]
      },
      {
        id: 'q-g1-07-5',
        order: 5,
        prompt: 'Mô hình que tính: 1 bó chục và 3 que lẻ, thêm vào 4 que lẻ. Có tất cả mấy que?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'bundles', tens: 1, ones: 7 },
        options: ['16', '17', '18'],
        expectedAnswer: '17',
        explanation: '3 que lẻ + 4 que lẻ = 7 que lẻ. Thêm 1 bó chục là 17.',
        skillTag: 'Mô hình trực quan que tính',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '3 + 4 = 7 que lẻ, cùng 1 bó chục thành 17 que.' }]
      },
      {
        id: 'q-g1-07-6',
        order: 6,
        prompt: 'Điền số thích hợp: 11 + ... = 18',
        interactionType: 'number_input',
        expectedAnswer: '7',
        explanation: 'Vì 1 + 7 = 8 nên 11 + 7 = 18.',
        skillTag: 'Tìm số hạng',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: '1 chục đã giống nhau, 1 thêm mấy bằng 8? 1 thêm 7.' }]
      },
      {
        id: 'q-g1-07-7',
        order: 7,
        prompt: 'Bình hoa có 12 bông, mẹ cắm thêm 5 bông hoa nữa. Hỏi có tất cả bao nhiêu bông hoa?',
        interactionType: 'number_input',
        expectedAnswer: '17',
        explanation: '12 + 5 = 17 bông hoa.',
        skillTag: 'Bài toán thêm hoa',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '12 + 5: 2 + 5 = 7, thêm 1 chục là 17.' }]
      },
      {
        id: 'q-g1-07-8',
        order: 8,
        prompt: 'Thám tử nhảy trên trục số từ vạch 14 sang phải 3 bước. Điểm dừng là số mấy?',
        interactionType: 'number_input',
        visualConfig: { type: 'number_line', min: 10, max: 20, target: 17 },
        expectedAnswer: '17',
        explanation: '14 + 3 = 17.',
        skillTag: 'Trục số 10-20',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: '14 đếm tiếp 3 bước: 15, 16, 17.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g1-08',
      title: 'Phép trừ không nhớ trong phạm vi 20',
      grade: 1,
      topic: 'Số và Phép tính trong phạm vi 20',
      learningStandard: 'Thực hiện trừ số có hai chữ số cho số có một chữ số dạng 17 - 4 không nhớ.',
      description: 'Luyện tập kỹ năng trừ hàng đơn vị và giữ nguyên hàng chục.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-08-1',
        order: 1,
        prompt: 'Tính: 18 - 5 = ?',
        interactionType: 'number_input',
        expectedAnswer: '13',
        explanation: '8 - 5 = 3, giữ 1 chục ta được 13.',
        skillTag: 'Trừ dạng 18 - 5',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Lấy 8 đơn vị trừ 5 đơn vị còn 3 đơn vị, giữ 1 chục là 13.' }]
      },
      {
        id: 'q-g1-08-2',
        order: 2,
        prompt: 'Tính: 16 - 6 = ?',
        interactionType: 'single_choice',
        options: ['10', '1', '12', '0'],
        expectedAnswer: '10',
        explanation: '6 - 6 = 0, còn lại 1 chục (10).',
        skillTag: 'Trừ hết đơn vị',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: '16 trừ đi 6 que lẻ thì còn nguyên vẹn 1 bó chục (số 10).' }]
      },
      {
        id: 'q-g1-08-3',
        order: 3,
        prompt: 'Chọn dấu so sánh đúng: 19 - 4 ... 15',
        interactionType: 'operator_pick',
        options: ['=', '>', '<'],
        expectedAnswer: '=',
        explanation: '19 - 4 = 15, nên 19 - 4 = 15.',
        skillTag: 'So sánh phép trừ',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '19 - 4 = 15, hai bên đều bằng 15 nên điền dấu =.' }]
      },
      {
        id: 'q-g1-08-4',
        order: 4,
        prompt: 'Nối phép trừ với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '17 - 2', right: '15' },
          { left: '15 - 3', right: '12' },
          { left: '14 - 4', right: '10' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '17 - 2 = 15, 15 - 3 = 12, 14 - 4 = 10.',
        skillTag: 'Bảng trừ phạm vi 20',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Lấy các số hàng đơn vị trừ cho nhau.' }]
      },
      {
        id: 'q-g1-08-5',
        order: 5,
        prompt: 'Có 1 bó chục và 8 que tính rời. Bớt đi 5 que tính rời thì còn lại bao nhiêu que?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'bundles', tens: 1, ones: 3 },
        options: ['13', '15', '3'],
        expectedAnswer: '13',
        explanation: '8 bớt 5 còn 3 que rời. Còn 1 bó chục và 3 que là 13 que tính.',
        skillTag: 'Mô hình bớt que tính',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Còn 1 bó chục và 3 que lẻ ghép lại là 13 que.' }]
      },
      {
        id: 'q-g1-08-6',
        order: 6,
        prompt: 'Điền số thích hợp: 17 - ... = 11',
        interactionType: 'number_input',
        expectedAnswer: '6',
        explanation: 'Vì 7 - 6 = 1 nên 17 - 6 = 11.',
        skillTag: 'Tìm số trừ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: '7 trừ mấy bằng 1? 7 trừ 6 bằng 1.' }]
      },
      {
        id: 'q-g1-08-7',
        order: 7,
        prompt: 'Lớp học có 19 bạn, 5 bạn ra sân tập thể dục. Trong lớp còn lại bao nhiêu bạn?',
        interactionType: 'single_choice',
        options: ['13', '14', '15', '16'],
        expectedAnswer: '14',
        explanation: '19 - 5 = 14 bạn.',
        skillTag: 'Toán lời văn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '9 - 5 = 4, thêm 1 chục là 14 bạn.' }]
      },
      {
        id: 'q-g1-08-8',
        order: 8,
        prompt: 'Thám tử đứng ở số 18 trên trục số và lùi 6 bước sang trái. Điểm dừng là số mấy?',
        interactionType: 'number_input',
        visualConfig: { type: 'number_line', min: 10, max: 20, target: 12 },
        expectedAnswer: '12',
        explanation: '18 - 6 = 12.',
        skillTag: 'Trừ trên trục số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: '18 lùi 6 bước: 8 - 6 = 2, còn 12.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g1-09',
      title: 'Đo độ dài và Xăng-ti-mét (cm)',
      grade: 1,
      topic: 'Đo lường',
      learningStandard: 'Làm quen với biểu tượng độ dài; đơn vị đo độ dài xăng-ti-mét (viết tắt là cm); dùng thước có vạch chia cm để đo.',
      description: 'Học sinh tập sử dụng thước kẻ có vạch chia số đo centimet.',
      durationMinutes: 15,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-09-1',
        order: 1,
        prompt: 'Xăng-ti-mét được viết tắt là gì?',
        interactionType: 'single_choice',
        options: ['cm', 'mm', 'dm', 'm'],
        expectedAnswer: 'cm',
        explanation: 'Xăng-ti-mét viết tắt là cm.',
        skillTag: 'Ký hiệu xăng-ti-mét',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Xăng-ti-mét viết tắt là 2 chữ cái c và m liền nhau: cm.' }]
      },
      {
        id: 'q-g1-09-2',
        order: 2,
        prompt: 'Bút chì đặt một đầu ở vạch 0 cm, đầu kia chỉ vào vạch 8 cm. Hỏi bút chì dài bao nhiêu cm?',
        interactionType: 'number_input',
        expectedAnswer: '8',
        explanation: 'Đầu bút chì ở vạch 0, đầu kia ở vạch 8 nên bút chì dài đúng 8 cm.',
        skillTag: 'Đo độ dài bằng thước',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Vì đầu kia ở vạch 0 nên độ dài chính bằng số chỉ ở đầu ngọn bút: 8 cm.' }]
      },
      {
        id: 'q-g1-09-3',
        order: 3,
        prompt: 'So sánh: 7 cm + 2 cm ... 10 cm',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '7 cm + 2 cm = 9 cm. Vì 9 cm < 10 cm nên điền dấu <.',
        skillTag: 'So sánh số đo',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '7 + 2 = 9 cm. 9 cm bé hơn 10 cm nên điền dấu <.' }]
      },
      {
        id: 'q-g1-09-4',
        order: 4,
        prompt: 'Nối phép tính đo lường với kết quả thích hợp:',
        interactionType: 'expression_match',
        pairs: [
          { left: '10 cm + 5 cm', right: '15 cm' },
          { left: '18 cm - 4 cm', right: '14 cm' },
          { left: '6 cm + 4 cm', right: '10 cm' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '10 + 5 = 15 cm; 18 - 4 = 14 cm; 6 + 4 = 10 cm.',
        skillTag: 'Tính toán với đơn vị cm',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Tính nhẩm các con số và giữ nguyên chữ cm phía sau.' }]
      },
      {
        id: 'q-g1-09-5',
        order: 5,
        prompt: 'Một cục tẩy đặt một đầu ở vạch 2 cm và đầu kia ở vạch 6 cm. Cục tẩy dài bao nhiêu cm?',
        interactionType: 'number_input',
        expectedAnswer: '4',
        explanation: 'Lấy vạch đích trừ vạch bắt đầu: 6 - 2 = 4 cm.',
        skillTag: 'Đo không từ vạch 0',
        difficulty: 'hard',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Chú ý: Cục tẩy không bắt đầu từ 0 mà từ vạch 2 cm! Lấy 6 - 2 = 4 cm nhé.' }]
      },
      {
        id: 'q-g1-09-6',
        order: 6,
        prompt: 'Đoạn thẳng AB dài 12 cm, đoạn thẳng CD dài 7 cm. Đoạn thẳng AB dài hơn đoạn thẳng CD bao nhiêu cm?',
        interactionType: 'single_choice',
        options: ['5 cm', '6 cm', '7 cm', '19 cm'],
        expectedAnswer: '5 cm',
        explanation: '12 - 7 = 5 cm.',
        skillTag: 'Toán so sánh độ dài',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Muốn biết dài hơn bao nhiêu ta làm phép trừ: 12 - 7 = 5 cm.' }]
      },
      {
        id: 'q-g1-09-7',
        order: 7,
        prompt: 'Gang tay của em bé dài khoảng bao nhiêu?',
        interactionType: 'single_choice',
        options: ['12 cm', '120 cm', '1 cm'],
        expectedAnswer: '12 cm',
        explanation: 'Một gang tay trẻ em khoảng 10 - 13 cm, hợp lý nhất là 12 cm.',
        skillTag: 'Ước lượng độ dài',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: '120 cm là rất dài (hơn cả chiều cao của bé lớp 1), 1 cm thì quá ngắn như hạt gạo.' }]
      },
      {
        id: 'q-g1-09-8',
        order: 8,
        prompt: 'Tính: 14 cm - 4 cm = ? Điền số cm:',
        interactionType: 'number_input',
        expectedAnswer: '10',
        acceptableAnswers: ['10', '10 cm'],
        explanation: '14 - 4 = 10 cm.',
        skillTag: 'Phép trừ đo lường',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '14 - 4 = 10 cm.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g1-10',
      title: 'Các số tròn chục từ 10 đến 90',
      grade: 1,
      topic: 'Các số đến 100',
      learningStandard: 'Đọc, viết, so sánh các số tròn chục từ 10 đến 90; cộng trừ nhẩm các số tròn chục.',
      description: 'Làm quen với các số tròn chục: 10, 20, 30, 40, 50, 60, 70, 80, 90.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-10-1',
        order: 1,
        prompt: '5 chục que tính là số nào?',
        interactionType: 'single_choice',
        options: ['50', '5', '55', '15'],
        expectedAnswer: '50',
        explanation: '5 chục là 50 (năm mươi).',
        skillTag: 'Số tròn chục',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: '5 chục có chữ số 0 ở hàng đơn vị: 50.' }]
      },
      {
        id: 'q-g1-10-2',
        order: 2,
        prompt: 'Tính nhẩm: 30 + 20 = ?',
        interactionType: 'number_input',
        expectedAnswer: '50',
        explanation: '3 chục + 2 chục = 5 chục (50).',
        skillTag: 'Cộng số tròn chục',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Nhẩm: 3 chục + 2 chục = 5 chục, viết là 50.' }]
      },
      {
        id: 'q-g1-10-3',
        order: 3,
        prompt: 'Chọn dấu so sánh đúng: 70 ... 40 + 30',
        interactionType: 'operator_pick',
        options: ['=', '>', '<'],
        expectedAnswer: '=',
        explanation: '40 + 30 = 70. Do đó 70 = 70.',
        skillTag: 'So sánh số tròn chục',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '40 + 30 = 70, hai bên đều là 70 nên bằng nhau (=).' }]
      },
      {
        id: 'q-g1-10-4',
        order: 4,
        prompt: 'Nối phép tính với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '80 - 30', right: '50' },
          { left: '40 + 50', right: '90' },
          { left: '60 - 20', right: '40' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '80 - 30 = 50; 40 + 50 = 90; 60 - 20 = 40.',
        skillTag: 'Cộng trừ nhẩm tròn chục',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Trừ các chữ số hàng chục và thêm số 0 ở tận cùng.' }]
      },
      {
        id: 'q-g1-10-5',
        order: 5,
        prompt: 'Mô hình có 6 bó chục que tính. Bớt đi 2 bó chục thì còn mấy que tính?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'bundles', tens: 4, ones: 0 },
        options: ['40', '4', '20'],
        expectedAnswer: '40',
        explanation: '6 chục bớt 2 chục còn 4 chục (40 que tính).',
        skillTag: 'Mô hình bó chục que tính',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: '4 bó chục là 40 que tính (chứ không phải 4 que rời đâu nhé).' }]
      },
      {
        id: 'q-g1-10-6',
        order: 6,
        prompt: 'Sắp xếp các số tròn chục theo thứ tự tăng dần: 80, 20, 60, 40',
        interactionType: 'number_line_order',
        options: ['20', '40', '60', '80'],
        expectedAnswer: '20,40,60,80',
        explanation: 'Thứ tự tăng dần: 20, 40, 60, 80.',
        skillTag: 'Thứ tự số tròn chục',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'So sánh hàng chục: 2 chục < 4 chục < 6 chục < 8 chục.' }]
      },
      {
        id: 'q-g1-10-7',
        order: 7,
        prompt: 'Tính: 90 - 50 = ? Điền số:',
        interactionType: 'number_input',
        expectedAnswer: '40',
        explanation: '9 chục - 5 chục = 4 chục (40).',
        skillTag: 'Trừ số tròn chục',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '9 - 5 = 4, thêm số 0 là 40.' }]
      },
      {
        id: 'q-g1-10-8',
        order: 8,
        prompt: 'Bác nông dân thu hoạch được 50 quả cam, đã bán đi 20 quả. Bác còn lại bao nhiêu quả cam?',
        interactionType: 'single_choice',
        options: ['30 quả', '70 quả', '25 quả', '40 quả'],
        expectedAnswer: '30 quả',
        explanation: '50 - 20 = 30 quả cam.',
        skillTag: 'Toán thực tế số tròn chục',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Đã bán đi là bớt đi: 50 - 20 = 30 quả cam.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g1-11',
      title: 'Các số có hai chữ số đến 100',
      grade: 1,
      topic: 'Các số đến 100',
      learningStandard: 'Đọc, viết các số có hai chữ số đến 100; phân tích cấu tạo chục và đơn vị.',
      description: 'Nắm vững cấu tạo thập phân của các số từ 21 đến 99 và số 100.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-11-1',
        order: 1,
        prompt: 'Số gồm 4 chục và 7 đơn vị viết là số nào?',
        interactionType: 'single_choice',
        options: ['47', '74', '407', '11'],
        expectedAnswer: '47',
        explanation: '4 chục và 7 đơn vị viết là 47.',
        skillTag: 'Cấu tạo số đến 100',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Chữ số hàng chục (4) viết trước, hàng đơn vị (7) viết sau: 47 (không phải 74).' }]
      },
      {
        id: 'q-g1-11-2',
        order: 2,
        prompt: 'Số 85 có chữ số hàng chục là mấy?',
        interactionType: 'number_input',
        expectedAnswer: '8',
        explanation: 'Trong số 85, chữ số 8 đứng ở hàng chục, chữ số 5 đứng ở hàng đơn vị.',
        skillTag: 'Nhận biết hàng chục',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Chữ số đứng bên trái là hàng chục (8), chữ số bên phải là hàng đơn vị (5).' }]
      },
      {
        id: 'q-g1-11-3',
        order: 3,
        prompt: 'Chọn dấu so sánh đúng: 63 ... 36',
        interactionType: 'operator_pick',
        options: ['>', '<', '='],
        expectedAnswer: '>',
        explanation: '63 > 36 vì hàng chục 6 > 3.',
        skillTag: 'So sánh số có 2 chữ số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'So sánh hàng chục trước: 6 chục lớn hơn 3 chục nên 63 > 36.' }]
      },
      {
        id: 'q-g1-11-4',
        order: 4,
        prompt: 'Nối số với cách đọc đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '35', right: 'Ba mươi lăm' },
          { left: '71', right: 'Bảy mươi mốt' },
          { left: '84', right: 'Tám mươi tư' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '35: Ba mươi lăm, 71: Bảy mươi mốt, 84: Tám mươi tư.',
        skillTag: 'Đọc số tiếng Việt chuẩn',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Chú ý: 35 đọc là lăm, 71 đọc là mốt, 84 đọc là tư.' }]
      },
      {
        id: 'q-g1-11-5',
        order: 5,
        prompt: 'Mô hình có 3 bó chục và 4 que rời. Hỏi có tất cả bao nhiêu que tính?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'bundles', tens: 3, ones: 4 },
        options: ['34', '43', '7'],
        expectedAnswer: '34',
        explanation: '3 bó chục và 4 que rời là 34 que tính.',
        skillTag: 'Mô hình chục đơn vị',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: '3 bó chục là 30, thêm 4 que rời là 34 que tính.' }]
      },
      {
        id: 'q-g1-11-6',
        order: 6,
        prompt: 'Số liền trước của số 70 là số nào?',
        interactionType: 'number_input',
        expectedAnswer: '69',
        explanation: '70 bớt 1 là 69.',
        skillTag: 'Số liền trước',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm lùi từ 70 một đơn vị: số đứng trước 70 là 69.' }]
      },
      {
        id: 'q-g1-11-7',
        order: 7,
        prompt: 'Sắp xếp dãy số sau theo thứ tự tăng dần: 52, 25, 78, 41',
        interactionType: 'number_line_order',
        options: ['25', '41', '52', '78'],
        expectedAnswer: '25,41,52,78',
        explanation: 'Thứ tự tăng dần: 25, 41, 52, 78.',
        skillTag: 'Sắp xếp số đến 100',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'So sánh hàng chục: 2 < 4 < 5 < 7.' }]
      },
      {
        id: 'q-g1-11-8',
        order: 8,
        prompt: 'Số lớn nhất có hai chữ số là số nào?',
        interactionType: 'single_choice',
        options: ['99', '100', '90', '98'],
        expectedAnswer: '99',
        explanation: '99 là số lớn nhất có 2 chữ số (100 là số có 3 chữ số).',
        skillTag: 'Số lớn nhất có 2 chữ số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Số 100 có 3 chữ số rồi, vậy số có hai chữ số lớn nhất là 99.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g1-12',
      title: 'Đồng hồ và Xem giờ đúng',
      grade: 1,
      topic: 'Thời gian',
      learningStandard: 'Biết xem giờ đúng trên mặt đồng hồ kim; đọc được giờ khi kim phút chỉ số 12.',
      description: 'Làm quen với mặt đồng hồ, kim ngắn chỉ giờ và kim dài chỉ phút.',
      durationMinutes: 15,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-12-1',
        order: 1,
        prompt: 'Khi đồng hồ chỉ giờ đúng, kim dài (kim phút) luôn chỉ vào số mấy?',
        interactionType: 'single_choice',
        options: ['Số 12', 'Số 6', 'Số 1', 'Số 3'],
        expectedAnswer: 'Số 12',
        explanation: 'Khi đúng giờ, kim phút luôn chỉ thẳng vào số 12.',
        skillTag: 'Kim phút giờ đúng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Kim dài chỉ đúng số 12 thì đó là giờ đúng (ví dụ 8 giờ đúng).' }]
      },
      {
        id: 'q-g1-12-2',
        order: 2,
        prompt: 'Kim ngắn chỉ số 7, kim dài chỉ số 12. Đồng hồ đang chỉ mấy giờ?',
        interactionType: 'number_input',
        expectedAnswer: '7',
        acceptableAnswers: ['7', '7 giờ'],
        explanation: 'Kim ngắn chỉ số 7 nên đó là 7 giờ đúng.',
        skillTag: 'Đọc giờ đúng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Kim ngắn chỉ số nào thì là bấy nhiêu giờ: kim ngắn chỉ số 7 là 7 giờ.' }]
      },
      {
        id: 'q-g1-12-3',
        order: 3,
        prompt: 'So sánh thời gian: 8 giờ sáng ... 10 giờ sáng (thời điểm nào sớm hơn?)',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '8 giờ đến trước 10 giờ nên 8 giờ < 10 giờ.',
        skillTag: 'So sánh thời điểm',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '8 bé hơn 10 nên 8 giờ sáng đến trước 10 giờ sáng.' }]
      },
      {
        id: 'q-g1-12-4',
        order: 4,
        prompt: 'Nối hoạt động trong ngày với giờ thích hợp:',
        interactionType: 'expression_match',
        pairs: [
          { left: 'Em thức dậy buổi sáng', right: '6 giờ' },
          { left: 'Em ăn bữa trưa', right: '11 giờ' },
          { left: 'Em đi ngủ buổi tối', right: '9 giờ' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: 'Thức dậy 6 giờ, ăn trưa 11 giờ, đi ngủ 9 giờ tối.',
        skillTag: 'Hoạt động theo giờ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Suy nghĩ về thời gian sinh hoạt thực tế hàng ngày của em.' }]
      },
      {
        id: 'q-g1-12-5',
        order: 5,
        prompt: 'Bé bắt đầu học bài lúc 8 giờ và học xong lúc 9 giờ. Bé đã học bài trong mấy giờ?',
        interactionType: 'number_input',
        expectedAnswer: '1',
        acceptableAnswers: ['1', '1 giờ'],
        explanation: '9 - 8 = 1 giờ.',
        skillTag: 'Tính khoảng thời gian',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Từ 8 giờ đến 9 giờ là vừa tròn 1 giờ đồng hồ.' }]
      },
      {
        id: 'q-g1-12-6',
        order: 6,
        prompt: 'Đồng hồ có kim ngắn chỉ vào số 3, kim dài chỉ vào số 12 là mấy giờ?',
        interactionType: 'single_choice',
        options: ['3 giờ', '12 giờ', '6 giờ'],
        expectedAnswer: '3 giờ',
        explanation: 'Kim ngắn chỉ số 3 là 3 giờ.',
        skillTag: 'Xem đồng hồ',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Kim ngắn chỉ giờ, kim ngắn ở số 3 nên là 3 giờ.' }]
      },
      {
        id: 'q-g1-12-7',
        order: 7,
        prompt: 'Một ngày có bao nhiêu giờ?',
        interactionType: 'single_choice',
        options: ['24 giờ', '12 giờ', '10 giờ', '60 giờ'],
        expectedAnswer: '24 giờ',
        explanation: 'Một ngày đêm có 24 giờ.',
        skillTag: 'Số giờ trong ngày',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Một ngày bắt đầu từ 12 giờ đêm này đến 12 giờ đêm hôm sau gồm 24 giờ.' }]
      },
      {
        id: 'q-g1-12-8',
        order: 8,
        prompt: 'Lúc 10 giờ, kim dài chỉ vào số 12, hỏi kim ngắn chỉ vào số mấy?',
        interactionType: 'number_input',
        expectedAnswer: '10',
        explanation: 'Lúc 10 giờ thì kim ngắn chỉ số 10.',
        skillTag: 'Vị trí kim đồng hồ',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: '10 giờ thì kim ngắn chỉ đúng số 10.' }]
      }
    ]
  },

  // ==================== LỚP 2 (12 BÀI) ====================
  {
    lesson: {
      id: 'lesson-g2-01',
      title: 'Phép cộng có nhớ trong phạm vi 20 (Qua 10)',
      grade: 2,
      topic: 'Phép cộng và phép trừ có nhớ phạm vi 20',
      learningStandard: 'Thực hiện cộng qua 10 dạng 9 + 5, 8 + 5, 7 + 4 bằng cách tách số để được 10.',
      description: 'Phương pháp tách số ở số hạng thứ hai để gộp với số hạng thứ nhất thành 1 chục rồi cộng tiếp.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-01-1',
        order: 1,
        prompt: 'Tính: 9 + 5 = ?',
        interactionType: 'number_input',
        expectedAnswer: '14',
        explanation: 'Tách 5 thành 1 và 4: 9 + 1 = 10, 10 + 4 = 14.',
        skillTag: 'Cộng qua 10 với 9',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '9 cần thêm 1 để thành 10. Hãy tách 5 thành 1 và 4: 9 + 1 = 10; 10 + 4 = 14.' }]
      },
      {
        id: 'q-g2-01-2',
        order: 2,
        prompt: 'Tính: 8 + 6 = ?',
        interactionType: 'single_choice',
        options: ['13', '14', '15', '16'],
        expectedAnswer: '14',
        explanation: '8 + 2 = 10, 10 + 4 = 14.',
        skillTag: 'Cộng qua 10 với 8',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '8 cần 2 để đủ 10: Tách 6 thành 2 và 4: 8 + 2 = 10, 10 + 4 = 14.' }]
      },
      {
        id: 'q-g2-01-3',
        order: 3,
        prompt: 'Chọn dấu thích hợp: 7 + 5 ... 8 + 4',
        interactionType: 'operator_pick',
        options: ['=', '>', '<'],
        expectedAnswer: '=',
        explanation: '7 + 5 = 12 và 8 + 4 = 12. Vậy hai biểu thức bằng nhau (=).',
        skillTag: 'So sánh hai tổng qua 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Tính: 7 + 5 = 12; 8 + 4 = 12. Hai bên đều bằng 12 nên điền dấu =.' }]
      },
      {
        id: 'q-g2-01-4',
        order: 4,
        prompt: 'Nối phép tính với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '9 + 7', right: '16' },
          { left: '8 + 5', right: '13' },
          { left: '7 + 6', right: '13' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '9 + 7 = 16, 8 + 5 = 13, 7 + 6 = 13.',
        skillTag: 'Bảng cộng qua 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Tách số để làm tròn 10 rồi cộng phần dư.' }]
      },
      {
        id: 'q-g2-01-5',
        order: 5,
        prompt: 'Khung 10 ô: Khung thứ nhất có 8 chấm đỏ, khung thứ hai có 5 chấm xanh. Chuyển 2 chấm sang để đầy khung 10. Tổng cộng có bao nhiêu chấm?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'ten_frame', count: 13, tens: 1, ones: 3 },
        options: ['12', '13', '14'],
        expectedAnswer: '13',
        explanation: '8 + 5 = 13. Khung 10 đầy và 3 chấm dư = 13.',
        skillTag: 'Khung 10 ô tạo nhóm 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Khung 10 ô đã đầy là 10, bên ngoài còn 3 chấm: 10 + 3 = 13.' }]
      },
      {
        id: 'q-g2-01-6',
        order: 6,
        prompt: 'Điền số thích hợp vào chỗ chấm: 6 + 7 = ?',
        interactionType: 'number_input',
        expectedAnswer: '13',
        explanation: '6 + 4 = 10, 10 + 3 = 13.',
        skillTag: 'Phép cộng 6 + 7',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '6 + 7 = 13 (có thể nhẩm 6 + 6 = 12 rồi thêm 1 là 13).' }]
      },
      {
        id: 'q-g2-01-7',
        order: 7,
        prompt: 'An có 9 viên bi, Bình cho An thêm 6 viên bi. Hỏi An có tất cả bao nhiêu viên bi?',
        interactionType: 'single_choice',
        options: ['14 viên', '15 viên', '16 viên', '13 viên'],
        expectedAnswer: '15 viên',
        explanation: '9 + 6 = 15 viên bi.',
        skillTag: 'Toán có lời văn qua 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '9 + 6: Tách 6 thành 1 và 5, 9 + 1 = 10, 10 + 5 = 15 viên bi.' }]
      },
      {
        id: 'q-g2-01-8',
        order: 8,
        prompt: 'Thám tử bước từ vạch 8 trên trục số, nhảy tiếp 7 bước về bên phải. Dừng ở số mấy?',
        interactionType: 'number_input',
        visualConfig: { type: 'number_line', min: 0, max: 20, target: 15 },
        expectedAnswer: '15',
        explanation: '8 + 7 = 15.',
        skillTag: 'Trục số qua 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: '8 nhảy 2 bước đến 10, nhảy tiếp 5 bước nữa đến 15.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g2-02',
      title: 'Phép trừ có nhớ trong phạm vi 20 (Trừ qua 10)',
      grade: 2,
      topic: 'Phép cộng và phép trừ có nhớ phạm vi 20',
      learningStandard: 'Thực hiện trừ qua 10 dạng 11 - 5, 12 - 7, 15 - 8 bằng cách trừ để được 10 rồi trừ tiếp.',
      description: 'Quy tắc: Trừ để được 10 rồi trừ số còn lại.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-02-1',
        order: 1,
        prompt: 'Tính: 13 - 5 = ?',
        interactionType: 'number_input',
        expectedAnswer: '8',
        explanation: '13 - 3 = 10, 10 - 2 = 8.',
        skillTag: 'Trừ qua 10 dạng 13 - 5',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Trừ để được 10: 13 trừ 3 bằng 10, lấy 10 trừ tiếp 2 bằng 8.' }]
      },
      {
        id: 'q-g2-02-2',
        order: 2,
        prompt: 'Tính: 15 - 8 = ?',
        interactionType: 'single_choice',
        options: ['6', '7', '8', '9'],
        expectedAnswer: '7',
        explanation: '15 - 5 = 10, 10 - 3 = 7.',
        skillTag: 'Trừ qua 10 dạng 15 - 8',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '15 trừ 5 còn 10, 10 trừ 3 còn 7.' }]
      },
      {
        id: 'q-g2-02-3',
        order: 3,
        prompt: 'Chọn dấu so sánh đúng: 14 - 6 ... 16 - 8',
        interactionType: 'operator_pick',
        options: ['=', '>', '<'],
        expectedAnswer: '=',
        explanation: '14 - 6 = 8 và 16 - 8 = 8. Vậy hai bên bằng nhau (=).',
        skillTag: 'So sánh hiệu qua 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '14 - 6 = 8; 16 - 8 = 8. Điền dấu =.' }]
      },
      {
        id: 'q-g2-02-4',
        order: 4,
        prompt: 'Nối phép trừ với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '11 - 4', right: '7' },
          { left: '12 - 5', right: '7' },
          { left: '17 - 9', right: '8' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '11 - 4 = 7, 12 - 5 = 7, 17 - 9 = 8.',
        skillTag: 'Bảng trừ qua 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Trừ để được 10 rồi lấy 10 trừ số còn lại.' }]
      },
      {
        id: 'q-g2-02-5',
        order: 5,
        prompt: 'Khung 10 ô: Có 1 khung đầy (10 chấm) và 2 chấm rời (tổng là 12 chấm). Gạch bớt 7 chấm thì còn mấy chấm?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'ten_frame', count: 5, tens: 0, ones: 5 },
        options: ['4', '5', '6'],
        expectedAnswer: '5',
        explanation: '12 - 7 = 5.',
        skillTag: 'Mô hình khung 10 trừ qua 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Gạch 2 chấm rời, rồi gạch thêm 5 chấm trong khung 10, trong khung còn lại 5 chấm.' }]
      },
      {
        id: 'q-g2-02-6',
        order: 6,
        prompt: 'Điền số thích hợp: 16 - ... = 9',
        interactionType: 'number_input',
        expectedAnswer: '7',
        explanation: 'Vì 16 - 7 = 9 nên số cần điền là 7.',
        skillTag: 'Tìm số trừ qua 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: '16 trừ mấy bằng 9? 16 - 9 = 7.' }]
      },
      {
        id: 'q-g2-02-7',
        order: 7,
        prompt: 'Trên cành có 14 quả táo, gió thổi rụng 8 quả. Hỏi trên cành còn lại bao nhiêu quả táo?',
        interactionType: 'single_choice',
        options: ['5', '6', '7', '8'],
        expectedAnswer: '6',
        explanation: '14 - 8 = 6 quả táo.',
        skillTag: 'Toán lời văn trừ qua 10',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '14 - 4 = 10, 10 - 4 = 6 quả táo.' }]
      },
      {
        id: 'q-g2-02-8',
        order: 8,
        prompt: 'Thám tử đứng ở vạch 15 và lùi 9 bước sang trái. Dừng ở vạch số mấy?',
        interactionType: 'number_input',
        visualConfig: { type: 'number_line', min: 0, max: 20, target: 6 },
        expectedAnswer: '6',
        explanation: '15 - 9 = 6.',
        skillTag: 'Trừ trên trục số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: '15 lùi 5 bước đến 10, lùi tiếp 4 bước nữa là đến 6.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g2-03',
      title: 'Đề-xi-mét (dm) và Đo độ dài',
      grade: 2,
      topic: 'Đo lường',
      learningStandard: 'Nhận biết đơn vị đề-xi-mét (viết tắt là dm); biết mối quan hệ 1 dm = 10 cm.',
      description: 'Mở rộng đơn vị đo độ dài từ cm lên dm.',
      durationMinutes: 15,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-03-1',
        order: 1,
        prompt: '1 đề-xi-mét (1 dm) bằng bao nhiêu xăng-ti-mét (cm)?',
        interactionType: 'number_input',
        expectedAnswer: '10',
        acceptableAnswers: ['10', '10 cm'],
        explanation: '1 dm = 10 cm.',
        skillTag: 'Đổi đơn vị dm sang cm',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Ghi nhớ: 1 dm = 10 cm.' }]
      },
      {
        id: 'q-g2-03-2',
        order: 2,
        prompt: 'Đề-xi-mét được viết tắt là gì?',
        interactionType: 'single_choice',
        options: ['dm', 'cm', 'm', 'mm'],
        expectedAnswer: 'dm',
        explanation: 'Đề-xi-mét viết tắt là dm.',
        skillTag: 'Ký hiệu đề-xi-mét',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Đề-xi-mét ghép từ 2 chữ d và m: dm.' }]
      },
      {
        id: 'q-g2-03-3',
        order: 3,
        prompt: 'Chọn dấu so sánh thích hợp: 3 dm ... 25 cm',
        interactionType: 'operator_pick',
        options: ['>', '<', '='],
        expectedAnswer: '>',
        explanation: '3 dm = 30 cm. Vì 30 cm > 25 cm nên 3 dm > 25 cm.',
        skillTag: 'So sánh dm và cm',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Đổi 3 dm = 30 cm trước. So sánh 30 cm với 25 cm: 30 > 25.' }]
      },
      {
        id: 'q-g2-03-4',
        order: 4,
        prompt: 'Nối các số đo tương đương:',
        interactionType: 'expression_match',
        pairs: [
          { left: '2 dm', right: '20 cm' },
          { left: '50 cm', right: '5 dm' },
          { left: '1 dm 4 cm', right: '14 cm' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '2 dm = 20 cm, 50 cm = 5 dm, 1 dm 4 cm = 14 cm.',
        skillTag: 'Đổi đơn vị độ dài',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Cứ 10 cm thì được 1 dm.' }]
      },
      {
        id: 'q-g2-03-5',
        order: 5,
        prompt: 'Tính: 15 dm + 4 dm = ? Điền số dm:',
        interactionType: 'number_input',
        expectedAnswer: '19',
        explanation: '15 + 4 = 19 dm.',
        skillTag: 'Cộng số đo dm',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '15 + 4 = 19 dm.' }]
      },
      {
        id: 'q-g2-03-6',
        order: 6,
        prompt: 'Một sợi dây dài 4 dm, cắt bớt đi 10 cm. Sợi dây còn lại bao nhiêu cm?',
        interactionType: 'number_input',
        expectedAnswer: '30',
        explanation: '4 dm = 40 cm. 40 cm - 10 cm = 30 cm.',
        skillTag: 'Toán đo lường đổi đơn vị',
        difficulty: 'hard',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Đổi 4 dm ra 40 cm trước, rồi lấy 40 cm trừ 10 cm = 30 cm.' }]
      },
      {
        id: 'q-g2-03-7',
        order: 7,
        prompt: 'Gang tay của người lớn dài khoảng bao nhiêu?',
        interactionType: 'single_choice',
        options: ['2 dm', '20 dm', '2 cm'],
        expectedAnswer: '2 dm',
        explanation: 'Gang tay người lớn dài khoảng 20 cm = 2 dm.',
        skillTag: 'Ước lượng độ dài dm',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: '2 dm = 20 cm là độ dài gang tay người lớn phù hợp nhất.' }]
      },
      {
        id: 'q-g2-03-8',
        order: 8,
        prompt: 'Tính: 30 dm - 12 dm = ? Điền số:',
        interactionType: 'number_input',
        expectedAnswer: '18',
        explanation: '30 - 12 = 18 dm.',
        skillTag: 'Trừ số đo dm',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '30 - 10 = 20, 20 - 2 = 18 dm.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g2-04',
      title: 'Phép cộng có nhớ trong phạm vi 100',
      grade: 2,
      topic: 'Số và Phép tính trong phạm vi 100',
      learningStandard: 'Đặt tính và tính phép cộng có nhớ trong phạm vi 100 dạng 38 + 25, 47 + 5.',
      description: 'Quy tắc đặt tính thẳng cột: cộng từ phải sang trái, nhớ 1 sang hàng chục.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-04-1',
        order: 1,
        prompt: 'Tính: 38 + 25 = ?',
        interactionType: 'number_input',
        expectedAnswer: '63',
        explanation: '8 + 5 = 13 viết 3 nhớ 1. 3 + 2 = 5 thêm 1 bằng 6. Kết quả là 63.',
        skillTag: 'Cộng có nhớ dạng 38 + 25',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '8 + 5 = 13 viết 3 nhớ 1. Nhớ cộng thêm 1 vào hàng chục: 3 + 2 + 1 = 6.' }]
      },
      {
        id: 'q-g2-04-2',
        order: 2,
        prompt: 'Tính: 47 + 6 = ?',
        interactionType: 'single_choice',
        options: ['52', '53', '54', '43'],
        expectedAnswer: '53',
        explanation: '7 + 6 = 13 viết 3 nhớ 1, 4 thêm 1 bằng 5. Kết quả 53.',
        skillTag: 'Cộng có nhớ với số có 1 chữ số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '7 + 6 = 13 nhớ 1 sang 4 thành 5: 53.' }]
      },
      {
        id: 'q-g2-04-3',
        order: 3,
        prompt: 'Chọn dấu thích hợp: 29 + 15 ... 45',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '29 + 15 = 44. Vì 44 < 45 nên điền dấu <.',
        skillTag: 'So sánh phép cộng có nhớ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '29 + 15 = 44. 44 bé hơn 45 nên điền dấu <.' }]
      },
      {
        id: 'q-g2-04-4',
        order: 4,
        prompt: 'Nối phép tính với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '46 + 18', right: '64' },
          { left: '57 + 24', right: '81' },
          { left: '35 + 29', right: '64' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '46 + 18 = 64; 57 + 24 = 81; 35 + 29 = 64.',
        skillTag: 'Ghép cặp phép tính có nhớ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Nhớ cộng 1 vào hàng chục sau khi hàng đơn vị vượt qua 10.' }]
      },
      {
        id: 'q-g2-04-5',
        order: 5,
        prompt: 'Mô hình bó que tính: 3 bó chục và 8 que lẻ, thêm 2 bó chục và 4 que lẻ. Gom 10 que lẻ thành 1 bó chục mới. Có tất cả bao nhiêu que tính?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'bundles', tens: 6, ones: 2 },
        options: ['62', '52', '61'],
        expectedAnswer: '62',
        explanation: '8 + 4 = 12 que (gồm 1 bó chục và 2 que lẻ). 3 bó + 2 bó + 1 bó mới = 6 bó chục và 2 que = 62.',
        skillTag: 'Mô hình gom chục trực quan',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '12 que lẻ gom được 1 bó chục mới và còn dư 2 que lẻ: 6 bó chục và 2 que = 62.' }]
      },
      {
        id: 'q-g2-04-6',
        order: 6,
        prompt: 'Điền số thích hợp vào chỗ chấm: 56 + ... = 72',
        interactionType: 'number_input',
        expectedAnswer: '16',
        explanation: '72 - 56 = 16.',
        skillTag: 'Tìm số hạng còn thiếu',
        difficulty: 'hard',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '6 cộng mấy có tận cùng là 2? 6 + 6 = 12. Vậy số đó là 16.' }]
      },
      {
        id: 'q-g2-04-7',
        order: 7,
        prompt: 'Đội Một trồng được 35 cây, Đội Hai trồng được 28 cây. Cả hai đội trồng được bao nhiêu cây?',
        interactionType: 'single_choice',
        options: ['63 cây', '53 cây', '62 cây', '73 cây'],
        expectedAnswer: '63 cây',
        explanation: '35 + 28 = 63 cây.',
        skillTag: 'Toán lời văn cộng có nhớ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '5 + 8 = 13 viết 3 nhớ 1, 3 + 2 = 5 thêm 1 là 6: 63 cây.' }]
      },
      {
        id: 'q-g2-04-8',
        order: 8,
        prompt: 'Tính nhẩm: 69 + 1 = ?',
        interactionType: 'number_input',
        expectedAnswer: '70',
        explanation: '69 + 1 = 70.',
        skillTag: 'Cộng tròn chục',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Số liền sau của 69 là 70.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g2-05',
      title: 'Phép trừ có nhớ trong phạm vi 100',
      grade: 2,
      topic: 'Số và Phép tính trong phạm vi 100',
      learningStandard: 'Đặt tính và tính phép trừ có nhớ dạng 52 - 28, 40 - 15.',
      description: 'Quy tắc: Hàng đơn vị không trừ được thì mượn 1 chục ở hàng chục, nhớ trả 1 sang hàng chục của số trừ.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-05-1',
        order: 1,
        prompt: 'Tính: 52 - 28 = ?',
        interactionType: 'number_input',
        expectedAnswer: '24',
        explanation: '2 không trừ được 8, lấy 12 - 8 = 4 nhớ 1. 2 thêm 1 là 3, 5 - 3 = 2. Kết quả là 24.',
        skillTag: 'Trừ có nhớ dạng 52 - 28',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '2 không trừ được 8, mượn 1 chục thành 12 - 8 = 4. Nhớ 1 vào 2 thành 3, 5 - 3 = 2: 24.' }]
      },
      {
        id: 'q-g2-05-2',
        order: 2,
        prompt: 'Tính: 60 - 24 = ?',
        interactionType: 'single_choice',
        options: ['36', '46', '34', '44'],
        expectedAnswer: '36',
        explanation: '0 không trừ được 4, lấy 10 - 4 = 6 nhớ 1. 2 thêm 1 bằng 3, 6 - 3 = 3. Kết quả 36.',
        skillTag: 'Số tròn chục trừ đi một số',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '10 - 4 = 6 nhớ 1 vào 2 thành 3; 6 - 3 = 3: Kết quả là 36.' }]
      },
      {
        id: 'q-g2-05-3',
        order: 3,
        prompt: 'Chọn dấu thích hợp: 71 - 35 ... 36',
        interactionType: 'operator_pick',
        options: ['=', '>', '<'],
        expectedAnswer: '=',
        explanation: '71 - 35 = 36. Vậy 71 - 35 = 36.',
        skillTag: 'So sánh phép trừ có nhớ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '71 - 35 = 36. Hai vế bằng nhau nên điền dấu =.' }]
      },
      {
        id: 'q-g2-05-4',
        order: 4,
        prompt: 'Nối phép trừ với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '43 - 17', right: '26' },
          { left: '85 - 38', right: '47' },
          { left: '90 - 45', right: '45' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '43 - 17 = 26; 85 - 38 = 47; 90 - 45 = 45.',
        skillTag: 'Ghép cặp trừ có nhớ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Nhớ trừ thêm 1 ở hàng chục do đã mượn.' }]
      },
      {
        id: 'q-g2-05-5',
        order: 5,
        prompt: 'Mô hình que tính: Có 4 bó chục và 1 que lẻ (41 que). Tháo 1 bó chục thành 10 que lẻ để bớt đi 15 que. Còn lại bao nhiêu que tính?',
        interactionType: 'ten_frame_bundle',
        visualConfig: { type: 'bundles', tens: 2, ones: 6 },
        options: ['26', '36', '25'],
        expectedAnswer: '26',
        explanation: '41 - 15 = 26 que tính.',
        skillTag: 'Mô hình tháo bó chục trực quan',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Tháo 1 bó thành 10 que lẻ, có tất cả 11 que lẻ. 11 que bớt 5 que còn 6 que lẻ. Còn 2 bó chục: 26.' }]
      },
      {
        id: 'q-g2-05-6',
        order: 6,
        prompt: 'Điền số thích hợp: 83 - ... = 49',
        interactionType: 'number_input',
        expectedAnswer: '34',
        explanation: '83 - 49 = 34.',
        skillTag: 'Tìm số trừ có nhớ',
        difficulty: 'hard',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Lấy 83 trừ đi 49: 13 - 9 = 4, 8 - 5 = 3: 34.' }]
      },
      {
        id: 'q-g2-05-7',
        order: 7,
        prompt: 'Cửa hàng có 75 kg gạo, đã bán được 38 kg. Hỏi cửa hàng còn lại bao nhiêu kg gạo?',
        interactionType: 'single_choice',
        options: ['37 kg', '47 kg', '38 kg', '43 kg'],
        expectedAnswer: '37 kg',
        explanation: '75 - 38 = 37 kg.',
        skillTag: 'Toán có lời văn trừ có nhớ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '15 - 8 = 7, 7 - 4 = 3: 37 kg gạo.' }]
      },
      {
        id: 'q-g2-05-8',
        order: 8,
        prompt: 'Tính nhẩm: 100 - 30 = ?',
        interactionType: 'number_input',
        expectedAnswer: '70',
        explanation: '10 chục - 3 chục = 7 chục (70).',
        skillTag: '100 trừ số tròn chục',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: '100 là 10 chục, 10 chục trừ 3 chục còn 7 chục (70).' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g2-06',
      title: 'Khối trụ và Khối cầu',
      grade: 2,
      topic: 'Hình học trực quan',
      learningStandard: 'Nhận biết khối trụ, khối cầu qua vật thật và mô hình; phân biệt mặt phẳng và mặt cong.',
      description: 'Làm quen với các hình khối không gian gần gũi trong đời sống.',
      durationMinutes: 15,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-06-1',
        order: 1,
        prompt: 'Quả bóng đá trong sân trường có dạng hình khối gì?',
        interactionType: 'single_choice',
        options: ['Khối cầu', 'Khối trụ', 'Khối lập phương', 'Hình tròn'],
        expectedAnswer: 'Khối cầu',
        explanation: 'Quả bóng đá là một khối không gian dạng khối cầu (không phải hình tròn phẳng).',
        skillTag: 'Nhận biết khối cầu',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Quả bóng đá cầm được trong tay, lăn được mọi phía là khối cầu (không phải hình tròn 2D vẽ trên giấy).' }]
      },
      {
        id: 'q-g2-06-2',
        order: 2,
        prompt: 'Lon sữa đặc hoặc lon nước ngọt có dạng hình khối gì?',
        interactionType: 'single_choice',
        options: ['Khối trụ', 'Khối cầu', 'Khối chữ nhật'],
        expectedAnswer: 'Khối trụ',
        explanation: 'Lon nước ngọt có 2 đáy tròn phẳng và thân cong tròn, đó là khối trụ.',
        skillTag: 'Nhận biết khối trụ',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Lon nước ngọt có 2 mặt đáy phẳng hình tròn và mặt xung quanh cong, đó là khối trụ.' }]
      },
      {
        id: 'q-g2-06-3',
        order: 3,
        prompt: 'Khối cầu có thể xếp chồng lên nhau được không? (Chọn dấu = cho Có, dấu < cho Không)',
        interactionType: 'operator_pick',
        options: ['<', '='],
        expectedAnswer: '<',
        explanation: 'Khối cầu có bề mặt cong hoàn toàn nên lăn tròn, không thể xếp chồng lên nhau như khối trụ hay khối vuông.',
        skillTag: 'Đặc điểm khối cầu',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Khối cầu tròn xoe không có mặt phẳng nên không xếp chồng được, nó sẽ lăn rơi.' }]
      },
      {
        id: 'q-g2-06-4',
        order: 4,
        prompt: 'Nối đồ vật với hình khối tương ứng:',
        interactionType: 'expression_match',
        pairs: [
          { left: 'Viên bi thủy tinh', right: 'Khối cầu' },
          { left: 'Hộp sữa chua hình trụ', right: 'Khối trụ' },
          { left: 'Quả địa cầu', right: 'Khối cầu' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: 'Viên bi và quả địa cầu là khối cầu, hộp sữa chua là khối trụ.',
        skillTag: 'Phân loại khối hình',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Đồ vật lăn được mọi phía là khối cầu; đồ vật có 2 mặt đáy tròn phẳng là khối trụ.' }]
      },
      {
        id: 'q-g2-06-5',
        order: 5,
        prompt: 'Khối trụ có mấy mặt đáy phẳng hình tròn?',
        interactionType: 'number_input',
        expectedAnswer: '2',
        explanation: 'Khung trụ có 2 mặt đáy hình tròn (đáy trên và đáy dưới).',
        skillTag: 'Số mặt đáy khối trụ',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Khối trụ có 1 mặt đáy trên và 1 mặt đáy dưới, tổng cộng là 2 mặt đáy.' }]
      },
      {
        id: 'q-g2-06-6',
        order: 6,
        prompt: 'Khối trụ có thể vừa lăn được vừa trượt được. Đúng hay Sai?',
        interactionType: 'single_choice',
        options: ['Đúng', 'Sai'],
        expectedAnswer: 'Đúng',
        explanation: 'Khi đặt nằm khối trụ lăn được; khi đặt đứng khối trụ có thể trượt được trên mặt bàn.',
        skillTag: 'Khả năng vận động khối trụ',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Đúng rồi, mặt đáy phẳng giúp trượt được, mặt cong xung quanh giúp lăn được.' }]
      },
      {
        id: 'q-g2-06-7',
        order: 7,
        prompt: 'Trong các đồ vật sau: Quả cam, Hộp chè ống tròn, Thùng gỗ vuông. Có mấy đồ vật có dạng khối trụ?',
        interactionType: 'number_input',
        expectedAnswer: '1',
        explanation: 'Chỉ có hộp chè ống tròn là khối trụ (quả cam là khối cầu, thùng gỗ vuông là khối lập phương).',
        skillTag: 'Đếm khối trụ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Chỉ có hộp chè ống tròn là khối trụ thôi nhé: 1 đồ vật.' }]
      },
      {
        id: 'q-g2-06-8',
        order: 8,
        prompt: 'Trái Đất chúng ta đang sống có hình dạng gần giống khối gì?',
        interactionType: 'single_choice',
        options: ['Khối cầu', 'Khối trụ', 'Khối chữ nhật'],
        expectedAnswer: 'Khối cầu',
        explanation: 'Trái Đất có hình dạng khối cầu hơi dẹt ở hai cực.',
        skillTag: 'Trái đất khối cầu',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Trái Đất là một khối cầu khổng lồ trong vũ trụ.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g2-07',
      title: 'Làm quen với Phép nhân và Dấu nhân (×)',
      grade: 2,
      topic: 'Phép nhân và Phép chia',
      learningStandard: 'Nhận biết phép nhân là tổng của các số hạng bằng nhau; viết và đọc được phép nhân.',
      description: 'Chuyển đổi từ tổng các số hạng bằng nhau sang phép nhân: 2 + 2 + 2 = 2 × 3.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-07-1',
        order: 1,
        prompt: 'Tổng 2 + 2 + 2 + 2 được viết thành phép nhân nào?',
        interactionType: 'single_choice',
        options: ['2 × 4', '4 × 2', '2 × 2', '2 + 4'],
        expectedAnswer: '2 × 4',
        explanation: 'Số 2 được lấy 4 lần nên viết là 2 × 4.',
        skillTag: 'Bản chất phép nhân',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Số 2 xuất hiện 4 lần, số 2 lấy 4 lần viết là: 2 × 4.' }]
      },
      {
        id: 'q-g2-07-2',
        order: 2,
        prompt: 'Tính kết quả phép nhân: 2 × 5 = ?',
        interactionType: 'number_input',
        expectedAnswer: '10',
        explanation: '2 × 5 = 2 + 2 + 2 + 2 + 2 = 10.',
        skillTag: 'Phép nhân 2',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm cách 2: 2, 4, 6, 8, 10.' }]
      },
      {
        id: 'q-g2-07-3',
        order: 3,
        prompt: 'Chọn dấu so sánh đúng: 2 × 3 ... 2 + 2 + 2',
        interactionType: 'operator_pick',
        options: ['=', '>', '<'],
        expectedAnswer: '=',
        explanation: '2 × 3 chính là 2 + 2 + 2 = 6. Hai vế bằng nhau (=).',
        skillTag: 'So sánh phép nhân và tổng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '2 × 3 nghĩa là 2 lấy 3 lần (2 + 2 + 2), hai bên cùng bằng 6 nên bằng nhau.' }]
      },
      {
        id: 'q-g2-07-4',
        order: 4,
        prompt: 'Nối tổng các số hạng bằng nhau với phép nhân tương ứng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '5 + 5 + 5', right: '5 × 3' },
          { left: '3 + 3 + 3 + 3', right: '3 × 4' },
          { left: '4 + 4', right: '4 × 2' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '5 lấy 3 lần là 5 × 3; 3 lấy 4 lần là 3 × 4; 4 lấy 2 lần là 4 × 2.',
        skillTag: 'Chuyển tổng thành tích',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Xác định số hạng được lặp lại và số lần lặp lại.' }]
      },
      {
        id: 'q-g2-07-5',
        order: 5,
        prompt: 'Mỗi bạn thỏ có 2 chiếc tai. Hỏi 6 bạn thỏ có tất cả bao nhiêu chiếc tai?',
        interactionType: 'number_input',
        expectedAnswer: '12',
        explanation: '2 × 6 = 12 chiếc tai.',
        skillTag: 'Toán có lời văn phép nhân',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '2 được lấy 6 lần: 2 × 6 = 12.' }]
      },
      {
        id: 'q-g2-07-6',
        order: 6,
        prompt: 'Trong phép nhân 2 × 7 = 14, số 14 được gọi là gì?',
        interactionType: 'single_choice',
        options: ['Tích', 'Thừa số', 'Tổng', 'Hiệu'],
        expectedAnswer: 'Tích',
        explanation: 'Trong phép nhân: Thừa số × Thừa số = Tích.',
        skillTag: 'Thành phần phép nhân',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Kết quả của phép nhân được gọi là Tích.' }]
      },
      {
        id: 'q-g2-07-7',
        order: 7,
        prompt: 'Tính: 5 × 4 = ?',
        interactionType: 'number_input',
        expectedAnswer: '20',
        explanation: '5 × 4 = 5 + 5 + 5 + 5 = 20.',
        skillTag: 'Phép nhân 5',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Đếm cách 5: 5, 10, 15, 20.' }]
      },
      {
        id: 'q-g2-07-8',
        order: 8,
        prompt: 'Mỗi đĩa có 5 quả cam. Có 3 đĩa cam như thế. Hỏi có tất cả bao nhiêu quả cam?',
        interactionType: 'single_choice',
        options: ['15 quả', '10 quả', '8 quả', '20 quả'],
        expectedAnswer: '15 quả',
        explanation: '5 × 3 = 15 quả cam.',
        skillTag: 'Bài toán đĩa cam',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: '5 quả cam lấy 3 lần: 5 × 3 = 15 quả cam (chứ không phải 5 + 3 = 8).' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g2-08',
      title: 'Bảng nhân 2 và Bảng nhân 5',
      grade: 2,
      topic: 'Phép nhân và Phép chia',
      learningStandard: 'Thuộc lòng bảng nhân 2 và bảng nhân 5; vận dụng tính nhẩm và giải bài toán thực tế.',
      description: 'Học sinh ghi nhớ quy luật tăng thêm 2 hoặc tăng thêm 5 trong bảng nhân.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-08-1',
        order: 1,
        prompt: 'Tính: 2 × 8 = ?',
        interactionType: 'number_input',
        expectedAnswer: '16',
        explanation: '2 × 8 = 16.',
        skillTag: 'Bảng nhân 2',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Nhẩm bảng nhân 2: 2 × 7 = 14, 14 thêm 2 là 16.' }]
      },
      {
        id: 'q-g2-08-2',
        order: 2,
        prompt: 'Tính: 5 × 7 = ?',
        interactionType: 'single_choice',
        options: ['30', '35', '40', '25'],
        expectedAnswer: '35',
        explanation: '5 × 7 = 35.',
        skillTag: 'Bảng nhân 5',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Đếm cách 5 đến lần thứ 7: 5, 10, 15, 20, 25, 30, 35.' }]
      },
      {
        id: 'q-g2-08-3',
        order: 3,
        prompt: 'Chọn dấu so sánh đúng: 2 × 9 ... 5 × 4',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '2 × 9 = 18, 5 × 4 = 20. Vì 18 < 20 nên 2 × 9 < 5 × 4.',
        skillTag: 'So sánh tích',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '2 × 9 = 18; 5 × 4 = 20. 18 bé hơn 20 nên điền dấu <.' }]
      },
      {
        id: 'q-g2-08-4',
        order: 4,
        prompt: 'Nối phép nhân với kết quả thích hợp:',
        interactionType: 'expression_match',
        pairs: [
          { left: '2 × 6', right: '12' },
          { left: '5 × 6', right: '30' },
          { left: '5 × 9', right: '45' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '2 × 6 = 12; 5 × 6 = 30; 5 × 9 = 45.',
        skillTag: 'Ghi nhớ bảng nhân',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Sử dụng quy tắc đếm cách 2 và đếm cách 5.' }]
      },
      {
        id: 'q-g2-08-5',
        order: 5,
        prompt: 'Mỗi bàn có 2 học sinh ngồi. Hỏi 9 bàn như thế có tất cả bao nhiêu học sinh?',
        interactionType: 'number_input',
        expectedAnswer: '18',
        explanation: '2 × 9 = 18 học sinh.',
        skillTag: 'Toán bàn học sinh',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '2 học sinh lấy 9 lần: 2 × 9 = 18.' }]
      },
      {
        id: 'q-g2-08-6',
        order: 6,
        prompt: 'Điền số thích hợp: 5 × ... = 40',
        interactionType: 'number_input',
        expectedAnswer: '8',
        explanation: '5 × 8 = 40.',
        skillTag: 'Tìm thừa số bảng nhân 5',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '5 nhân mấy bằng 40? 5 × 8 = 40.' }]
      },
      {
        id: 'q-g2-08-7',
        order: 7,
        prompt: 'Mỗi tuần lễ mẹ đi làm 5 ngày. Hỏi trong 4 tuần lễ mẹ đi làm bao nhiêu ngày?',
        interactionType: 'single_choice',
        options: ['15 ngày', '20 ngày', '25 ngày', '24 ngày'],
        expectedAnswer: '20 ngày',
        explanation: '5 × 4 = 20 ngày.',
        skillTag: 'Toán ngày công',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: '5 ngày lấy 4 lần: 5 × 4 = 20 ngày.' }]
      },
      {
        id: 'q-g2-08-8',
        order: 8,
        prompt: 'Dãy số cách đều: 5, 10, 15, 20, 25, ... Số tiếp theo là số mấy?',
        interactionType: 'number_input',
        expectedAnswer: '30',
        explanation: '25 + 5 = 30.',
        skillTag: 'Dãy số bảng nhân 5',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Cộng thêm 5 vào số 25: 25 + 5 = 30.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g2-09',
      title: 'Làm quen với Phép chia và Bảng chia 2, chia 5',
      grade: 2,
      topic: 'Phép nhân và Phép chia',
      learningStandard: 'Nhận biết ý nghĩa phép chia (chia thành các phần bằng nhau, chia theo nhóm); thực hiện chia cho 2 và chia cho 5.',
      description: 'Hiểu mối quan hệ nghịch đảo giữa phép nhân và phép chia: Nếu 2 × 4 = 8 thì 8 : 2 = 4.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-09-1',
        order: 1,
        prompt: 'Có 10 chiếc kẹo chia đều cho 2 bạn. Mỗi bạn nhận được bao nhiêu chiếc kẹo?',
        interactionType: 'number_input',
        expectedAnswer: '5',
        explanation: '10 : 2 = 5 chiếc kẹo.',
        skillTag: 'Bản chất chia đều',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Chia đều cho 2 tức là làm phép chia: 10 : 2 = 5.' }]
      },
      {
        id: 'q-g2-09-2',
        order: 2,
        prompt: 'Tính: 16 : 2 = ?',
        interactionType: 'single_choice',
        options: ['7', '8', '9', '6'],
        expectedAnswer: '8',
        explanation: 'Vì 2 × 8 = 16 nên 16 : 2 = 8.',
        skillTag: 'Bảng chia 2',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Nhẩm lại bảng nhân 2: 2 nhân mấy bằng 16? 2 × 8 = 16.' }]
      },
      {
        id: 'q-g2-09-3',
        order: 3,
        prompt: 'Chọn dấu so sánh đúng: 20 : 5 ... 14 : 2',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '20 : 5 = 4, 14 : 2 = 7. Vì 4 < 7 nên 20 : 5 < 14 : 2.',
        skillTag: 'So sánh kết quả phép chia',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '20 : 5 = 4; 14 : 2 = 7. 4 bé hơn 7 nên điền dấu <.' }]
      },
      {
        id: 'q-g2-09-4',
        order: 4,
        prompt: 'Nối phép chia với thương đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '35 : 5', right: '7' },
          { left: '18 : 2', right: '9' },
          { left: '40 : 5', right: '8' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '35 : 5 = 7; 18 : 2 = 9; 40 : 5 = 8.',
        skillTag: 'Bảng chia 2 và 5',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Dựa vào bảng nhân 5 và bảng nhân 2 để tìm thương.' }]
      },
      {
        id: 'q-g2-09-5',
        order: 5,
        prompt: 'Trong phép chia 15 : 5 = 3, số 3 được gọi là gì?',
        interactionType: 'single_choice',
        options: ['Thương', 'Số bị chia', 'Số chia', 'Tích'],
        expectedAnswer: 'Thương',
        explanation: 'Số bị chia : Số chia = Thương.',
        skillTag: 'Thành phần phép chia',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Kết quả của phép chia gọi là Thương.' }]
      },
      {
        id: 'q-g2-09-6',
        order: 6,
        prompt: 'Có 25 bông hoa cắm đều vào 5 bình hoa. Hỏi mỗi bình có mấy bông hoa?',
        interactionType: 'number_input',
        expectedAnswer: '5',
        explanation: '25 : 5 = 5 bông hoa.',
        skillTag: 'Toán cắm hoa',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '25 chia đều cho 5: 25 : 5 = 5 bông hoa.' }]
      },
      {
        id: 'q-g2-09-7',
        order: 7,
        prompt: 'Điền số thích hợp: ... : 2 = 6',
        interactionType: 'number_input',
        expectedAnswer: '12',
        explanation: 'Số bị chia = Thương × Số chia = 6 × 2 = 12.',
        skillTag: 'Tìm số bị chia',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Số nào chia cho 2 thì được 6? Lấy 6 × 2 = 12.' }]
      },
      {
        id: 'q-g2-09-8',
        order: 8,
        prompt: 'Có 18 bạn học sinh xếp thành 2 hàng đều nhau. Hỏi mỗi hàng có bao nhiêu bạn?',
        interactionType: 'single_choice',
        options: ['9 bạn', '8 bạn', '10 bạn', '7 bạn'],
        expectedAnswer: '9 bạn',
        explanation: '18 : 2 = 9 bạn.',
        skillTag: 'Toán xếp hàng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '18 : 2 = 9 bạn học sinh.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g2-10',
      title: 'Các số trong phạm vi 1000 và Hàng trăm',
      grade: 2,
      topic: 'Các số đến 1000',
      learningStandard: 'Đọc, viết, so sánh các số trong phạm vi 1000; phân tích cấu tạo trăm, chục, đơn vị.',
      description: 'Làm quen với số có 3 chữ số và giá trị vị trí từng hàng.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-10-1',
        order: 1,
        prompt: 'Số gồm 3 trăm, 5 chục và 2 đơn vị viết là số nào?',
        interactionType: 'single_choice',
        options: ['352', '532', '325', '253'],
        expectedAnswer: '352',
        explanation: '3 trăm, 5 chục và 2 đơn vị viết là 352.',
        skillTag: 'Cấu tạo số có 3 chữ số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Viết từ hàng lớn đến hàng bé: trăm (3), chục (5), đơn vị (2): 352.' }]
      },
      {
        id: 'q-g2-10-2',
        order: 2,
        prompt: 'Số 608 có chữ số hàng chục là mấy?',
        interactionType: 'number_input',
        expectedAnswer: '0',
        explanation: 'Chữ số hàng chục là 0 (đọc là sáu trăm linh tám).',
        skillTag: 'Chữ số 0 ở hàng chục',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Chữ số ở giữa là hàng chục: số 0.' }]
      },
      {
        id: 'q-g2-10-3',
        order: 3,
        prompt: 'Chọn dấu so sánh đúng: 489 ... 512',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: 'So sánh hàng trăm: 4 trăm < 5 trăm nên 489 < 512.',
        skillTag: 'So sánh số phạm vi 1000',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Hàng trăm 4 bé hơn hàng trăm 5 nên 489 < 512.' }]
      },
      {
        id: 'q-g2-10-4',
        order: 4,
        prompt: 'Nối số với cách đọc tương ứng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '405', right: 'Bốn trăm linh năm' },
          { left: '750', right: 'Bảy trăm năm mươi' },
          { left: '999', right: 'Chín trăm chín mươi chín' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '405: Bốn trăm linh năm; 750: Bảy trăm năm mươi; 999: Chín trăm chín mươi chín.',
        skillTag: 'Đọc số phạm vi 1000',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Khi hàng chục là 0 ta đọc là linh.' }]
      },
      {
        id: 'q-g2-10-5',
        order: 5,
        prompt: 'Số tròn trăm liền sau số 300 là số nào?',
        interactionType: 'number_input',
        expectedAnswer: '400',
        explanation: '300 thêm 1 trăm là 400.',
        skillTag: 'Số tròn trăm',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm số tròn trăm: 100, 200, 300 rồi đến 400.' }]
      },
      {
        id: 'q-g2-10-6',
        order: 6,
        prompt: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 380, 290, 510, 420',
        interactionType: 'number_line_order',
        options: ['290', '380', '420', '510'],
        expectedAnswer: '290,380,420,510',
        explanation: 'Thứ tự từ bé đến lớn: 290, 380, 420, 510.',
        skillTag: 'Sắp xếp số đến 1000',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'So sánh hàng trăm: 2 < 3 < 4 < 5.' }]
      },
      {
        id: 'q-g2-10-7',
        order: 7,
        prompt: 'Số lớn nhất có 3 chữ số là số nào?',
        interactionType: 'single_choice',
        options: ['999', '1000', '900', '989'],
        expectedAnswer: '999',
        explanation: '999 là số có 3 chữ số lớn nhất (1000 là số có 4 chữ số).',
        skillTag: 'Số lớn nhất 3 chữ số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Số 1000 có 4 chữ số, vậy số lớn nhất có 3 chữ số là 999.' }]
      },
      {
        id: 'q-g2-10-8',
        order: 8,
        prompt: 'Số 1000 gồm bao nhiêu trăm?',
        interactionType: 'number_input',
        expectedAnswer: '10',
        explanation: '1000 gồm 10 trăm (1 nghìn).',
        skillTag: '10 trăm là 1000',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: '10 trăm gộp lại thành 1 nghìn (1000).' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g2-11',
      title: 'Đo lường: Ki-lô-gam (kg) và Lít (l)',
      grade: 2,
      topic: 'Đo lường',
      learningStandard: 'Làm quen với biểu tượng khối lượng ki-lô-gam (kg); dung tích lít (l); thực hiện tính toán đơn giản.',
      description: 'Nhận biết và sử dụng đơn vị đo khối lượng và dung tích quen thuộc.',
      durationMinutes: 15,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-11-1',
        order: 1,
        prompt: 'Ki-lô-gam được viết tắt là gì?',
        interactionType: 'single_choice',
        options: ['kg', 'g', 'l', 'km'],
        expectedAnswer: 'kg',
        explanation: 'Ki-lô-gam viết tắt là kg.',
        skillTag: 'Ký hiệu ki-lô-gam',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Ki-lô-gam viết tắt là 2 chữ k và g: kg.' }]
      },
      {
        id: 'q-g2-11-2',
        order: 2,
        prompt: 'Lít được viết tắt là chữ gì?',
        interactionType: 'single_choice',
        options: ['l', 'ml', 'kg', 'm'],
        expectedAnswer: 'l',
        explanation: 'Lít viết tắt là chữ cái l.',
        skillTag: 'Ký hiệu lít',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Lít viết tắt là chữ l thường.' }]
      },
      {
        id: 'q-g2-11-3',
        order: 3,
        prompt: 'Tính: 18 kg + 25 kg = ? Điền số kg:',
        interactionType: 'number_input',
        expectedAnswer: '43',
        explanation: '18 + 25 = 43 kg.',
        skillTag: 'Cộng số đo kg',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '8 + 5 = 13 nhớ 1, 1 + 2 + 1 = 4: 43 kg.' }]
      },
      {
        id: 'q-g2-11-4',
        order: 4,
        prompt: 'Chọn dấu so sánh đúng: 35 l - 10 l ... 26 l',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '35 l - 10 l = 25 l. Vì 25 l < 26 l nên điền dấu <.',
        skillTag: 'So sánh số đo lít',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '35 - 10 = 25 l. 25 nhỏ hơn 26 nên điền dấu <.' }]
      },
      {
        id: 'q-g2-11-5',
        order: 5,
        prompt: 'Nối phép tính đo lường với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '40 l : 5', right: '8 l' },
          { left: '5 kg × 6', right: '30 kg' },
          { left: '50 kg - 15 kg', right: '35 kg' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '40 l : 5 = 8 l; 5 kg × 6 = 30 kg; 50 kg - 15 kg = 35 kg.',
        skillTag: 'Phép tính với kg và l',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Tính nhẩm các con số và giữ nguyên đơn vị tương ứng.' }]
      },
      {
        id: 'q-g2-11-6',
        order: 6,
        prompt: 'Can thứ nhất chứa 15 l dầu, can thứ hai chứa 18 l dầu. Cả hai can chứa bao nhiêu lít dầu?',
        interactionType: 'number_input',
        expectedAnswer: '33',
        explanation: '15 + 18 = 33 l.',
        skillTag: 'Toán can dầu',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '15 + 18 = 33 lít.' }]
      },
      {
        id: 'q-g2-11-7',
        order: 7,
        prompt: 'Bao gạo nặng 50 kg, người ta đã lấy ra 18 kg. Bao gạo còn lại bao nhiêu kg?',
        interactionType: 'single_choice',
        options: ['32 kg', '42 kg', '38 kg', '68 kg'],
        expectedAnswer: '32 kg',
        explanation: '50 - 18 = 32 kg.',
        skillTag: 'Toán bớt khối lượng',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '50 - 18: 10 - 8 = 2 nhớ 1, 5 - 2 = 3: 32 kg.' }]
      },
      {
        id: 'q-g2-11-8',
        order: 8,
        prompt: 'Tính: 2 kg × 9 = ? Điền số kg:',
        interactionType: 'number_input',
        expectedAnswer: '18',
        explanation: '2 × 9 = 18 kg.',
        skillTag: 'Nhân số đo kg',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: '2 × 9 = 18 kg.' }]
      }
    ]
  },
  {
    lesson: {
      id: 'lesson-g2-12',
      title: 'Xem lịch, Ngày - Tháng và Xem đồng hồ',
      grade: 2,
      topic: 'Thời gian',
      learningStandard: 'Đọc được tờ lịch ngày - tháng; biết số ngày trong tuần lễ; xem đồng hồ khi kim phút chỉ số 3 (15 phút), số 6 (30 phút / rưỡi).',
      description: 'Nắm vững các mốc thời gian giờ rưỡi, giờ 15 phút và các thứ trong tuần.',
      durationMinutes: 20,
      totalQuestions: 8,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-12-1',
        order: 1,
        prompt: 'Một tuần lễ có bao nhiêu ngày?',
        interactionType: 'number_input',
        expectedAnswer: '7',
        acceptableAnswers: ['7', '7 ngày'],
        explanation: 'Một tuần lễ có 7 ngày (từ Thứ Hai đến Chủ Nhật).',
        skillTag: 'Ngày trong tuần',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm các thứ: Thứ 2, 3, 4, 5, 6, 7, Chủ Nhật gồm đúng 7 ngày.' }]
      },
      {
        id: 'q-g2-12-2',
        order: 2,
        prompt: 'Khi kim phút chỉ vào số 6 trên mặt đồng hồ thì được gọi là bao nhiêu phút?',
        interactionType: 'single_choice',
        options: ['30 phút (giờ rưỡi)', '15 phút', '6 phút', '45 phút'],
        expectedAnswer: '30 phút (giờ rưỡi)',
        explanation: 'Kim phút chỉ số 6 là 30 phút hay còn gọi là giờ rưỡi.',
        skillTag: 'Giờ rưỡi',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Mỗi số cách nhau 5 phút: 5 × 6 = 30 phút (một nửa vòng đồng hồ là giờ rưỡi).' }]
      },
      {
        id: 'q-g2-12-3',
        order: 3,
        prompt: 'Khi kim phút chỉ vào số 3 là bao nhiêu phút?',
        interactionType: 'number_input',
        expectedAnswer: '15',
        acceptableAnswers: ['15', '15 phút'],
        explanation: '5 × 3 = 15 phút.',
        skillTag: 'Giờ 15 phút',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Kim phút chỉ số 3 tương ứng với 15 phút.' }]
      },
      {
        id: 'q-g2-12-4',
        order: 4,
        prompt: 'Nối ngày trong tuần với thứ tự kế tiếp:',
        interactionType: 'expression_match',
        pairs: [
          { left: 'Hôm nay là Thứ Ba', right: 'Ngày mai là Thứ Tư' },
          { left: 'Hôm nay là Thứ Bảy', right: 'Ngày mai là Chủ Nhật' },
          { left: 'Hôm qua là Thứ Năm', right: 'Hôm nay là Thứ Sáu' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: 'Thứ Ba đến Thứ Tư; Thứ Bảy đến Chủ Nhật; Thứ Năm đến Thứ Sáu.',
        skillTag: 'Hôm qua, hôm nay, ngày mai',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Xác định thứ tự các ngày trong tuần từ Thứ Hai đến Chủ Nhật.' }]
      },
      {
        id: 'q-g2-12-5',
        order: 5,
        prompt: 'Nếu ngày 5 là Thứ Hai thì ngày 12 cùng tháng đó là Thứ mấy?',
        interactionType: 'single_choice',
        options: ['Thứ Hai', 'Thứ Ba', 'Chủ Nhật', 'Thứ Tư'],
        expectedAnswer: 'Thứ Hai',
        explanation: 'Sau 1 tuần lễ (7 ngày), tức là 5 + 7 = 12, ngày đó lại là Thứ Hai.',
        skillTag: 'Quy luật lịch 7 ngày',
        difficulty: 'hard',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Cứ cách đúng 7 ngày thì lại lặp lại cùng một thứ trong tuần: 5 + 7 = 12 nên vẫn là Thứ Hai.' }]
      },
      {
        id: 'q-g2-12-6',
        order: 6,
        prompt: 'Đồng hồ có kim ngắn qua số 8 một chút, kim dài chỉ số 6. Đó là mấy giờ mấy phút?',
        interactionType: 'single_choice',
        options: ['8 giờ 30 phút', '8 giờ 6 phút', '6 giờ 40 phút', '9 giờ 30 phút'],
        expectedAnswer: '8 giờ 30 phút',
        explanation: 'Đó là 8 giờ 30 phút (8 giờ rưỡi).',
        skillTag: 'Đọc đồng hồ giờ rưỡi',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Kim ngắn qua số 8 là 8 giờ, kim dài ở số 6 là 30 phút.' }]
      },
      {
        id: 'q-g2-12-7',
        order: 7,
        prompt: 'Tháng 4 có 30 ngày. Đúng hay Sai?',
        interactionType: 'single_choice',
        options: ['Đúng', 'Sai'],
        expectedAnswer: 'Đúng',
        explanation: 'Tháng 4 có đúng 30 ngày.',
        skillTag: 'Số ngày trong tháng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Ghi nhớ: Tháng 4, 6, 9, 11 có 30 ngày.' }]
      },
      {
        id: 'q-g2-12-8',
        order: 8,
        prompt: 'Học sinh vào lớp học lúc 7 giờ 15 phút, tan học lúc 10 giờ 15 phút. Buổi học kéo dài trong mấy giờ?',
        interactionType: 'number_input',
        expectedAnswer: '3',
        acceptableAnswers: ['3', '3 giờ'],
        explanation: '10 - 7 = 3 giờ.',
        skillTag: 'Tính thời gian buổi học',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Phút giống nhau (15 phút), lấy 10 giờ trừ 7 giờ = 3 giờ.' }]
      }
    ]
  }
];
