/**
 * THÁM TỬ TOÁN NHÍ - KHO BÀI TẬP BỔ SUNG TUẦN 1 ĐẾN TUẦN 9 (KNTT)
 * Môn Toán Lớp 1 & Lớp 2 - Chuẩn chương trình GDPT 2018 (Kết nối tri thức với cuộc sống)
 * Đảm bảo 100% hình ảnh có sẵn trong hệ thống, không 404, không lộ đáp án.
 * 
 * ĐỐI CHIẾU CHÍNH XÁC PHÂN PHỐI CHƯƠNG TRÌNH KẾT NỐI TRI THỨC VỚI CUỘC SỐNG:
 * Khối 1:
 * - Tuần 1: Bài 1 - Các số 0 đến 5: Đếm, đọc và viết
 * - Tuần 2: Bài 2 - Bé hơn, lớn hơn, bằng nhau (<, >, =)
 * - Tuần 3: Bài 3 - Nhiều hơn, ít hơn, bằng nhau
 * - Tuần 4: Bài 4 - Hình vuông, hình tròn, hình tam giác, hình chữ nhật
 * - Tuần 5: Bài 5 - Vị trí: Trên - Dưới, Phải - Trái, Trước - Sau, Ở giữa
 * - Tuần 6: Bài 6 - Các số 6, 7, 8, 9, 10
 * - Tuần 7: Bài 7 - Số 10 và So sánh các số trong phạm vi 10
 * - Tuần 8: Bài 8 - Làm quen với phép cộng, dấu cộng (+)
 * - Tuần 9: Bài 9 - Phép cộng trong phạm vi 10
 * 
 * Khối 2:
 * - Tuần 1: Bài 1 - Ôn tập các số đến 100: Đọc, viết và cấu tạo số
 * - Tuần 2: Bài 2 - Tia số. Số liền trước, số liền sau
 * - Tuần 3: Bài 3 - Các thành phần của phép cộng, phép trừ
 * - Tuần 4: Bài 4 - Hơn, kém nhau bao nhiêu
 * - Tuần 5: Bài 5 - Ôn tập phép cộng, phép trừ không nhớ trong phạm vi 100
 * - Tuần 6: Bài 6 - Điểm, đoạn thẳng, đường thẳng, đường cong, ba điểm thẳng hàng
 * - Tuần 7: Bài 7 - Phép cộng có nhớ trong phạm vi 20 (Bảng cộng qua 10)
 * - Tuần 8: Bài 8 - Phép trừ có nhớ trong phạm vi 20 (Bảng trừ qua 10)
 * - Tuần 9: Bài 9 - Đo lường: Ki-lô-gam (kg) và Lít (l)
 */

import { Lesson, Question } from '../types';

export interface CurriculumSeedItem {
  lesson: Omit<Lesson, 'id' | 'createdAt' | 'createdBy' | 'dataOrigin' | 'environmentTag'> & { id: string };
  questions: Question[];
}

