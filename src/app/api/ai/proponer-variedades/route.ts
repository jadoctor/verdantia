import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// Helper for authentication and authorization
async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function POST(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { especieNombre, existingVariedades, extraInstructions } = await request.json();
    if (!especieNombre) {
      return NextResponse.json({ error: 'Nombre de la especie requerido' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No se encontró la API key de Gemini' }, { status: 500 });
    }

    const existingText = existingVariedades && existingVariedades.length > 0 
      ? `\nVARIEDADES YA EXISTENTES (No las propongas de nuevo ni repitas su nombre):\n${existingVariedades.map((v: any) => `- ${v.variedadesnombre}`).join('\n')}`
      : '';

    const extraText = extraInstructions ? `\nINSTRUCCIONES DEL USUARIO (PRIORIDAD ALTA):\n${extraInstructions}` : '';

    const prompt = `
Eres un experto botánico y agrícola especializado en horticultura, fruticultura y catalogación de variedades de plantas.
La especie de la que buscamos variedades es: "${especieNombre}".
${existingText}

Necesito que propongas entre 5 y 10 de las variedades comerciales, tradicionales, exóticas o más populares y conocidas de esta especie "${especieNombre}".

${extraText}

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con un array JSON. Nada más. No uses markdown wrapping como \`\`\`json ... \`\`\`. Solo el texto plano JSON.
2. Cada objeto debe tener exactamente esta estructura:
   {
     "variedadesnombre": "Nombre de la variedad (ej. 'Cherry Negro', 'Raf', 'Kumato' para Tomate)",
     "variedadestamano": "pequeno" | "mediano" | "grande" (solo uno de estos tres valores en minúsculas y sin eñes ni acentos),
     "variedadesdiasgerminacion": <número entero estimado de días de germinación, ej. 7>,
     "variedadescolor": "Color característico de la variedad (ej. 'Rojo', 'Amarillo', 'Negro', 'Verde')",
     "variedadesdescripcion": "Una breve descripción de las características principales de esta variedad (máximo 150 caracteres)"
   }
3. No incluyas explicaciones antes ni después del bloque JSON. Solo el array.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.4,
          responseMimeType: 'application/json' 
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[AI Variedades Error]', res.status, errText);
      return NextResponse.json({ error: 'Error del motor de IA' }, { status: res.status });
    }

    const data = await res.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ error: 'Respuesta vacía de la IA' }, { status: 500 });
    }

    let variedades = [];
    try {
      const arrayMatch = resultText.match(/\[[\s\S]*\]/);
      if (!arrayMatch) {
        throw new Error('No se encontró un array JSON en la respuesta');
      }
      variedades = JSON.parse(arrayMatch[0]);
    } catch (parseErr) {
      console.error('Error parseando JSON de Gemini:', resultText);
      return NextResponse.json({ error: 'Formato de respuesta inválido de IA' }, { status: 500 });
    }

    // Sanitización y validaciones básicas
    variedades = variedades.map((v: any) => {
      let tam = (v.variedadestamano || 'mediano').toLowerCase().trim();
      if (tam.includes('peque') || tam === 'pequeno') tam = 'pequeno';
      else if (tam.includes('grand')) tam = 'grande';
      else tam = 'mediano';

      return {
        variedadesnombre: String(v.variedadesnombre || '').trim(),
        variedadestamano: tam,
        variedadesdiasgerminacion: Number(v.variedadesdiasgerminacion) || null,
        variedadescolor: String(v.variedadescolor || '').trim(),
        variedadesdescripcion: String(v.variedadesdescripcion || '').trim()
      };
    });

    // Filtro anti-duplicados y vacíos
    variedades = variedades.filter((v: any) => v.variedadesnombre.length > 0);

    return NextResponse.json({ success: true, variedades });
  } catch (error: any) {
    console.error('Error in AI variedades:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
