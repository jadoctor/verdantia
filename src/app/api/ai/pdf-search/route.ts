import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { topic, especieNombre } = await request.json();

    if (!topic || !especieNombre) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 });
    }

    const prompt = `Actúa como un bibliotecario agrónomo experto. Busca 4 enlaces reales a manuales, guías o documentos PDF (preferiblemente de instituciones agrícolas, universidades o ministerios) sobre el cultivo de "${especieNombre}", específicamente enfocados en el tema: "${topic}". 
Es IMPRESCINDIBLE que uses tu herramienta de búsqueda en internet para obtener enlaces reales y actualizados.
Devuelve tu respuesta ÚNICAMENTE como un bloque de código JSON válido con la siguiente estructura:
\`\`\`json
[
  {
    "url": "URL_DEL_DOCUMENTO_AQUI",
    "nombre": "Nombre descriptivo y claro basado en el contenido (ej. 'Manual de Poda')",
    "resumenCorto": "Breve descripción de 1-2 líneas",
    "apuntes": "Apuntes de estudiante muy detallados y técnicos extraídos de lo que has leído. Usa viñetas y texto largo."
  }
]
\`\`\``;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: {
        temperature: 0.1
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini error:', errorText);
      return NextResponse.json({ error: 'Error al conectar con Gemini API' }, { status: 500 });
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 1. Extraer los links reales de Google Search (Grounding Chunks) - Fuente de la Verdad
    const realLinks: { title: string, url: string }[] = [];
    if (data.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const chunks = data.candidates[0].groundingMetadata.groundingChunks;
      const seenUrls = new Set();
      for (const chunk of chunks) {
        if (chunk.web?.uri && chunk.web?.title && chunk.web.uri.startsWith('http')) {
           if (!seenUrls.has(chunk.web.uri)) {
             seenUrls.add(chunk.web.uri);
             
             // Si el enlace de Google es un redirect interno (vertexaisearch), intentar resolverlo
             let finalUrl = chunk.web.uri;
             if (finalUrl.includes('vertexaisearch.cloud.google.com/grounding-api-redirect')) {
               try {
                 const redirRes = await fetch(finalUrl, { redirect: 'manual' });
                 const loc = redirRes.headers.get('location');
                 if (loc) finalUrl = loc;
               } catch(e) {
                 console.warn('No se pudo resolver redirect de vertex', e);
               }
             }
             realLinks.push({ title: chunk.web.title, url: finalUrl });
           }
        }
      }
    }
    console.log('[Gemini PDF Search] Raw output length:', textOutput.length);
    if (!data.candidates) {
      console.error('[Gemini PDF Search] ERROR FROM API:', JSON.stringify(data));
    }

    let parsedLinks: any[] = [];
    try {
      const firstBracket = textOutput.indexOf('[');
      const lastBracket = textOutput.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const jsonString = textOutput.substring(firstBracket, lastBracket + 1);
        parsedLinks = JSON.parse(jsonString);
      } else if (textOutput.trim() !== '') {
        parsedLinks = JSON.parse(textOutput);
      }
      
      // Ensure parsedLinks is an array
      if (!Array.isArray(parsedLinks)) {
        if (parsedLinks && typeof parsedLinks === 'object') {
          // If Gemini wrapped it in an object like { links: [...] }
          const arrayValues = Object.values(parsedLinks).find(v => Array.isArray(v));
          if (arrayValues) {
            parsedLinks = arrayValues as any[];
          } else {
            // It might just be a single object
            parsedLinks = [parsedLinks];
          }
        } else {
          parsedLinks = [];
        }
      }
    } catch(e) {
      console.error('Error parseando JSON de Gemini:', e, textOutput.substring(0, 100));
    }

    // 3. Cruzar datos: Evitar URLs alucinadas cruzando el JSON con los enlaces reales por orden
    const links = [];
    if (realLinks.length > 0) {
      for (let i = 0; i < parsedLinks.length; i++) {
        // Si hay un enlace real disponible, lo usamos (para evitar error 404).
        if (i < realLinks.length) {
          links.push({
            title: parsedLinks[i].nombre || realLinks[i].title, // Priorizamos el nombre IA para evitar dominios crudos
            url: realLinks[i].url, // SIEMPRE URL REAL
            summary: parsedLinks[i].resumenCorto || 'Análisis técnico no disponible.',
            apuntes: parsedLinks[i].apuntes || ''
          });
        }
      }
      
      // Si la IA encontró enlaces reales pero no generó JSON para ellos, los añadimos igualmente
      for (let i = links.length; i < realLinks.length && i < 5; i++) {
        links.push({
          title: realLinks[i].title,
          url: realLinks[i].url,
          summary: 'Documento técnico encontrado en internet vía Google Search.',
          apuntes: ''
        });
      }
    } else {
      // Fallback si no hay Google Search Grounding (raro)
      for (const p of parsedLinks) {
        links.push({
          title: 'Documento Encontrado',
          url: p.url,
          summary: p.resumenCorto || '',
          apuntes: p.apuntes || ''
        });
      }
    }

    return NextResponse.json({ links });
  } catch (error: any) {
    console.error('Error en pdf-search:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
