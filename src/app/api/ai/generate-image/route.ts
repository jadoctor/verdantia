import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function authenticateAdmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('administrador') && !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function POST(request: Request) {
  const user = await authenticateAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { tipoEntidad = 'especie', especieNombre, variedadNombre, especieNombreCientifico, especieFamilia, concept, customPrompt } = await request.json();

    if (!especieNombre) {
      return NextResponse.json({ error: 'Falta el nombre de la entidad (especie/labor/variedad)' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
    }

    const sciNameContext = especieNombreCientifico ? ` Nombre científico: ${especieNombreCientifico}.` : '';
    const familyContext = especieFamilia ? ` Familia botánica: ${especieFamilia}.` : '';

    let varietyVisualDescription = '';
    if (tipoEntidad === 'variedad' && !customPrompt) {
      try {
        const searchPrompt = `Busca fotos, imágenes y descripciones reales de la variedad de ${especieNombre} llamada "${variedadNombre}" en internet para ver cómo es físicamente. A partir de lo que observes en las imágenes y la información, describe con detalle sus características visuales reales y fenotipo (color exacto, forma, tamaño, hojas y aspecto general) para que un generador de imágenes de IA pueda ilustrarla con total fidelidad botánica y no se la invente.`;
        const searchPayload = {
          contents: [{ role: 'user', parts: [{ text: searchPrompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 250 }
        };
        const searchUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const searchRes = await fetch(searchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchPayload)
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          varietyVisualDescription = searchData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          console.log('[AI Image Gen Grounding] Found variety description:', varietyVisualDescription);
        }
      } catch (err) {
        console.warn('[AI Image Gen Grounding] Error fetching variety grounding:', err);
      }
    }

    let finalPrompt = '';

    if (tipoEntidad === 'labor') {
      finalPrompt = `Fotografía hiperrealista de alta calidad, estilo fotoperiodístico profesional, iluminación natural, hiperdetallada, resolución 8k.
Tema principal: la labor agrícola o tarea de jardinería "${especieNombre}".
Contexto y situación: ${concept || 'realizando la tarea en un entorno natural o huerto'}.
MUY IMPORTANTE Y ESTRICTO: 
1. La foto DEBE ilustrar claramente la realización de esta tarea o labor, o las herramientas asociadas.
2. La foto debe estar perfectamente enfocada en la acción o los elementos de esta labor, ocupando el centro geométrico de la composición y abarcando la mayor parte de la fotografía como foco absoluto de atención.`;
    } else if (tipoEntidad === 'documento') {
      const subject = variedadNombre ? `la variedad "${variedadNombre}" de la especie "${especieNombre}"` : `"${especieNombre}"`;
      finalPrompt = `Ilustración digital de alta calidad, estilo editorial y académico, diseño limpio y minimalista.
Tema principal: Portada de documento técnico o manual sobre ${subject}.
Contexto y situación: ${concept || 'Diseño de portada académica'}.
MUY IMPORTANTE Y ESTRICTO:
1. La imagen DEBE parecer la portada de un libro o manual técnico, con composición equilibrada y espacio negativo.
2. Usa colores sobrios y elementos gráficos relacionados con la agricultura o la botánica, pero manteniendo un formato de publicación profesional.`;
    } else if (tipoEntidad === 'blog') {
      const subject = variedadNombre ? `la variedad "${variedadNombre}" de la especie "${especieNombre}"` : `"${especieNombre}"`;
      finalPrompt = `Fotografía hiperrealista de alta calidad, estilo editorial profesional para artículo de blog sobre agricultura y horticultura, iluminación natural cálida, hiperdetallada, resolución 8k.
Contexto del artículo: "${subject}".
Enfoque visual: ${concept || 'Escena atractiva y profesional relacionada con el cultivo y la agricultura'}.
MUY IMPORTANTE Y ESTRICTO:
1. La foto DEBE ser una imagen editorial atractiva que ilustre visualmente el tema del artículo.
2. Composición profesional tipo revista, con profundidad de campo, colores vibrantes y un estilo que invite a la lectura.
3. NO incluir texto, logos ni marcas de agua en la imagen.`;
    } else if (tipoEntidad === 'variedad') {
      const defaultConcept = `varios ejemplares de la variedad "${variedadNombre}" (perteneciente a la especie botánica "${especieNombre}") recién cosechados, dispuestos sobre una mesa rústica de madera en un huerto al aire libre, con tierra y hojas verdes visibles al fondo`;
      const descriptionCtx = varietyVisualDescription ? `\nCaracterísticas visuales reales y fenotipo botánico verificado en internet para la variedad "${variedadNombre}":\n${varietyVisualDescription}\n` : '';
      
      finalPrompt = `Fotografía profesional de stock de alta resolución (8K), iluminación natural suave de hora dorada.
Sujeto principal: La variedad "${variedadNombre}" de la especie botánica "${especieNombre}" (hortaliza/planta comestible de huerto).${sciNameContext}${familyContext}${descriptionCtx}
Escena concreta: ${concept || defaultConcept}.
Composición: regla de los tercios, sujeto nítido en primer plano, fondo suavemente desenfocado (bokeh) mostrando vegetación de huerto.
REGLAS ESTRICTAS E INQUEBRANTABLES:
1. El sujeto es SIEMPRE la variedad "${variedadNombre}" perteneciente a la especie botánica "${especieNombre}". Es obligatorio y crítico que la imagen contemple e ilustre fielmente las características específicas de esta variedad botánica, basándose rigurosamente en la descripción física real proporcionada.${descriptionCtx ? ' Debes apegarte con precisión a los colores, formas y texturas indicados en dicha descripción.' : ''}
2. EVITA CONFUSIONES DE FORMA: Si la variedad "${variedadNombre}" pertenece a la especie "${especieNombre}" (ej. Calabacín / Zucchini / Cucurbita pepo), el fruto DEBE ser de forma alargada, cilíndrica y recta (como un calabacín clásico de mercado) y de color verde muy oscuro brillante, con piel lisa. NO dibujes frutos redondos, esféricos, estriados ni con forma de calabaza redonda (como en la segunda imagen que parecía una calabaza verde pequeña), a menos que la descripción web indique explícitamente que es redonda. Si es un calabacín estándar, debe ser largo y cilíndrico.
3. La fotografía debe parecer tomada por un fotógrafo profesional de gastronomía o agricultura, con colores naturales muy realistas y texturas detalladas, sin parecer artificial.
4. El entorno debe ser obligatoriamente agrícola: huerto, bancal, invernadero, mesa de cosecha o cocina rústica. Nunca fondos abstractos ni estudios fotográficos.
5. NO incluir personas, manos, texto, logotipos ni marcas de agua.
6. Mostrar el producto hortícola en su mejor estado: fresco, limpio, apetecible, con gotas de rocío o tierra suelta si es apropiado.`;
    } else if (tipoEntidad === 'consumidor' || tipoEntidad === 'animal') {
      const defaultConcept = `un ejemplar de ${especieNombre} en un corral de granja limpio y soleado, con paja en el suelo y vegetación verde difuminada en el fondo`;
      finalPrompt = `Fotografía profesional de stock de alta resolución (8K), iluminación natural suave.\nSujeto principal: ${especieNombre} (animal de granja / ganado / ave de corral).\nEscena concreta: ${concept || defaultConcept}.\nComposición: primer plano o plano medio del animal, nítido y detallado, fondo suavemente desenfocado (bokeh) mostrando un entorno de granja o campo.\nREGLAS ESTRICTAS:\n1. El sujeto es SIEMPRE un animal, ave o ganado de granja. Ignora otras acepciones.\n2. La fotografía debe parecer real y tomada por un fotógrafo profesional de fauna o agricultura.\n3. El entorno debe ser de granja o campo (pastizal, pradera, corral, gallinero, establo).\n4. NO incluir personas, manos, texto, logotipos ni marcas de agua.\n5. Mostrar al animal en un estado saludable y limpio.`;
    } else {
      // Por defecto 'especie'
      const defaultConcept = `varios ejemplares de ${especieNombre} recién cosechados, dispuestos sobre una mesa rústica de madera en un huerto al aire libre, con tierra y hojas verdes visibles al fondo`;
      finalPrompt = `Fotografía profesional de stock de alta resolución (8K), iluminación natural suave de hora dorada.
Sujeto principal: ${especieNombre} (hortaliza/planta comestible de huerto).${sciNameContext}${familyContext}
Escena concreta: ${concept || defaultConcept}.
Composición: regla de los tercios, sujeto nítido en primer plano, fondo suavemente desenfocado (bokeh) mostrando vegetación de huerto.
REGLAS ESTRICTAS:
1. El sujeto es SIEMPRE una planta, hortaliza, fruto o semilla comestible de huerto. Si el nombre coincide con una parte del cuerpo humano o animal (diente, ojo, oreja, corona…), ignora esa acepción y muestra SOLO el vegetal/planta.
2. La fotografía debe parecer tomada por un fotógrafo profesional de gastronomía o agricultura, con colores naturales vibrantes y texturas detalladas.
3. El entorno debe ser siempre agrícola: huerto, bancal, invernadero, mesa de cosecha o cocina rústica. Nunca fondos abstractos ni estudios fotográficos.
4. NO incluir personas, manos, texto, logotipos ni marcas de agua.
5. Mostrar el producto hortícola en su mejor estado: fresco, limpio, apetecible, con gotas de rocío o tierra suelta si es apropiado.`;
    }

    // Si el usuario envía un prompt personalizado, usarlo directamente
    if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim()) {
      finalPrompt = customPrompt.trim();
      if (varietyVisualDescription) {
        finalPrompt += `\n[BOTANICAL PHENOTYPE DETECTED FOR "${variedadNombre}": ${varietyVisualDescription}. Respect this color, skin texture, exact fruit shape, and leaves shape precisely. Reject other generic visual representations. Avoid drawing round pumpkins or round shapes for elongated squashes/zucchinis.]`;
      }
    }

    // Traducir y optimizar el prompt a inglés para mejorar la fidelidad del modelo Imagen 4.0
    try {
      const transPrompt = `You are an expert AI image prompt engineer and translator.
Translate the following image generation prompt from Spanish to English.
Ensure that specific terms like "gallina ponedora", "Isa Brown", etc. are translated to their exact English agricultural/biological terms (e.g., "Isa Brown laying hen", "commercial layer chicken").
The final prompt must be highly detailed and optimized for photorealistic image generation in Google Imagen 4.0.

CRITICAL INSTRUCTION: Do NOT include any camera names, camera models, camera accessories, or brand names (such as DSLR, SLR, mirrorless, Canon, Nikon, Sony, Canon EOS R5, macro lens, prime lens, etc.) in the output. Instead, describe the style as professional photorealistic photography with sharp focus, depth of field, high-fidelity details, and natural lighting.

Output ONLY the final translated English prompt. No conversational text, no explanations, and no markdown wrappers (do not use triple backticks).

Prompt to translate:
${finalPrompt}`;

      const transUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const transRes = await fetch(transUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: transPrompt }] }],
          generationConfig: { maxOutputTokens: 8000, temperature: 0.1 }
        })
      });
      if (transRes.ok) {
        const transData = await transRes.json();
        const translated = transData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (translated) {
          console.log('[AI Image Prompt English Translation] Before:', finalPrompt);
          finalPrompt = translated;
          console.log('[AI Image Prompt English Translation] After:', finalPrompt);
        }
      }
    } catch (transErr) {
      console.warn('[AI Prompt Translation] Failed to translate prompt to English, using original:', transErr);
    }

    const payload = {
      instances: [
        { prompt: finalPrompt }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: tipoEntidad === 'documento' ? '3:4' : '1:1'
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json({ error: 'La generación de la imagen por IA ha superado el tiempo de espera máximo. Por favor, inténtalo de nuevo.' }, { status: 504 });
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Image Gen Error]', response.status, errText);
      return NextResponse.json({ error: 'Error del motor de IA generativa' }, { status: response.status });
    }

    const data = await response.json();

    if (data.predictions && data.predictions.length > 0 && data.predictions[0].bytesBase64Encoded) {
      // Generar descripción SEO analizando la imagen REAL generada
      let description = '';
      try {
        const imageBase64 = data.predictions[0].bytesBase64Encoded;
        const descPrompt = `Eres un redactor SEO especializado en horticultura y agricultura.
Observa esta fotografía y escribe UNA SOLA frase descriptiva en español de entre 8 y 15 palabras.
La frase debe describir exactamente lo que se VE: el producto hortícola, su estado, color, disposición y entorno.
NUNCA uses palabras técnicas de fotografía (hiperrealista, 8k, bokeh, macro…).
NUNCA describas lo que se le pidió generar, describe lo que VES.

Ejemplos buenos:
- "Cabezas de ajo morado recién cosechadas sobre mesa de madera rústica"
- "Tomates cherry rojos y brillantes colgando de la tomatera en invernadero"
- "Manojos de zanahorias naranjas con hojas verdes sobre tierra húmeda de huerto"
- "Pimientos rojos y verdes frescos apilados en una cesta de mimbre"

Responde SOLO con la frase descriptiva. Sin comillas, sin puntos finales, sin explicaciones.`;
        const descUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const descRes = await fetch(descUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [
              { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
              { text: descPrompt }
            ] }],
            generationConfig: { maxOutputTokens: 1000, temperature: 0.4 }
          })
        });
        if (descRes.ok) {
          const descData = await descRes.json();
          const rawDesc = descData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          // Limpiar comillas y punto final si los pone
          description = rawDesc.replace(/^["'«]+|["'»]+$/g, '').replace(/\.+$/, '').trim();
        }
      } catch (descErr) {
        console.warn('[AI Desc Gen] No se pudo generar descripción, continuando sin ella:', descErr);
      }

      return NextResponse.json({
        success: true,
        base64: data.predictions[0].bytesBase64Encoded,
        promptUsed: finalPrompt,
        description
      });
    } else {
      console.error('[AI Image Gen Invalid Response]', data);
      return NextResponse.json({ error: 'El modelo no devolvió una imagen válida' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[AI Image Gen Exception]', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
