const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = env.match(/GEMINI_API_KEY=([^\r\n]+)/);
if (!apiKeyMatch) process.exit(1);
const apiKey = apiKeyMatch[1];

async function test() {
  const prompt = `
Eres un experto botánico y filólogo especializado en términos agrícolas y nombres comunes de plantas.
La especie es: "Ajos" (Nombre científico: Allium sativum).

Necesito que propongas los sinónimos y nombres locales/regionales más conocidos de esta especie.
Para cada sinónimo, asocia el idioma y el país (si aplica).

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con un array en formato JSON. Nada más.
2. Cada objeto del array debe tener exactamente esta estructura:
   {
     "especiessinonimosnombre": "El sinónimo aquí",
     "xespeciessinonimosididiomas": <ID del idioma según la lista>,
     "xespeciessinonimosidpaises": <ID del país según la lista o null si es general>,
     "especiessinonimosnotas": "Breve nota de uso o región"
   }
3. IMPORTANTE: Si vas a proponer un sinónimo de la región de levante, Cataluña, Valencia o Baleares (ej. Aj, Tomaca, etc.), DEBES usar obligatoriamente el idioma "Valenciano". Tienes prohibido usar la denominación "Catalán". Busca en la lista de idiomas el ID que corresponde a "Valenciano".
4. Usa los siguientes IDs de IDIOMAS permitidos (solo usa el ID numérico):
1: Español, 2: Valenciano
5. Usa los siguientes IDs de PAÍSES permitidos (solo usa el ID numérico, o null si es muy general):
1: España, 2: México

Ejemplo de respuesta (solo el JSON):
[
  { "especiessinonimosnombre": "Palta", "xespeciessinonimosididiomas": 1, "xespeciessinonimosidpaises": 3, "especiessinonimosnotas": "Uso en Sudamérica" }
]
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.3,
        responseMimeType: 'application/json' 
      }
    })
  });

  const data = await res.json();
  const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log("RAW OUTPUT:");
  console.log(resultText);

  try {
      const arrayMatch = resultText.match(/\[[\s\S]*\]/);
      if (!arrayMatch) {
        throw new Error('No se encontró un array JSON en la respuesta');
      }
      const sinonimos = JSON.parse(arrayMatch[0]);
      console.log("PARSED OK:", sinonimos);
  } catch(e) {
      console.error("PARSE ERROR:", e.message);
  }
}
test();
