import { runMathEngineTests } from './src/lib/mathEngine.test.ts';

console.log('--- ĐANG CHẠY BỘ KIỂM THỬ THÁM TỬ TOÁN NHÍ ---');
const mathResults = runMathEngineTests();

console.log(`Kết quả Unit Test Math Engine: ${mathResults.passed} ĐẠT / ${mathResults.passed + mathResults.failed} TỔNG`);
if (mathResults.failed > 0) {
  console.error('Các lỗi phát hiện:', mathResults.errors);
  process.exit(1);
} else {
  console.log('✓ 100% KIỂM THỬ ĐỘNG CƠ TOÁN VÀ CHẨN ĐOÁN LỖI SAI ĐÃ PASS THỰC TẾ!');
}
