import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// GET /api/admin/incidencias — Listar incidencias (con filtros opcionales)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo');
  const estado = searchParams.get('estado');
  const email = searchParams.get('email');

  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (tipo) { where += ' AND i.incidenciastipo = ?'; params.push(tipo); }
    if (estado) { where += ' AND i.incidenciasestado = ?'; params.push(estado); }
    if (email) { where += ' AND i.incidenciasusuarioemail = ?'; params.push(email); }

    const [rows]: any = await pool.query(`
      SELECT
        i.*,
        u.usuariosnombre AS usuarioNombre
      FROM incidencias i
      LEFT JOIN usuarios u ON i.xincidenciasidusuarios = u.idusuarios
      ${where}
      ORDER BY i.incidenciasfechacreacion DESC
      LIMIT 200
    `, params);

    return NextResponse.json({ incidencias: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/incidencias — Crear nueva incidencia
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tipo,
      usuarioId,
      usuarioEmail,
      adminEmail,
      referenciaId,
      referenciaTipo,
      referenciaRuta,
      motivo,
      notas,
      estado = 'resuelta'
    } = body;

    if (!tipo || !usuarioEmail) {
      return NextResponse.json({ error: 'tipo y usuarioEmail son obligatorios' }, { status: 400 });
    }

    const [result]: any = await pool.query(`
      INSERT INTO incidencias (
        incidenciastipo,
        incidenciasestado,
        xincidenciasidusuarios,
        incidenciasusuarioemail,
        incidenciasadminemail,
        incidenciasreferenciaid,
        incidenciasreferenciatipo,
        incidenciasreferenciaruta,
        incidenciasmotivo,
        incidenciasnotas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [tipo, estado, usuarioId || null, usuarioEmail, adminEmail || null,
        referenciaId || null, referenciaTipo || null, referenciaRuta || null,
        motivo || null, notas || null]);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/incidencias — Actualizar estado / notas / recurso
export async function PUT(request: Request) {
  try {
    const { id, estado, notas, motivo, rejectionEmailTo, rejectionReason } = await request.json();

    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const fields: string[] = [];
    const params: any[] = [];

    if (estado) { fields.push('incidenciasestado = ?'); params.push(estado); }
    if (notas !== undefined) { fields.push('incidenciasnotas = ?'); params.push(notas); }
    if (motivo !== undefined) { fields.push('incidenciasmotivo = ?'); params.push(motivo); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
    }

    params.push(id);
    await pool.query(
      `UPDATE incidencias SET ${fields.join(', ')} WHERE idincidencias = ?`,
      params
    );


    if (rejectionEmailTo && rejectionReason) {
      try {
        await resend.emails.send({
          from: 'Verdantia Moderación <admin@verdantia.life>',
          to: rejectionEmailTo,
          subject: 'Verdantia - Resolución definitiva de tu alegación',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #e2e8f0; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://verdantia.life/logo-verdantia.jpg" alt="Verdantia Logo" style="max-width: 150px; height: auto;" />
              </div>
              <h2 style="color: #e63946; text-align: center;">Resolución Definitiva de Alegación</h2>
              <p>Hola,</p>
              <p>Te escribimos desde el equipo de moderación de Verdantia en respuesta a la alegación que presentaste sobre el rechazo de tu fotografía.</p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 15px; margin: 20px 0;">
                <h4 style="margin-top: 0;">Cronología del proceso:</h4>
                <ol style="margin-bottom: 0; padding-left: 20px;">
                  <li><strong>Rechazo inicial:</strong> Tu foto fue identificada como no apta para la plataforma.</li>
                  <li><strong>Tu alegación:</strong> Recibimos y leímos atentamente tu justificación.</li>
                  <li><strong>Resolución final:</strong> Tras una revisión en profundidad por parte de un administrador, hemos decidido <strong>desestimar tu recurso</strong>.</li>
                </ol>
              </div>

              <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
                <strong>Motivo técnico de la resolución:</strong><br/>
                ${rejectionReason}
              </div>
              
              <p><strong>¿Qué debes hacer ahora?</strong></p>
              <p>Esta decisión es firme e inapelable. Para poder continuar utilizando tu panel de control sin bloqueos, debes iniciar sesión, dirigirte al Dashboard y <strong>eliminar permanentemente la fotografía rechazada</strong> o sustituirla por otra que cumpla estrictamente con la normativa.</p>
              
              <p>Agradecemos tu comprensión y tu colaboración para hacer de Verdantia una plataforma de calidad.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
              <p style="font-size: 0.8rem; color: #888;">Este es un mensaje automático del sistema de moderación de Verdantia.</p>
            </div>
          `
        });
        console.log('[Incidencias API] Email de rechazo de alegación enviado a:', rejectionEmailTo);
      } catch (e) {
        console.error('[Incidencias API] Error enviando email de rechazo de alegación:', e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
