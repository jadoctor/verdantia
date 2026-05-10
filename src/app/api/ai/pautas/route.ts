import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { especie, labores, instruccionesAdicionales } = await request.json();
    if (!especie) {
      return NextResponse.json({ error: 'Nombre de la especie requerido' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No se encontró la API key de Gemini' }, { status: 500 });
    }

    const laboresList = labores.map((l: any) => `${l.id}: ${l.nombre}`).join('\n');
    const extraText = instruccionesAdicionales ? `\nINSTRUCCIONES DEL USUARIO (PRIORIDAD ALTA):\n${instruccionesAdicionales}` : '';

    const prompt = `
Eres un experto botánico, ingeniero agrónomo y especialista en gestión de cultivos.
Necesito que analices el ciclo de vida del cultivo/planta: "${especie}".

Dispones del siguiente listado de labores en el sistema (ID: Nombre):
${laboresList}

Tu objetivo es proponer las "Pautas de Labores" necesarias para esta especie, especificando cuándo y con qué frecuencia deben realizarse.

Fases válidas permitidas (elige EXTREMADAMENTE SOLO una de estas para cada pauta, son las únicas que nuestro sistema puede calcular):
- siembra
- germinacion
- trasplante
- crecimiento
- fructificacion
- cosecha
- general

${extraText}

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con un array JSON. Nada más.
2. Usa SOLAMENTE las labores (por su ID numérico) que se listan arriba. NO inventes IDs.
3. Para la "frecuencia", proporciona un número entero (en días). Si es una labor puntual (como la cosecha final), pon null.
4. Las "notas_ia" deben ser concisas y útiles (máx 150 caracteres).
5. Agrega el campo "selected": true a todas las pautas.

Ejemplo de respuesta:
[
  { "id_labor": 2, "fase": "germinacion", "frecuencia": 2, "notas_ia": "Riego ligero con pulverizador para no mover las semillas.", "selected": true },
  { "id_labor": 4, "fase": "crecimiento", "frecuencia": 15, "notas_ia": "Abono rico en nitrógeno para estimular el desarrollo vegetativo.", "selected": true },
  { "id_labor": 10, "fase": "floracion", "frecuencia": null, "notas_ia": "Poda de chupones para mejorar la ventilación.", "selected": true }
]
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.2,
          responseMimeType: 'application/json' 
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[AI Pautas Error]', res.status, errText);
      return NextResponse.json({ error: 'Error del motor de IA' }, { status: res.status });
    }

    const data = await res.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ error: 'Respuesta vacía de la IA' }, { status: 500 });
    }

    let pautas = [];
    try {
      const arrayMatch = resultText.match(/\[[\s\S]*\]/);
      if (!arrayMatch) {
        throw new Error('No se encontró un array JSON en la respuesta');
      }
      pautas = JSON.parse(arrayMatch[0]);
    } catch (parseErr) {
      console.error('Error parseando JSON de Gemini:', resultText);
      return NextResponse.json({ error: 'Formato de respuesta inválido de IA' }, { status: 500 });
    }

    // Validación básica
    pautas = pautas.map((p: any) => ({
      ...p,
      selected: true,
      frecuencia: typeof p.frecuencia === 'number' ? p.frecuencia : null,
      id_labor: Number(p.id_labor) || null,
      fase: p.fase || 'general'
    })).filter((p: any) => p.id_labor !== null);

    return NextResponse.json({ success: true, pautas });
  } catch (error: any) {
    console.error('Error in AI pautas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
