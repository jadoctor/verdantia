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

Fases válidas permitidas (elige SOLO una de estas para cada pauta):
- presiembra (labores preparatorias ANTES de sembrar. Frecuencia: null si es puntual)
- siembra (momento puntual de depositar la semilla o plantón. Siempre con frecuencia: null)
- pregerminacion (periodo desde la siembra hasta que emerge la plántula)
- germinacion (momento o etapa inmediatamente posterior a emerger la plántula)
- crecimiento_inicial (fase temprana tras la germinación o el enraizamiento inicial)
- trasplante (momento o periodo de trasplante al lugar definitivo)
- crecimiento (crecimiento firme y desarrollo vegetativo fuerte)
- fructificacion (periodo de floración y posterior desarrollo/maduración del fruto)
- recoleccion (periodo de cosecha o recolección)
- finalizacion (labores de fin de ciclo, como arranque de la planta o limpieza)
- general (aplicable a todo el ciclo)

IMPORTANTE sobre las fases:
- "presiembra" = labores previas a depositar la semilla.
- "siembra" = momento puntual. Su frecuencia DEBE ser null.
- "pregerminacion" = labores como riegos frecuentes para mantener la humedad antes de que brote.
- "germinacion" = acciones puntuales o cuidados justo cuando asoma la planta.
- "crecimiento_inicial" = cuidados de la plántula antes del crecimiento fuerte.
- "fructificacion" = engloba tanto la floración como el cuajado y engorde del fruto.
- "finalizacion" = tareas al terminar el cultivo.

${extraText}

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con un array JSON. Nada más.
2. Usa SOLAMENTE las labores (por su ID numérico) que se listan arriba. NO inventes IDs.
3. Para la "frecuencia", proporciona un número entero (en días). Si es una labor puntual (como la cosecha final), pon null.
4. Para el "offset", proporciona un número entero (en días). Usa valores negativos para adelantar la labor respecto al inicio de su fase teórica (ej: -180 para 6 meses antes de la siembra), valores positivos para retrasarla, o 0 si debe ir en su tiempo normal.
5. Las "notas_ia" deben ser concisas y útiles (máx 150 caracteres).
6. Agrega el campo "selected": true a todas las pautas.

Ejemplo de respuesta:
[
  { "id_labor": 2, "fase": "germinacion", "frecuencia": 2, "offset": 0, "notas_ia": "Riego ligero con pulverizador para no mover las semillas.", "selected": true },
  { "id_labor": 4, "fase": "siembra", "frecuencia": null, "offset": -180, "notas_ia": "Abono profundo y preparación del suelo 6 meses antes de la siembra real.", "selected": true },
  { "id_labor": 10, "fase": "fructificacion", "frecuencia": null, "offset": 10, "notas_ia": "Poda de chupones unos días después de iniciar la floración.", "selected": true }
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
      offset: typeof p.offset === 'number' ? p.offset : 0,
      id_labor: Number(p.id_labor) || null,
      fase: p.fase || 'general'
    })).filter((p: any) => p.id_labor !== null);

    return NextResponse.json({ success: true, pautas });
  } catch (error: any) {
    console.error('Error in AI pautas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
