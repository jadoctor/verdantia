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
          v.idvariedadesvegetales AS variedadId,
          COALESCE(NULLIF(v.variedadesvegetalesnombre, ''), vg.variedadesvegetalesnombre) AS variedadNombre,
          e.especiesvegetalesnombre AS especieNombre,
          u.usuariosnombre AS usuarioNombre,
          u.usuariosemail AS usuarioEmail,
          u.idusuarios AS usuarioId,
          (SELECT da2.datosadjuntosruta 
           FROM datosadjuntos da2 
           WHERE da2.xdatosadjuntosidusuarios = u.idusuarios 
             AND da2.xdatosadjuntosidvariedadesvegetales IS NULL 
             AND da2.xdatosadjuntosidcultivos IS NULL 
             AND da2.xdatosadjuntosidcultivosavisos IS NULL 
             AND da2.datosadjuntosvalidado = 1 
             AND da2.datosadjuntosesprincipal = 1 
             AND da2.datosadjuntosactivo = 1 
           LIMIT 1) AS usuarioFotoPerfil,
          CASE 
            WHEN da.xdatosadjuntosidvariedadesvegetales IS NOT NULL THEN 'planta' 
            WHEN da.xdatosadjuntosidcultivos IS NOT NULL THEN 'labor'
            ELSE 'perfil' 
          END AS fotoTipo,
          c.cultivosnumerocoleccion AS cultivoNumero,
          c.cultivosfechainicio AS cultivoFecha
        FROM incidencias i
        JOIN datosadjuntos da ON i.incidenciasreferenciaid = da.iddatosadjuntos
        LEFT JOIN cultivos c ON da.xdatosadjuntosidcultivos = c.idcultivos
        LEFT JOIN variedadesvegetales v ON COALESCE(da.xdatosadjuntosidvariedadesvegetales, c.xcultivosidvariedadesvegetales) = v.idvariedadesvegetales
        LEFT JOIN variedadesvegetales vg ON v.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales
        LEFT JOIN especiesvegetales e ON COALESCE(vg.xvariedadesvegetalesidespeciesvegetales, v.xvariedadesvegetalesidespeciesvegetales) = e.idespeciesvegetales
        LEFT JOIN usuarios u ON i.xincidenciasidusuarios = u.idusuarios
        WHERE i.incidenciastipo = 'foto_rechazada' 
          AND i.incidenciasestado = 'apelada'
        ORDER BY i.incidenciasfechacreacion ASC
      `);
      return NextResponse.json({ pendientes: rows, tab: 'recursos' });
    }

    const [rows]: any = await pool.query(`
      SELECT pendientes.*,
        (SELECT da2.datosadjuntosruta 
         FROM datosadjuntos da2 
         WHERE da2.xdatosadjuntosidusuarios = pendientes.usuarioId 
           AND da2.xdatosadjuntosidvariedadesvegetales IS NULL 
           AND da2.xdatosadjuntosidcultivos IS NULL 
           AND da2.xdatosadjuntosidcultivosavisos IS NULL 
           AND da2.datosadjuntosvalidado = 1 
           AND da2.datosadjuntosesprincipal = 1 
           AND da2.datosadjuntosactivo = 1 
         LIMIT 1) AS usuarioFotoPerfil
      FROM (
        SELECT 
          da.iddatosadjuntos AS id,
          da.datosadjuntosruta AS ruta,
          da.datosadjuntosnombreoriginal AS nombreOriginal,
          da.datosadjuntosfechacreacion AS fecha,
          da.datosadjuntospesobytes AS peso,
          da.datosadjuntosvalidado AS validado,
          v.idvariedadesvegetales AS variedadId,
          COALESCE(NULLIF(v.variedadesvegetalesnombre, ''), vg.variedadesvegetalesnombre) AS variedadNombre,
          e.especiesvegetalesnombre AS especieNombre,
          u.usuariosnombre AS usuarioNombre,
          u.usuariosemail AS usuarioEmail,
          u.idusuarios AS usuarioId,
          'planta' AS fotoTipo,
          NULL AS cultivoId,
          NULL AS avisoId,
          da.datosadjuntosresumen AS resumen,
          NULL AS laborNombre,
          NULL AS cultivoNumero,
          NULL AS cultivoFecha
        FROM datosadjuntos da
        LEFT JOIN variedadesvegetales v ON da.xdatosadjuntosidvariedadesvegetales = v.idvariedadesvegetales
        LEFT JOIN variedadesvegetales vg ON v.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales
        LEFT JOIN especiesvegetales e ON (vg.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales OR v.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales)
        LEFT JOIN usuarios u ON v.xvariedadesvegetalesidusuarios = u.idusuarios
        WHERE da.datosadjuntosvalidado = 0 
          AND da.datosadjuntosactivo = 1
          AND da.datosadjuntostipo = 'imagen'
          AND da.xdatosadjuntosidvariedadesvegetales IS NOT NULL

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
          'perfil' AS fotoTipo,
          NULL AS cultivoId,
          NULL AS avisoId,
          da.datosadjuntosresumen AS resumen,
          NULL AS laborNombre,
          NULL AS cultivoNumero,
          NULL AS cultivoFecha
        FROM datosadjuntos da
        JOIN usuarios u ON da.xdatosadjuntosidusuarios = u.idusuarios
        WHERE da.datosadjuntosvalidado = 0
          AND da.datosadjuntosactivo = 1
          AND da.datosadjuntostipo = 'imagen'
          AND da.xdatosadjuntosidusuarios IS NOT NULL
          AND da.xdatosadjuntosidvariedadesvegetales IS NULL
          AND da.xdatosadjuntosidcultivos IS NULL
          AND da.xdatosadjuntosidcultivosavisos IS NULL

        UNION ALL

        SELECT
          da.iddatosadjuntos AS id,
          da.datosadjuntosruta AS ruta,
          da.datosadjuntosnombreoriginal AS nombreOriginal,
          da.datosadjuntosfechacreacion AS fecha,
          da.datosadjuntospesobytes AS peso,
          da.datosadjuntosvalidado AS validado,
          v.idvariedadesvegetales AS variedadId,
          COALESCE(NULLIF(v.variedadesvegetalesnombre, ''), vg.variedadesvegetalesnombre) AS variedadNombre,
          e.especiesvegetalesnombre AS especieNombre,
          u.usuariosnombre AS usuarioNombre,
          u.usuariosemail AS usuarioEmail,
          u.idusuarios AS usuarioId,
          'labor' AS fotoTipo,
          da.xdatosadjuntosidcultivos AS cultivoId,
          da.xdatosadjuntosidcultivosavisos AS avisoId,
          da.datosadjuntosresumen AS resumen,
          l.laboresnombre AS laborNombre,
          c.cultivosnumerocoleccion AS cultivoNumero,
          c.cultivosfechainicio AS cultivoFecha
        FROM datosadjuntos da
        JOIN cultivos c ON da.xdatosadjuntosidcultivos = c.idcultivos
        LEFT JOIN variedadesvegetales v ON c.xcultivosidvariedadesvegetales = v.idvariedadesvegetales
        LEFT JOIN variedadesvegetales vg ON v.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales
        LEFT JOIN especiesvegetales e ON (vg.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales OR v.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales)
        JOIN usuarios u ON da.xdatosadjuntosidusuarios = u.idusuarios
        LEFT JOIN cultivosavisos ca ON da.xdatosadjuntosidcultivosavisos = ca.idcultivosavisos
        LEFT JOIN laborespauta lp ON ca.xcultivosavisosidlaborespauta = lp.idlaborespauta
        LEFT JOIN labores l ON lp.xlaborespautaidlabores = l.idlabores
        WHERE da.datosadjuntosvalidado = 0
          AND da.datosadjuntosactivo = 1
          AND da.datosadjuntostipo = 'imagen'
          AND da.xdatosadjuntosidcultivos IS NOT NULL
      ) AS pendientes
      ORDER BY fecha DESC
    `);

    const rowsArr = rows as any[];
    const usersInRows = [...new Set(rowsArr.map(r => r.usuarioId).filter(Boolean))];
    const userStats: Record<number, any> = {};

    if (usersInRows.length > 0) {
      const placeholders = usersInRows.map(() => '?').join(',');
      const [statsRows]: any = await pool.query(`
        SELECT 
          u.idusuarios AS usuarioId,
          (SELECT s.suscripcionesnombre FROM usuariossuscripciones us JOIN suscripciones s ON s.idsuscripciones = us.xusuariossuscripcionesidsuscripciones WHERE us.xusuariossuscripcionesidusuarios = u.idusuarios AND us.usuariossuscripcionesestado IN ('activa','degradacion_fase1','degradacion_fase2','degradacion_fase3') ORDER BY us.idusuariossuscripciones DESC LIMIT 1) AS suscripcion_nombre,
          (SELECT COUNT(*) FROM variedadesvegetales v WHERE v.xvariedadesvegetalesidusuarios = u.idusuarios) AS variedades_asumidas,
          (SELECT COUNT(*) FROM cultivos c WHERE c.xcultivosidusuarios = u.idusuarios AND c.cultivosfechafinalizacion IS NULL AND c.cultivosactivosino = 1) AS cultivos_activos,
          (SELECT COUNT(*) FROM cultivos c WHERE c.xcultivosidusuarios = u.idusuarios AND (c.cultivosfechafinalizacion IS NOT NULL OR c.cultivosactivosino = 0)) AS cultivos_inactivos,
          (SELECT GROUP_CONCAT(CONCAT(COALESCE(e.especiesvegetalesnombre, 'Especie sin definir'), ' (', COALESCE(NULLIF(v.variedadesvegetalesnombre, ''), vg.variedadesvegetalesnombre, 'Sin nombre'), ')') SEPARATOR ', ') FROM variedadesvegetales v LEFT JOIN variedadesvegetales vg ON v.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales LEFT JOIN especiesvegetales e ON COALESCE(vg.xvariedadesvegetalesidespeciesvegetales, v.xvariedadesvegetalesidespeciesvegetales) = e.idespeciesvegetales WHERE v.xvariedadesvegetalesidusuarios = u.idusuarios) AS variedades_nombres,
          (SELECT GROUP_CONCAT(CONCAT(COALESCE(e.especiesvegetalesnombre, 'Especie sin definir'), ' (', COALESCE(NULLIF(v.variedadesvegetalesnombre, ''), vg.variedadesvegetalesnombre, 'Sin nombre'), ')') SEPARATOR ', ') FROM cultivos c JOIN variedadesvegetales v ON c.xcultivosidvariedadesvegetales = v.idvariedadesvegetales LEFT JOIN variedadesvegetales vg ON v.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales LEFT JOIN especiesvegetales e ON COALESCE(vg.xvariedadesvegetalesidespeciesvegetales, v.xvariedadesvegetalesidespeciesvegetales) = e.idespeciesvegetales WHERE c.xcultivosidusuarios = u.idusuarios AND c.cultivosfechafinalizacion IS NULL AND c.cultivosactivosino = 1) AS cultivos_activos_nombres,
          (SELECT GROUP_CONCAT(CONCAT(COALESCE(e.especiesvegetalesnombre, 'Especie sin definir'), ' (', COALESCE(NULLIF(v.variedadesvegetalesnombre, ''), vg.variedadesvegetalesnombre, 'Sin nombre'), ')') SEPARATOR ', ') FROM cultivos c JOIN variedadesvegetales v ON c.xcultivosidvariedadesvegetales = v.idvariedadesvegetales LEFT JOIN variedadesvegetales vg ON v.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales LEFT JOIN especiesvegetales e ON COALESCE(vg.xvariedadesvegetalesidespeciesvegetales, v.xvariedadesvegetalesidespeciesvegetales) = e.idespeciesvegetales WHERE c.xcultivosidusuarios = u.idusuarios AND (c.cultivosfechafinalizacion IS NOT NULL OR c.cultivosactivosino = 0)) AS cultivos_inactivos_nombres,
          (SELECT COUNT(*) FROM datosadjuntos da 
           LEFT JOIN variedadesvegetales v2 ON da.xdatosadjuntosidvariedadesvegetales = v2.idvariedadesvegetales
           LEFT JOIN cultivos c2 ON da.xdatosadjuntosidcultivos = c2.idcultivos
           WHERE (da.xdatosadjuntosidusuarios = u.idusuarios 
              OR v2.xvariedadesvegetalesidusuarios = u.idusuarios
              OR c2.xcultivosidusuarios = u.idusuarios)
             AND da.datosadjuntostipo = 'imagen') AS fotos_subidas,
          (SELECT COUNT(*) FROM datosadjuntos da 
           LEFT JOIN variedadesvegetales v3 ON da.xdatosadjuntosidvariedadesvegetales = v3.idvariedadesvegetales
           LEFT JOIN cultivos c3 ON da.xdatosadjuntosidcultivos = c3.idcultivos
           WHERE (da.xdatosadjuntosidusuarios = u.idusuarios 
              OR v3.xvariedadesvegetalesidusuarios = u.idusuarios
              OR c3.xcultivosidusuarios = u.idusuarios)
             AND da.datosadjuntosresultadovalidacion = 'rechazado') AS fotos_rechazadas,
          (SELECT GROUP_CONCAT(DISTINCT i.incidenciasmotivo SEPARATOR ' | ') 
           FROM incidencias i 
           JOIN datosadjuntos da ON i.incidenciasreferenciaid = da.iddatosadjuntos 
           LEFT JOIN variedadesvegetales v4 ON da.xdatosadjuntosidvariedadesvegetales = v4.idvariedadesvegetales
           LEFT JOIN cultivos c4 ON da.xdatosadjuntosidcultivos = c4.idcultivos
           WHERE (da.xdatosadjuntosidusuarios = u.idusuarios 
              OR v4.xvariedadesvegetalesidusuarios = u.idusuarios
              OR c4.xcultivosidusuarios = u.idusuarios)
             AND i.incidenciastipo = 'foto_rechazada' 
             AND i.incidenciasmotivo IS NOT NULL) AS motivos_rechazo
        FROM usuarios u
        WHERE u.idusuarios IN (${placeholders})
      `, usersInRows);

      for (const stat of statsRows) {
        userStats[stat.usuarioId] = stat;
      }
    }

    return NextResponse.json({ pendientes: rows, userStats });
  } catch (error: any) {
    console.error('[asuntos-pendientes GET]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Validar, rechazar o eliminar (inapropiado) una foto
export async function PUT(request: Request) {
  try {
    const { photoId, action, motivo, adminEmail, resumen } = await request.json();

    if (!photoId || !['validar', 'rechazar', 'eliminar_inapropiado', 'updateMeta'].includes(action)) {
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

    // ── UPDATE META ──────────────────────────────────────────
    if (action === 'updateMeta') {
      await pool.query(
        `UPDATE datosadjuntos SET datosadjuntosresumen = ? WHERE iddatosadjuntos = ?`,
        [resumen, photoId]
      );
      return NextResponse.json({ success: true });
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
        da.xdatosadjuntosidvariedadesvegetales AS variedadId,
        da.xdatosadjuntosidusuarios AS ownerId,
        v.xvariedadesvegetalesidusuarios AS usuarioId,
        u.usuariosemail AS usuarioEmail,
        u.idusuarios AS uid
      FROM datosadjuntos da
      LEFT JOIN variedadesvegetales v ON da.xdatosadjuntosidvariedadesvegetales = v.idvariedadesvegetales
      LEFT JOIN usuarios u ON u.idusuarios = COALESCE(v.xvariedadesvegetalesidusuarios, da.xdatosadjuntosidusuarios)
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
          const [check]: any = await pool.query('SELECT 1 FROM datosadjuntos WHERE xdatosadjuntosidvariedadesvegetales = ? AND datosadjuntosesprincipal = 1 AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen"', [foto.variedadId]);
          if (check.length === 0) {
            await pool.query(`UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE xdatosadjuntosidvariedadesvegetales = ? AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen" ORDER BY datosadjuntosorden ASC LIMIT 1`, [foto.variedadId]);
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
          const [check]: any = await pool.query('SELECT 1 FROM datosadjuntos WHERE xdatosadjuntosidvariedadesvegetales = ? AND datosadjuntosesprincipal = 1 AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen"', [foto.variedadId]);
          if (check.length === 0) {
            await pool.query(`UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE xdatosadjuntosidvariedadesvegetales = ? AND datosadjuntosactivo = 1 AND datosadjuntostipo = "imagen" ORDER BY datosadjuntosorden ASC LIMIT 1`, [foto.variedadId]);
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
