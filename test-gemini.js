const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = env.match(/GEMINI_API_KEY=([^\r\n]+)/);
if (!apiKeyMatch) process.exit(1);
const apiKey = apiKeyMatch[1];

async function test() {
  const finalPrompt = 'varios ejemplares de Ajos recién cosechados';
  const descPrompt = `Eres un redactor SEO especializado en horticultura y agricultura.
Observa esta fotografía y escribe UNA SOLA frase descriptiva en español de entre 8 y 15 palabras.
La frase debe describir exactamente lo que se VE: el producto hortícola, su estado, color, disposición y entorno.
NUNCA uses palabras técnicas de fotografía (hiperrealista, 8k, bokeh, macro…).
NUNCA describas lo que se le pidió generar, describe lo que VES.

Ejemplos buenos:
- "Cabezas de ajo morado recién cosechadas sobre mesa de madera rústica"
- "Tomates cherry rojos y brillantes colgando de la tomatera en invernadero"

Responde SOLO con la frase descriptiva. Sin comillas, sin puntos finales, sin explicaciones.`;

  const payload = {
    instances: [ { prompt: finalPrompt } ],
    parameters: { sampleCount: 1 }
  };
  console.log('Generating image...');
  let res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=' + apiKey, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
  });
  let data = await res.json();
  if(!data.predictions || !data.predictions[0].bytesBase64Encoded) {
     console.error('Image Gen Failed', data); return;
  }
  const imageBase64 = data.predictions[0].bytesBase64Encoded;
  console.log('Image generated. Asking Gemini Flash for description...');
  
  res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey, {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      contents: [{ parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        { text: descPrompt }
      ] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.4 }
    })
  });
  data = await res.json();
  console.log('Description Data:', JSON.stringify(data, null, 2));
}
test();
