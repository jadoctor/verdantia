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
Necesito que me devuelvas EXCLUSIVAMENTE un objeto JSON válido con las recomendaciones de rotación para la familia botánica "${nombre}". 
No incluyas markdown, ni comillas invertidas, solo el JSON puro.
${customPrompt ? `\nINSTRUCCIONES ADICIONALES DEL USUARIO:\n${customPrompt}\n` : ''}

Las claves esperadas obligatorias en el JSON son:
- familiasanosdescanso (numero entero, de 1 a 10, que indica cuántos años deben pasar antes de volver a plantar cultivos de esta familia en el mismo bancal para evitar plagas y agotamiento de nutrientes. Ej: Solanáceas = 4)
- familiasnotas (string, 1 o 2 párrafos concisos que expliquen brevemente las necesidades de nutrientes de esta familia, y justifiquen por qué se rota de esta manera)
- familiasprecedentes (array de números enteros correspondientes a los IDs de las familias ideales para plantar justo ANTES de ${nombre}. Usa lógica agronómica: ej. usar Leguminosas para fijar nitrógeno antes de plantas exigentes. SÓLO elige de la lista proporcionada).
- familiassucesores (array de números enteros correspondientes a los IDs de las familias ideales para plantar justo DESPUÉS de ${nombre}. SÓLO elige de la lista proporcionada).

ATENCIÓN Y REGLAS DE ROTACIÓN: 
1. Usa estrictamente los IDs numéricos de la siguiente lista de familias disponibles.
2. NUNCA incluyas a la propia familia "${nombre}" en sus precedentes ni sucesores.
3. ¡PROHIBIDO REPETIR! Nunca pongas la misma familia en precedentes y sucesores. La rotación de cultivos es un ciclo lineal (por ejemplo: Leguminosas -> Brasicáceas -> Liliáceas -> Solanáceas -> Leguminosas). Si repites la misma familia botánica antes y después, destruyes el tiempo de descanso de esa familia en la tierra. 
4. La ÚNICA excepción a la regla de repetición son las Leguminosas o Gramíneas, que a veces pueden usarse como abono verde rápido o cultivo de cobertura antes y después. Para el resto de familias, exige una progresión estricta en escalera.

LISTA DE FAMILIAS DISPONIBLES:
${familiasStr}
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
    console.error('Error in AI Familia Assistant:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
