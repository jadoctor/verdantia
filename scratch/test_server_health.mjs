import fetch from 'node-fetch';

async function testApi() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/blog');
    const text = await res.text();
    console.log("STATUS /api/admin/blog:", res.status);
    console.log("RESPONSE:", text.substring(0, 100));
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}
testApi();
