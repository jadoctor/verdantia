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
    const { nombreVariedad, nombreEspecie, customPrompt } = await request.json();

    if (!nombreVariedad) {
      return NextResponse.json({ error: 'Falta el nombre de la variedad' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key de IA no configurada' }, { status: 500 });
    }

    const prompt = `
Eres un experto botánico y agrónomo. Necesito que me devuelvas EXCLUSIVAMENTE un objeto JSON válido con los datos de cultivo ESPECÍFICOS de la variedad "${nombreVariedad}" de la especie "${nombreEspecie || 'desconocida'}".
No incluyas markdown, ni comillas invertidas, solo el JSON puro.
${customPrompt ? `\nINSTRUCCIONES ADICIONALES DEL USUARIO:\n${customPrompt}\n` : ''}

IMPORTANTE: Los datos deben ser ESPECÍFICOS de esta variedad, no genéricos de la especie. Si la variedad tiene características distintas a la especie base (ej. tamaño más pequeño, maduración más rápida, etc.), refleja esas diferencias.

Las claves esperadas en el JSON son:
- variedadesvegetalesnombrecientifico (string, ej: Solanum lycopersicum var. cerasiforme)
- variedadesfamilia (string, ej: Solanaceae)
- variedadestipo (array de strings, elige entre: hortaliza, fruta, aromatica, leguminosa, cereal)
- variedadesciclo (array de strings, elige entre: anual, bianual, perenne)
- variedadesdiasgerminacion (entero aproximado, ej: 8)
- variedadesviabilidadsemilla (entero aproximado en años, ej: 4)
- variedadespeso1000semillas (numero, usa punto decimal solo si es necesario, sin ceros extra, ej: 1.5 o 5)
- variedadesdiashastatrasplante (entero aproximado en días desde la siembra, ej: 30)
- variedadesdiascrecimientofirme (entero aproximado en días post-trasplante o post-siembra directa en que la planta ya es robusta, ej: 45)
- variedadesdiashastafructificacion (entero aproximado en días post-trasplante o post-siembra directa, ej: 75)
- variedadesdiashastarecoleccion (entero aproximado en días post-trasplante o post-siembra directa, ej: 90)
- variedadestemperaturaminima (numero decimal, ej: 10.5)
- variedadestemperaturaoptima (numero decimal, ej: 25.0)
- variedadestemperaturamaxima (numero decimal, ej: 35.0)
- variedadesmarcoplantas (entero en cm, ej: 40)
- variedadesmarcofilas (entero en cm, ej: 80)
- variedadesmarcomargen (entero en cm, margen desde el borde del bancal. Aproximadamente la mitad del marco entre plantas, ej: 20)
- variedadesprofundidadsiembra (numero decimal en cm, ej: 1.0)
- variedadesprofundidadtrasplante (numero decimal en cm, ej: 5.0)
- variedadeshistoria (string, una breve historia de 2 párrafos sobre el origen de esta variedad específica)
- variedadesdescripcion (string, consejos breves de cultivo específicos de esta variedad)
- variedadescolor (string, color fenotípico base, ej: Rojo)
- variedadestamano (string, elige entre: pequeno, mediano, grande)
- variedadessemillerodesde (entero del mes, 1 a 12, null si no aplica)
- variedadessemillerohasta (entero del mes, 1 a 12, null si no aplica)
- variedadessiembradirectadesde (entero del mes, 1 a 12, null si no aplica)
- variedadessiembradirectahasta (entero del mes, 1 a 12, null si no aplica)
- variedadestrasplantedesde (entero del mes, 1 a 12, null si no aplica)
- variedadestrasplantehasta (entero del mes, 1 a 12, null si no aplica)
- variedadesrecolecciondesde (entero del mes, 1 a 12)
- variedadesrecoleccionhasta (entero del mes, 1 a 12)
- variedadesautosuficiencia (entero, plantas estimadas por persona al año para consumo COMPLETO en fresco)
- variedadesautosuficienciaparcial (entero, plantas estimadas por persona para consumo PARCIAL, un 30-40% de la demanda)
- variedadesautosuficienciaconserva (entero, plantas estimadas por persona al año con conserva)
- variedadesphsuelo (string, ej: 6.0 - 6.8)
- variedadesnecesidadriego (string, elige entre: baja, media, alta)
- variedadestiposiembra (string, elige entre: directa, semillero, planton, esqueje, bulbo, division)
- variedadesvolumenmaceta (numero entero en litros, ej: 10)
- variedadesluzsolar (string, elige entre: pleno_sol, semisombra, sombra)
- variedadescaracteristicassuelo (string, ej: franco-arcilloso, bien drenado)
- variedadesdificultad (string, elige entre: baja, media, alta)

Recuerda: SOLO JSON válido, nada de formato adicional.
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

    // Clean markdown code blocks if any
    const match = textResponse.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('No se pudo extraer JSON de la respuesta: ' + textResponse);
    }
    const cleanJson = match[0];
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in Variedad AI Assistant:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
