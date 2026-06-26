import { NextResponse } from 'next/server';
import pool from '@/lib/db';
export async function POST(request: Request) {
  try {
    const { idespecies, especie, labores, instruccionesAdicionales, datosAdicionales } = await request.json();
    if (!especie) {
      return NextResponse.json({ error: 'Nombre de la especie requerido' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No se encontró la API key de Gemini' }, { status: 500 });
    }

    const laboresList = labores.map((l: any) => `${l.id}: ${l.nombre}`).join('\n');
    const [fasesRows]: any = await pool.query("SELECT fasescultivoclave, fasescultivonombre, fasescultivodescripcion, fasescultivotipo FROM fasescultivo WHERE fasescultivoclave != 'perdido' ORDER BY fasescultivoorden ASC");
    const fasesStr = fasesRows.map((f: any) => `- ${f.fasescultivoclave} (${f.fasescultivonombre}${f.fasescultivotipo.includes('Hito') ? ' -> ES UN HITO PUNTUAL, frecuencia DEBE ser null' : ''}. ${f.fasescultivodescripcion || ''})`).join('\n');

    const extraText = instruccionesAdicionales ? `\nINSTRUCCIONES DEL USUARIO (PRIORIDAD ALTA):\n${instruccionesAdicionales}` : '';

    let contextData = '';
    if (datosAdicionales) {
      const relevantData = {
        marcoPlantacion: datosAdicionales.especiesmarcopilantacion,
        profundidadSiembra: datosAdicionales.especiesprofundidadsiembracm ? `${datosAdicionales.especiesprofundidadsiembracm} cm` : undefined,
        temperaturaIdeal: datosAdicionales.especiestemperaturaideal,
        phIdeal: datosAdicionales.especiesphideal,
        tipoSuelo: datosAdicionales.especiestiposuelo,
        necesidadesHidricas: datosAdicionales.especiesnecesidadeshidricas,
        necesidadesLuminicas: datosAdicionales.especiesnecesidadesluminicas
      };
      contextData = `\nDATOS REGISTRADOS DE LA ESPECIE EN BASE DE DATOS:\n${JSON.stringify(relevantData, null, 2)}\n\nEs IMPORTANTÍSIMO que si existe un dato como la profundidad de siembra, el pH, o las necesidades hídricas, lo integres en las notas_ia de la pauta correspondiente (ej: al proponer la siembra, incluye la profundidad).`;
    }

    const prompt = `
Eres un experto botánico, ingeniero agrónomo y especialista en gestión de cultivos.
Necesito que analices el ciclo de vida del cultivo/planta: "${especie}".
${contextData}

Dispones del siguiente listado de labores en el sistema (ID: Nombre):
${laboresList}

Tu objetivo es proponer las "Pautas de Labores" necesarias para esta especie, especificando cuándo y con qué frecuencia deben realizarse.

Fases válidas permitidas (elige SOLO la CLAVE EXACTA de una de estas fases permitidas para cada pauta):
${fasesStr}

${extraText}

REGLAS ESTRICTAS Y EXHAUSTIVIDAD:
1. SE EXTREMADAMENTE EXHAUSTIVO. No te saltes ninguna fase lógica. Piensa en TODO el ciclo biológico. Es OBLIGATORIO Y CRÍTICO que generes al menos una labor para hitos fundamentales como 'siembra', 'germinacion', 'crecimiento' y 'cosecha' si aplican a la planta. ¡No puedes omitir la siembra en una especie que se cultiva!
2. PROHIBIDO crear fases o grupos genéricos. Tienes que obligar a la labor a pertenecer a la CLAVE exacta de una fase concreta permitida arriba.
3. Responde ÚNICAMENTE con un array JSON. Nada más.
4. Usa SOLAMENTE las labores (por su ID numérico) que se listan arriba. NO inventes IDs.
5. Para la "frecuencia", proporciona un número entero (en días). Si la fase es un Hito puntual (como siembra, adquisición, trasplante, cosecha), la frecuencia DEBE ser null obligatoriamente.
6. Para el "offset", proporciona un número entero (en días). Usa valores negativos para adelantar la labor respecto al inicio de su fase teórica (ej: -180 para 6 meses antes), valores positivos para retrasarla, o 0 si debe ir en su tiempo normal.
7. Las "notas_ia" deben ser concisas y útiles (máx 150 caracteres).
8. Agrega el campo "selected": true a todas las pautas.
9. LABORES COMPLEMENTARIAS Y SECUENCIALES: Es fundamental que asocies labores dependientes en la misma fase. Por ejemplo, SIEMPRE que propongas una labor de "Siembra" o "Trasplante", debes proponer INMEDIATAMENTE DESPUÉS (con offset 0 o 1) una labor de "Riego" (riego de siembra/trasplante) en esa misma fase. No asumas que un solo hito engloba todo, divídelo en las labores correspondientes (ej: Siembra + Riego).

Ejemplo de respuesta:
[
  { "id_labor": 2, "fase": "germinacion", "frecuencia": 2, "offset": 0, "notas_ia": "Riego ligero con pulverizador para no mover las semillas.", "selected": true },
  { "id_labor": 4, "fase": "siembra", "frecuencia": null, "offset": -180, "notas_ia": "Abono profundo y preparación del suelo 6 meses antes de la siembra real.", "selected": true }
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
