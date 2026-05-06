
import { getAdminBucket } from './src/lib/firebase/admin.js';
import fetch from 'node-fetch';

async function run() {
  const bucket = getAdminBucket();
  const fileRef = bucket.file('uploads/temp/test12345.jpg');
  console.log('Uploading mock file to Firebase Storage...');
  await fileRef.save(Buffer.from('fake image data'), { contentType: 'image/jpeg' });
  console.log('Mock file uploaded. Calling API...');

  const res = await fetch('http://localhost:3000/api/admin/especies/1/photos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-email': 'jaillueca@gmail.com' },
    body: JSON.stringify({ rawStoragePath: 'uploads/temp/test12345.jpg', especieNombre: 'Test' })
  });

  const text = await res.text();
  console.log('API Status:', res.status);
  console.log('API Response:', text);
}
run().catch(console.error);

