import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { topic, especieNombre, variedadNombre } = await request.json();

    if (!topic || !especieNombre) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 });
    }

    const contextContext = variedadNombre && variedadNombre !== 'Variedad' && variedadNombre !== 'Sin nombre' 
      ? `de la especie "${especieNombre}" y variedad "${variedadNombre}"` 
      : `de la especie "${especieNombre}"`;

    const prompt = `Actúa como un bibliotecario agrónomo experto. Busca 4 enlaces reales a manuales, guías o documentos PDF (preferiblemente de instituciones agrícolas, universidades o ministerios) sobre el cultivo ${contextContext}, específicamente enfocados en el tema: "${topic}". 
Es IMPRESCINDIBLE que uses tu herramienta de búsqueda en internet para obtener enlaces reales y actualizados.
Devuelve tu respuesta ÚNICAMENTE como un array JSON válido, sin bloques markdown (\`\`\`) ni texto adicional. El JSON debe tener esta estructura exacta:
[
  {
    "url": "URL_DEL_DOCUMENTO_AQUI",
    "nombre": "Nombre descriptivo y breve (max 10 palabras)",
    "resumenCorto": "Resumen técnico detallado de al menos 4 líneas. Menciona métodos, climas y consejos clave de forma redactada y sin viñetas.",
    "apuntes": "Apuntes muy extensos y técnicos extraídos del documento. Genera al menos 5 viñetas detalladas con datos concretos, plagas, cuidados o metodologías."
  }
]`;

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
      // Intentar limpiar posibles caracteres extra antes del [ y después del ]
      let cleanOutput = textOutput.trim();
      if (cleanOutput.startsWith('```json')) cleanOutput = cleanOutput.substring(7);
      if (cleanOutput.startsWith('```')) cleanOutput = cleanOutput.substring(3);
      if (cleanOutput.endsWith('```')) cleanOutput = cleanOutput.substring(0, cleanOutput.length - 3);
      cleanOutput = cleanOutput.trim();
      
      const firstBracket = cleanOutput.indexOf('[');
      const lastBracket = cleanOutput.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        let jsonString = cleanOutput.substring(firstBracket, lastBracket + 1);
        try {
          parsedLinks = JSON.parse(jsonString);
        } catch (e) {
          // Si el JSON falla (ej. truncado), intentar arreglar un array truncado simple
          if (jsonString.endsWith(',\n]') || jsonString.endsWith(',]')) {
             jsonString = jsonString.replace(/,\s*\]$/, ']');
             parsedLinks = JSON.parse(jsonString);
          } else {
             // Fallback desesperado: forzar cierre
             if (!jsonString.endsWith('}')) jsonString += '"}]';
             else jsonString += ']';
             parsedLinks = JSON.parse(jsonString);
          }
        }
      } else if (cleanOutput !== '') {
        parsedLinks = JSON.parse(cleanOutput);
      }
      
      // Ensure parsedLinks is an array
      if (!Array.isArray(parsedLinks)) {
        if (parsedLinks && typeof parsedLinks === 'object') {
          const arrayValues = Object.values(parsedLinks).find(v => Array.isArray(v));
          if (arrayValues) {
            parsedLinks = arrayValues as any[];
          } else {
            parsedLinks = [parsedLinks];
          }
        } else {
          parsedLinks = [];
        }
      }
    } catch(e) {
      console.error('Error parseando JSON de Gemini:', e, textOutput.substring(0, 200));
      // Si falla totalmente el parseo, devolver un error controlado al frontend en lugar de continuar a ciegas
      return NextResponse.json({ error: 'La IA devolvió un formato ilegible (truncado). Por favor, intenta de nuevo con una búsqueda más corta.' }, { status: 422 });
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
