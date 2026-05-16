import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/tareas/pending — El Motor de Tareas (On-the-Fly)
export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    // 1. Obtener todos los cultivos activos del usuario (que no estén finalizados/perdidos)
    const [cultivos]: any = await pool.query(`
      SELECT 
        c.idcultivos,
        c.xcultivosidvariedades,
        c.cultivosestado,
        c.cultivosfechainicio,
        c.cultivoscantidad,
        c.cultivosubicacion,
        c.cultivosnumerocoleccion,
        COALESCE(vu.variedadesnombre, vg.variedadesnombre) AS variedad_nombre,
        e.especiesnombre,
        e.especiesicono
      FROM cultivos c
      JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
      LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
      WHERE c.xcultivosidusuarios = ? 
        AND c.cultivosactivosino = 1 
        AND c.cultivosestado NOT IN ('finalizado', 'perdido')
    `, [user.id]);

    if (cultivos.length === 0) {
      return NextResponse.json({ tareas: [] });
    }

    const pendingTasks = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // 2. Iterar sobre cada cultivo para calcular sus tareas
    for (const cultivo of cultivos) {
      // 2.1 Obtener la pauta de labores para esta variedad y esta fase (estado del cultivo)
      const [pautas]: any = await pool.query(`
        SELECT 
          l.idlabores,
          l.laboresnombre,
          l.laboresicono,
          l.laborescolor,
          COALESCE(pu.laborespautafrecuenciadias, pg.laborespautafrecuenciadias) AS frecuenciadias,
          COALESCE(pu.laborespautaactivosino, pg.laborespautaactivosino) AS activa,
          COALESCE(pu.laborespautanotasia, pg.laborespautanotasia) AS notasia
        FROM laborespauta pg
        LEFT JOIN laborespauta pu 
          ON pg.xlaborespautaidlabores = pu.xlaborespautaidlabores 
          AND pu.xlaborespautaidusuarios = ?
          AND pu.xlaborespautafase = pg.laborespautafase
        JOIN labores l ON pg.xlaborespautaidlabores = l.idlabores
        WHERE pg.xlaborespautaidvariedades = (
            -- Buscar la pauta en la variedad origen (Gold)
            SELECT xvariedadesidvariedadorigen FROM variedades WHERE idvariedades = ?
          )
          AND pg.laborespautafase = ?
      `, [user.id, cultivo.xcultivosidvariedades, cultivo.cultivosestado]);

      // 2.2 Por cada labor activa en esta fase, calcular si toca hoy
      for (const pauta of pautas) {
        if (pauta.activa === 0 || !pauta.frecuenciadias) continue; // Si está desactivada o no tiene frecuencia, la saltamos

        // Buscar cuándo fue la última vez que se hizo esta labor para este cultivo
        const [ultimaLabor]: any = await pool.query(`
          SELECT laboresrealizadasfecha 
          FROM laboresrealizadas 
          WHERE xlaboresrealizadasidcultivos = ? AND xlaboresrealizadasidlabores = ?
          ORDER BY laboresrealizadasfecha DESC LIMIT 1
        `, [cultivo.idcultivos, pauta.idlabores]);

        // Fecha base: o bien la última vez que se hizo, o bien la fecha en que se inició el cultivo
        const fechaBase = ultimaLabor.length > 0 
          ? new Date(ultimaLabor[0].laboresrealizadasfecha) 
          : new Date(cultivo.cultivosfechainicio);
        
        fechaBase.setHours(0, 0, 0, 0);

        // Sumar la frecuencia de días
        const proximaFecha = new Date(fechaBase);
        proximaFecha.setDate(proximaFecha.getDate() + pauta.frecuenciadias);

        // Si la próxima fecha es HOY o YA PASÓ, es una tarea pendiente
        if (proximaFecha <= hoy) {
          
          // Calcular días de retraso
          const diffTime = Math.abs(hoy.getTime() - proximaFecha.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          const estado = proximaFecha.getTime() === hoy.getTime() ? 'hoy' : (proximaFecha < hoy ? 'retrasada' : 'futura');

          pendingTasks.push({
            idcultivo: cultivo.idcultivos,
            idlabor: pauta.idlabores,
            cultivoNombre: `${cultivo.especiesicono} ${cultivo.variedad_nombre}`,
            cultivoUbicacion: cultivo.cultivosubicacion,
            cultivoLote: cultivo.cultivosnumerocoleccion ? `#${cultivo.cultivosnumerocoleccion}` : null,
            laborNombre: pauta.laboresnombre,
            laborIcono: pauta.laboresicono,
            laborColor: pauta.laborescolor,
            fechaPrevista: proximaFecha.toISOString().split('T')[0],
            estado: estado,
            diasRetraso: estado === 'retrasada' ? diffDays : 0,
            notas: pauta.notasia
          });
        }
      }
    }

    // Ordenar las tareas: las más retrasadas primero
    pendingTasks.sort((a, b) => new Date(a.fechaPrevista).getTime() - new Date(b.fechaPrevista).getTime());

    return NextResponse.json({ tareas: pendingTasks });
  } catch (error: any) {
    console.error('Error calculando tareas pendientes:', error);
    return NextResponse.json({ error: 'Error interno en el motor de tareas' }, { status: 500 });
  }
}
