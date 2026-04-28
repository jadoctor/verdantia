import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { uploadToStorage } from '@/lib/firebase/storage';

export async function POST(request: Request) {
  try {
    const { pdfUrl, instructions, especieId, variedadId, autorEmail, especieNombre } = await request.json();

    if (!pdfUrl || !instructions) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 });
    }

    // 1. Fetch PDF and convert to Base64
    let base64Pdf = '';
    try {
      const pdfRes = await fetch(pdfUrl);
      if (!pdfRes.ok) throw new Error('No se pudo descargar el PDF');
      const arrayBuffer = await pdfRes.arrayBuffer();
      base64Pdf = Buffer.from(arrayBuffer).toString('base64');
    } catch (e) {
      console.error("Error descargando PDF:", e);
      return NextResponse.json({ error: 'Error al descargar el PDF de origen' }, { status: 500 });
    }

    // 2. Prepare Gemini prompt
    const prompt = `Actúa como un experto redactor de blogs agronómicos y de jardinería moderna. Vas a leer el documento adjunto (sobre ${especieNombre || 'agricultura'}) y vas a escribir un artículo de blog altamente atractivo, SEO-optimizado y estructurado.
Instrucciones específicas del usuario: "${instructions}"

Reglas estrictas de Estructura de Blog Moderno:
1. Sin paja: Ve directo al grano. Párrafos cortos de máximo 3 líneas.
2. Jerarquía: Usa de 3 a 5 apartados H2 descriptivos. Aplica negritas a los conceptos clave.
3. El Gancho: La introducción debe ser de máximo 100 palabras empatizando con el problema.
4. Caja TL;DR: Inmediatamente después de la introducción, incluye una caja de "Puntos Clave" (usa Blockquotes de Markdown > o una lista de viñetas).
5. CTA Final: Termina con una llamada a la acción o pregunta breve.
6. Prompts de Imágenes: Imagina fotos o ilustraciones perfectas para acompañar tu artículo. Debes redactar descripciones altamente detalladas en INGLÉS (para DALL-E 3) de estas imágenes. La primera será la foto de portada. La segunda y tercera serán para intercalar en el texto.

Devuelve tu respuesta ÚNICAMENTE como un objeto JSON válido con la siguiente estructura exacta:
{
  "titulo": "Título atractivo aquí",
  "slug": "url-amigable-aqui",
  "resumen": "Un resumen corto de 2 líneas para la tarjeta del blog",
  "contenido_markdown": "El texto completo del artículo en Markdown (SIN INCLUIR LAS IMÁGENES AÚN, yo las inyectaré).",
  "imagenes_prompt": [
    "A high quality photorealistic image of...", 
    "An educational illustration showing..."
  ]
}`;

    const payload = {
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'application/pdf', data: base64Pdf } }
        ]
      }],
      generationConfig: { 
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini error:', errorText);
      return NextResponse.json({ error: 'Error al generar el blog con IA' }, { status: 500 });
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 3. Parse JSON
    let parsedData = null;
    try {
      parsedData = JSON.parse(textOutput);
    } catch(e) {
      console.error('Error parseando JSON de Gemini:', e);
      return NextResponse.json({ error: 'La IA no devolvió un formato válido' }, { status: 500 });
    }

    if (!parsedData || !parsedData.titulo || !parsedData.contenido_markdown) {
      return NextResponse.json({ error: 'Faltan datos en la respuesta de la IA' }, { status: 500 });
    }

    // 4. Obtener ID del autor
    let idUsuario = null;
    if (autorEmail) {
      const [userRows] = await pool.query<any>('SELECT idusuarios FROM usuarios WHERE usuariosemail = ? LIMIT 1', [autorEmail]);
      if (userRows.length > 0) {
        idUsuario = userRows[0].idusuarios;
      }
    }

    // 5. Generación Autónoma de Imágenes con Imagen 4.0 (Gemini)
    let heroImageUrl = null;
    let markdownConImagenes = parsedData.contenido_markdown;

    if (parsedData.imagenes_prompt && Array.isArray(parsedData.imagenes_prompt) && parsedData.imagenes_prompt.length > 0) {
      try {
        console.log("Generando " + parsedData.imagenes_prompt.length + " imágenes con Imagen 4.0...");
        
        // Ejecutamos las promesas en serie para no saturar el rate limit gratuito
        const generatedBase64s: (string | null)[] = [];
        for (let i = 0; i < Math.min(3, parsedData.imagenes_prompt.length); i++) {
          const imgPrompt = parsedData.imagenes_prompt[i];
          const urlImg = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
          // Nota: Usamos imagen-3.0-generate-001 porque es más estable en v1beta, aunque podemos probar imagen-4.0 si estuviera disponible.
          // Usaremos la versión que detectamos soportada
          const urlImg4 = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`;
          
          const res = await fetch(urlImg4, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ prompt: imgPrompt }],
              parameters: { sampleCount: 1 }
            })
          });
          const data = await res.json();
          if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
             const base64Data = data.predictions[0].bytesBase64Encoded;
             const buffer = Buffer.from(base64Data, 'base64');
             const filename = `blog_img_${Date.now()}_${i}.jpg`;
             const storagePath = `uploads/blog/${filename}`;
             
             // Subir a Firebase Storage
             const publicUrl = await uploadToStorage(buffer, storagePath, 'image/jpeg');
             
             generatedBase64s.push(publicUrl);
          } else {
             generatedBase64s.push(null);
          }
        }
        
        // Asignar Foto de Portada (Hero Image)
        if (generatedBase64s[0]) heroImageUrl = generatedBase64s[0];

        // Ensamblar las fotos interiores en el Markdown
        if (generatedBase64s.length > 1) {
          let h2Count = 0;
          markdownConImagenes = markdownConImagenes.replace(/(##\s.*)/g, (match: string) => {
            h2Count++;
            if (h2Count === 1 && generatedBase64s[1]) {
              return `![Imagen ilustrativa](${generatedBase64s[1]})\n\n${match}`;
            }
            if (h2Count === 3 && generatedBase64s[2]) {
              return `![Imagen detallada](${generatedBase64s[2]})\n\n${match}`;
            }
            return match;
          });
        }
        console.log("Imágenes de Google Imagen inyectadas correctamente.");
      } catch(e) {
        console.error("Error general generando imágenes:", e);
      }
    }

    // Ensure unique slug
    let finalSlug = (parsedData.slug || parsedData.titulo).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const [slugRows] = await pool.query<any>('SELECT idblog FROM blog WHERE xblogslug = ?', [finalSlug]);
    if (slugRows.length > 0) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    // 6. Insert into DB
    const [result] = await pool.query<any>(`
      INSERT INTO blog 
      (xblogslug, xblogtitulo, xblogresumen, xblogcontenido, xblogimagen, xblogestado, xblogidusuarios, xblogidespecies, xblogidvariedades) 
      VALUES (?, ?, ?, ?, ?, 'borrador', ?, ?, ?)
    `, [
      finalSlug,
      parsedData.titulo,
      parsedData.resumen || '',
      markdownConImagenes,
      heroImageUrl,
      idUsuario,
      especieId || null,
      variedadId || null
    ]);

    return NextResponse.json({ success: true, blogId: result.insertId, slug: finalSlug });
  } catch (error: any) {
    console.error('Error en generate-blog:', error);
    return NextResponse.json({ error: 'Error interno del servidor: ' + (error.message || String(error)) }, { status: 500 });
  }
}
