import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    const { especieNombre, especieCientifico, existingSinonimos, extraInstructions } = await request.json();
    if (!especieNombre) {
      return NextResponse.json({ error: 'Nombre de la especie requerido' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No se encontró la API key de Gemini' }, { status: 500 });
    }

    // Fetch master tables to give Gemini the exact IDs and names
    const [idiomas] = await pool.query<RowDataPacket[]>('SELECT ididiomas, idiomasnombre FROM idiomas');
    const [paises] = await pool.query<RowDataPacket[]>('SELECT idpaises, paisesnombre FROM paises');

    const idiomasList = idiomas.map(i => `${i.ididiomas}: ${i.idiomasnombre}`).join(', ');
    const paisesList = paises.map(p => `${p.idpaises}: ${p.paisesnombre}`).join(', ');

    const existingText = existingSinonimos && existingSinonimos.length > 0 
      ? `\nSINÓNIMOS YA EXISTENTES (No propongas estos mismos para los mismos países):\n${existingSinonimos.map((s: any) => `- ${s.nombre} (País ID: ${s.idPais || 'General'})`).join('\n')}`
      : '';

    const extraText = extraInstructions ? `\nINSTRUCCIONES DEL USUARIO (PRIORIDAD ALTA):\n${extraInstructions}` : '';

    const prompt = `
Eres un experto botánico y filólogo especializado en términos agrícolas y nombres comunes de plantas.
La especie es: "${especieNombre}" (Nombre científico: ${especieCientifico || 'Desconocido'}).
${existingText}

Necesito que propongas SOLO los nombres ALTERNATIVOS de esta especie: palabras DIFERENTES al nombre principal "${especieNombre}".

⚠️ REGLA FUNDAMENTAL — LEE ESTO PRIMERO:
Un sinónimo es ÚNICAMENTE un nombre DIFERENTE para la misma planta.
Si en Colombia, México y España la planta se llama igual (ej. "Ajo"), NO la repitas para cada país.
Solo propón una entrada si el NOMBRE EN SÍ es una palabra distinta.

EJEMPLO CORRECTO para "Ajo" (Allium sativum):
✅ "All" (Valenciano, España) — palabra DIFERENTE
✅ "Baratxuri" (Euskera, España) — palabra DIFERENTE
✅ "Garlic" (Inglés, Internacional) — palabra DIFERENTE

EJEMPLO INCORRECTO:
❌ "Ajo" (Español, México) — es la MISMA PALABRA
❌ "Ajo" (Español, Colombia) — es la MISMA PALABRA
${extraText}

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con un array JSON. Nada más.
2. Cada objeto debe tener exactamente esta estructura:
   {
     "especiessinonimosnombre": "El sinónimo aquí (DEBE ser diferente a ${especieNombre})",
     "xespeciessinonimosididiomas": <ID del idioma>,
     "xespeciessinonimosidpaises": <ID del país>,
     "especiessinonimosnotas": "Breve nota"
   }
3. VALENCIANO: Toda referencia a catalán/valenciano/balear DEBE usar el idioma "Valenciano". Prohibido usar "Catalán".
4. PAÍS OBLIGATORIO Y COHERENTE CON EL IDIOMA: Cada idioma tiene su país natural. Asócialos correctamente:
   - Valenciano, Gallego, Euskera → España
   - Inglés → Estados Unidos, Reino Unido, Canadá, Australia o India según contexto
   - Francés → Francia (o Canadá si es variante canadiense)
   - Italiano → Italia
   - Portugués → Portugal (o Brasil si es variante brasileña)
   - Alemán → Alemania
   - Chino → China
   - Japonés → Japón
   - Guaraní → Paraguay
   - Quechua → Perú
   - Latín → Internacional
   NUNCA uses "Internacional" si existe el país natural del idioma. NUNCA uses null.
5. NO repitas el mismo nombre para distintos países. Si "Palta" se usa en Argentina, Perú y Uruguay, pon UNA sola entrada con el país más representativo y menciónalo en las notas.
6. NUNCA propongas el nombre principal "${especieNombre}" ni su nombre científico como sinónimo.
7. IDs de IDIOMAS: ${idiomasList}
8. IDs de PAÍSES: ${paisesList}

Ejemplo de respuesta:
[
  { "especiessinonimosnombre": "Palta", "xespeciessinonimosididiomas": 1, "xespeciessinonimosidpaises": 3, "especiessinonimosnotas": "Argentina, Uruguay y Perú" },
  { "especiessinonimosnombre": "Alvocat", "xespeciessinonimosididiomas": 2, "xespeciessinonimosidpaises": 1, "especiessinonimosnotas": "Valenciano" }
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

    if (!res.ok) {
      const errText = await res.text();
      console.error('[AI Sinonimos Error]', res.status, errText);
      return NextResponse.json({ error: 'Error del motor de IA' }, { status: res.status });
    }

    const data = await res.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ error: 'Respuesta vacía de la IA' }, { status: 500 });
    }

    // Parsear la respuesta JSON de Gemini
    let sinonimos = [];
    try {
      // Buscar explícitamente el array JSON ignorando cualquier otro texto conversacional
      const arrayMatch = resultText.match(/\[[\s\S]*\]/);
      if (!arrayMatch) {
        throw new Error('No se encontró un array JSON en la respuesta');
      }
      sinonimos = JSON.parse(arrayMatch[0]);
    } catch (parseErr) {
      console.error('Error parseando JSON de Gemini:', resultText);
      return NextResponse.json({ error: 'Formato de respuesta inválido de IA' }, { status: 500 });
    }

    // Sanitización: forzar que SIEMPRE tengan país e idioma válidos
    const validPaisIds = new Set(paises.map(p => p.idpaises));
    const validIdiomaIds = new Set(idiomas.map(i => i.ididiomas));
    const ID_INTERNACIONAL = paises.find(p => p.paisesnombre === 'Internacional')?.idpaises || 22;
    const ID_ESPANOL = idiomas.find(i => i.idiomasnombre === 'Español')?.ididiomas || 1;

    sinonimos = sinonimos.map((s: any) => ({
      ...s,
      xespeciessinonimosidpaises: validPaisIds.has(Number(s.xespeciessinonimosidpaises))
        ? Number(s.xespeciessinonimosidpaises)
        : ID_INTERNACIONAL,
      xespeciessinonimosididiomas: validIdiomaIds.has(Number(s.xespeciessinonimosididiomas))
        ? Number(s.xespeciessinonimosididiomas)
        : ID_ESPANOL
    }));

    // Filtro anti-duplicados:
    // 1. Eliminar sinónimos que sean idénticos al nombre de la especie
    const nombreNorm = especieNombre.toLowerCase().trim();
    const cientificoNorm = (especieCientifico || '').toLowerCase().trim();
    sinonimos = sinonimos.filter((s: any) => {
      const sinNorm = (s.especiessinonimosnombre || '').toLowerCase().trim();
      return sinNorm !== nombreNorm && sinNorm !== cientificoNorm && sinNorm.length > 0;
    });

    // 2. Eliminar nombres repetidos: si "Palta" aparece 3 veces para 3 países, dejar solo la primera
    const seenNames = new Set<string>();
    sinonimos = sinonimos.filter((s: any) => {
      const key = (s.especiessinonimosnombre || '').toLowerCase().trim();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

    return NextResponse.json({ success: true, sinonimos });
  } catch (error: any) {
    console.error('Error in AI sinonimos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
