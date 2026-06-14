import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';

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
    const { nombre, customPrompt } = await request.json();

    if (!nombre) {
      return NextResponse.json({ error: 'Falta el nombre de la familia' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key de IA no configurada' }, { status: 500 });
    }

    const prompt = `
Eres un experto botánico, agrónomo y especialista en diseño de interfaces agroecológicas.
Necesito que me devuelvas EXCLUSIVAMENTE un objeto JSON válido con los datos generales para la familia botánica "${nombre}". 
No incluyas markdown, ni comillas invertidas, solo el JSON puro.
${customPrompt ? `\nINSTRUCCIONES ADICIONALES DEL USUARIO:\n${customPrompt}\n` : ''}

Las claves esperadas obligatorias en el JSON son:
- familiasnombrecientifico (string, el nombre en latín clásico de esta familia botánica, ej. Solanaceae)
- familiasgruporotacion (string, una palabra clave en minúsculas y sin acentos que identifique a este grupo para temas de rotación de cultivos, ej. solanaceas, leguminosas, liliaceas)
- familiasanosdescanso (número entero, de 1 a 10, que indica cuántos años deben pasar antes de volver a plantar cultivos de esta familia en el mismo bancal para evitar plagas y agotamiento de nutrientes. Ej: 4)
- familiasemoji (string, EXACTAMENTE UN (1) emoji de uso general que represente muy bien a esta familia botánica. Ej: 🍅 para Solanáceas, 🧅 para Amarilidáceas, 🥦 para Crucíferas)
- familiascolor (string, un código hexadecimal de 6 caracteres ej. #ff0000, que represente el color visual más característico de los frutos u hojas de esta familia. Ej: Rojo vibrante para solanáceas, verde azulado para brasicáceas)
- familiasdescripcion (string, de 2 a 3 párrafos completos y bien redactados que sirvan como una "Wikipedia" interna. Debe incluir: origen botánico, clima ideal, tipo de raíz, principales exigencias de riego o nutrientes, y un resumen de las especies más destacadas que la componen).

ATENCIÓN: SOLO debes responder con un objeto JSON, sin explicaciones adicionales.
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
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

    // Limpiar bloques markdown si existen
    const match = textResponse.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('No se pudo extraer JSON de la respuesta: ' + textResponse);
    }
    const cleanJson = match[0];
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in AI Familia General Assistant:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
