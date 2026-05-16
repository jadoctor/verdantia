import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = 'force-dynamic';

// GET: Listar fotos pendientes de validar o recursos (apelaciones)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'pendientes';

  try {
    if (tab === 'recursos') {
      const [rows]: any = await pool.query(`
        SELECT 
          i.idincidencias AS id,
          i.incidenciasfechacreacion AS fecha,
          i.incidenciasmotivo AS motivoRechazo,
          i.incidenciasnotas AS motivoRecurso,
          da.iddatosadjuntos AS photoId,
          da.datosadjuntosruta AS ruta,
          da.datosadjuntosnombreoriginal AS nombreOriginal,
          da.datosadjuntospesobytes AS peso,
          v.idvariedades AS variedadId,
          v.variedadesnombre AS variedadNombre,
          e.especiesnombre AS especieNombre,
          u.usuariosnombre AS usuarioNombre,
          u.usuariosemail AS usuarioEmail,
          u.idusuarios AS usuarioId,
          CASE WHEN da.xdatosadjuntosidvariedades IS NOT NULL THEN 'planta' ELSE 'perfil' END AS fotoTipo
        FROM incidencias i
        JOIN datosadjuntos da ON i.incidenciasreferenciaid = da.iddatosadjuntos
        LEFT JOIN variedades v ON da.xdatosadjuntosidvariedades = v.idvariedades
        LEFT JOIN especies e ON v.xvariedadesidespecies = e.idespecies
        LEFT JOIN usuarios u ON i.xincidenciasidusuarios = u.idusuarios
        WHERE i.incidenciastipo = 'foto_rechazada' 
          AND i.incidenciasestado = 'apelada'
        ORDER BY i.incidenciasfechacreacion ASC
      `);
      return NextResponse.json({ pendientes: rows, tab: 'recursos' });
    }

    const [rows]: any = await pool.query(`
      SELECT * FROM (
        SELECT 
          da.iddatosadjuntos AS id,
          da.datosadjuntosruta AS ruta,
          da.datosadjuntosnombreoriginal AS nombreOriginal,
          da.datosadjuntosfechacreacion AS fecha,
          da.datosadjuntospesobytes AS peso,
          da.datosadjuntosvalidado AS validado,
          v.idvariedades AS variedadId,
          v.variedadesnombre AS variedadNombre,
          e.especiesnombre AS especieNombre,
          u.usuariosnombre AS usuarioNombre,
          u.usuariosemail AS usuarioEmail,
          u.idusuarios AS usuarioId,
          'planta' AS fotoTipo
        FROM datosadjuntos da
        LEFT JOIN variedades v ON da.xdatosadjuntosidvariedades = v.idvariedades
        LEFT JOIN variedades vg ON v.xvariedadesidvariedadorigen = vg.idvariedades
        LEFT JOIN especies e ON (vg.xvariedadesidespecies = e.idespecies OR v.xvariedadesidespecies = e.idespecies)
        LEFT JOIN usuarios u ON v.xvariedadesidusuarios = u.idusuarios
        WHERE da.datosadjuntosvalidado = 0 
          AND da.datosadjuntosactivo = 1
          AND da.datosadjuntostipo = 'imagen'
          AND da.xdatosadjuntosidvariedades IS NOT NULL

        UNION ALL

        SELECT
          da.iddatosadjuntos AS id,
          da.datosadjuntosruta AS ruta,
          da.datosadjuntosnombreoriginal AS nombreOriginal,
          da.datosadjuntosfechacreacion AS fecha,
          da.datosadjuntospesobytes AS peso,
          da.datosadjuntosvalidado AS validado,
          NULL AS variedadId,
          NULL AS variedadNombre,
          'Foto de Perfil' AS especieNombre,
          u.usuariosnombre AS usuarioNombre,
          u.usuariosemail AS usuarioEmail,
          u.idusuarios AS usuarioId,
          'perfil' AS fotoTipo
        FROM datosadjuntos da
        JOIN usuarios u ON da.xdatosadjuntosidusuarios = u.idusuarios
        WHERE da.datosadjuntosvalidado = 0
          AND da.datosadjuntosactivo = 1
          AND da.datosadjuntostipo = 'imagen'
          AND da.xdatosadjuntosidusuarios IS NOT NULL
          AND da.xdatosadjuntosidvariedades IS NULL
      ) AS pendientes
      ORDER BY fecha DESC
    `);

    return NextResponse.json({ pendientes: rows });
  } catch (error: any) {
    console.error('[asuntos-pendientes GET]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Validar, rechazar o eliminar (inapropiado) una foto
export async function PUT(request: Request) {
  try {
    const { photoId, action, motivo, adminEmail } = await request.json();

    if (!photoId || !['validar', 'rechazar', 'eliminar_inapropiado'].includes(action)) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    // Obtener ID del admin a partir de su email
    let adminId = null;
    if (adminEmail) {
      const [adminRows]: any = await pool.query('SELECT idusuarios FROM usuarios WHERE usuariosemail = ? LIMIT 1', [adminEmail]);
      if (adminRows.length > 0) {
        adminId = adminRows[0].idusuarios;
      }
    }

    // ── VALIDAR ──────────────────────────────────────────────
    if (action === 'validar') {
      await pool.query(
        `UPDATE datosadjuntos 
         SET datosadjuntosvalidado = 1,
             datosadjuntosfechavalidacion = NOW(),
             datosadjuntosresultadovalidacion = 'aprobado',
             xdatosadjuntosidusuariovalidador = ?
         WHERE iddatosadjuntos = ?`,
        [adminId, photoId]
      );
      return NextResponse.json({ success: true });
    }

    // Obtener datos de la foto y propietario (usado por rechazar y eliminar)
    const [fotoRows]: any = await pool.query(`
      SELECT
        da.datosadjuntosruta,
        da.datosadjuntosnombreoriginal,
        da.xdatosadjuntosidvariedades AS variedadId,
        da.xdatosadjuntosidusuarios AS ownerId,
        v.xvariedadesidusuarios AS usuarioId,
        u.usuariosemail AS usuarioEmail,
        u.idusuarios AS uid
      FROM datosadjuntos da
      LEFT JOIN variedades v ON da.xdatosadjuntosidvariedades = v.idvariedades
      LEFT JOIN usuarios u ON u.idusuarios = COALESCE(v.xvariedadesidusuarios, da.xdatosadjuntosidusuarios)
      WHERE da.iddatosadjuntos = ?
    `, [photoId]);

    const foto = fotoRows[0] || null;

    // ── RECHAZAR ─────────────────────────────────────────────
    if (action === 'rechazar') {
      await pool.query(
        `UPDATE datosadjuntos 
         SET datosadjuntosactivo = 0, 
             datosadjuntosvalidado = 0,
             datosadjuntosesprincipal = 0,
             datosadjuntosfechavalidacion = NOW(),
             datosadjuntosresultadovalidacion = 'rechazado',
             xdatosadjuntosidusuariovalidador = ?
         WHERE iddatosadjuntos = ?`,
        [adminId, photoId]
      );

      if (foto) {
        await pool.query(`
          INSERT INTO incidencias (
            incidenciastipo, incidenciasestado,
            xincidenciasidusuarios, incidenciasusuarioemail,
            incidenciasadminemail, incidenciasreferenciaid,
            incidenciasreferenciatipo, incidenciasreferenciaruta, incidenciasmotivo
          ) VALUES ('foto_rechazada', 'abierta', ?, ?, ?, ?, 'datosadjuntos', ?, ?)
        `, [foto.usuarioId || null, foto.usuarioEmail || 'desconocido',
            adminEmail || null, photoId, foto.datosadjuntosruta || null, motivo || null]);

        // Enviar correo de notificación al usuario si tenemos su email
        if (foto.usuarioEmail && foto.usuarioEmail !== 'desconocido') {
          try {
            const resendResult = await resend.emails.send({
              from: 'Verdantia Moderación <admin@verdantia.life>',
              to: foto.usuarioEmail,
              subject: 'Verdantia - Una de tus fotos ha sido rechazada',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://verdantia.life/logo-verdantia.jpg" alt="Verdantia Logo" style="max-width: 150px; height: auto;" />
                  </div>
                  <h2 style="color: #e63946; text-align: center;">Atención: Foto Rechazada</h2>
                  <p>Hola,</p>
                  <p>Te escribimos desde el equipo de moderación de Verdantia para informarte que una de tus fotos ha sido <strong>rechazada</strong> tras la revisión manual de nuestros administradores.</p>
                  
                  <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
                    <strong>Motivo del rechazo:</strong><br/>
                    ${motivo || 'Incumplimiento de las normas de la comunidad.'}
                  </div>
                  
                  <p><strong>¿Qué debes hacer ahora?</strong></p>
                  <p>Por favor, accede a tu panel de usuario, dirígete a la galería correspondiente y <strong>elimina la foto rechazada</strong> de tu cuenta. Hasta que no la elimines, la foto seguirá apareciendo bloqueada en tu interfaz con un aviso rojo.</p>
                  
                  <p><strong>Derecho a réplica</strong></p>
                  <p>Si consideras que esto ha sido un error y tu foto cumple con todas las <a href="https://verdantia.life/politica-privacidad">normas de uso de Verdantia</a>, puedes ponerte en contacto con soporte respondiendo a este correo para que revisemos tu caso.</p>
                  
                  <p>Gracias por tu colaboración para mantener Verdantia como un espacio seguro para todos.</p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
                  <p style="font-size: 0.8rem; color: #888;">Este es un mensaje automático del sistema de moderación de Verdantia.</p>
                </div>
              `
            });
            if (resendResult.error) {
              console.error('[Asuntos Pendientes] Error de Resend:', resendResult.error);
            } else {
              console.log('[Asuntos Pendientes] Email de rechazo enviado a:', foto.usuarioEmail);
            }
          } catch (e) {
            console.error('[Asuntos Pendientes] Error enviando email de rechazo:', e);
          }
        }
      }

      // Fallback para elegir nueva foto principal si es necesario
      if (foto) {
        if (foto.variedadId) {
          const [check]: any = await pool.query('SELECT 1 FROM datosadjuntos WHERE xdatosadjuntosidvariedades = ? AND datosadjuntosesprincipal = 1 AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen"', [foto.variedadId]);
          if (check.length === 0) {
            await pool.query(`UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE xdatosadjuntosidvariedades = ? AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen" ORDER BY datosadjuntosorden ASC LIMIT 1`, [foto.variedadId]);
          }
        } else if (foto.ownerId) {
          const [check]: any = await pool.query('SELECT 1 FROM datosadjuntos WHERE xdatosadjuntosidusuarios = ? AND datosadjuntosesprincipal = 1 AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen"', [foto.ownerId]);
          if (check.length === 0) {
            await pool.query(`UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE xdatosadjuntosidusuarios = ? AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen" ORDER BY datosadjuntosorden ASC LIMIT 1`, [foto.ownerId]);
          }
        }
      }

      return NextResponse.json({ 
        success: true, 
        action: 'rechazar',
        emailEnviado: (foto?.usuarioEmail && foto.usuarioEmail !== 'desconocido') ? foto.usuarioEmail : null 
      });
    }

    // ── ELIMINAR_INAPROPIADO ──────────────────────────────────
    if (action === 'eliminar_inapropiado') {
      // 1. Marcar como 'sancionada' (placeholder visible para el usuario)
      await pool.query(
        `UPDATE datosadjuntos 
         SET datosadjuntosactivo = 0, 
             datosadjuntosvalidado = 0, 
             datosadjuntostipo = 'sancionada',
             datosadjuntosesprincipal = 0,
             datosadjuntosfechavalidacion = NOW(),
             datosadjuntosresultadovalidacion = 'sancionado',
             xdatosadjuntosidusuariovalidador = ?
         WHERE iddatosadjuntos = ?`,
        [adminId, photoId]
      );

      if (!foto) {
        return NextResponse.json({ success: true, sancion: null });
      }

      const usuarioId = foto.usuarioId || foto.uid;
      const usuarioEmail = foto.usuarioEmail || 'desconocido';

      // 2. Contar sanciones graves previas del usuario
      const [prevRows]: any = await pool.query(`
        SELECT COUNT(*) AS total FROM incidencias
        WHERE xincidenciasidusuarios = ?
          AND incidenciastipo = 'contenido_inapropiado'
          AND incidenciassancion IS NOT NULL
      `, [usuarioId]);

      const totalPrevias = prevRows[0]?.total || 0;

      // 3. Determinar nivel de sanción
      let sancion: 'advertencia_1' | 'advertencia_2' | 'baja';
      let notasAdmin: string;
      let suspensionFin: Date | null = null;

      if (totalPrevias === 0) {
        sancion = 'advertencia_1';
        notasAdmin = '1ª infracción grave. Advertencia formal emitida.';
      } else if (totalPrevias === 1) {
        sancion = 'advertencia_2';
        notasAdmin = '2ª infracción grave. Cuenta suspendida 7 días.';
        suspensionFin = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else {
        sancion = 'baja';
        notasAdmin = `3ª infracción grave (reincidencia múltiple). Baja definitiva aplicada.`;
      }

      // 4. Aplicar sanción en cuenta del usuario
      if (sancion === 'advertencia_2' && suspensionFin) {
        await pool.query(
          `UPDATE usuarios SET usuariosestadocuenta = 'suspendido', usuariossuspensionfin = ? WHERE idusuarios = ?`,
          [suspensionFin, usuarioId]
        );
      } else if (sancion === 'baja') {
        await pool.query(
          `UPDATE usuarios SET usuariosestadocuenta = 'baja' WHERE idusuarios = ?`,
          [usuarioId]
        );
      }

      // 5. Registrar incidencia con nivel de sanción
      await pool.query(`
        INSERT INTO incidencias (
          incidenciastipo, incidenciassancion, incidenciasestado,
          xincidenciasidusuarios, incidenciasusuarioemail,
          incidenciasadminemail, incidenciasreferenciaid,
          incidenciasreferenciatipo, incidenciasreferenciaruta,
          incidenciasmotivo, incidenciasnotas
        ) VALUES ('contenido_inapropiado', ?, 'resuelta', ?, ?, ?, ?, 'datosadjuntos', ?, ?, ?)
      `, [sancion, usuarioId, usuarioEmail, adminEmail || null,
          photoId, foto.datosadjuntosruta || null, motivo || null, notasAdmin]);

      // Fallback para elegir nueva foto principal si es necesario
      if (foto) {
        if (foto.variedadId) {
          const [check]: any = await pool.query('SELECT 1 FROM datosadjuntos WHERE xdatosadjuntosidvariedades = ? AND datosadjuntosesprincipal = 1 AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen"', [foto.variedadId]);
          if (check.length === 0) {
            await pool.query(`UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE xdatosadjuntosidvariedades = ? AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen" ORDER BY datosadjuntosorden ASC LIMIT 1`, [foto.variedadId]);
          }
        } else if (foto.ownerId) {
          const [check]: any = await pool.query('SELECT 1 FROM datosadjuntos WHERE xdatosadjuntosidusuarios = ? AND datosadjuntosesprincipal = 1 AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen"', [foto.ownerId]);
          if (check.length === 0) {
            await pool.query(`UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE xdatosadjuntosidusuarios = ? AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen" ORDER BY datosadjuntosorden ASC LIMIT 1`, [foto.ownerId]);
          }
        }
      }

      return NextResponse.json({
        success: true,
        action: 'eliminar_inapropiado',
        sancion,
        totalPrevias: totalPrevias + 1,
        suspensionFin: suspensionFin?.toISOString() || null
      });
    }

    return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
