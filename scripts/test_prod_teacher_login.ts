import https from 'https';

async function test(email: string, pass: string) {
  const payload = JSON.stringify({ email, password: pass });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'thamtunhi.vercel.app',
      port: 443,
      path: '/api/auth/teacher-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ email, status: res.statusCode, data }));
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log(await test('xuannuong@gmail.com', 'MatKhauGiaoVien@123'));
  console.log(await test('xuannuong@thamtunhi.edu.vn', 'MatKhauGiaoVien@123'));
  console.log(await test('admin@thamtutoannhi.edu.vn', 'AdminBaoMat@123'));
}
run();