export const WEEKS_1_TO_9_SUPPLEMENTARY: CurriculumSeedItem[] = [
  // ==========================================
  // KHỐI 1 - CHUẨN PPCT TUẦN 1 ĐẾN TUẦN 9 (9 BÀI)
  // ==========================================

  // --- LỚP 1 - TUẦN 1: CÁC SỐ 0 ĐẾN 5 ---
  {
    lesson: {
      id: 'lesson-g1-w01',
      title: '[Tuần 1] Các số từ 0 đến 5: Đếm, Đọc và Viết',
      grade: 1,
      week: 1,
      topic: 'Các số từ 0 đến 10',
      learningStandard: 'Đếm, đọc, viết được các số từ 0 đến 5; nhận biết số lượng đồ vật trong phạm vi 5.',
      description: 'Làm quen với các chữ số tự nhiên từ 0 đến 5 qua đồ vật trực quan quen thuộc.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-w01-1',
        order: 1,
        prompt: 'Thám tử Cáo nhìn thấy có bao nhiêu củ cà rốt trong rổ?',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 4, iconName: 'carrot' },
        options: ['3', '4', '5', '2'],
        expectedAnswer: '4',
        explanation: 'Đếm từng củ cà rốt: 1, 2, 3, 4 củ cà rốt.',
        skillTag: 'Đếm số lượng đến 5',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Hãy chỉ tay vào từng củ cà rốt và đếm chậm: 1, 2, 3, 4.' }]
      },
      {
        id: 'q-g1-w01-2',
        order: 2,
        prompt: 'Đếm số quả táo đỏ trên cây và chọn số thích hợp:',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 3, iconName: 'apple' },
        options: ['2', '3', '4', '5'],
        expectedAnswer: '3',
        explanation: 'Có tất cả 3 quả táo đỏ trên cây.',
        skillTag: 'Đếm quả táo',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm lần lượt từng quả táo: 1, 2, 3 quả.' }]
      },
      {
        id: 'q-g1-w01-3',
        order: 3,
        prompt: 'Trong đĩa không có chiếc kẹo nào. Ta dùng số nào để biểu thị số kẹo trong đĩa?',
        interactionType: 'single_choice',
        options: ['Số 0', 'Số 1', 'Số 2', 'Số 5'],
        expectedAnswer: 'Số 0',
        explanation: 'Không có vật nào được biểu thị bằng số 0.',
        skillTag: 'Nhận biết số 0',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Không có đồ vật nào tương ứng với số 0.' }]
      },
      {
        id: 'q-g1-w01-4',
        order: 4,
        prompt: 'Có mấy chú cá vàng đang bơi trong bể?',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 5, iconName: 'fish' },
        options: ['4', '5', '3', '2'],
        expectedAnswer: '5',
        explanation: 'Đếm lần lượt: 1, 2, 3, 4, 5 chú cá.',
        skillTag: 'Đếm số lượng 5',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Chỉ tay vào từng chú cá để đếm đủ 5 chú cá.' }]
      },
      {
        id: 'q-g1-w01-5',
        order: 5,
        prompt: 'Nối số lượng đồ vật với chữ số tương ứng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '✏️ ✏️ (Bút chì)', right: 'Số 2', count: 2, icon: 'pencil', label: 'Bút chì' },
          { left: '🌸 🌸 🌸 🌸 🌸 (Bông hoa)', right: 'Số 5', count: 5, icon: 'flower', label: 'Bông hoa' },
          { left: '🐰 (Chú thỏ)', right: 'Số 1', count: 1, icon: 'rabbit', label: 'Chú thỏ' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: 'Nhóm bút chì nối số 2, nhóm bông hoa nối số 5, nhóm chú thỏ nối số 1.',
        skillTag: 'Ghép cặp số lượng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm kỹ từng nhóm đồ vật trước khi nối số.' }]
      }
    ]
  },

  // --- LỚP 1 - TUẦN 2: SO SÁNH CÁC SỐ (BÉ HƠN, LỚN HƠN, BẰNG NHAU) ---
  {
    lesson: {
      id: 'lesson-g1-w02',
      title: '[Tuần 2] So sánh các số: Bé hơn, Lớn hơn, Bằng nhau (<, >, =)',
      grade: 1,
      week: 2,
      topic: 'Các số từ 0 đến 10',
      learningStandard: 'Biết so sánh hai số trong phạm vi 5, sử dụng đúng các dấu <, >, =.',
      description: 'Luyện tập so sánh các số lượng và sử dụng chính xác các dấu so sánh.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-w02-1',
        order: 1,
        prompt: 'So sánh số lượng: 4 quả táo ... 2 quả táo. Chọn dấu thích hợp (<, >, =):',
        interactionType: 'operator_pick',
        visualConfig: {
          type: 'comparison',
          leftCount: 4,
          rightCount: 2,
          iconName: 'apple',
          leftLabel: '4 quả táo',
          rightLabel: '2 quả táo'
        },
        options: ['>', '<', '='],
        expectedAnswer: '>',
        explanation: 'Vì 4 nhiều hơn 2 nên 4 > 2.',
        skillTag: 'So sánh lớn hơn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Miệng dấu luôn mở về phía số lớn hơn (số 4).' }]
      },
      {
        id: 'q-g1-w02-2',
        order: 2,
        prompt: 'Điền dấu thích hợp vào chỗ chấm: 3 ... 5',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '3 bé hơn 5 nên 3 < 5.',
        skillTag: 'So sánh bé hơn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Đầu nhọn quay về số bé hơn (số 3).' }]
      },
      {
        id: 'q-g1-w02-3',
        order: 3,
        prompt: 'Có 3 chú thỏ và 3 củ cà rốt. Điền dấu so sánh thích hợp:',
        interactionType: 'operator_pick',
        visualConfig: {
          type: 'comparison',
          leftCount: 3,
          rightCount: 3,
          iconName: 'carrot',
          leftLabel: '3 chú thỏ',
          rightLabel: '3 củ cà rốt'
        },
        options: ['=', '>', '<'],
        expectedAnswer: '=',
        explanation: 'Hai bên số lượng bằng nhau: 3 = 3.',
        skillTag: 'So sánh bằng nhau',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Số lượng hai bên như nhau ta dùng dấu bằng (=).' }]
      },
      {
        id: 'q-g1-w02-4',
        order: 4,
        prompt: 'Trong các số: 1, 4, 2, 5. Số nào là số lớn nhất?',
        interactionType: 'single_choice',
        options: ['5', '4', '2', '1'],
        expectedAnswer: '5',
        explanation: 'Số 5 lớn nhất trong dãy số.',
        skillTag: 'Tìm số lớn nhất đến 5',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Đếm từ 1 đến 5, số đứng sau cùng là số lớn nhất.' }]
      },
      {
        id: 'q-g1-w02-5',
        order: 5,
        prompt: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 4, 1, 3, 2',
        interactionType: 'single_choice',
        options: ['1, 2, 3, 4', '4, 3, 2, 1', '1, 3, 2, 4', '2, 1, 3, 4'],
        expectedAnswer: '1, 2, 3, 4',
        explanation: 'Thứ tự từ bé đến lớn: 1, 2, 3, 4.',
        skillTag: 'Thứ tự số đến 5',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Bắt đầu từ số nhỏ nhất là 1 rồi đếm xuôi tiếp.' }]
      }
    ]
  },

  // --- LỚP 1 - TUẦN 3: NHIỀU HƠN, ÍT HƠN, BẰNG NHAU ---
  {
    lesson: {
      id: 'lesson-g1-w03',
      title: '[Tuần 3] Nhiều hơn, Ít hơn, Bằng nhau',
      grade: 1,
      week: 3,
      topic: 'Các số từ 0 đến 10',
      learningStandard: 'Nhận biết quan hệ nhiều hơn, ít hơn, bằng nhau bằng phương pháp ghép đôi trực quan.',
      description: 'Luyện tập so sánh các tập hợp đồ vật trực quan bằng cách ghép đôi tương ứng 1-1.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-w03-1',
        order: 1,
        prompt: 'Có 5 bông hoa đỏ và 3 chú bướm. Số bông hoa đỏ so với số chú bướm thì:',
        interactionType: 'single_choice',
        visualConfig: {
          type: 'comparison',
          leftCount: 5,
          rightCount: 3,
          iconName: 'flower',
          leftLabel: '5 bông hoa',
          rightLabel: '3 chú bướm'
        },
        options: ['Nhiều hơn', 'Ít hơn', 'Bằng nhau'],
        expectedAnswer: 'Nhiều hơn',
        explanation: '5 nhiều hơn 3 (thừa ra 2 bông hoa). Vậy số hoa nhiều hơn số bướm.',
        skillTag: 'Nhận biết nhiều hơn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Nhóm hoa có 5 bông, bướm có 3 con, hoa nhiều hơn.' }]
      },
      {
        id: 'q-g1-w03-2',
        order: 2,
        prompt: 'Có 2 cây bút chì và 4 cục tẩy. Số cây bút chì so với số cục tẩy thì:',
        interactionType: 'single_choice',
        visualConfig: {
          type: 'comparison',
          leftCount: 2,
          rightCount: 4,
          iconName: 'pencil',
          leftLabel: '2 bút chì',
          rightLabel: '4 cục tẩy'
        },
        options: ['Ít hơn', 'Nhiều hơn', 'Bằng nhau'],
        expectedAnswer: 'Ít hơn',
        explanation: '2 ít hơn 4. Vậy số bút chì ít hơn số cục tẩy.',
        skillTag: 'Nhận biết ít hơn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '2 nhỏ hơn 4 nên bút chì ít hơn.' }]
      },
      {
        id: 'q-g1-w03-3',
        order: 3,
        prompt: 'Có 4 chú thỏ và 4 củ cà rốt. Số thỏ và số cà rốt như thế nào với nhau?',
        interactionType: 'single_choice',
        visualConfig: {
          type: 'comparison',
          leftCount: 4,
          rightCount: 4,
          iconName: 'carrot',
          leftLabel: '4 chú thỏ',
          rightLabel: '4 củ cà rốt'
        },
        options: ['Bằng nhau', 'Số thỏ nhiều hơn', 'Số thỏ ít hơn'],
        expectedAnswer: 'Bằng nhau',
        explanation: 'Mỗi chú thỏ được 1 củ cà rốt, không thừa không thiếu. Vậy hai bên bằng nhau.',
        skillTag: 'Nhận biết bằng nhau',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Cả hai bên đều có 4, vậy bằng nhau.' }]
      },
      {
        id: 'q-g1-w03-4',
        order: 4,
        prompt: 'Chọn câu nhận xét đúng khi so sánh 3 quả cam và 5 quả táo:',
        interactionType: 'single_choice',
        options: ['Số cam ít hơn số táo', 'Số cam nhiều hơn số táo', 'Số cam bằng số táo'],
        expectedAnswer: 'Số cam ít hơn số táo',
        explanation: '3 ít hơn 5 nên số cam ít hơn số táo.',
        skillTag: 'So sánh đồ vật',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: '3 bé hơn 5 nên số cam ít hơn.' }]
      },
      {
        id: 'q-g1-w03-5',
        order: 5,
        prompt: 'Nối nhận xét đúng với từng cặp đối tượng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '4 cái bánh và 2 cái kẹo', right: 'Bánh nhiều hơn kẹo' },
          { left: '1 chú mèo và 3 chú chuột', right: 'Mèo ít hơn chuột' },
          { left: '2 con gà và 2 con vịt', right: 'Gà bằng vịt' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '4 > 2 bánh nhiều hơn; 1 < 3 mèo ít hơn; 2 = 2 bằng nhau.',
        skillTag: 'Ghép cặp so sánh',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'So sánh từng cặp số lượng để nối.' }]
      }
    ]
  },

  // --- LỚP 1 - TUẦN 4: HÌNH VUÔNG, HÌNH TRÒN, HÌNH TAM GIÁC, HÌNH CHỮ NHẬT ---
  {
    lesson: {
      id: 'lesson-g1-w04',
      title: '[Tuần 4] Hình vuông, Hình tròn, Hình tam giác, Hình chữ nhật',
      grade: 1,
      week: 4,
      topic: 'Hình học trực quan',
      learningStandard: 'Nhận biết và gọi đúng tên các hình phẳng: hình vuông, hình tròn, hình tam giác, hình chữ nhật.',
      description: 'Làm quen với các hình học cơ bản qua đồ vật thực tế quen thuộc trong cuộc sống.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-w04-1',
        order: 1,
        prompt: 'Mặt chiếc đồng hồ treo tường có dạng hình gì tròn xoe, không có góc cạnh nào?',
        interactionType: 'single_choice',
        options: ['Hình tròn', 'Hình vuông', 'Hình tam giác', 'Hình chữ nhật'],
        expectedAnswer: 'Hình tròn',
        explanation: 'Hình tròn là hình cong tròn khép kín, không có cạnh và góc.',
        skillTag: 'Nhận diện hình tròn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Hình tròn có đường cong khép kín, lăn được.' }]
      },
      {
        id: 'q-g1-w04-2',
        order: 2,
        prompt: 'Biển báo giao thông hình có 3 cạnh và 3 góc nhọn là hình gì?',
        interactionType: 'single_choice',
        options: ['Hình tam giác', 'Hình vuông', 'Hình tròn', 'Hình chữ nhật'],
        expectedAnswer: 'Hình tam giác',
        explanation: 'Hình tam giác có đúng 3 cạnh và 3 góc.',
        skillTag: 'Nhận diện hình tam giác',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Hình có 3 cạnh là hình tam giác.' }]
      },
      {
        id: 'q-g1-w04-3',
        order: 3,
        prompt: 'Chiếc khăn mùi xoa có 4 cạnh dài bằng nhau là hình gì?',
        interactionType: 'single_choice',
        options: ['Hình vuông', 'Hình chữ nhật', 'Hình tam giác', 'Hình tròn'],
        expectedAnswer: 'Hình vuông',
        explanation: 'Hình vuông có 4 cạnh bằng nhau.',
        skillTag: 'Nhận diện hình vuông',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Hình có 4 cạnh bằng nhau là hình vuông.' }]
      },
      {
        id: 'q-g1-w04-4',
        order: 4,
        prompt: 'Bảng lớp học hoặc bìa cuốn sách Toán có 2 cạnh dài bằng nhau và 2 cạnh ngắn bằng nhau là hình gì?',
        interactionType: 'single_choice',
        options: ['Hình chữ nhật', 'Hình vuông', 'Hình tam giác', 'Hình tròn'],
        expectedAnswer: 'Hình chữ nhật',
        explanation: 'Bảng lớp và bìa sách có dạng hình chữ nhật.',
        skillTag: 'Nhận diện hình chữ nhật',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Hình chữ nhật có 2 cạnh dài và 2 cạnh ngắn.' }]
      },
      {
        id: 'q-g1-w04-5',
        order: 5,
        prompt: 'Nối đồ vật với hình dạng tương ứng:',
        interactionType: 'expression_match',
        pairs: [
          { left: 'Quả bóng đá', right: 'Hình tròn' },
          { left: 'Hộp bánh quy vuông', right: 'Hình vuông' },
          { left: 'Bức tranh chữ nhật', right: 'Hình chữ nhật' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: 'Bóng đá dạng tròn, hộp bánh vuông dạng hình vuông, bức tranh dạng chữ nhật.',
        skillTag: 'Ghép nối hình học',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Quan sát kỹ hình dạng ngoài đời sống của đồ vật.' }]
      }
    ]
  },

  // --- LỚP 1 - TUẦN 5: VỊ TRÍ KHÔNG GIAN ---
  {
    lesson: {
      id: 'lesson-g1-w05',
      title: '[Tuần 5] Vị trí: Trên - Dưới, Phải - Trái, Trước - Sau, Ở giữa',
      grade: 1,
      week: 5,
      topic: 'Hình học và Định hướng không gian',
      learningStandard: 'Nhận biết và sử dụng đúng các thuật ngữ vị trí không gian trong cuộc sống.',
      description: 'Luyện tập xác định vị trí đồ vật qua các thuật ngữ định hướng không gian sinh động.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-w05-1',
        order: 1,
        prompt: 'Chú chim đang đậu ở đâu so với cành cây?',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 1, iconName: 'bird' },
        options: ['Trên cành cây', 'Dưới gầm bàn', 'Ở phía sau', 'Bên trái'],
        expectedAnswer: 'Trên cành cây',
        explanation: 'Chú chim đang đậu ở trên cành cây.',
        skillTag: 'Vị trí trên - dưới',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Chú chim ở phía trên cành cây.' }]
      },
      {
        id: 'q-g1-w05-2',
        order: 2,
        prompt: 'Cây bút chì nằm ở phía tay nào của em khi đặt bên phải cuốn vở?',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 1, iconName: 'pencil' },
        options: ['Bên phải', 'Bên trái', 'Ở giữa', 'Phía sau'],
        expectedAnswer: 'Bên phải',
        explanation: 'Cây bút chì nằm ở phía bên phải.',
        skillTag: 'Vị trí phải - trái',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Giơ tay phải để xác định bên phải.' }]
      },
      {
        id: 'q-g1-w05-3',
        order: 3,
        prompt: 'Chú thỏ đứng ở vị trí nào so với gốc cây?',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 1, iconName: 'rabbit' },
        options: ['Ở phía trước', 'Ở phía sau', 'Trên ngọn cây', 'Dưới lòng đất'],
        expectedAnswer: 'Ở phía trước',
        explanation: 'Chú thỏ đứng ngay phía trước gốc cây.',
        skillTag: 'Vị trí trước - sau',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Nhìn thấy rõ ở mặt tiền là phía trước.' }]
      },
      {
        id: 'q-g1-w05-4',
        order: 4,
        prompt: 'Trong hàng có Quả cam, Quả táo, Quả chuối. Quả táo ở vị trí nào?',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 1, iconName: 'apple' },
        options: ['Ở giữa', 'Ở đầu hàng', 'Ở cuối hàng', 'Ở bên trên'],
        expectedAnswer: 'Ở giữa',
        explanation: 'Quả táo nằm kẹp giữa quả cam và quả chuối.',
        skillTag: 'Vị trí ở giữa',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Nằm giữa hai vật gọi là ở giữa.' }]
      },
      {
        id: 'q-g1-w05-5',
        order: 5,
        prompt: 'Nối vị trí phù hợp với các đồ vật trong phòng học:',
        interactionType: 'expression_match',
        pairs: [
          { left: 'Quyển sách để', right: 'Trên mặt bàn' },
          { left: 'Đôi dép để', right: 'Dưới gầm bàn' },
          { left: 'Bức tranh treo', right: 'Trên bức tường' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: 'Sách để trên bàn, dép dưới gầm bàn, tranh treo trên tường.',
        skillTag: 'Vị trí thực tế',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Quan sát vị trí quen thuộc trong lớp.' }]
      }
    ]
  },

  // --- LỚP 1 - TUẦN 6: CÁC SỐ 6, 7, 8, 9, 10 ---
  {
    lesson: {
      id: 'lesson-g1-w06',
      title: '[Tuần 6] Các số 6, 7, 8, 9, 10: Đếm và Nhận dạng',
      grade: 1,
      week: 6,
      topic: 'Các số từ 0 đến 10',
      learningStandard: 'Đếm, đọc, viết được các số từ 6 đến 10; nhận biết số lượng trong phạm vi 10.',
      description: 'Mở rộng phạm vi đếm và nhận biết chữ số từ 6 đến 10 qua mô hình trực quan.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-w06-1',
        order: 1,
        prompt: 'Đếm xem có bao nhiêu ngôi sao màu vàng:',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 7, iconName: 'star' },
        options: ['6', '7', '8', '9'],
        expectedAnswer: '7',
        explanation: 'Có tất cả 7 ngôi sao màu vàng.',
        skillTag: 'Đếm số lượng 7',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm chậm từng ngôi sao từ 1 đến 7.' }]
      },
      {
        id: 'q-g1-w06-2',
        order: 2,
        prompt: 'Có mấy bông hoa màu đỏ đang nở rực rỡ?',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 8, iconName: 'flower' },
        options: ['7', '8', '9', '10'],
        expectedAnswer: '8',
        explanation: 'Có tất cả 8 bông hoa màu đỏ.',
        skillTag: 'Đếm số lượng 8',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm lần lượt từng bông hoa: có 8 bông hoa.' }]
      },
      {
        id: 'q-g1-w06-3',
        order: 3,
        prompt: 'Đếm số chú thỏ trắng trong bãi cỏ:',
        interactionType: 'single_choice',
        visualConfig: { type: 'counters', count: 6, iconName: 'rabbit' },
        options: ['5', '6', '7', '8'],
        expectedAnswer: '6',
        explanation: 'Có tất cả 6 chú thỏ trắng.',
        skillTag: 'Đếm số lượng 6',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm chậm từng chú thỏ để không bỏ sót chú nào.' }]
      },
      {
        id: 'q-g1-w06-4',
        order: 4,
        prompt: 'Số nào đứng liền sau số 8?',
        interactionType: 'single_choice',
        options: ['9', '7', '10', '6'],
        expectedAnswer: '9',
        explanation: 'Số đứng liền sau 8 là số 9 (8 + 1 = 9).',
        skillTag: 'Số liền sau phạm vi 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Đếm xuôi: ... 7, 8 rồi đến 9.' }]
      },
      {
        id: 'q-g1-w06-5',
        order: 5,
        prompt: 'Nối chữ số với số lượng đồ vật tương ứng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '6 cây bút chì', right: 'Số 6' },
          { left: '9 quả táo đỏ', right: 'Số 9' },
          { left: '10 chấm tròn', right: 'Số 10' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '6 bút chì nối số 6, 9 táo nối số 9, 10 chấm tròn nối số 10.',
        skillTag: 'Ghép cặp số đến 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm kỹ từng nhóm đồ vật rồi nối.' }]
      }
    ]
  },

  // --- LỚP 1 - TUẦN 7: SỐ 10 VÀ SO SÁNH CÁC SỐ TRONG PHẠM VI 10 ---
  {
    lesson: {
      id: 'lesson-g1-w07',
      title: '[Tuần 7] Số 10 và So sánh các số trong phạm vi 10',
      grade: 1,
      week: 7,
      topic: 'Các số từ 0 đến 10',
      learningStandard: 'Nhận biết số 10; so sánh thành thạo các số từ 0 đến 10 bằng dấu <, >, =.',
      description: 'Luyện tập so sánh các số trong phạm vi 10 và sắp xếp thứ tự các số.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-w07-1',
        order: 1,
        prompt: 'Điền dấu so sánh thích hợp vào chỗ chấm: 7 ... 9',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: '7 bé hơn 9 nên ta điền dấu <.',
        skillTag: 'So sánh số đến 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Đầu nhọn quay về số bé hơn (số 7).' }]
      },
      {
        id: 'q-g1-w07-2',
        order: 2,
        prompt: 'Điền dấu so sánh thích hợp vào chỗ chấm: 10 ... 8',
        interactionType: 'operator_pick',
        options: ['>', '<', '='],
        expectedAnswer: '>',
        explanation: '10 lớn hơn 8 nên ta điền dấu >.',
        skillTag: 'So sánh lớn hơn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Miệng mở rộng về phía số lớn hơn (số 10).' }]
      },
      {
        id: 'q-g1-w07-3',
        order: 3,
        prompt: 'Trong các số: 6, 10, 8, 3. Số nào là số lớn nhất?',
        interactionType: 'single_choice',
        options: ['10', '8', '6', '3'],
        expectedAnswer: '10',
        explanation: 'Số 10 là số lớn nhất trong phạm vi từ 0 đến 10.',
        skillTag: 'Tìm số lớn nhất đến 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: '10 là số lớn nhất trong các số đã cho.' }]
      },
      {
        id: 'q-g1-w07-4',
        order: 4,
        prompt: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: 7, 3, 10, 5',
        interactionType: 'single_choice',
        options: ['3, 5, 7, 10', '10, 7, 5, 3', '3, 7, 5, 10', '5, 3, 7, 10'],
        expectedAnswer: '3, 5, 7, 10',
        explanation: 'Thứ tự từ bé đến lớn là: 3, 5, 7, 10.',
        skillTag: 'Sắp xếp thứ tự đến 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Số nhỏ nhất là 3, rồi đến 5, 7, lớn nhất là 10.' }]
      },
      {
        id: 'q-g1-w07-5',
        order: 5,
        prompt: 'Số nào đứng liền trước số 10?',
        interactionType: 'single_choice',
        options: ['9', '8', '7', '10'],
        expectedAnswer: '9',
        explanation: 'Số đứng liền trước 10 là số 9 (10 - 1 = 9).',
        skillTag: 'Số liền trước của 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Số đứng ngay trước 10 là 9.' }]
      }
    ]
  },

  // --- LỚP 1 - TUẦN 8: LÀM QUEN VỚI PHÉP CỘNG, DẤU CỘNG (+) ---
  {
    lesson: {
      id: 'lesson-g1-w08',
      title: '[Tuần 8] Làm quen với Phép cộng và Dấu cộng (+)',
      grade: 1,
      week: 8,
      topic: 'Phép cộng và phép trừ trong phạm vi 10',
      learningStandard: 'Hiểu ý nghĩa phép cộng là hành động "gộp lại"; làm quen với dấu cộng (+) và dấu bằng (=).',
      description: 'Hình thành khái niệm phép cộng qua tình huống trực quan gộp hai nhóm đối tượng.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-w08-1',
        order: 1,
        prompt: 'Có 3 quả táo đỏ và 2 quả táo xanh. Gộp lại có tất cả bao nhiêu quả táo?',
        interactionType: 'single_choice',
        visualConfig: {
          type: 'addition',
          leftCount: 3,
          rightCount: 2,
          iconName: 'apple',
          leftLabel: '3 táo đỏ',
          rightLabel: '2 táo xanh'
        },
        options: ['5 quả táo', '4 quả táo', '6 quả táo', '1 quả táo'],
        expectedAnswer: '5 quả táo',
        explanation: 'Gộp lại là phép cộng: 3 + 2 = 5 (quả táo).',
        skillTag: 'Ý nghĩa phép cộng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Gộp lại là phép tính cộng: 3 + 2 = 5.' }]
      },
      {
        id: 'q-g1-w08-2',
        order: 2,
        prompt: 'Tính nhẩm phép tính cộng: 2 + 2 = ?',
        interactionType: 'single_choice',
        options: ['4', '3', '5', '0'],
        expectedAnswer: '4',
        explanation: '2 + 2 = 4.',
        skillTag: 'Cộng trong phạm vi 5',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: '2 ngón tay thêm 2 ngón tay là 4 ngón tay.' }]
      },
      {
        id: 'q-g1-w08-3',
        order: 3,
        prompt: 'Trên cành có 4 chú chim, 1 chú chim bay đến thêm. Hỏi có tất cả mấy chú chim?',
        interactionType: 'single_choice',
        visualConfig: {
          type: 'addition',
          leftCount: 4,
          rightCount: 1,
          iconName: 'bird',
          leftLabel: '4 chú chim',
          rightLabel: '1 chú chim bay đến'
        },
        options: ['5 chú chim', '4 chú chim', '3 chú chim', '6 chú chim'],
        expectedAnswer: '5 chú chim',
        explanation: '4 thêm 1 là 5: 4 + 1 = 5 (chú chim).',
        skillTag: 'Toán thêm vào',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: '"Bay đến thêm" là phép cộng: 4 + 1 = 5.' }]
      },
      {
        id: 'q-g1-w08-4',
        order: 4,
        prompt: 'Điền số thích hợp vào chỗ chấm: 3 + 1 = ...',
        interactionType: 'single_choice',
        options: ['4', '3', '5', '2'],
        expectedAnswer: '4',
        explanation: '3 + 1 = 4.',
        skillTag: 'Cộng thêm 1',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: '3 đếm thêm 1 là 4.' }]
      },
      {
        id: 'q-g1-w08-5',
        order: 5,
        prompt: 'Nối phép tính cộng với kết quả chính xác:',
        interactionType: 'expression_match',
        pairs: [
          { left: '1 + 2', right: '3' },
          { left: '2 + 3', right: '5' },
          { left: '3 + 1', right: '4' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '1 + 2 = 3; 2 + 3 = 5; 3 + 1 = 4.',
        skillTag: 'Phép cộng cơ bản',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Tính nhẩm từng phép cộng rồi nối.' }]
      }
    ]
  },

  // --- LỚP 1 - TUẦN 9: PHÉP CỘNG TRONG PHẠM VI 10 ---
  {
    lesson: {
      id: 'lesson-g1-w09',
      title: '[Tuần 9] Phép cộng trong phạm vi 10',
      grade: 1,
      week: 9,
      topic: 'Phép cộng và phép trừ trong phạm vi 10',
      learningStandard: 'Thuộc bảng cộng và thực hiện thành thạo các phép tính cộng trong phạm vi 10.',
      description: 'Luyện tập các phép tính cộng trong phạm vi 10 và giải bài toán có lời văn gộp nhóm.',
      durationMinutes: 15,
      totalQuestions: 6,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g1-w09-1',
        order: 1,
        prompt: 'Tính nhẩm: 6 + 3 = ? Điền kết quả vào ô trống:',
        interactionType: 'number_input',
        expectedAnswer: '9',
        acceptableAnswers: ['9'],
        explanation: '6 + 3 = 9.',
        skillTag: 'Cộng trong phạm vi 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm thêm 3 từ số 6: 7, 8, 9.' }]
      },
      {
        id: 'q-g1-w09-2',
        order: 2,
        prompt: 'Tính nhẩm: 5 + 5 = ?',
        interactionType: 'single_choice',
        options: ['10', '9', '8', '7'],
        expectedAnswer: '10',
        explanation: '5 + 5 = 10.',
        skillTag: 'Cộng tạo thành 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: '5 ngón tay cộng 5 ngón tay là 10 ngón tay.' }]
      },
      {
        id: 'q-g1-w09-3',
        order: 3,
        prompt: 'Trong bể có 4 chú cá, thả thêm 3 chú cá nữa. Hỏi trong bể có tất cả bao nhiêu chú cá?',
        interactionType: 'single_choice',
        visualConfig: {
          type: 'addition',
          leftCount: 4,
          rightCount: 3,
          iconName: 'fish',
          leftLabel: '4 chú cá',
          rightLabel: '3 chú cá thả thêm'
        },
        options: ['7 chú cá', '6 chú cá', '8 chú cá', '5 chú cá'],
        expectedAnswer: '7 chú cá',
        explanation: '4 + 3 = 7 (chú cá).',
        skillTag: 'Toán lời văn cộng phạm vi 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: '"Thả thêm" là phép cộng: 4 + 3 = 7 chú cá.' }]
      },
      {
        id: 'q-g1-w09-4',
        order: 4,
        prompt: 'Điền số thích hợp vào chỗ chấm: 7 + ... = 9',
        interactionType: 'number_input',
        expectedAnswer: '2',
        acceptableAnswers: ['2'],
        explanation: 'Vì 7 + 2 = 9 nên số cần điền là 2.',
        skillTag: 'Tìm số hạng còn thiếu',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Từ 7 đếm thêm mấy để bằng 9? 7 đếm thêm 8, 9 (thêm 2).' }]
      },
      {
        id: 'q-g1-w09-5',
        order: 5,
        prompt: 'Điền dấu so sánh thích hợp: 4 + 4 ... 5 + 2',
        interactionType: 'operator_pick',
        options: ['>', '<', '='],
        expectedAnswer: '>',
        explanation: 'Ta có 4 + 4 = 8 và 5 + 2 = 7. Vì 8 > 7 nên điền dấu >.',
        skillTag: 'So sánh phép tính',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Tính hai vế: 8 lớn hơn 7.' }]
      },
      {
        id: 'q-g1-w09-6',
        order: 6,
        prompt: 'Nối phép tính với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '4 + 5', right: '9' },
          { left: '3 + 4', right: '7' },
          { left: '2 + 8', right: '10' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '4 + 5 = 9; 3 + 4 = 7; 2 + 8 = 10.',
        skillTag: 'Bảng cộng tổng hợp phạm vi 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Tính nhẩm từng phép tính rồi ghép nối.' }]
      }
    ]
  },

  // ==========================================
  // KHỐI 2 - CHUẨN PPCT TUẦN 1 ĐẾN TUẦN 9 (9 BÀI)
  // ==========================================

  // --- LỚP 2 - TUẦN 1: ÔN TẬP CÁC SỐ ĐẾN 100 ---
  {
    lesson: {
      id: 'lesson-g2-w01',
      title: '[Tuần 1] Ôn tập các số đến 100: Đọc, Viết và Cấu tạo số',
      grade: 2,
      week: 1,
      topic: 'Ôn tập đầu năm và các số đến 100',
      learningStandard: 'Đọc, viết, so sánh và phân tích cấu tạo thập phân của các số trong phạm vi 100.',
      description: 'Hệ thống hóa kiến thức số học lớp 1: nhận biết hàng chục, hàng đơn vị và thứ tự các số đến 100.',
      durationMinutes: 20,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-w01-1',
        order: 1,
        prompt: 'Số gồm 4 chục và 7 đơn vị được viết là số nào?',
        interactionType: 'single_choice',
        visualConfig: { type: 'bundles', tens: 4, ones: 7 },
        options: ['47', '74', '407', '11'],
        expectedAnswer: '47',
        explanation: '4 chục viết ở hàng chục (bên trái), 7 đơn vị viết ở hàng đơn vị (bên phải): 47.',
        skillTag: 'Cấu tạo số có 2 chữ số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Số chục viết trước, số đơn vị viết sau: 4 chục và 7 đơn vị là 47.' }]
      },
      {
        id: 'q-g2-w01-2',
        order: 2,
        prompt: 'Số liền trước của số 60 là số nào?',
        interactionType: 'number_input',
        expectedAnswer: '59',
        acceptableAnswers: ['59'],
        explanation: 'Số liền trước của 60 là: 60 - 1 = 59.',
        skillTag: 'Số liền trước',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Số liền trước của một số thì bé hơn số đó 1 đơn vị: 60 - 1 = 59.' }]
      },
      {
        id: 'q-g2-w01-3',
        order: 3,
        prompt: 'Số liền sau của số 89 là số nào?',
        interactionType: 'number_input',
        expectedAnswer: '90',
        acceptableAnswers: ['90'],
        explanation: 'Số liền sau của 89 là: 89 + 1 = 90.',
        skillTag: 'Số liền sau',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Số liền sau của một số thì lớn hơn số đó 1 đơn vị: 89 + 1 = 90.' }]
      },
      {
        id: 'q-g2-w01-4',
        order: 4,
        prompt: 'Điền dấu so sánh thích hợp vào ô trống: 56 ... 65',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: 'So sánh chữ số hàng chục: 5 chục bé hơn 6 chục nên 56 < 65.',
        skillTag: 'So sánh số có 2 chữ số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'So sánh hàng chục trước: 5 bé hơn 6 nên 56 bé hơn 65.' }]
      },
      {
        id: 'q-g2-w01-5',
        order: 5,
        prompt: 'Nối số với cách đọc tương ứng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '35', right: 'Ba mươi lăm' },
          { left: '71', right: 'Bảy mươi mốt' },
          { left: '90', right: 'Chín mươi' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '35 đọc là ba mươi lăm, 71 đọc là bảy mươi mốt, 90 đọc là chín mươi.',
        skillTag: 'Đọc số đến 100',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Chú ý phát âm: chữ số 5 ở hàng đơn vị đọc là "lăm", 1 đọc là "mốt".' }]
      }
    ]
  },

  // --- LỚP 2 - TUẦN 2: TIA SỐ. SỐ LIỀN TRƯỚC, SỐ LIỀN SAU ---
  {
    lesson: {
      id: 'lesson-g2-w02',
      title: '[Tuần 2] Tia số. Số liền trước, Số liền sau',
      grade: 2,
      week: 2,
      topic: 'Các số đến 100',
      learningStandard: 'Nhận biết tia số; xác định chính xác số liền trước và số liền sau của một số trên tia số.',
      description: 'Thực hành biểu diễn số trên tia số và xác định mối quan hệ số liền trước, liền sau.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-w02-1',
        order: 1,
        prompt: 'Trên tia số, gốc của tia số là số nào?',
        interactionType: 'single_choice',
        options: ['Số 0', 'Số 1', 'Số 10', 'Số 100'],
        expectedAnswer: 'Số 0',
        explanation: 'Gốc của tia số luôn là điểm 0.',
        skillTag: 'Gốc tia số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Tia số bắt đầu từ vạch gốc số 0 và tăng dần sang phải.' }]
      },
      {
        id: 'q-g2-w02-2',
        order: 2,
        prompt: 'Trên tia số: 23, 24, [ ? ], 26, 27. Số thích hợp điền vào dấu ? là:',
        interactionType: 'number_input',
        expectedAnswer: '25',
        acceptableAnswers: ['25'],
        explanation: 'Số đứng liền sau 24 và liền trước 26 là 25.',
        skillTag: 'Điền số trên tia số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Đếm xuôi từng đơn vị: 23, 24, 25, 26, 27.' }]
      },
      {
        id: 'q-g2-w02-3',
        order: 3,
        prompt: 'Số liền trước của số 1 là số nào?',
        interactionType: 'number_input',
        expectedAnswer: '0',
        acceptableAnswers: ['0'],
        explanation: 'Số liền trước của 1 là: 1 - 1 = 0.',
        skillTag: 'Số liền trước số 1',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Bớt đi 1 đơn vị: 1 - 1 = 0.' }]
      },
      {
        id: 'q-g2-w02-4',
        order: 4,
        prompt: 'Trên tia số, số đứng bên phải luôn như thế nào so với số đứng bên trái?',
        interactionType: 'single_choice',
        options: ['Lớn hơn', 'Bé hơn', 'Bằng nhau'],
        expectedAnswer: 'Lớn hơn',
        explanation: 'Trên tia số từ trái sang phải, các số tăng dần nên số đứng bên phải luôn lớn hơn số đứng bên trái.',
        skillTag: 'So sánh trên tia số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Tia số tăng dần từ trái sang phải.' }]
      },
      {
        id: 'q-g2-w02-5',
        order: 5,
        prompt: 'Nối mỗi số với số liền sau của nó:',
        interactionType: 'expression_match',
        pairs: [
          { left: 'Số 49', right: '50' },
          { left: 'Số 99', right: '100' },
          { left: 'Số 18', right: '19' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: 'Số liền sau cộng thêm 1: 49 -> 50, 99 -> 100, 18 -> 19.',
        skillTag: 'Tìm số liền sau',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'NUMBER_ORDER_CONFUSION', hintText: 'Số liền sau bằng số đó cộng thêm 1 đơn vị.' }]
      }
    ]
  },

  // --- LỚP 2 - TUẦN 3: CÁC THÀNH PHẦN CỦA PHÉP CỘNG, PHÉP TRỪ ---
  {
    lesson: {
      id: 'lesson-g2-w03',
      title: '[Tuần 3] Các thành phần của Phép cộng và Phép trừ',
      grade: 2,
      week: 3,
      topic: 'Phép cộng và phép trừ trong phạm vi 100',
      learningStandard: 'Gọi đúng tên các thành phần: số hạng, tổng trong phép cộng; số bị trừ, số trừ, hiệu trong phép trừ.',
      description: 'Nắm vững thuật ngữ số học và vận dụng tìm thành phần chưa biết trong tính toán.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-w03-1',
        order: 1,
        prompt: 'Trong phép tính 32 + 15 = 47, số 47 được gọi là gì?',
        interactionType: 'single_choice',
        options: ['Tổng', 'Số hạng', 'Hiệu', 'Số bị trừ'],
        expectedAnswer: 'Tổng',
        explanation: 'Kết quả của phép cộng được gọi là Tổng.',
        skillTag: 'Thành phần phép cộng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Trong phép cộng: Số hạng + Số hạng = Tổng.' }]
      },
      {
        id: 'q-g2-w03-2',
        order: 2,
        prompt: 'Trong phép tính 58 - 23 = 35, số 58 được gọi là gì?',
        interactionType: 'single_choice',
        options: ['Số bị trừ', 'Số trừ', 'Hiệu', 'Tổng'],
        expectedAnswer: 'Số bị trừ',
        explanation: 'Số đứng đầu trong phép trừ bị bớt đi gọi là Số bị trừ.',
        skillTag: 'Thành phần phép trừ',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Số bị trừ - Số trừ = Hiệu.' }]
      },
      {
        id: 'q-g2-w03-3',
        order: 3,
        prompt: 'Biết hai số hạng là 20 và 30. Tổng của hai số đó là bao nhiêu?',
        interactionType: 'number_input',
        expectedAnswer: '50',
        acceptableAnswers: ['50'],
        explanation: 'Tổng là kết quả phép cộng: 20 + 30 = 50.',
        skillTag: 'Tính tổng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Tìm tổng ta làm phép tính cộng: 20 + 30 = 50.' }]
      },
      {
        id: 'q-g2-w03-4',
        order: 4,
        prompt: 'Biết số bị trừ là 65, số trừ là 15. Hiệu của hai số đó là bao nhiêu?',
        interactionType: 'number_input',
        expectedAnswer: '50',
        acceptableAnswers: ['50'],
        explanation: 'Hiệu là kết quả phép trừ: 65 - 15 = 50.',
        skillTag: 'Tính hiệu',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Tìm hiệu ta làm phép tính trừ: 65 - 15 = 50.' }]
      },
      {
        id: 'q-g2-w03-5',
        order: 5,
        prompt: 'Nối phép tính với tên gọi thành phần tương ứng:',
        interactionType: 'expression_match',
        pairs: [
          { left: 'Trong 25 + 14 = 39, số 14 là', right: 'Số hạng' },
          { left: 'Trong 48 - 12 = 36, số 12 là', right: 'Số trừ' },
          { left: 'Trong 48 - 12 = 36, số 36 là', right: 'Hiệu' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '14 là số hạng, 12 là số trừ, 36 là hiệu.',
        skillTag: 'Nhận diện thành phần',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Phép cộng có số hạng và tổng; phép trừ có số bị trừ, số trừ và hiệu.' }]
      }
    ]
  },

  // --- LỚP 2 - TUẦN 4: HƠN, KÉM NHAU BAO NHIÊU ---
  {
    lesson: {
      id: 'lesson-g2-w04',
      title: '[Tuần 4] Hơn, Kém nhau bao nhiêu',
      grade: 2,
      week: 4,
      topic: 'Bài toán về nhiều hơn, ít hơn một số đơn vị',
      learningStandard: 'Giải được bài toán so sánh xem một đại lượng hơn hoặc kém đại lượng kia bao nhiêu đơn vị.',
      description: 'Luyện tập phương pháp giải bài toán so sánh chênh lệch bằng phép tính trừ.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-w04-1',
        order: 1,
        prompt: 'Bạn Mai có 9 bông hoa, bạn Lan có 6 bông hoa. Hỏi bạn Mai có nhiều hơn bạn Lan mấy bông hoa?',
        interactionType: 'number_input',
        expectedAnswer: '3',
        acceptableAnswers: ['3', '3 bông hoa'],
        explanation: 'Muốn biết hơn bao nhiêu ta làm phép trừ: 9 - 6 = 3 (bông hoa).',
        skillTag: 'Bài toán nhiều hơn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WORD_PROBLEM_WRONG_OPERATION', hintText: 'Tìm phần chênh lệch hơn kém: lấy số lớn trừ số bé: 9 - 6 = 3.' }]
      },
      {
        id: 'q-g2-w04-2',
        order: 2,
        prompt: 'Cây cam cao 8 mét, cây bưởi cao 5 mét. Cây bưởi thấp hơn cây cam bao nhiêu mét?',
        interactionType: 'number_input',
        expectedAnswer: '3',
        acceptableAnswers: ['3', '3 mét', '3 m'],
        explanation: 'Cây bưởi thấp hơn cây cam: 8 - 5 = 3 (mét).',
        skillTag: 'Bài toán kém hơn',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WORD_PROBLEM_WRONG_OPERATION', hintText: 'Tìm phần kém hơn: lấy số lớn trừ số bé: 8 - 5 = 3.' }]
      },
      {
        id: 'q-g2-w04-3',
        order: 3,
        prompt: 'Tổ Một có 12 bạn, tổ Hai có 10 bạn. Hỏi tổ Hai kém tổ Một mấy bạn?',
        interactionType: 'single_choice',
        options: ['2 bạn', '22 bạn', '1 bạn', '3 bạn'],
        expectedAnswer: '2 bạn',
        explanation: 'Tổ Hai kém tổ Một: 12 - 10 = 2 (bạn).',
        skillTag: 'So sánh chênh lệch',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Không được cộng gộp, làm phép trừ: 12 - 10 = 2 bạn.' }]
      },
      {
        id: 'q-g2-w04-4',
        order: 4,
        prompt: 'Để biết số lớn hơn số bé bao nhiêu đơn vị, ta thực hiện phép tính gì?',
        interactionType: 'single_choice',
        options: ['Phép trừ (lấy số lớn trừ số bé)', 'Phép cộng', 'Phép nhân', 'Không tính được'],
        expectedAnswer: 'Phép trừ (lấy số lớn trừ số bé)',
        explanation: 'Quy tắc: Muốn tìm hơn hoặc kém bao nhiêu đơn vị, ta lấy số lớn trừ đi số bé.',
        skillTag: 'Phương pháp so sánh chênh lệch',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WORD_PROBLEM_WRONG_OPERATION', hintText: 'Nhớ quy tắc: lấy số lớn trừ số bé.' }]
      },
      {
        id: 'q-g2-w04-5',
        order: 5,
        prompt: 'Nối cặp đại lượng với số đơn vị chênh lệch nhau:',
        interactionType: 'expression_match',
        pairs: [
          { left: '15 cái kẹo và 10 cái kẹo', right: 'Hơn nhau 5 cái' },
          { left: '20 quả bóng và 12 quả bóng', right: 'Hơn nhau 8 quả' },
          { left: '18 quyển vở và 14 quyển vở', right: 'Hơn nhau 4 quyển' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '15 - 10 = 5; 20 - 12 = 8; 18 - 14 = 4.',
        skillTag: 'Ghép cặp chênh lệch',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Lấy số lớn trừ số bé của từng cặp.' }]
      }
    ]
  },

  // --- LỚP 2 - TUẦN 5: ÔN TẬP PHÉP CỘNG, PHÉP TRỪ KHÔNG NHỚ TRONG PHẠM VI 100 ---
  {
    lesson: {
      id: 'lesson-g2-w05',
      title: '[Tuần 5] Ôn tập Phép cộng, Phép trừ không nhớ trong phạm vi 100',
      grade: 2,
      week: 5,
      topic: 'Phép cộng và phép trừ trong phạm vi 100',
      learningStandard: 'Thực hiện thành thạo đặt tính rồi tính phép cộng, phép trừ không nhớ trong phạm vi 100.',
      description: 'Củng cố kỹ năng đặt tính thẳng cột và tính nhẩm phép cộng trừ không nhớ các số có hai chữ số.',
      durationMinutes: 20,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-w05-1',
        order: 1,
        prompt: 'Đặt tính rồi tính: 43 + 25 = ? Điền kết quả vào ô trống:',
        interactionType: 'number_input',
        expectedAnswer: '68',
        acceptableAnswers: ['68'],
        explanation: '3 cộng 5 bằng 8, 4 cộng 2 bằng 6. Vậy 43 + 25 = 68.',
        skillTag: 'Cộng không nhớ phạm vi 100',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'PLACE_VALUE_SWAP', hintText: 'Cộng hàng đơn vị trước: 3 + 5 = 8; cộng hàng chục: 4 + 2 = 6.' }]
      },
      {
        id: 'q-g2-w05-2',
        order: 2,
        prompt: 'Đặt tính rồi tính: 76 - 32 = ? Điền kết quả vào ô trống:',
        interactionType: 'number_input',
        expectedAnswer: '44',
        acceptableAnswers: ['44'],
        explanation: '6 trừ 2 bằng 4, 7 trừ 3 bằng 4. Vậy 76 - 32 = 44.',
        skillTag: 'Trừ không nhớ phạm vi 100',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Trừ hàng đơn vị trước rồi trừ hàng chục.' }]
      },
      {
        id: 'q-g2-w05-3',
        order: 3,
        prompt: 'Lớp 2A có 24 học sinh nữ và 15 học sinh nam. Hỏi lớp 2A có tất cả bao nhiêu học sinh?',
        interactionType: 'single_choice',
        options: ['39 học sinh', '38 học sinh', '49 học sinh', '9 học sinh'],
        expectedAnswer: '39 học sinh',
        explanation: 'Lớp 2A có tất cả: 24 + 15 = 39 (học sinh).',
        skillTag: 'Toán lời văn cộng không nhớ',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: 'Hỏi tất cả là phép cộng: 24 + 15 = 39 học sinh.' }]
      },
      {
        id: 'q-g2-w05-4',
        order: 4,
        prompt: 'Điền dấu so sánh thích hợp: 34 + 20 ... 65 - 10',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: 'Ta có 34 + 20 = 54; 65 - 10 = 55. Vì 54 < 55 nên điền dấu <.',
        skillTag: 'So sánh hai biểu thức',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Tính hai vế: 54 bé hơn 55.' }]
      },
      {
        id: 'q-g2-w05-5',
        order: 5,
        prompt: 'Nối phép tính với kết quả chính xác:',
        interactionType: 'expression_match',
        pairs: [
          { left: '50 + 30', right: '80' },
          { left: '90 - 40', right: '50' },
          { left: '22 + 33', right: '55' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '50 + 30 = 80; 90 - 40 = 50; 22 + 33 = 55.',
        skillTag: 'Cộng trừ tròn chục',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Tính nhẩm từng phép tính tròn chục.' }]
      }
    ]
  },

  // --- LỚP 2 - TUẦN 6: ĐIỂM, ĐOẠN THẲNG, ĐƯỜNG THẲNG, ĐƯỜNG CONG, BA ĐIỂM THẲNG HÀNG ---
  {
    lesson: {
      id: 'lesson-g2-w06',
      title: '[Tuần 6] Điểm, Đoạn thẳng, Đường thẳng, Đường cong, Ba điểm thẳng hàng',
      grade: 2,
      week: 6,
      topic: 'Hình học trực quan',
      learningStandard: 'Nhận biết điểm, đoạn thẳng, đường thẳng, đường cong; nhận biết ba điểm thẳng hàng.',
      description: 'Làm quen các yếu tố hình học cơ bản và thực hành vẽ, nhận biết các loại đường nét.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-w06-1',
        order: 1,
        prompt: 'Đoạn thẳng AB dài 8 cm, đoạn thẳng BC dài 5 cm. Độ dài đoạn thẳng AC gồm AB và BC là bao nhiêu cm?',
        interactionType: 'number_input',
        expectedAnswer: '13',
        acceptableAnswers: ['13', '13 cm'],
        explanation: 'Độ dài đoạn thẳng AC là: 8 + 5 = 13 (cm).',
        skillTag: 'Cộng độ dài đoạn thẳng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Cộng độ dài hai đoạn thẳng: 8 + 5 = 13 cm.' }]
      },
      {
        id: 'q-g2-w06-2',
        order: 2,
        prompt: 'Cho 3 điểm A, B, C không cùng nằm trên một đường thẳng. Nối từng cặp điểm lại thì vẽ được tất cả mấy đoạn thẳng?',
        interactionType: 'single_choice',
        options: ['3 đoạn thẳng', '2 đoạn thẳng', '4 đoạn thẳng', '1 đoạn thẳng'],
        expectedAnswer: '3 đoạn thẳng',
        explanation: 'Nối được 3 đoạn thẳng: AB, BC và CA tạo thành hình tam giác.',
        skillTag: 'Nhận biết đoạn thẳng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Nối từng cặp điểm: AB, BC, CA là 3 đoạn thẳng.' }]
      },
      {
        id: 'q-g2-w06-3',
        order: 3,
        prompt: 'Khi ba điểm cùng nằm trên một đường thẳng, ta nói ba điểm đó như thế nào?',
        interactionType: 'single_choice',
        options: ['Ba điểm thẳng hàng', 'Ba điểm không thẳng hàng', 'Ba điểm bằng nhau'],
        expectedAnswer: 'Ba điểm thẳng hàng',
        explanation: 'Khi ba điểm cùng thuộc một đường thẳng thì ba điểm đó thẳng hàng.',
        skillTag: 'Ba điểm thẳng hàng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Cùng nằm trên một đường thẳng gọi là thẳng hàng.' }]
      },
      {
        id: 'q-g2-w06-4',
        order: 4,
        prompt: 'Đường ray xe lửa uốn lượn quanh sườn đồi là hình ảnh của đường gì?',
        interactionType: 'single_choice',
        options: ['Đường cong', 'Đường thẳng', 'Đoạn thẳng'],
        expectedAnswer: 'Đường cong',
        explanation: 'Đường ray uốn lượn mềm mại là hình ảnh của đường cong.',
        skillTag: 'Nhận biết đường cong',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Đường uốn lượn không thẳng gọi là đường cong.' }]
      },
      {
        id: 'q-g2-w06-5',
        order: 5,
        prompt: 'Nối thuật ngữ hình học với hình ảnh mô tả:',
        interactionType: 'expression_match',
        pairs: [
          { left: 'Dây đàn ghi-ta căng thẳng', right: 'Đoạn thẳng' },
          { left: 'Cầu vồng trên bầu trời', right: 'Đường cong' },
          { left: 'Đèn tín hiệu giao thông 3 bóng thẳng đứng', right: 'Ba điểm thẳng hàng' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: 'Dây đàn căng là đoạn thẳng, cầu vồng là đường cong, 3 bóng đèn là 3 điểm thẳng hàng.',
        skillTag: 'Hình học thực tế',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'GEOMETRY_MISIDENTIFICATION', hintText: 'Liên hệ các sự vật thực tế xung quanh.' }]
      }
    ]
  },

  // --- LỚP 2 - TUẦN 7: PHÉP CỘNG CÓ NHỚ TRONG PHẠM VI 20 (BẢNG CỘNG QUA 10) ---
  {
    lesson: {
      id: 'lesson-g2-w07',
      title: '[Tuần 7] Phép cộng có nhớ trong phạm vi 20 (Bảng cộng qua 10)',
      grade: 2,
      week: 7,
      topic: 'Phép cộng và phép trừ có nhớ trong phạm vi 20',
      learningStandard: 'Thuộc bảng cộng (qua 10) trong phạm vi 20; vận dụng phương pháp "tách số để làm tròn 10 rồi cộng tiếp".',
      description: 'Luyện tập kỹ năng tính nhẩm cộng qua 10 bằng cách tách số bù 10 chính xác.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-w07-1',
        order: 1,
        prompt: 'Tính nhẩm phép tính cộng qua 10: 9 + 4 = ? Điền kết quả vào ô trống:',
        interactionType: 'number_input',
        expectedAnswer: '13',
        acceptableAnswers: ['13'],
        explanation: 'Tách 4 thành 1 và 3; 9 + 1 = 10; 10 + 3 = 13. Vậy 9 + 4 = 13.',
        skillTag: 'Cộng 9 với một số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Tách 4 = 1 + 3: 9 + 1 = 10, rồi 10 + 3 = 13.' }]
      },
      {
        id: 'q-g2-w07-2',
        order: 2,
        prompt: 'Tính nhẩm phép tính cộng qua 10: 8 + 5 = ?',
        interactionType: 'single_choice',
        options: ['13', '12', '14', '15'],
        expectedAnswer: '13',
        explanation: 'Tách 5 thành 2 và 3; 8 + 2 = 10; 10 + 3 = 13. Vậy 8 + 5 = 13.',
        skillTag: 'Cộng 8 với một số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Tách 5 = 2 + 3: 8 + 2 = 10, 10 + 3 = 13.' }]
      },
      {
        id: 'q-g2-w07-3',
        order: 3,
        prompt: 'Tính nhẩm: 7 + 6 = ?',
        interactionType: 'number_input',
        expectedAnswer: '13',
        acceptableAnswers: ['13'],
        explanation: 'Tách 6 thành 3 và 3; 7 + 3 = 10; 10 + 3 = 13.',
        skillTag: 'Cộng 7 với một số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Tách 6 = 3 + 3: 7 + 3 = 10, 10 + 3 = 13.' }]
      },
      {
        id: 'q-g2-w07-4',
        order: 4,
        prompt: 'Điền dấu so sánh thích hợp: 9 + 6 ... 8 + 7',
        interactionType: 'operator_pick',
        options: ['=', '>', '<'],
        expectedAnswer: '=',
        explanation: 'Ta có 9 + 6 = 15 và 8 + 7 = 15. Vì 15 = 15 nên điền dấu =.',
        skillTag: 'So sánh phép cộng qua 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Cả hai vế đều bằng 15 nên điền dấu =.' }]
      },
      {
        id: 'q-g2-w07-5',
        order: 5,
        prompt: 'Nối phép tính với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '9 + 5', right: '14' },
          { left: '8 + 6', right: '14' },
          { left: '6 + 6', right: '12' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '9 + 5 = 14; 8 + 6 = 14; 6 + 6 = 12.',
        skillTag: 'Bảng cộng qua 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Áp dụng tách số bù 10 để tính nhẩm nhanh.' }]
      }
    ]
  },

  // --- LỚP 2 - TUẦN 8: PHÉP TRỪ CÓ NHỚ TRONG PHẠM VI 20 (BẢNG TRỪ QUA 10) ---
  {
    lesson: {
      id: 'lesson-g2-w08',
      title: '[Tuần 8] Phép trừ có nhớ trong phạm vi 20 (Bảng trừ qua 10)',
      grade: 2,
      week: 8,
      topic: 'Phép cộng và phép trừ có nhớ trong phạm vi 20',
      learningStandard: 'Thuộc bảng trừ (qua 10) trong phạm vi 20; vận dụng phương pháp "trừ để được 10 rồi trừ tiếp".',
      description: 'Luyện tập phương pháp tính nhẩm trừ qua 10 và giải bài toán bớt đi có nhớ.',
      durationMinutes: 15,
      totalQuestions: 5,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-w08-1',
        order: 1,
        prompt: 'Tính nhẩm phép tính trừ qua 10: 11 - 4 = ? Điền kết quả vào ô trống:',
        interactionType: 'number_input',
        expectedAnswer: '7',
        acceptableAnswers: ['7'],
        explanation: '11 - 1 = 10, rồi 10 - 3 = 7. Vậy 11 - 4 = 7.',
        skillTag: 'Trừ qua 10 dạng 11 trừ đi một số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Tách 4 = 1 + 3: 11 - 1 = 10, 10 - 3 = 7.' }]
      },
      {
        id: 'q-g2-w08-2',
        order: 2,
        prompt: 'Tính nhẩm: 13 - 6 = ?',
        interactionType: 'single_choice',
        options: ['7', '6', '8', '9'],
        expectedAnswer: '7',
        explanation: '13 - 3 = 10; 10 - 3 = 7. Vậy 13 - 6 = 7.',
        skillTag: 'Trừ qua 10 dạng 13 trừ đi một số',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Tách 6 = 3 + 3: 13 - 3 = 10, 10 - 3 = 7.' }]
      },
      {
        id: 'q-g2-w08-3',
        order: 3,
        prompt: 'Một cửa hàng có 15 thùng sữa, đã bán đi 8 thùng sữa. Hỏi cửa hàng còn lại mấy thùng sữa?',
        interactionType: 'single_choice',
        options: ['7 thùng sữa', '8 thùng sữa', '6 thùng sữa', '9 thùng sữa'],
        expectedAnswer: '7 thùng sữa',
        explanation: 'Cửa hàng còn lại: 15 - 8 = 7 (thùng sữa).',
        skillTag: 'Toán lời văn trừ qua 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: '"Bán đi" là phép trừ: 15 - 8 = 7 thùng sữa.' }]
      },
      {
        id: 'q-g2-w08-4',
        order: 4,
        prompt: 'Điền số thích hợp vào chỗ chấm: 16 - ... = 9',
        interactionType: 'number_input',
        expectedAnswer: '7',
        acceptableAnswers: ['7'],
        explanation: 'Vì 16 - 7 = 9 nên số cần điền là 7.',
        skillTag: 'Tìm số trừ',
        difficulty: 'medium',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: '16 trừ mấy bằng 9? Ta lấy 16 - 9 = 7.' }]
      },
      {
        id: 'q-g2-w08-5',
        order: 5,
        prompt: 'Nối phép tính với kết quả đúng:',
        interactionType: 'expression_match',
        pairs: [
          { left: '12 - 5', right: '7' },
          { left: '14 - 6', right: '8' },
          { left: '17 - 8', right: '9' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: '12 - 5 = 7; 14 - 6 = 8; 17 - 8 = 9.',
        skillTag: 'Bảng trừ qua 10',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'CROSS_TEN_ERROR', hintText: 'Trừ về 10 rồi trừ tiếp phần còn lại.' }]
      }
    ]
  },

  // --- LỚP 2 - TUẦN 9: ĐO LƯỜNG: KI-LÔ-GAM (KG) VÀ LÍT (L) ---
  {
    lesson: {
      id: 'lesson-g2-w09',
      title: '[Tuần 9] Đo lường: Ki-lô-gam (kg) và Lít (l)',
      grade: 2,
      week: 9,
      topic: 'Đo lường',
      learningStandard: 'Nhận biết biểu tượng, tên gọi và kí hiệu đơn vị đo khối lượng ki-lô-gam (kg), đơn vị đo dung tích lít (l); thực hiện phép tính với số đo.',
      description: 'Làm quen với cân nặng ki-lô-gam và dung tích lít qua đồ dùng sinh hoạt hàng ngày.',
      durationMinutes: 20,
      totalQuestions: 6,
      status: 'published',
      currentVersion: 1,
    },
    questions: [
      {
        id: 'q-g2-w09-1',
        order: 1,
        prompt: 'Ki-lô-gam là đơn vị đo khối lượng. Kí hiệu của ki-lô-gam viết là gì?',
        interactionType: 'single_choice',
        options: ['kg', 'km', 'cm', 'l'],
        expectedAnswer: 'kg',
        explanation: 'Ki-lô-gam viết tắt là kg.',
        skillTag: 'Kí hiệu ki-lô-gam',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Ki-lô-gam viết tắt là hai chữ cái k và g: kg.' }]
      },
      {
        id: 'q-g2-w09-2',
        order: 2,
        prompt: 'Lít là đơn vị đo dung tích. Kí hiệu của lít viết là gì?',
        interactionType: 'single_choice',
        options: ['l', 'kg', 'dm', 'm'],
        expectedAnswer: 'l',
        explanation: 'Lít viết tắt là chữ l.',
        skillTag: 'Kí hiệu lít',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Lít viết tắt là chữ l.' }]
      },
      {
        id: 'q-g2-w09-3',
        order: 3,
        prompt: 'Bao gạo to cân nặng 25 kg, bao gạo nhỏ cân nặng 10 kg. Cả hai bao gạo cân nặng bao nhiêu ki-lô-gam?',
        interactionType: 'number_input',
        expectedAnswer: '35',
        acceptableAnswers: ['35', '35 kg'],
        explanation: 'Cả hai bao gạo cân nặng: 25 + 10 = 35 (kg).',
        skillTag: 'Cộng số đo ki-lô-gam',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Cộng các số đo cùng đơn vị: 25 + 10 = 35 kg.' }]
      },
      {
        id: 'q-g2-w09-4',
        order: 4,
        prompt: 'Một can dầu có 18 lít dầu, mẹ đã rót ra dùng hết 5 lít. Trong can còn lại bao nhiêu lít dầu?',
        interactionType: 'number_input',
        expectedAnswer: '13',
        acceptableAnswers: ['13', '13 lít', '13 l'],
        explanation: 'Trong can còn lại: 18 - 5 = 13 (lít).',
        skillTag: 'Trừ số đo lít',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'WRONG_OPERATOR', hintText: '"Đã dùng hết" là phép trừ: 18 - 5 = 13 lít.' }]
      },
      {
        id: 'q-g2-w09-5',
        order: 5,
        prompt: 'Điền dấu so sánh thích hợp: 15 kg + 8 kg ... 25 kg',
        interactionType: 'operator_pick',
        options: ['<', '>', '='],
        expectedAnswer: '<',
        explanation: 'Ta có 15 kg + 8 kg = 23 kg. Vì 23 kg < 25 kg nên điền dấu <.',
        skillTag: 'So sánh số đo khối lượng',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'COMPARISON_INVERSION', hintText: 'Tính vế trái: 15 + 8 = 23 kg, bé hơn 25 kg.' }]
      },
      {
        id: 'q-g2-w09-6',
        order: 6,
        prompt: 'Nối vật dụng với số đo phù hợp nhất trong thực tế:',
        interactionType: 'expression_match',
        pairs: [
          { left: 'Túi muối ăn nhỏ', right: '1 kg' },
          { left: 'Hộp sữa tươi học đường', right: '180 ml' },
          { left: 'Bình nước lớn của lớp', right: '19 l' }
        ],
        expectedAnswer: 'MATCHED_ALL',
        explanation: 'Túi muối khoảng 1 kg, hộp sữa tươi 180 ml, bình nước lớn khoảng 19 lít.',
        skillTag: 'Ước lượng đo lường',
        difficulty: 'easy',
        ruleHints: [{ pattern: 'MEASUREMENT_UNIT_ERROR', hintText: 'Ước lượng độ nặng và sức chứa của vật ngoài đời sống.' }]
      }
    ]
  }
];
