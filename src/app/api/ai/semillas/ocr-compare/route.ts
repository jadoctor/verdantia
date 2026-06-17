import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const email = request.headers.get('x-user-email');
    if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    // Comprobar límite de IA
    const cleanName = (user.suscripcion || '').toLowerCase();
    let maxConsultas = 5; // Básica
    if (cleanName.includes('premium')) maxConsultas = 100;
    else if (cleanName.includes('avanzado') || cleanName.includes('profesional')) maxConsultas = 50;
    else if (cleanName.includes('esencial') || cleanName.includes('avanzada')) maxConsultas = 20;

    if (user.roles.includes('superadministrador')) {
      maxConsultas = 100;
    }

    const { default: pool } = await import('@/lib/db');
    const [rows]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM historialia 
      WHERE xhistorialiaidusuarios = ? 
        AND MONTH(historialiafecha) = MONTH(CURRENT_DATE())
        AND YEAR(historialiafecha) = YEAR(CURRENT_DATE())
    `, [user.id]);

    const usedConsultas = rows[0].count;
    if (usedConsultas >= maxConsultas) {
      return NextResponse.json({ error: 'Has superado el límite de consultas IA de tu plan' }, { status: 403 });
    }

    const body = await request.json();
    const { storagePath, base64Image: directBase64, base64Images } = body;

    const inputImages = base64Images && base64Images.length > 0 ? base64Images : (directBase64 ? [directBase64] : []);

    if (!storagePath && inputImages.length === 0) {
      return NextResponse.json({ error: 'Ruta de imagen o array de imágenes base64 requerido' }, { status: 400 });
    }

    const processedImages: { mimeType: string, data: string }[] = [];

    if (inputImages.length > 0) {
      for (const b64 of inputImages) {
        let currentB64 = b64;
        let mime = 'image/jpeg';
        if (currentB64.startsWith('data:')) {
          const parts = currentB64.split(',');
          const match = parts[0].match(/:(.*?);/);
          if (match) mime = match[1];
          currentB64 = parts[1];
        }
        processedImages.push({ mimeType: mime, data: currentB64 });
      }
    } else if (storagePath) {
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

      processedImages.push({ mimeType: 'image/webp', data: downloadedFile.toString('base64') });
    }

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
  "especie_detectada": "Nombre común de la especie u hortaliza principal (ej: Tomate, Lechuga)",
  "variedad_detectada": "Nombre específico de la variedad si aparece (ej: Muchamiel, Romana). Si no aparece, devuelve texto vacío",
  "peso_gramos": "String o número con el peso NETO detectado del contenido de las semillas. SOLO el peso de las semillas, no del sobre entero ni embalaje exterior. Extraer el valor numérico (ej. '5' o '1.5' o '0.5'). Dejar vacío si no aparece.",
  "semillasobservaciones": "Resumen de las instrucciones de siembra o descripción de la variedad. SOLO EN CASTELLANO. Máximo 30 palabras. Si NO hay instrucciones ni texto descriptivo, devuelve un texto vacío.",
  "precio": "String o número con el precio impreso o etiquetado en el sobre, si aparece (ej. '1.50' o '2'). Dejar vacío si no aparece.",
  "lugar_compra": "Nombre del lugar o tienda donde se ha comprado, si aparece en alguna etiqueta de precio o logo comercial (ej. 'Leroy Merlin', 'Verdecora'). Dejar vacío si no aparece."
}

INSTRUCCIONES IMPORTANTES:
1. Asegúrate de devolver ÚNICAMENTE el JSON crudo, sin bloques de código ni formato markdown.
2. Formatea las fechas al estándar de base de datos YYYY-MM-DD. Si solo indica año (ej. 2025), asume 2025-01-01. Si tiene mes y año (ej. 04/2026), asume el último día del mes (ej. 2026-04-30).
3. Extrae la información literalmente, sin inventar nada.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          ...processedImages.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
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
      return NextResponse.json({ error: `Error de la IA: ${errText}` }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    
    // Limpiar posibles bloques markdown (```json ... ```) en caso de que lo ignore
    const cleanText = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

    try {
      const parsedData = JSON.parse(cleanText);
      
      // Registrar interacción exitosa
      await pool.query(`
        INSERT INTO historialia (xhistorialiaidusuarios, historialiamodulo, historialiaprompt, historialiarespuesta, historialiaexito)
        VALUES (?, 'OCR_WIZARD_SEMILLAS', ?, ?, 1)
      `, [user.id, 'Petición OCR desde Asistente de Semillas', cleanText]);

      return NextResponse.json({ success: true, data: parsedData });
    } catch (parseError) {
      console.error('Error parseando JSON de Gemini:', cleanText);
      // Registrar error
      await pool.query(`
        INSERT INTO historialia (xhistorialiaidusuarios, historialiamodulo, historialiaprompt, historialiarespuesta, historialiaexito)
        VALUES (?, 'OCR_WIZARD_SEMILLAS', ?, ?, 0)
      `, [user.id, 'Petición OCR desde Asistente de Semillas', cleanText]);
      return NextResponse.json({ error: 'La IA no devolvió un formato válido', raw: cleanText }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[OCR Exception]', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
