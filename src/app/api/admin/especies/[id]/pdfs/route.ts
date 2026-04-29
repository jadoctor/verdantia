import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { uploadToStorage } from '@/lib/firebase/storage';
import { getUserByEmail } from '@/lib/auth';

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

  const idespecies = resolvedParams.id;

  try {
    const [rows] = await pool.query(
      `SELECT iddatosadjuntos, datosadjuntosruta, datosadjuntosnombreoriginal, datosadjuntostitulo, datosadjuntosresumen, datosadjuntosapuntes, datosadjuntosportada
       FROM datosadjuntos 
       WHERE xdatosadjuntosidespecies = ? 
       AND datosadjuntostipo = 'documento' 
       AND datosadjuntosactivo = 1 
       ORDER BY datosadjuntosorden ASC`,
      [idespecies]
    );

    const pdfs = (rows as any[]).map(r => ({
      id: r.iddatosadjuntos,
      ruta: r.datosadjuntosruta,
      nombreOriginal: r.datosadjuntosnombreoriginal,
      titulo: r.datosadjuntostitulo || '',
      resumen: r.datosadjuntosresumen || '',
      apuntes: r.datosadjuntosapuntes || '',
      portada: r.datosadjuntosportada || null
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

  const idespecies = resolvedParams.id;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 });
    }

    const filename = `especie_${idespecies}_${Date.now()}.pdf`;
    const storagePath = `uploads/especies_pdfs/${filename}`;

    const bytes = await file.arrayBuffer();
    const publicUrl = await uploadToStorage(
      Buffer.from(bytes),
      storagePath,
      'application/pdf'
    );

    let generatedTitle = '';
    let generatedSummary = '';
    let generatedApuntes = '';
    try {
      const base64Pdf = Buffer.from(bytes).toString('base64');
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && bytes.byteLength < 10 * 1024 * 1024) { // Only process if < 10MB to avoid timeouts/limits
        const payload = {
          contents: [{
            parts: [
              { text: `Analiza este documento PDF sobre la especie agrícola. Eres un experto agrónomo. Devuelve EXCLUSIVAMENTE un JSON con tres propiedades: "nombre" (nombre súper corto del documento que aparecerá en el visor, ideal 3-4 palabras, máximo 40 caracteres), "resumen" (resumen corto de 1-2 líneas), y "apuntes" (un resumen técnico muy detallado de varios párrafos o viñetas estructuradas con datos concretos, plagas, metodologías y consejos vitales para el agricultor).` },
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
        }
      }
    } catch (e) {
      console.error('[Gemini PDF Summary Error]:', e);
    }

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM datosadjuntos WHERE xdatosadjuntosidespecies = ? AND datosadjuntostipo = 'documento' AND datosadjuntosactivo = 1",
      [idespecies]
    );
    const total = (countResult as any[])[0].total;

    const fileSize = bytes.byteLength;

    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidespecies,
        datosadjuntospesobytes, datosadjuntostitulo, datosadjuntosresumen, datosadjuntosapuntes
      ) VALUES ('documento', 'application/pdf', ?, ?, 0, ?, 1, NOW(), ?, ?, ?, ?, ?)`,
      [file.name, storagePath, total + 1, idespecies, fileSize, generatedTitle, generatedSummary, generatedApuntes]
    );

    return NextResponse.json({
      success: true,
      pdf: {
        id: (result as any).insertId,
        ruta: storagePath,
        nombreOriginal: file.name,
        titulo: generatedTitle,
        resumen: generatedSummary,
        apuntes: generatedApuntes
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

  const idespecies = resolvedParams.id;

  try {
    const { pdfId, titulo, resumen, apuntes, portada, base64Cover } = await request.json();

    if (!pdfId) {
      return NextResponse.json({ error: 'ID de PDF requerido' }, { status: 400 });
    }

    let finalPortada = portada;
    if (base64Cover) {
      const buffer = Buffer.from(base64Cover.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const storagePath = `uploads/especies_pdfs_covers/cover_${idespecies}_${pdfId}_${Date.now()}.jpg`;
      finalPortada = await uploadToStorage(buffer, storagePath, 'image/jpeg');
    }

    let updateQuery = `UPDATE datosadjuntos SET datosadjuntostitulo = ?, datosadjuntosresumen = ?, datosadjuntosapuntes = ?`;
    let updateParams = [titulo || '', resumen || '', apuntes || ''];

    if (finalPortada !== undefined) {
      updateQuery += `, datosadjuntosportada = ?`;
      updateParams.push(finalPortada);
    }

    updateQuery += ` WHERE iddatosadjuntos = ? AND xdatosadjuntosidespecies = ? AND datosadjuntostipo = 'documento'`;
    updateParams.push(pdfId, idespecies);

    await pool.query(updateQuery, updateParams);

    return NextResponse.json({ success: true });
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
  const pdfId = searchParams.get('pdfId');

  if (!pdfId) return NextResponse.json({ error: 'pdfId requerido' }, { status: 400 });

  try {
    await pool.query(
      'UPDATE datosadjuntos SET datosadjuntosactivo = 0, datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ? AND xdatosadjuntosidespecies = ?',
      [pdfId, resolvedParams.id]
    );
    return NextResponse.json({ success: true, message: 'PDF eliminado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
