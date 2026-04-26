import fetch from 'node-fetch';

async function test() {
  const payload = {
    contents: [{ role: 'user', parts: [{ text: "Busca 4 enlaces reales a manuales PDF sobre el cultivo de 'Tomate'. Usa la herramienta googleSearch." }] }],
    tools: [{ googleSearch: {} }],
    generationConfig: { temperature: 0.1 }
  };
  const key = "AIzaSyB6IrSxm-8UUxKyiid8Mx3JP527PBAnQXQ";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
