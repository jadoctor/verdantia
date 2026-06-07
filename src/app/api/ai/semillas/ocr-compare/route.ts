import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const email = request.headers.get('x-user-email');
    if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    // Si queremos restringirlo a Premium/Profesional, lo haríamos aquí. 
    // Por ahora lo permitimos para todos como indica el usuario, pero comprobamos:
    const isPremium = user.suscripcion === 'Premium' || user.suscripcion === 'Profesional';
    // Si en un futuro se requiere bloquear:
    // if (!isPremium) return NextResponse.json({ error: 'Función exclusiva Premium' }, { status: 403 });

    const body = await request.json();
    const { storagePath } = body;

    if (!storagePath) {
      return NextResponse.json({ error: 'Ruta de imagen requerida' }, { status: 400 });
    }

    // 1. Descargar la imagen de Firebase Storage
    const { getAdminBucket } = await import('@/lib/firebase/admin');
    const bucket = getAdminBucket();
    const fileRef = bucket.file(storagePath);
    
    let downloadedFile: Buffer;
    try {
      [downloadedFile] = await fileRef.download();
    } catch (e) {
      return NextResponse.json({ error: 'No se pudo descargar la imagen original' }, { status: 404 });
    }

    const base64Image = downloadedFile.toString('base64');

    // 2. Preparar llamada a Gemini Vision
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key de IA no configurada' }, { status: 500 });
    }

    const prompt = `Actúa como un OCR experto en agricultura. Analiza esta fotografía (típicamente un sobre de semillas, etiqueta o envase agrícola) y extrae los datos clave. 
DEBES devolver EXCLUSIVAMENTE un objeto JSON válido con las siguientes claves (si no encuentras el dato, devuelve string vacío ""):
{
  "semillasmarca": "Nombre de la marca comercial, fabricante o semillera",
  "semillaslote": "Número de lote (Batch/Lote)",
  "semillasfechaenvasado": "Fecha de envasado, control o test (formato YYYY-MM-DD)",
  "semillasfechacaducidad": "Fecha de caducidad o uso preferente (formato YYYY-MM-DD)",
  "especie_detectada": "Nombre común de la planta, variedad o especie que figura en el envase",
  "peso_gramos": "Peso o contenido neto en gramos (solo el número, si indica 5g devuelve 5, si indica 0.5g devuelve 0.5)",
  "semillasobservaciones": "Resumen de las instrucciones de siembra o descripción de la variedad. SOLO EN CASTELLANO. Máximo 30 palabras. Si NO hay instrucciones ni texto descriptivo, devuelve un texto vacío."
}

REGLAS ESTRICTAS:
1. No incluyas explicaciones, saludos ni markdown de bloques de código. Devuelve SOLO el JSON en crudo.
2. Si las fechas solo tienen mes y año (ej: 04/2026), asume el último día del mes (ej: 2026-04-30). Si tiene solo año (ej. 2025), asume 2025-12-31.
3. Extrae la información literalmente, sin inventar nada.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { inlineData: { mimeType: 'image/webp', data: base64Image } }, // Firebase guarda en webp, gemini lo lee
          { text: prompt }
        ] }],
        generationConfig: { 
          maxOutputTokens: 8000, 
          temperature: 0.1, // Baja temperatura para mayor precisión OCR
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[OCR Error]', response.status, errText);
      return NextResponse.json({ error: 'Error al contactar con la IA' }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    
    // Limpiar posibles bloques markdown (```json ... ```) en caso de que lo ignore
    const cleanText = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

    try {
      const parsedData = JSON.parse(cleanText);
      return NextResponse.json({ success: true, data: parsedData });
    } catch (parseError) {
      console.error('Error parseando JSON de Gemini:', cleanText);
      return NextResponse.json({ error: 'La IA no devolvió un formato válido', raw: cleanText }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[OCR Exception]', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
