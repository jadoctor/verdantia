import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';
import pool from '@/lib/db';

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
    const { images, customPrompt } = await request.json(); // Array of { data: base64, mimeType: string }

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No se han proporcionado imágenes' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key de IA no configurada' }, { status: 500 });
    }

    // EXTRAER CONSUMIDORES ACTIVOS PARA EL PROMPT
    const [animalesRows]: any = await pool.query('SELECT idespeciesanimales, especiesanimalesnombre FROM especiesanimales WHERE especiesanimalesactivo = 1');
    const animalesList = animalesRows.map((c: any) => `${c.idespeciesanimales}:${c.especiesanimalesnombre}`).join(', ');

    const prompt = `
Eres un experto botánico, agrónomo y biólogo.
Tu tarea es analizar las imágenes adjuntas e identificar de qué especie botánica o variedad vegetal se trata.
${customPrompt ? `\nINSTRUCCIONES ADICIONALES DEL USUARIO:\n${customPrompt}\n` : ''}

Además, debes evaluar la comestibilidad y toxicidad de esta planta para los siguientes animales activos en nuestra granja:
[${animalesList}]

Debes devolver EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura:

{
  "especiesvegetalesnombre": "El nombre común más habitual de la especie",
  "especiesvegetalesnombrecientifico": "El nombre botánico científico",
  "confianza": "alta, media o baja",
  "es_adventicia": <true si es considerada una mala hierba/adventicia común, false si es cultivo u ornamental>,
  "descripcion": "Breve descripción de lo que ves, identificación y características clave",
  "usos_consumo": [
    {
      "idespeciesanimales": <ID del animal según la lista proporcionada>,
      "nombre": "<Nombre del animal>",
      "esapto": <1 si es comestible/apto, 2 si es apto con moderación, 0 si es tóxico/inadecuado o no apto>,
      "partes": "<Partes comestibles/afectadas. Debe ser estrictamente uno de los siguientes strings: Hojas, Frutos, Raíz, Tallo, Flores, Semillas, Toda la planta.>",
      "notas": "<Explicación detallada. Ej: Tóxico por oxalatos, o Apto como forraje seco>"
    }
  ]
}

REGLAS:
- No uses markdown para el JSON.
- Devuelve SOLO texto JSON puro.
- Asegúrate de que especiesvegetalesnombrecientifico esté correctamente escrito (Género y especie).
- Para CADA uno de los animales listados, debes evaluar de forma independiente cada parte relevante de la planta. Si hay partes que son aptas y partes que son tóxicas o que requieren moderación, DEBES generar un objeto separado para cada una de las partes de la planta evaluadas para ese animal. Si no hay información para un animal, incluye al menos un objeto con esapto=0 y explícalo en notas.
`;

    const contentsParts: any[] = [{ text: prompt }];

    // Add images to parts
    for (const img of images) {
      contentsParts.push({
        inline_data: {
          mime_type: img.mimeType || 'image/jpeg',
          data: img.data
        }
      });
    }

    // Usar gemini-1.5-pro porque es mejor para reconocimiento de imágenes complejas y web search (si lo necesitara internamente)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: contentsParts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    };

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error('Error de Gemini API: ' + errorText);
    }

    const data = await res.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Respuesta vacía de IA');
    }

    // Parsear el JSON
    const match = textResponse.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('No se pudo extraer JSON de la respuesta: ' + textResponse);
    }
    const cleanJson = match[0];
    const parsed = JSON.parse(cleanJson);

    // Buscar en la base de datos si existe esta especie
    let existe = false;
    let especieId = null;
    let especiesSimilares = [];

    if (parsed.especiesvegetalesnombrecientifico || parsed.especiesvegetalesnombre) {
      const searchQuery = `
        SELECT idespeciesvegetales, especiesvegetalesnombre, especiesvegetalesnombrecientifico 
        FROM especiesvegetales 
        WHERE especiesvegetalesnombrecientifico LIKE ? OR especiesvegetalesnombre LIKE ?
      `;
      const sciNameParam = parsed.especiesvegetalesnombrecientifico ? `%${parsed.especiesvegetalesnombrecientifico}%` : '';
      const commonNameParam = parsed.especiesvegetalesnombre ? `%${parsed.especiesvegetalesnombre}%` : '';
      
      const [rows]: any = await pool.query(searchQuery, [sciNameParam, commonNameParam]);
      
      if (rows && rows.length > 0) {
        existe = true;
        especieId = rows[0].idespeciesvegetales;
        especiesSimilares = rows;
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: parsed,
      dbCheck: {
        existe,
        especieId,
        especiesSimilares
      }
    });

  } catch (error: any) {
    console.error('Error in Image ID Assistant:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
