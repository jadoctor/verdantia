import fetch from 'node-fetch';

async function testImagen4() {
  const apiKey = 'AIzaSyB6IrSxm-8UUxKyiid8Mx3JP527PBAnQXQ';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`;

  const payload = {
    instances: [
      { prompt: "A bright red tomato" }
    ],
    parameters: {
      sampleCount: 1
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", Object.keys(data));
    if (data.predictions) {
       console.log("Has predictions! Bytes length:", data.predictions[0].bytesBase64Encoded.length);
    }
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

testImagen4();
