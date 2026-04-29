require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function test() {
  const base64Pdf = Buffer.from('dummy text just for testing as pdf').toString('base64');
  const payload = {
    contents: [{
      parts: [
        { text: 'Analiza este documento PDF sobre la especie agrícola. Eres un experto agrónomo. Devuelve EXCLUSIVAMENTE un JSON con tres propiedades: "nombre", "resumen", y "apuntes".' },
        { inlineData: { mimeType: 'application/pdf', data: base64Pdf } }
      ]
    }],
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
  };
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY;
  try {
    const aiResponse = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await aiResponse.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
