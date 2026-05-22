import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: cultivoId } = await params;

  try {
    const [rows]: any = await pool.query(`
      SELECT 
        c.*,
        COALESCE(NULLIF(vu.variedadesnombre, ''), vg.variedadesnombre) AS variedad_nombre,
        e.especiesnombre,
        COALESCE(vu.variedadesdiasgerminacion, vg.variedadesdiasgerminacion, e.especiesdiasgerminacion) AS dias_germinacion,
        COALESCE(vu.variedadesdiashastatrasplante, vg.variedadesdiashastatrasplante, e.especiesdiashastatrasplante) AS dias_trasplante,
        COALESCE(vu.variedadesdiascrecimientofirme, vg.variedadesdiascrecimientofirme, e.especiesdiascrecimientofirme) AS dias_crecimiento,
        COALESCE(vu.variedadesdiashastafructificacion, vg.variedadesdiashastafructificacion, e.especiesdiashastafructificacion) AS dias_fructificacion,
        COALESCE(vu.variedadesdiashastarecoleccion, vg.variedadesdiashastarecoleccion, e.especiesdiashastarecoleccion) AS dias_recoleccion,
        COALESCE(vu.variedadesduraciontotal, vg.variedadesduraciontotal, e.especiesduraciontotal) AS duracion_total,
        COALESCE(
          (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidcultivos = c.idcultivos AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidvariedades = vu.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidvariedades = vg.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidespecies = e.idespecies AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1)
        ) AS foto
      FROM cultivos c
      JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
      LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
      WHERE c.idcultivos = ? AND c.xcultivosidusuarios = ?
    `, [cultivoId, user.id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado' }, { status: 404 });
    }

    const cultivo = rows[0];

    // Obtener las pautas de labores aplicables a este cultivo
    const [pautasRows]: any = await pool.query(`
      SELECT lp.*, l.laboresnombre, l.laboresicono, l.laborescolor, l.laboresdescripcion
      FROM laborespauta lp
      JOIN labores l ON lp.xlaborespautaidlabores = l.idlabores
      WHERE (
        lp.xlaborespautaidusuarios = ? OR 
        lp.xlaborespautaidvariedades = ? OR 
        lp.xlaborespautaidvariedades = (SELECT xvariedadesidvariedadorigen FROM variedades WHERE idvariedades = ?) OR
        lp.xlaborespautaidespecies = (SELECT xvariedadesidespecies FROM variedades WHERE idvariedades = ?)
      )
    `, [user.id, cultivo.xcultivosidvariedades, cultivo.xcultivosidvariedades, cultivo.xcultivosidvariedades]);

    // Lógica básica de herencia: si hay una pauta de usuario para una labor y fase, pisa a las demás
    const pautasMap = new Map();
    for (const p of pautasRows) {
      const key = `${p.xlaborespautaidlabores}-${p.laborespautafase}`;
      const current = pautasMap.get(key);
      
      const priority = p.xlaborespautaidusuarios ? 3 : p.xlaborespautaidvariedades ? 2 : 1;
      const currentPriority = current ? (current.xlaborespautaidusuarios ? 3 : current.xlaborespautaidvariedades ? 2 : 1) : 0;
      
      if (priority > currentPriority) {
        pautasMap.set(key, p);
      }
    }

    const pautas = Array.from(pautasMap.values()); // REMOVED .filter

    let avisosCompletados = [];
    try {
      const [avisosRows]: any = await pool.query(`
        SELECT idcultivosavisos as id, xcultivosavisosidlaborespauta as idpauta, cultivosavisosfase as fase, cultivosavisosfechaemision as fechaEmision, cultivosavisosfecharespuesta as fechaRealizacion
        FROM cultivosavisos
        WHERE xcultivosavisosidcultivos = ?
      `, [cultivoId]);
      avisosCompletados = avisosRows;
    } catch (err) {
      console.warn('La tabla cultivosavisos aún no existe o hay un error. Devolviendo array vacío.');
    }

    let fotosLabores = [];
    try {
      const [fotosRows]: any = await pool.query(`
        SELECT iddatosadjuntos as id, datosadjuntosruta as ruta, xdatosadjuntosidcultivosavisos as idAviso, datosadjuntosresumen as resumen, datosadjuntosesprincipal as esPrincipal
        FROM datosadjuntos
        WHERE xdatosadjuntosidcultivos = ? AND datosadjuntosactivo = 1
      `, [cultivoId]);
      fotosLabores = fotosRows;
    } catch (err) {
      console.warn('Error fetching fotosLabores:', err);
    }

    return NextResponse.json({ cultivo, pautas, avisosCompletados, fotosLabores });
  } catch (error: any) {
    console.error('Error fetching cultivo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: cultivoId } = await params;

  try {
    // Verificar que el cultivo pertenezca al usuario
    const [rows]: any = await pool.query(
      'SELECT idcultivos FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?',
      [cultivoId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado o no autorizado' }, { status: 404 });
    }

    // Hard delete (borrado físico). Fallará si tiene semillas generadas (FK constraint)
    try {
      await pool.query(
        'DELETE FROM cultivos WHERE idcultivos = ?',
        [cultivoId]
      );
    } catch (e: any) {
      if (e.code === 'ER_ROW_IS_REFERENCED_2') {
        return NextResponse.json({ error: 'No se puede borrar el cultivo porque ha generado semillas o tiene registros asociados.' }, { status: 400 });
      }
      throw e;
    }

    return NextResponse.json({ success: true, message: 'Cultivo eliminado correctamente' });
  } catch (error: any) {
    console.error('Error eliminando cultivo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: cultivoId } = await params;

  try {
    const body = await request.json();
    
    // Si la request es para actualizar las alertas ignoradas
    if (body.action === 'toggle_alert') {
      const pautaId = body.pautaId;
      if (!pautaId) return NextResponse.json({ error: 'Falta pautaId' }, { status: 400 });

      // Obtener el estado actual
      const [rows]: any = await pool.query('SELECT cultivosalertas_ignoradas FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?', [cultivoId, user.id]);
      if (rows.length === 0) return NextResponse.json({ error: 'Cultivo no encontrado' }, { status: 404 });

      let ignoradas = [];
      try {
        if (rows[0].cultivosalertas_ignoradas) {
          ignoradas = typeof rows[0].cultivosalertas_ignoradas === 'string' ? JSON.parse(rows[0].cultivosalertas_ignoradas) : rows[0].cultivosalertas_ignoradas;
        }
      } catch (e) { ignoradas = []; }

      // Toggle
      if (ignoradas.includes(pautaId)) {
        ignoradas = ignoradas.filter((id: number) => id !== pautaId);
      } else {
        ignoradas.push(pautaId);
      }

      await pool.query('UPDATE cultivos SET cultivosalertas_ignoradas = ? WHERE idcultivos = ?', [JSON.stringify(ignoradas), cultivoId]);
      return NextResponse.json({ success: true, ignoradas });
    }

    if (body.action === 'toggle_force') {
      const pautaId = body.pautaId;
      if (!pautaId) return NextResponse.json({ error: 'Falta pautaId' }, { status: 400 });

      const [rows]: any = await pool.query('SELECT cultivosalertas_forzadas FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?', [cultivoId, user.id]);
      if (rows.length === 0) return NextResponse.json({ error: 'Cultivo no encontrado' }, { status: 404 });

      let forzadas = [];
      try {
        if (rows[0].cultivosalertas_forzadas) {
          forzadas = typeof rows[0].cultivosalertas_forzadas === 'string' ? JSON.parse(rows[0].cultivosalertas_forzadas) : rows[0].cultivosalertas_forzadas;
        }
      } catch (e) { forzadas = []; }

      // Toggle
      if (forzadas.includes(pautaId)) {
        forzadas = forzadas.filter((id: number) => id !== pautaId);
      } else {
        forzadas.push(pautaId);
      }

      await pool.query('UPDATE cultivos SET cultivosalertas_forzadas = ? WHERE idcultivos = ?', [JSON.stringify(forzadas), cultivoId]);
      return NextResponse.json({ success: true, forzadas });
    }

    if (body.action === 'reset_alerts') {
      // 1. Limpiar excepciones locales del cultivo
      await pool.query('UPDATE cultivos SET cultivosalertas_ignoradas = ?, cultivosalertas_forzadas = ? WHERE idcultivos = ?', ['[]', '[]', cultivoId]);
      
      // 2. Eliminar cualquier override global inactivo de esta variedad para este usuario
      // Obtenemos la variedad del cultivo
      const [cultivos]: any = await pool.query('SELECT xcultivosidvariedades FROM cultivos WHERE idcultivos = ?', [cultivoId]);
      if (cultivos.length > 0) {
        await pool.query('DELETE FROM laborespauta WHERE xlaborespautaidusuarios = ? AND xlaborespautaidvariedades = ?', [user.id, cultivos[0].xcultivosidvariedades]);
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Verificar que el cultivo pertenezca al usuario para otras actualizaciones
    const [rows]: any = await pool.query(
      'SELECT idcultivos FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?',
      [cultivoId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado o no autorizado' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'cultivosestado',
      'cultivoscantidad',
      'cultivosubicacion',
      'cultivosfechainicio',
      'cultivosfechagerminacion',
      'cultivosfechatrasplante',
      'cultivosfechacrecimiento',
      'cultivosfechafructificacion',
      'cultivosfecharecoleccion',
      'cultivosfechafinalizacion',
      'cultivosobservaciones',
      'cultivosmetodo'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field] || null); // Convert empty strings to null for dates
      }
    });

    if (updates.length > 0) {
      values.push(cultivoId);
      await pool.query(
        `UPDATE cultivos SET ${updates.join(', ')} WHERE idcultivos = ?`,
        values
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error actualizando cultivo:', error);
    // Force turbopack to recompile and clear the stale error
    console.log("Clearing NextJS cache for this file");
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

