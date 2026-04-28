import fetch from 'node-fetch';

async function testImagen() {
  const apiKey = 'AIzaSyB6IrSxm-8UUxKyiid8Mx3JP527PBAnQXQ'; // User's GEMINI_API_KEY from .env.local
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

  const payload = {
    instances: [
      { prompt: "A photorealistic bright red tomato on a green vine" }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: "1:1"
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text.substring(0, 500));
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

testImagen();
