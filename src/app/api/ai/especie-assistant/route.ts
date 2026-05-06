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
    const { nombre } = await request.json();

    if (!nombre) {
      return NextResponse.json({ error: 'Falta el nombre de la especie' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key de IA no configurada' }, { status: 500 });
    }

    const prompt = `
Eres un experto botánico y agrónomo. Necesito que me devuelvas EXCLUSIVAMENTE un objeto JSON válido con los datos de cultivo de la especie "${nombre}". 
No incluyas markdown, ni comillas invertidas, solo el JSON puro.

Las claves esperadas en el JSON son:
- especiesnombrecientifico (string, ej: Solanum lycopersicum)
- especiesfamilia (string, ej: Solanaceae)
- especiestipo (array de strings, elige entre: hortaliza, fruta, aromatica, leguminosa, cereal)
- especiesciclo (array de strings, elige entre: anual, bianual, perenne)
- especiesdiasgerminacion (entero aproximado, ej: 8)
- especiesviabilidadsemilla (entero aproximado en años, ej: 4)
- especiesdiashastatrasplante (entero aproximado en días desde la siembra, ej: 30)
- especiesdiashastafructificacion (entero aproximado, ej: 75)
- especiestemperaturaminima (numero decimal, ej: 10.5)
- especiestemperaturaoptima (numero decimal, ej: 25.0)
- especiestemperaturamaxima (numero decimal, ej: 35.0)
- especiesmarcoplantas (entero en cm, ej: 40)
- especiesmarcofilas (entero en cm, ej: 80)
- especiesprofundidadsiembra (numero decimal en cm, ej: 1.0)
- especiesprofundidadtrasplante (numero decimal en cm, ej: 5.0)
- especieshistoria (string, una breve historia de 2 párrafos sobre su origen)
- especiesdescripcion (string, consejos breves de cultivo)
- especiescolor (string, color fenotípico base, ej: Rojo)
- especiestamano (string, elige entre: pequeno, mediano, grande)
- especiesfechasemillerodesde (entero del mes, 1 a 12, null si no aplica)
- especiesfechasemillerohasta (entero del mes, 1 a 12, null si no aplica)
- especiesfechasiembradirectadesde (entero del mes, 1 a 12, null si no aplica)
- especiesfechasiembradirectahasta (entero del mes, 1 a 12, null si no aplica)
- especiestrasplantedesde (entero del mes, 1 a 12, null si no aplica)
- especiestrasplantehasta (entero del mes, 1 a 12, null si no aplica)
- especiesfecharecolecciondesde (entero del mes, 1 a 12)
- especiesfecharecoleccionhasta (entero del mes, 1 a 12)
- especiesfuentesinformacion (string, IMPORTANTE: Proporciona SOLO 2 URLs absolutas, reales y comprobables. 1) La página de Wikipedia de la especie usando el nombre científico (ej: https://es.wikipedia.org/wiki/Solanum_lycopersicum). 2) La URL oficial de Wikipedia sobre Agricultura Biodinámica para justificar el calendario lunar: https://es.wikipedia.org/wiki/Agricultura_biodin%C3%A1mica )
- especiesautosuficiencia (entero, plantas estimadas por persona al año para consumo COMPLETO en fresco, es decir, cubrir el 100% de la demanda anual)
- especiesautosuficienciaparcial (entero, plantas estimadas por persona para un consumo PARCIAL/básico, aproximadamente un 30-40% de la demanda, solo para complementar la compra)
- especiesautosuficienciaconserva (entero, plantas estimadas por persona al año con conserva, incluye fresco + producción extra para conservar)
- especiesbiodinamicacategoria (string, elige UNO entre: fruto, raiz, hoja, flor — según la parte comestible/ornamental principal)
- especiesbiodinamicanotas (string, 2-3 frases concisas sobre cómo aprovechar el calendario lunar biodinámico: siembra, trasplante, poda y recolección)
- especiesphsuelo (string, ej: 6.0 - 6.8)
- especiesnecesidadriego (string, elige entre: baja, media, alta)
- especiestiposiembra (string, elige entre: directa, semillero, ambas)
- especiesvolumenmaceta (numero entero en litros, ej: 10)
- especiesluzsolar (string, elige entre: pleno_sol, semisombra, sombra)
- especiescaracteristicassuelo (string, ej: franco-arcilloso, bien drenado)
- especiesdificultad (string, elige entre: baja, media, alta)
- asociaciones_beneficiosas (array de objetos {nombre: string, motivo: string}, solo nombres comunes exactos y específicos, NUNCA uses términos genéricos como "hierbas aromáticas", DEBES decir especies concretas. El motivo debe explicar brevemente POR QUÉ es beneficiosa, ej: [{"nombre": "Albahaca", "motivo": "Repele pulgones y mejora el sabor"}, {"nombre": "Cebolla", "motivo": "Ahuyenta plagas por su olor"}])
- asociaciones_perjudiciales (array de objetos {nombre: string, motivo: string}, solo nombres comunes exactos, NUNCA genéricos. El motivo debe explicar POR QUÉ es perjudicial, ej: [{"nombre": "Patata", "motivo": "Compiten por nutrientes y comparten enfermedades"}, {"nombre": "Hinojo", "motivo": "Inhibe el crecimiento por alelopatía"}])
- plagas_asociadas (array de objetos {nombre: string, riesgo: string, notas: string}, solo nombres comunes específicos. El riesgo debe ser "baja", "media" o "alta". Las notas deben describir brevemente el daño o síntoma, ej: [{"nombre": "Pulgón", "riesgo": "alta", "notas": "Coloniza brotes tiernos y transmite virus"}, {"nombre": "Oídio", "riesgo": "media", "notas": "Hongo blanco en hojas, reduce fotosíntesis"}])

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
    console.error('Error in AI Assistant:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
