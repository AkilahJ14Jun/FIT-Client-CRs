import crypto from 'crypto';

async function test() {
  const largeString = crypto.randomBytes(80000).toString('hex'); // 160kb
  try {
    const res = await fetch('http://localhost:3001/api/whatsapp/send-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'localhost',
        mobile: '1234567890',
        msg: 'test',
        base64Image: largeString,
        fileName: 'test.jpg'
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
