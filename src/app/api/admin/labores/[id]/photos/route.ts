import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { uploadToStorage } from '@/lib/firebase/storage';
import { getUserByEmail } from '@/lib/auth';
import sharp from 'sharp';
import exifr from 'exifr';
import { Vibrant } from 'node-vibrant/node';
import { encode } from 'blurhash';

export const dynamic = 'force-dynamic';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const idlabores = resolvedParams.id;

  try {
    const [rows] = await pool.query(
      `SELECT iddatosadjuntos as id, datosadjuntosruta as ruta, 
              datosadjuntosesprincipal as esPrincipal, datosadjuntosresumen as resumen,
              datosadjuntosnombreoriginal as nombreOriginal
       FROM datosadjuntos 
       WHERE xdatosadjuntosidlabores = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 
       ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC`,
      [idlabores]
    );
    return NextResponse.json({ photos: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const idlabores = resolvedParams.id;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const ext = (file.name.match(/\.\w+$/) || ['.jpg'])[0];
    const bytes = await file.arrayBuffer();

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM datosadjuntos WHERE xdatosadjuntosidlabores = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1",
      [idlabores]
    );
    const total = (countResult as any[])[0].total;

    const esPrimera = total === 0 ? 1 : 0;
    const fileSize = bytes.byteLength;

    // Obtener nombre de la labor para contexto de IA
    let laborNombre = formData.get('laborNombre') as string;
    if (!laborNombre) {
      const [laborResult] = await pool.query("SELECT laboresnombre FROM labores WHERE idlabores = ?", [idlabores]);
      laborNombre = (laborResult as any[])[0]?.laboresnombre || 'Labor';
    }

    // Llamada a Gemini para obtener seo_alt
    let seoAlt = '';
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey) {
      try {
        const jpegBuffer = await sharp(Buffer.from(bytes))
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 70 })
          .toBuffer();
        const base64Data = jpegBuffer.toString('base64');
        
        const payload = {
          contents: [{
            parts: [
              { text: `Analiza esta imagen relacionada con la labor agrícola '${laborNombre}'. Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta: {"seo_alt": "descripción visual en español útil para SEO, máximo 80 caracteres"}` },
              { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        };

        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
          try {
            const parsed = JSON.parse(cleanText);
            seoAlt = parsed.seo_alt || '';
          } catch {
            const match = cleanText.match(/"seo_alt"\s*:\s*"([^"]+)"/);
            if (match) seoAlt = match[1];
          }
        }
      } catch (e) {
        console.error('[Labores Photos API] Error llamando a Gemini para SEO:', e);
      }
    }

    // SLUGIFY
    const textToSlugify = seoAlt || laborNombre;
    const slug = textToSlugify
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const filename = `${slug}-${Date.now()}.webp`;
    const storagePath = `uploads/labores/${filename}`;
    const thumbFilename = `thumb-${filename}`;
    const thumbStoragePath = `uploads/labores/${thumbFilename}`;

    const sharpInstance = sharp(Buffer.from(bytes));

    let dominantColor = null;
    let vibrantColor = null;
    let blurhashStr = null;
    let exifData: any = null;

    try {
      const stats = await sharpInstance.stats();
      if (stats.dominant) {
        dominantColor = `rgb(${stats.dominant.r}, ${stats.dominant.g}, ${stats.dominant.b})`;
      }
    } catch (e) {}

    try {
      const parsedExif = await exifr.parse(Buffer.from(bytes));
      if (parsedExif) {
        exifData = {};
        if (parsedExif.Make) exifData.make = parsedExif.Make;
        if (parsedExif.Model) exifData.model = parsedExif.Model;
        if (parsedExif.DateTimeOriginal) exifData.date = parsedExif.DateTimeOriginal;
      }
    } catch (e) {}

    try {
      const palette = await Vibrant.from(Buffer.from(bytes)).getPalette();
      if (palette.Vibrant) {
        vibrantColor = palette.Vibrant.hex;
      }
    } catch (e) {}

    try {
      const { data, info } = await sharpInstance
        .clone()
        .resize(32, 32, { fit: 'inside' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      blurhashStr = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
    } catch (e) {}

    const mainSharp = sharpInstance
      .clone()
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true });

    const mainBuffer = await mainSharp
      .webp({ quality: 80 })
      .toBuffer();

    const publicUrl = await uploadToStorage(mainBuffer, storagePath, 'image/webp');

    const thumbBuffer = await sharpInstance
      .clone()
      .resize(400, 400, { fit: 'cover', position: 'centre' })
      .webp({ quality: 65 })
      .toBuffer();

    await uploadToStorage(thumbBuffer, thumbStoragePath, 'image/webp');

    const initialResumen = JSON.stringify({
      profile_object_x: 50,
      profile_object_y: 50,
      profile_object_zoom: 100,
      profile_style: '',
      seo_alt: seoAlt,
      dominant_color: dominantColor,
      vibrant_color: vibrantColor,
      blurhash: blurhashStr,
      exif_data: exifData
    });

    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidlabores,
        datosadjuntospesobytes, datosadjuntosresumen
      ) VALUES ('imagen', ?, ?, ?, ?, ?, 1, NOW(), ?, ?, ?)`,
      [
        file.type || 'image/jpeg', file.name, publicUrl, esPrimera,
        total + 1, idlabores, fileSize, initialResumen
      ]
    );

    return NextResponse.json({
      success: true,
      photo: {
        id: (result as any).insertId,
        ruta: publicUrl,
        esPrincipal: esPrimera,
        nombreOriginal: file.name,
        resumen: initialResumen
      }
    });

  } catch (error: any) {
    console.error('[Labores Photos API] Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('photoId');

  if (!photoId) return NextResponse.json({ error: 'photoId requerido' }, { status: 400 });

  try {
    await pool.query(
      'UPDATE datosadjuntos SET datosadjuntosactivo = 0, datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ? AND xdatosadjuntosidlabores = ?',
      [photoId, resolvedParams.id]
    );
    return NextResponse.json({ success: true, message: 'Foto eliminada' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const body = await request.json();
    const { photoId, action, resumen } = body;

    if (action === 'setPrimary') {
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosesprincipal = 0 WHERE xdatosadjuntosidlabores = ? AND datosadjuntostipo = "imagen"',
        [resolvedParams.id]
      );
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE iddatosadjuntos = ? AND xdatosadjuntosidlabores = ?',
        [photoId, resolvedParams.id]
      );
      return NextResponse.json({ success: true, message: 'Foto principal actualizada' });
    }

    if (action === 'updateMeta' && resumen) {
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosresumen = ? WHERE iddatosadjuntos = ? AND xdatosadjuntosidlabores = ?',
        [typeof resumen === 'string' ? resumen : JSON.stringify(resumen), photoId, resolvedParams.id]
      );
      return NextResponse.json({ success: true, message: 'Metadatos actualizados' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
