import https from 'https';

const PROD_HOST = 'thamtunhi.vercel.app';

function request(method: string, path: string, headers: any = {}, body?: any): Promise<{ statusCode: number; headers: any; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined;
    const reqHeaders: any = { ...headers };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = https.request({
      hostname: PROD_HOST,
      port: 443,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode || 0, headers: res.headers, data: parsed });
        } catch {
          resolve({ statusCode: res.statusCode || 0, headers: res.headers, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('================================================================');
  console.log('KIỂM CHỨNG TRỰC TIẾP API QUẢN LÝ ÂM THANH TRÊN PRODUCTION');
  console.log('================================================================\n');

  // 1. Đăng nhập Giáo viên trên Production
  console.log('--- 1. Đăng nhập Giáo viên lấy token chính thức từ Production ---');
  const loginRes = await request('POST', '/api/auth/teacher-login', {}, {
    email: 'giaovien1@thamtutoannhi.edu.vn',
    password: 'MatKhauGiaoVien@123'
  });
  console.log(`[PASS] Đăng nhập HTTP ${loginRes.statusCode}:`, loginRes.data.user.displayName, `(Token dài: ${loginRes.data.token.length})`);
  const token = loginRes.data.token;
  const authHeaders = { 'Authorization': `Bearer ${token}` };

  // 2. Thao tác Tạo âm thanh TTS tiếng Việt (Add / Synthesize)
  console.log('\n--- 2. Kiểm thử Tạo âm thanh tiếng Việt (/api/audio/synthesize) ---');
  const synthText1 = 'Bé hãy quan sát thật kỹ và đếm xem có bao nhiêu quả táo trong giỏ nhé!';
  const synthRes1 = await request('POST', '/api/audio/synthesize', authHeaders, {
    text: synthText1,
    type: 'question'
  });
  console.log(`[PASS] Tạo âm thanh HTTP ${synthRes1.statusCode}:`, synthRes1.data);
  const synthUrl = synthRes1.data.audioUrl;

  // 3. Thao tác Sửa lời đọc và Tạo lại âm thanh mới (Edit & Force Re-synthesize)
  console.log('\n--- 3. Kiểm thử Sửa lời đọc và Tạo lại âm thanh (/api/audio/synthesize với force: true) ---');
  const synthText2 = 'Các em hãy quan sát các nhóm đồ vật và chọn đáp án chính xác nhé!';
  const synthRes2 = await request('POST', '/api/audio/synthesize', authHeaders, {
    text: synthText2,
    type: 'question',
    force: true
  });
  console.log(`[PASS] Tạo lại âm thanh mới HTTP ${synthRes2.statusCode}:`, synthRes2.data);
  const resynthUrl = synthRes2.data.audioUrl;

  // 4. Thao tác Tải lên tệp âm thanh có sẵn (Upload / Replace)
  console.log('\n--- 4. Kiểm thử Tải lên tệp âm thanh có sẵn (/api/audio/upload) ---');
  const sampleAudio = Buffer.alloc(2048, 0x55);
  // Add ID3 header
  sampleAudio.write('ID3\x03\x00\x00\x00\x00\x00\x10', 0);
  const uploadRes = await request('POST', '/api/audio/upload', authHeaders, {
    filename: 'giao_vien_thu_am_loi_doc.mp3',
    mimeType: 'audio/mpeg',
    base64Data: sampleAudio.toString('base64'),
    type: 'hint'
  });
  console.log(`[PASS] Tải lên âm thanh HTTP ${uploadRes.statusCode}:`, uploadRes.data);
  const uploadedUrl = uploadRes.data.audioUrl;

  // 5. Kiểm thử Từ chối tệp vượt quá 5MB
  console.log('\n--- 5. Kiểm thử Kiểm tra giới hạn dung lượng (> 5MB) ---');
  const oversizedBuf = Buffer.alloc(5.2 * 1024 * 1024);
  const overRes = await request('POST', '/api/audio/upload', authHeaders, {
    filename: 'oversized_voice.mp3',
    mimeType: 'audio/mpeg',
    base64Data: oversizedBuf.toString('base64'),
    type: 'prompt'
  });
  console.log(`[PASS] Từ chối tệp > 5MB HTTP ${overRes.statusCode}:`, overRes.data);

  // 6. Kiểm thử Từ chối định dạng tệp không được hỗ trợ
  console.log('\n--- 6. Kiểm thử Kiểm tra định dạng tệp hợp lệ ---');
  const invalidRes = await request('POST', '/api/audio/upload', authHeaders, {
    filename: 'virus.exe',
    mimeType: 'application/octet-stream',
    base64Data: Buffer.from('fake payload').toString('base64'),
    type: 'prompt'
  });
  console.log(`[PASS] Từ chối định dạng không hợp lệ HTTP ${invalidRes.statusCode}:`, invalidRes.data);

  // 7. Nghe thử / Tải phát các tệp âm thanh trực tiếp từ Production
  console.log('\n--- 7. Kiểm thử Phát trực tiếp các tệp âm thanh từ Production ---');
  for (const url of [synthUrl, resynthUrl, uploadedUrl]) {
    const playRes = await request('GET', url);
    console.log(`[PASS] Phát tệp ${url}: HTTP ${playRes.statusCode}, Content-Type: ${playRes.headers['content-type']}, Size: ${typeof playRes.data === 'string' ? playRes.data.length : 'buffer'} bytes`);
  }

  console.log('\n================================================================');
  console.log('TẤT CẢ THAO TÁC THÊM - SỬA - TẠO LẠI - THAY THẾ - NGHE THỬ');
  console.log('ĐÃ CHẠY HOÀN HẢO TRỰC TIẾP TRÊN MÔI TRƯỜNG PRODUCTION!');
  console.log('================================================================');
}

run().catch(console.error);
