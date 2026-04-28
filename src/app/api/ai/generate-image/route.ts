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
    const { tipoEntidad = 'especie', especieNombre, especieNombreCientifico, especieFamilia, concept } = await request.json();

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
    } else {
      // Por defecto 'especie'
      finalPrompt = `Fotografía hiperrealista de alta calidad, estilo fotoperiodístico profesional, iluminación natural, hiperdetallada, resolución 8k.
Tema principal biológico/botánico: la especie "${especieNombre}".${sciNameContext}${familyContext}
Contexto y situación: ${concept || 'en su entorno natural'}.
MUY IMPORTANTE Y ESTRICTO: 
1. La foto DEBE tratar exclusivamente sobre la planta/vegetal/fruto biológico mencionado. NUNCA generes animales ni otros sujetos no botánicos que tengan un nombre similar (por ejemplo, si el nombre parece un animal, ignóralo, es una variedad de planta).
2. La foto debe estar perfectamente enfocada en el sujeto botánico principal, ocupando el centro geométrico de la composición y abarcando la mayor parte de la fotografía como foco absoluto de atención.`;
    }

    const payload = {
      instances: [
        { prompt: finalPrompt }
      ],
      parameters: {
        sampleCount: 1,
        // Optional parameters you might want depending on the model's exact schema
        // aspect_ratio: "1:1",
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
      return NextResponse.json({
        success: true,
        base64: data.predictions[0].bytesBase64Encoded
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
