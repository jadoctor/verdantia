import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    const { especieNombre, especieCientifico } = await request.json();
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

    const prompt = `
Eres un experto botánico y filólogo especializado en términos agrícolas y nombres comunes de plantas.
La especie es: "${especieNombre}" (Nombre científico: ${especieCientifico || 'Desconocido'}).

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
4. IMPORTANTE SOBRE EL PAÍS: Intenta asociar SIEMPRE un ID de país si el sinónimo es característico de una región o país en particular (ej. España o México). Usa "null" SOLO si el sinónimo es mundialmente conocido y estándar en todo el idioma sin distinción regional.
5. Usa los siguientes IDs de IDIOMAS permitidos (solo usa el ID numérico):
${idiomasList}
6. Usa los siguientes IDs de PAÍSES permitidos (solo usa el ID numérico, o null si es muy general):
${paisesList}

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

    return NextResponse.json({ success: true, sinonimos });
  } catch (error: any) {
    console.error('Error in AI sinonimos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
