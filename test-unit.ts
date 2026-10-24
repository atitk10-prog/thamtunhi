/**
 * SAFE IN-MEMORY UNIT TESTS
 * Chạy các bài kiểm thử đơn vị logic thuần túy (Toán học, Chuẩn hóa đáp án, Phát hiện mẫu lỗi).
 * Tuyệt đối ZERO kết nối mạng, ZERO tác động vào Cloud Firestore hoặc dữ liệu thật.
 */

import { runMathEngineTests } from './src/lib/mathEngine.test.ts';

console.log('================================================================');
console.log('   CHẠY KIỂM THỬ ĐƠN VỊ AN TOÀN (IN-MEMORY UNIT TESTS)');
console.log('   Môi trường: Cô lập hoàn toàn - KHÔNG kết nối Firestore');
console.log('================================================================\n');

const result = runMathEngineTests();

console.log('\n----------------------------------------------------------------');
console.log(` Kết quả kiểm thử Math Engine: ${result.passed} PASS / ${result.failed} FAIL`);
console.log('----------------------------------------------------------------\n');

if (result.failed > 0) {
  console.error('❌ Kiểm thử đơn vị thất bại:', result.errors);
  process.exit(1);
} else {
  console.log('✓ 100% KIỂM THỬ ĐƠN VỊ ĐẠT TIÊU CHUẨN AN TOÀN.\n');
  process.exit(0);
}
