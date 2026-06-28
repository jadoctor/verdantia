import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Trim start
    .replace(/-+$/, ''); // Trim end
}

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

  const idespeciesvegetales = resolvedParams.id;

  try {
    const [rows] = await pool.query(
      `SELECT iddatosadjuntos, datosadjuntosruta, datosadjuntosnombreoriginal, datosadjuntostitulo, datosadjuntosresumen, datosadjuntosapuntes, datosadjuntosportada, datosadjuntosautores, datosadjuntosidentificacion, datosadjuntosactivo
       FROM datosadjuntos 
       WHERE xdatosadjuntosidespeciesvegetales = ? 
       AND datosadjuntostipo = 'documento' 
       AND datosadjuntosfechaeliminacion IS NULL 
       ORDER BY datosadjuntosorden ASC`,
      [idespeciesvegetales]
    );

    const pdfs = (rows as any[]).map(r => ({
      id: r.iddatosadjuntos,
      ruta: r.datosadjuntosruta,
      nombreOriginal: r.datosadjuntosnombreoriginal,
      titulo: r.datosadjuntostitulo || '',
      resumen: r.datosadjuntosresumen || '',
      apuntes: r.datosadjuntosapuntes || '',
      portada: r.datosadjuntosportada || null,
      autores: r.datosadjuntosautores || '',
      identificacion: r.datosadjuntosidentificacion || '',
      activo: r.datosadjuntosactivo ?? 1
    }));

    return NextResponse.json({ pdfs });
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

  const idespeciesvegetales = resolvedParams.id;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 });
    }

    const filename = `especie_${idespeciesvegetales}_${Date.now()}.pdf`;
    const storagePath = `uploads/especies_pdfs/${filename}`;

    const bytes = await file.arrayBuffer();
    const { uploadToStorage } = await import('@/lib/firebase/storage');
    const publicUrl = await uploadToStorage(
      Buffer.from(bytes),
      storagePath,
      'application/pdf'
    );

    let generatedTitle = '';
    let generatedSummary = '';
    let generatedApuntes = '';
    let generatedAutores = '';
    let generatedIdentificacion = '';
    try {
      const base64Pdf = Buffer.from(bytes).toString('base64');
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && bytes.byteLength < 10 * 1024 * 1024) { // Only process if < 10MB to avoid timeouts/limits
        const payload = {
          contents: [{
            parts: [
              { text: `Analiza este documento PDF sobre la especie agrícola. Eres un experto agrónomo. Devuelve EXCLUSIVAMENTE un JSON con cinco propiedades: "nombre" (nombre súper corto del documento que aparecerá en el visor, ideal 3-4 palabras, máximo 40 caracteres), "resumen" (resumen corto de 1-2 líneas), "apuntes" (Una guía exhaustiva, técnica y extensa en formato Markdown. Extrae absolutamente todos los datos de valor del PDF. Usa títulos (##), listas con viñetas, y negritas para resaltar métricas y cifras), "autores" (Nombres de los autores o de la institución que publica el PDF, ej: Juan Pérez, Universidad Agraria), e "identificacion" (DOI, ISBN, ISSN o cualquier identificador único o académico internacional del documento. Si no tiene, déjalo vacío).` },
              { inlineData: { mimeType: "application/pdf", data: base64Pdf } }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        };
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (aiResponse.ok) {
          const data = await aiResponse.json();
          if (!data.candidates) console.error('[Gemini PDF Upload] ERROR FROM API:', JSON.stringify(data));
          const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          
          let jsonOut: any = {};
          try {
            const firstBracket = textOut.indexOf('{');
            const lastBracket = textOut.lastIndexOf('}');
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
              jsonOut = JSON.parse(textOut.substring(firstBracket, lastBracket + 1));
            } else {
              jsonOut = JSON.parse(textOut);
            }
          } catch (e) {
            console.error('Error parseando JSON de Gemini PDF Upload:', e);
          }
          
          generatedTitle = typeof jsonOut.nombre === 'string' ? jsonOut.nombre : (typeof jsonOut.titulo === 'string' ? jsonOut.titulo : '');
          generatedSummary = Array.isArray(jsonOut.resumen) ? jsonOut.resumen.join(' ') : (jsonOut.resumen || '');
          generatedApuntes = Array.isArray(jsonOut.apuntes) ? '- ' + jsonOut.apuntes.join('\n- ') : (jsonOut.apuntes || '');
          generatedAutores = Array.isArray(jsonOut.autores) ? jsonOut.autores.join(', ') : (jsonOut.autores || '');
          generatedIdentificacion = Array.isArray(jsonOut.identificacion) ? jsonOut.identificacion.join(', ') : (jsonOut.identificacion || '');
        }
      }
    } catch (e) {
      console.error('[Gemini PDF Summary Error]:', e);
    }

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM datosadjuntos WHERE xdatosadjuntosidespeciesvegetales = ? AND datosadjuntostipo = 'documento' AND datosadjuntosactivo = 1",
      [idespeciesvegetales]
    );
    const total = (countResult as any[])[0].total;

    const fileSize = bytes.byteLength;

    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidespeciesvegetales,
        datosadjuntospesobytes, datosadjuntostitulo, datosadjuntosresumen, datosadjuntosapuntes, datosadjuntosautores, datosadjuntosidentificacion
      ) VALUES ('documento', 'application/pdf', ?, ?, 0, ?, 1, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
      [file.name, storagePath, total + 1, idespeciesvegetales, fileSize, generatedTitle, generatedSummary, generatedApuntes, generatedAutores, generatedIdentificacion]
    );

    return NextResponse.json({
      success: true,
      pdf: {
        id: (result as any).insertId,
        ruta: storagePath,
        nombreOriginal: file.name,
        titulo: generatedTitle,
        resumen: generatedSummary,
        apuntes: generatedApuntes,
        autores: generatedAutores,
        identificacion: generatedIdentificacion
      }
    });

  } catch (error: any) {
    console.error('[Especie PDFs API] Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const idespeciesvegetales = resolvedParams.id;

  try {
    const { pdfId, titulo, resumen, apuntes, portada, base64Cover, autores, identificacion, activo } = await request.json();

    if (!pdfId) {
      return NextResponse.json({ error: 'ID de PDF requerido' }, { status: 400 });
    }

    let finalPortada = portada;
    if (base64Cover) {
      const buffer = Buffer.from(base64Cover.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      
      const sharp = eval(`require('sharp')`);
      const watermarkSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60">
        <rect x="0" y="0" width="300" height="60" fill="black" fill-opacity="0.4" rx="8" />
        <text x="280" y="40" text-anchor="end"
          font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold"
          fill="white" fill-opacity="0.9" letter-spacing="2">
          VERDANTIA
        </text>
      </svg>`);

      const watermarkedBuffer = await sharp(buffer)
        .composite([{ input: watermarkSvg, gravity: 'southeast' }])
        .jpeg({ quality: 85 })
        .toBuffer();

      let docTitle = titulo;
      if (!docTitle) {
        const [pdfRows] = await pool.query(
          "SELECT datosadjuntostitulo FROM datosadjuntos WHERE iddatosadjuntos = ? AND xdatosadjuntosidespeciesvegetales = ?",
          [pdfId, idespeciesvegetales]
        );
        if (Array.isArray(pdfRows) && pdfRows.length > 0) {
          docTitle = (pdfRows[0] as any).datosadjuntostitulo;
        }
      }
      const cleanTitle = (docTitle ? slugify(docTitle) : '') || 'documento';
      const storagePath = `uploads/especies_pdfs_covers/${cleanTitle}_${pdfId}_${Date.now()}.jpg`;
      const { uploadToStorage } = await import('@/lib/firebase/storage');
      finalPortada = await uploadToStorage(watermarkedBuffer, storagePath, 'image/jpeg');
    }

    let updateQuery = "UPDATE datosadjuntos SET ";
    let updateParams: any[] = [];
    let setClauses: string[] = [];

    if (titulo !== undefined) {
      setClauses.push("datosadjuntostitulo = ?");
      updateParams.push(titulo || '');
    }
    if (resumen !== undefined) {
      setClauses.push("datosadjuntosresumen = ?");
      updateParams.push(resumen || '');
    }
    if (apuntes !== undefined) {
      setClauses.push("datosadjuntosapuntes = ?");
      updateParams.push(apuntes || '');
    }
    if (finalPortada !== undefined) {
      setClauses.push("datosadjuntosportada = ?");
      updateParams.push(finalPortada || null);
    }
    if (autores !== undefined) {
      setClauses.push("datosadjuntosautores = ?");
      updateParams.push(autores || '');
    }
    if (identificacion !== undefined) {
      setClauses.push("datosadjuntosidentificacion = ?");
      updateParams.push(identificacion || '');
    }
    if (activo !== undefined) {
      setClauses.push("datosadjuntosactivo = ?");
      updateParams.push(activo ? 1 : 0);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ success: true });
    }

    updateQuery += setClauses.join(', ');
    updateQuery += " WHERE iddatosadjuntos = ? AND xdatosadjuntosidespeciesvegetales = ? AND datosadjuntostipo = 'documento'";
    updateParams.push(pdfId, idespeciesvegetales);

    await pool.query(updateQuery, updateParams);

    return NextResponse.json({ success: true, portada: finalPortada });
  } catch (error: any) {
    console.error('[Especie PDFs PUT API] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const pdfId = searchParams.get('id');

  if (!pdfId) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  try {
    await pool.query(
      'UPDATE datosadjuntos SET datosadjuntosactivo = 0, datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ? AND xdatosadjuntosidespeciesvegetales = ?',
      [pdfId, resolvedParams.id]
    );
    return NextResponse.json({ success: true, message: 'PDF eliminado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
