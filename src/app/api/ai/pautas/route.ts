import { NextResponse } from 'next/server';
import pool from '@/lib/db';
export async function POST(request: Request) {
  try {
    const { idespecies, especie, labores, instruccionesAdicionales } = await request.json();
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
- planificacion (labores preparatorias ANTES de sembrar/plantar. Frecuencia: null si es puntual)
- siembra (momento puntual de depositar la semilla. Siempre con frecuencia: null)
- adquisicion (momento puntual en que se compra un plantón. Frecuencia: null)
- pregerminacion (latencia de la semilla bajo tierra)
- germinacion (momento puntual cuando asoma el primer brote a la superficie)
- postgerminacion (desarrollo de las primeras hojas verdaderas)
- semillero (desarrollo de la planta en entorno protegido antes del trasplante)
- trasplante (mudanza puntual al suelo definitivo)
- enraizamiento (periodo de estrés post-trasplante y desarrollo radicular primario)
- crecimiento (desarrollo masivo de hojas y tallos, crecimiento vegetativo)
- floracion (periodo de polinización y cuajado de las primeras flores)
- cosecha (periodo de recolección de los frutos)
- finalizado (fin de ciclo o arrancado. Tareas finales de limpieza)

IMPORTANTE sobre las fases:
- "planificacion" = pre-siembra, preparar bancal.
- "siembra", "adquisicion", "germinacion", "trasplante", "finalizado" = hitos puntuales. Frecuencia DEBE ser null.
- "semillero" = aplica SOLO a hortalizas que se trasplantan.
- "floracion" = labores específicas cuando salen flores (ej. polinización manual, abono rico en P/K).
- "cosecha" = época en la que la planta ya da fruto recolectable.

${extraText}

REGLAS ESTRICTAS Y EXHAUSTIVIDAD:
1. SE EXTREMADAMENTE EXHAUSTIVO. No te saltes ninguna fase lógica. Piensa en TODO el ciclo biológico. Es OBLIGATORIO considerar si la especie necesita:
   - Riego o preparación el día exacto de la "siembra" o "trasplante".
   - Mantenimiento de humedad durante la "pregerminacion" (hasta que germina).
   - Cuidados especiales durante la "germinacion" (cuando asoma el brote).
   - Abonados o podas específicos en "crecimiento" y "floracion".
   - Tareas finales en "cosecha" y "finalizado".
2. PROHIBIDO crear fases o grupos genéricos. Tienes que obligar a la labor a pertenecer a una fase concreta de las permitidas arriba.
3. Responde ÚNICAMENTE con un array JSON. Nada más.
4. Usa SOLAMENTE las labores (por su ID numérico) que se listan arriba. NO inventes IDs.
5. Para la "frecuencia", proporciona un número entero (en días). Si es una labor puntual (como la cosecha final), pon null.
6. Para el "offset", proporciona un número entero (en días). Usa valores negativos para adelantar la labor respecto al inicio de su fase teórica (ej: -180 para 6 meses antes de la siembra), valores positivos para retrasarla, o 0 si debe ir en su tiempo normal.
7. Las "notas_ia" deben ser concisas y útiles (máx 150 caracteres).
8. Agrega el campo "selected": true a todas las pautas.

Ejemplo de respuesta:
[
  { "id_labor": 2, "fase": "germinacion", "frecuencia": 2, "offset": 0, "notas_ia": "Riego ligero con pulverizador para no mover las semillas.", "selected": true },
  { "id_labor": 4, "fase": "siembra", "frecuencia": null, "offset": -180, "notas_ia": "Abono profundo y preparación del suelo 6 meses antes de la siembra real.", "selected": true },
  { "id_labor": 10, "fase": "floracion", "frecuencia": null, "offset": 10, "notas_ia": "Poda de chupones unos días después de iniciar la floración.", "selected": true }
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

      // Fetch existing ACTIVE pautas for this species
      let existingSet = new Set<string>();
      try {
        const [existing]: any = await pool.query('SELECT xlaborespautaidlabores, laborespautafase FROM laborespauta WHERE xlaborespautaidespecies = ? AND laborespautaactivosino = 1', [idespecies]);
        (existing || []).forEach((e: any) => {
          existingSet.add(`${e.xlaborespautaidlabores}_${e.laborespautafase}`);
        });
      } catch(e) {
        console.error('Error fetching existing pautas:', e);
      }

      // Validación básica y marcado de existentes
      pautas = pautas.map((p: any) => {
        const id_labor = Number(p.id_labor) || null;
        const fase = p.fase || 'general';
        const alreadyExists = existingSet.has(`${id_labor}_${fase}`);
        
        return {
          ...p,
          id_labor,
          fase,
          frecuencia: typeof p.frecuencia === 'number' ? p.frecuencia : null,
          offset: typeof p.offset === 'number' ? p.offset : 0,
          selected: !alreadyExists,
          alreadyExists
        };
      }).filter((p: any) => p.id_labor !== null);
    } catch (parseErr) {
      console.error('Error parseando JSON de Gemini:', resultText);
      return NextResponse.json({ error: 'Formato de respuesta inválido de IA' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pautas });
  } catch (error: any) {
    console.error('Error in AI pautas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
