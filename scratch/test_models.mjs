import fetch from 'node-fetch';

async function listModels() {
  const apiKey = 'AIzaSyB6IrSxm-8UUxKyiid8Mx3JP527PBAnQXQ';
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(data.models.map(m => m.name).join('\n'));
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

listModels();
