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
    const { tipoEntidad = 'especie', especieNombre, especieNombreCientifico, especieFamilia, concept, customPrompt } = await request.json();

    if (!especieNombre) {
      return NextResponse.json({ error: 'Falta el nombre de la entidad (especie/labor)' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
    }

    const sciNameContext = especieNombreCientifico ? ` Nombre científico: ${especieNombreCientifico}.` : '';
    const familyContext = especieFamilia ? ` Familia botánica: ${especieFamilia}.` : '';

    let finalPrompt = '';

    if (tipoEntidad === 'labor') {
      finalPrompt = `Fotografía hiperrealista de alta calidad, estilo fotoperiodístico profesional, iluminación natural, hiperdetallada, resolución 8k.
Tema principal: la labor agrícola o tarea de jardinería "${especieNombre}".
Contexto y situación: ${concept || 'realizando la tarea en un entorno natural o huerto'}.
MUY IMPORTANTE Y ESTRICTO: 
1. La foto DEBE ilustrar claramente la realización de esta tarea o labor, o las herramientas asociadas.
2. La foto debe estar perfectamente enfocada en la acción o los elementos de esta labor, ocupando el centro geométrico de la composición y abarcando la mayor parte de la fotografía como foco absoluto de atención.`;
    } else if (tipoEntidad === 'documento') {
      finalPrompt = `Ilustración digital de alta calidad, estilo editorial y académico, diseño limpio y minimalista.
Tema principal: Portada de documento técnico o manual sobre "${especieNombre}".
Contexto y situación: ${concept || 'Diseño de portada académica'}.
MUY IMPORTANTE Y ESTRICTO:
1. La imagen DEBE parecer la portada de un libro o manual técnico, con composición equilibrada y espacio negativo.
2. Usa colores sobrios y elementos gráficos relacionados con la agricultura o la botánica, pero manteniendo un formato de publicación profesional.`;
    } else if (tipoEntidad === 'blog') {
      finalPrompt = `Fotografía hiperrealista de alta calidad, estilo editorial profesional para artículo de blog sobre agricultura y horticultura, iluminación natural cálida, hiperdetallada, resolución 8k.
Contexto del artículo: "${especieNombre}".
Enfoque visual: ${concept || 'Escena atractiva y profesional relacionada con el cultivo y la agricultura'}.
MUY IMPORTANTE Y ESTRICTO:
1. La foto DEBE ser una imagen editorial atractiva que ilustre visualmente el tema del artículo.
2. Composición profesional tipo revista, con profundidad de campo, colores vibrantes y un estilo que invite a la lectura.
3. NO incluir texto, logos ni marcas de agua en la imagen.`;
    } else {
      // Por defecto 'especie'
      const defaultConcept = `varios ejemplares de ${especieNombre} recién cosechados, dispuestos sobre una mesa rústica de madera en un huerto al aire libre, con tierra y hojas verdes visibles al fondo`;
      finalPrompt = `Fotografía profesional de stock de alta resolución (8K), tomada con una cámara DSLR Canon EOS R5 y un objetivo macro 100mm f/2.8, iluminación natural suave de hora dorada.
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
    }

    const payload = {
      instances: [
        { prompt: finalPrompt }
      ],
      parameters: {
        sampleCount: 1,
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

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
