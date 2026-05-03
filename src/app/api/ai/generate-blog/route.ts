import { NextResponse } from 'next/server';
import pool from '@/lib/db';
// Lazy load: NO importar firebase/storage ni sharp estáticamente (causa hash corrupto en Turbopack)

export async function POST(request: Request) {
  try {
    const { pdfUrl, instructions, especieId, variedadId, laborId, autorEmail, especieNombre, contexto, pdfSourceId } = await request.json();

    // Contexto adaptativo: especie, variedad o labor
    const tipoEntidad = contexto?.tipo || 'especie';
    const nombreEntidad = contexto?.nombre || especieNombre || 'agricultura';
    
    const contextoTexto = tipoEntidad === 'labor' 
      ? `la labor agrícola "${nombreEntidad}"` 
      : tipoEntidad === 'variedad' 
        ? `la variedad "${nombreEntidad}"` 
        : `la especie "${nombreEntidad}"`;

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

    // 2. Prepare Gemini prompt con estructura estándar Verdantia (ver BLOG_STANDARD.md)
    const fichaRapidaEjemplo = tipoEntidad === 'labor'
      ? `    {"icono": "📅", "label": "Época", "valor": "Mes-Mes"},
    {"icono": "⏱️", "label": "Duración", "valor": "X horas"},
    {"icono": "🔧", "label": "Herramientas", "valor": "Lista"},
    {"icono": "🌡️", "label": "Temp. Ideal", "valor": "XX°C"},
    {"icono": "⚠️", "label": "Dificultad", "valor": "Fácil/Media/Alta"},
    {"icono": "💰", "label": "Coste", "valor": "Bajo/Medio/Alto"}`
      : `    {"icono": "🌡️", "label": "Temp. Óptima", "valor": "XX-XX°C"},
    {"icono": "🗓️", "label": "Siembra", "valor": "Mes-Mes"},
    {"icono": "🌱", "label": "Germinación", "valor": "X-X días"},
    {"icono": "📏", "label": "Marco", "valor": "XXxXXcm"},
    {"icono": "🕐", "label": "Cosecha", "valor": "XX-XX días"},
    {"icono": "💧", "label": "Riego", "valor": "Tipo"}`;

    const prompt = `Actúa como un experto redactor de blogs agronómicos y de jardinería moderna. Vas a leer el documento adjunto sobre ${contextoTexto} y vas a escribir un artículo de blog profesional, SEO-optimizado y visualmente estructurado.

CONTEXTO: Este blog trata sobre ${tipoEntidad === 'labor' ? 'una LABOR AGRÍCOLA (tarea/técnica del huerto)' : tipoEntidad === 'variedad' ? 'una VARIEDAD específica de una especie vegetal' : 'una ESPECIE vegetal/hortaliza'}.

INDICACIONES DEL USUARIO: "${instructions}"

REGLAS DE ESTRUCTURA OBLIGATORIAS (Blog Verdantia):
1. SIN PAJA: Párrafos de máximo 3 líneas. Ve directo al grano.
2. NEGRITAS en conceptos clave. DATOS CONCRETOS: cifras, temperaturas, días, medidas.
3. TONO: Profesional pero cercano, como un agrónomo hablándote en el huerto.
4. TÍTULO: Siempre que sea posible, usa un título INTERROGATIVO (ej: "¿Cómo cultivar calabacín?", "¿Cuándo podar los tomates?"). Genera curiosidad.

Devuelve ÚNICAMENTE un JSON válido con esta estructura EXACTA:
{
  "titulo": "Título SEO interrogativo siempre que sea posible (ej: ¿Cómo cultivar...?), máximo 70 caracteres",
  "slug": "url-amigable-en-minusculas",
  "resumen": "Resumen de 2 líneas para la tarjeta del blog",
  "tags": ["#tag1", "#tag2", "#tag3", "#tag4"],
  "ficha_rapida": [
${fichaRapidaEjemplo}
  ],
  "introduccion": "Máximo 100 palabras. Gancho emocional que conecte con el lector.",
  "secciones": [
    {
      "titulo_h2": "Emoji + Título descriptivo",
      "contenido_markdown": "Texto con H3, negritas, listas. Mínimo 150 palabras.",
      "imagen_posicion": "derecha"
    },
    {
      "titulo_h2": "Emoji + Título descriptivo",
      "contenido_markdown": "Texto con H3, negritas, listas. Mínimo 150 palabras.",
      "imagen_posicion": "izquierda"
    }
  ],
  "consejos": {
    "titulo": "💡 Título atractivo para la caja de consejos",
    "items": [
      "**Concepto en negrita** — Explicación breve",
      "**Concepto en negrita** — Explicación breve",
      "**Concepto en negrita** — Explicación breve"
    ]
  },
  "cta": {
    "titulo": "Pregunta o llamada a la acción",
    "subtitulo": "Frase motivadora corta",
    "boton_primario": "🌱 Texto del botón principal",
    "boton_secundario": "📄 Texto del botón secundario"
  },
  "imagenes": [
    {
      "prompt_en": "Highly detailed professional photorealistic image prompt in English for the hero/cover image",
      "titulo_seo": "Título SEO en español, max 60 caracteres",
      "descripcion_seo": "Descripción SEO en español, max 120 caracteres"
    },
    {
      "prompt_en": "Highly detailed image prompt in English for section 1",
      "titulo_seo": "Título SEO en español",
      "descripcion_seo": "Descripción SEO en español"
    },
    {
      "prompt_en": "Highly detailed image prompt in English for section 2",
      "titulo_seo": "Título SEO en español",
      "descripcion_seo": "Descripción SEO en español"
    }
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
    let jsonString = textOutput.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      parsedData = JSON.parse(jsonString);
    } catch(e) {
      console.error('Error parseando JSON de Gemini:', e);
      console.error('Output crudo:', textOutput);
      return NextResponse.json({ error: 'La IA no devolvió un formato válido' }, { status: 500 });
    }

    if (!parsedData || !parsedData.titulo || (!parsedData.secciones && !parsedData.contenido_markdown)) {
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

    // Asegurar que el título sea único
    let finalTitulo = parsedData.titulo;
    let titleCounter = 1;
    while (true) {
      const [tRows] = await pool.query<any>('SELECT idblog FROM blog WHERE blogtitulo = ?', [finalTitulo]);
      if (tRows.length === 0) break;
      titleCounter++;
      finalTitulo = `${parsedData.titulo} (Versión ${titleCounter})`;
    }
    parsedData.titulo = finalTitulo;

    // Ensure unique slug
    let finalSlug = (parsedData.slug || parsedData.titulo).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const [slugRows] = await pool.query<any>('SELECT idblog FROM blog WHERE blogslug = ?', [finalSlug]);
    if (slugRows.length > 0) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    // 5. Insert blog entry first (to get the ID for datosadjuntos FK)
    const [result] = await pool.query<any>(`
      INSERT INTO blog 
      (blogslug, blogtitulo, blogresumen, blogcontenido, blogimagen, blogestado, xblogidusuarios, xblogidespecies, xblogidvariedades) 
      VALUES (?, ?, ?, ?, NULL, 'borrador', ?, ?, ?)
    `, [
      finalSlug,
      parsedData.titulo,
      parsedData.resumen || '',
      '{}',
      idUsuario,
      especieId || null,
      variedadId || null
    ]);

    const blogId = result.insertId;

    // 6. Generación de imágenes con pipeline estándar Verdantia
    const imagenesData = parsedData.imagenes || parsedData.imagenes_prompt || [];
    let heroImagePath: string | null = null;
    const generatedImagePaths: (string | null)[] = [];

    // Marca de agua SVG Verdantia (estándar del proyecto)
    // Lazy import para evitar hash corrupto de Turbopack en producción
    const sharp = (await import('sharp')).default;
    const { uploadToStorage } = await import('@/lib/firebase/storage');
    const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET || 'verdantia-494121.firebasestorage.app';

    const watermarkSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60">
      <text x="290" y="50" text-anchor="end"
        font-family="Arial, sans-serif" font-size="28" font-weight="bold"
        fill="white" fill-opacity="0.35" stroke="black" stroke-width="1.5" stroke-opacity="0.25">
        VERDANTIA
      </text>
    </svg>`);

    if (Array.isArray(imagenesData) && imagenesData.length > 0) {
      try {
        console.log(`[Blog Gen] Generando ${imagenesData.length} imágenes con pipeline estándar Verdantia...`);
        
        const generatedPaths: (string | null)[] = [];

        for (let i = 0; i < Math.min(3, imagenesData.length); i++) {
          const imgData = imagenesData[i];
          // Soportar tanto el formato nuevo {prompt_en, titulo_seo, descripcion_seo} como el antiguo (string simple)
          const imgPrompt = typeof imgData === 'string' ? imgData : imgData.prompt_en;
          const tituloSeo = typeof imgData === 'string' ? `Imagen ${i + 1} del artículo` : (imgData.titulo_seo || '');
          const descripcionSeo = typeof imgData === 'string' ? '' : (imgData.descripcion_seo || '');

          const urlImg = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`;
          
          const res = await fetch(urlImg, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ prompt: imgPrompt }],
              parameters: { sampleCount: 1 }
            })
          });
          const imgResponse = await res.json();

          if (imgResponse.predictions && imgResponse.predictions[0]?.bytesBase64Encoded) {
            const rawBuffer = Buffer.from(imgResponse.predictions[0].bytesBase64Encoded, 'base64');
            
            // ── PIPELINE ESTÁNDAR VERDANTIA ──

            // Slugify del título SEO para nombre de archivo
            const slugifiedTitle = (tituloSeo || `blog-imagen-${i}`)
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            
            const filename = `${slugifiedTitle}-${Date.now()}.webp`;
            const storagePath = `uploads/blog/${filename}`;

            // Redimensionar + marca de agua VERDANTIA + WebP
            const sharpInstance = sharp(rawBuffer);
            let mainSharp = sharpInstance
              .clone()
              .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true });

            const meta = await sharpInstance.metadata();
            if ((meta.width || 0) >= 300 && (meta.height || 0) >= 60) {
              mainSharp = mainSharp.composite([{
                input: watermarkSvg,
                gravity: 'southeast'
              }]);
            }

            const mainBuffer = await mainSharp.webp({ quality: 80 }).toBuffer();
            
            // Subir a Firebase Storage
            await uploadToStorage(mainBuffer, storagePath, 'image/webp');

            // Guardar en datosadjuntos vinculado al blog
            const resumenJson = JSON.stringify({
              seo_alt: descripcionSeo,
              seo_title: tituloSeo,
              profile_object_x: 50,
              profile_object_y: 50,
              profile_object_zoom: 100,
              profile_style: '',
              es_portada_blog: i === 0
            });

            await pool.query(
              `INSERT INTO datosadjuntos (
                datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
                datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
                datosadjuntosactivo, datosadjuntosfechacreacion, 
                xdatosadjuntosidespecies, datosadjuntospesobytes, 
                datosadjuntostitulo, datosadjuntosresumen
              ) VALUES ('imagen_blog', 'image/webp', ?, ?, ?, ?, 1, NOW(), ?, ?, ?, ?)`,
              [
                filename, storagePath, i === 0 ? 1 : 0, i + 1,
                especieId || null, mainBuffer.byteLength,
                tituloSeo, resumenJson
              ]
            );

            generatedImagePaths.push(storagePath);
            console.log(`[Blog Gen] ✅ Imagen ${i + 1} procesada: ${filename} (${tituloSeo})`);
          } else {
            generatedImagePaths.push(null);
            console.warn(`[Blog Gen] ⚠️ Imagen ${i + 1} no generada por Imagen 4.0`);
          }
        }
        
        // Asignar portada del blog
        if (generatedImagePaths[0]) {
          heroImagePath = generatedImagePaths[0];
        }

        // Inyectar rutas y metadatos SEO de imágenes en las secciones del JSON
        if (parsedData.secciones && Array.isArray(parsedData.secciones)) {
          parsedData.secciones.forEach((sec: any, idx: number) => {
            if (generatedImagePaths[idx + 1]) {
              sec.imagen_ruta = `https://storage.googleapis.com/${storageBucketName}/${generatedImagePaths[idx + 1]!}`;
              if (imagenesData[idx + 1]) {
                sec.imagen_alt = imagenesData[idx + 1].descripcion_seo || sec.titulo_h2;
                sec.imagen_title = imagenesData[idx + 1].titulo_seo || sec.titulo_h2;
              }
            }
          });
        }

        console.log("[Blog Gen] ✅ Pipeline completo: watermark + SEO + datosadjuntos");
      } catch(e) {
        console.error("[Blog Gen] Error general generando imágenes:", e);
      }
    }

    // 7. Construir JSON estructurado final y guardar
    const blogJson = {
      titulo: parsedData.titulo,
      resumen: parsedData.resumen,
      tags: parsedData.tags || [],
      ficha_rapida: parsedData.ficha_rapida || [],
      introduccion: parsedData.introduccion || '',
      secciones: parsedData.secciones || [],
      consejos: parsedData.consejos || null,
      cta: parsedData.cta || null,
      hero_imagen: heroImagePath ? `https://storage.googleapis.com/${storageBucketName}/${heroImagePath}` : null,
      hero_imagen_alt: imagenesData[0]?.descripcion_seo || parsedData.titulo,
      hero_imagen_title: imagenesData[0]?.titulo_seo || parsedData.titulo,
      contexto: { tipo: tipoEntidad, nombre: nombreEntidad },
      pdf_source_id: pdfSourceId || null
    };

    await pool.query<any>(
      `UPDATE blog SET blogcontenido = ?, blogimagen = ? WHERE idblog = ?`,
      [JSON.stringify(blogJson), heroImagePath, blogId]
    );

    return NextResponse.json({ success: true, blogId, slug: finalSlug });
  } catch (error: any) {
    console.error('Error en generate-blog:', error);
    return NextResponse.json({ error: 'Error interno del servidor: ' + (error.message || String(error)) }, { status: 500 });
  }
}
