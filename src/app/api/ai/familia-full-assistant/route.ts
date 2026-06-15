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
    const { nombre, customPrompt } = await request.json();

    if (!nombre) {
      return NextResponse.json({ error: 'Falta el nombre de la familia' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key de IA no configurada' }, { status: 500 });
    }

    const [familiasRows]: any = await pool.query("SELECT idfamilias, familiasnombre FROM familias");
    const familiasStr = familiasRows.map((f: any) => `- ID ${f.idfamilias}: ${f.familiasnombre}`).join('\n');

    const prompt = `
Eres un experto botánico y agrónomo especializado en rotaciones y asociaciones de cultivos en huertos agroecológicos.
Necesito que me devuelvas EXCLUSIVAMENTE un objeto JSON válido con los datos generales y recomendaciones de rotación para la familia botánica "${nombre}". 
No incluyas markdown, ni comillas invertidas, solo el JSON puro.
${customPrompt ? '\nINSTRUCCIONES ADICIONALES DEL USUARIO:\n' + customPrompt + '\n' : ''}

Las claves esperadas obligatorias en el JSON son:
- familiasnombrecientifico (string, el nombre en latín clásico de esta familia botánica)
- familiasgruporotacion (string, una palabra clave en minúsculas y sin acentos que identifique a este grupo para temas de rotación de cultivos, ej. solanaceas)
- familiasanosdescanso (numero entero, de 1 a 10, que indica cuántos años deben pasar antes de volver a plantar cultivos de esta familia en el mismo bancal. Ej: 4)
- familiasemoji (string, EXACTAMENTE UN (1) emoji representativo)
- familiascolor (string, código hexadecimal de 6 caracteres ej. #ff0000, color característico)
- familiasdescripcion (string, de 2 a 3 párrafos de "Wikipedia" interna: origen, clima, riego, especies destacadas)
- familiasnotas (string, 1 o 2 párrafos concisos que expliquen las necesidades de nutrientes de esta familia y su rotación)
- familiasprecedentes (array de números enteros correspondientes a los IDs de las familias ideales para plantar justo ANTES de ${nombre}. SÓLO elige de la lista)
- familiassucesores (array de números enteros correspondientes a los IDs de las familias ideales para plantar justo DESPUÉS de ${nombre}. SÓLO elige de la lista)

ATENCIÓN Y REGLAS DE ROTACIÓN: 
1. Usa estrictamente los IDs numéricos de la siguiente lista de familias disponibles para precedentes y sucesores.
2. NUNCA incluyas a la propia familia "${nombre}" en sus precedentes ni sucesores.
3. ¡PROHIBIDO REPETIR! Nunca pongas la misma familia en precedentes y sucesores.

LISTA DE FAMILIAS DISPONIBLES:
${familiasStr}
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

    const match = textResponse.match(/\\{[\\s\\S]*\\}/);
    if (!match) {
      throw new Error('No se pudo extraer JSON de la respuesta: ' + textResponse);
    }
    const cleanJson = match[0];
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in AI Familia Full Assistant:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
