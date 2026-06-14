const apiKey = 'AIzaSyAm0CeG-w38oo_e7pmcCoUfwkBhOu-u4UA';
const nombre = 'Tomate';
const fasesStr = `- ID 1: Tiempo de Planificación
- ID 3: Tiempo de Plantón / Semillero
- ID 4: Tiempo de Crecimiento Vegetativo
- ID 5: Tiempo de Cosecha
- ID 11: Tiempo de Posplantación (Enraizamiento)
- ID 12: Tiempo de Floración
- ID 15: Tiempo de Germinación
- ID 16: Tiempo de Postgerminación`;

const prompt = `
Eres un experto botánico y agrónomo. Necesito que me devuelvas EXCLUSIVAMENTE un objeto JSON válido con los datos de cultivo de la especie "${nombre}". 
No incluyas markdown, ni comillas invertidas, solo el JSON puro.

Las claves esperadas en el JSON son:
- especiesnombrecientifico (string, ej: Solanum lycopersicum)
- especiesfamilia (string, ej: Solanaceae)
- especiestipo (array de strings, elige entre: hortaliza, fruta, aromatica, leguminosa, cereal)
- especiesciclo (array de strings, elige entre: anual, bianual, perenne)
- fases_duracion (objeto cuyas claves son los IDs de las siguientes fases, y sus valores son la duración en DÍAS. Solo incluye las fases que apliquen al ciclo normal de la planta, omitiendo las que no apliquen poniendo 0 o no incluyéndolas. OBLIGATORIO. Estas son las fases disponibles:
${fasesStr}
Ejemplo: {"1": 8, "2": 30, "3": 45})
`;

const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const payload = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 0.1,
    responseMimeType: "application/json"
  }
};

async function run() {
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(data.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err) {
    console.error(err);
  }
}

run();
