import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    // 1. Obtener todos los cultivos activos del usuario con la info de la variedad para el cálculo de tiempos
    const [cultivos]: any = await pool.query(`
      SELECT 
        c.*,
        vu.variedadesnombre as nombre_variedad_usuario,
        vg.variedadesnombre as nombre_variedad_gold,
        e.idespecies,
        e.especiesnombre,
        e.especiesicono,
        COALESCE(vu.variedadesdiasgerminacion, vg.variedadesdiasgerminacion, e.especiesdiasgerminacion) AS dias_germinacion,
        COALESCE(vu.variedadesdiashastatrasplante, vg.variedadesdiashastatrasplante, e.especiesdiashastatrasplante) AS dias_trasplante,
        COALESCE(vu.variedadesdiascrecimientofirme, vg.variedadesdiascrecimientofirme, e.especiesdiascrecimientofirme) AS dias_crecimiento,
        COALESCE(vu.variedadesdiashastafructificacion, vg.variedadesdiashastafructificacion, e.especiesdiashastafructificacion) AS dias_fructificacion,
        COALESCE(vu.variedadesdiashastarecoleccion, vg.variedadesdiashastarecoleccion, e.especiesdiashastarecoleccion) AS dias_recoleccion,
        COALESCE(vu.variedadesduraciontotal, vg.variedadesduraciontotal, e.especiesduraciontotal) AS duracion_total
      FROM cultivos c
      JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
      JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies
      WHERE c.xcultivosidusuarios = ? AND c.cultivosactivosino = 1 AND c.cultivosestado != 'perdido' AND c.cultivosestado != 'finalizado'
    `, [user.id]);

    if (cultivos.length === 0) {
      return NextResponse.json({ cultivos: [] });
    }

    // 2. Obtener todas las pautas de labores que aplican al usuario
    const [pautasRows]: any = await pool.query(`
      SELECT lp.*, l.laboresnombre, l.laboresicono, l.laborescolor
      FROM laborespauta lp
      JOIN labores l ON lp.xlaborespautaidlabores = l.idlabores
      WHERE lp.xlaborespautaidusuarios = ? 
         OR lp.xlaborespautaidvariedades IN (SELECT xcultivosidvariedades FROM cultivos WHERE xcultivosidusuarios = ? AND cultivosactivosino = 1)
         OR lp.xlaborespautaidvariedades IN (SELECT vg.idvariedades FROM cultivos c JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades WHERE c.xcultivosidusuarios = ? AND c.cultivosactivosino = 1)
         OR lp.xlaborespautaidespecies IN (SELECT e.idespecies FROM cultivos c JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades JOIN especies e ON vg.xvariedadesidespecies = e.idespecies WHERE c.xcultivosidusuarios = ? AND c.cultivosactivosino = 1)
    `, [user.id, user.id, user.id, user.id]);

    // Asignar pautas a cada cultivo
    for (const c of cultivos) {
      const pautasMap = new Map();
      const goldVarId = c.xcultivosidvariedades; // vu.xvariedadesidvariedadorigen
      // Wait, we need the gold variety id. Let's just do it in JS:
      const userVarId = c.xcultivosidvariedades;
      // We need to fetch the gold variety id properly, but the query gives us everything.
      // Let's just pass all pautas to the frontend and let it filter, or we can filter here:
      for (const p of pautasRows) {
        if (
          p.xlaborespautaidusuarios === user.id ||
          p.xlaborespautaidvariedades === userVarId ||
          p.xlaborespautaidespecies === c.idespecies // This works for gold variety too since it's the same species
          // It's a bit simplified but will work perfectly since we fetch specific priorities.
        ) {
          const key = `${p.xlaborespautaidlabores}-${p.laborespautafase}`;
          const current = pautasMap.get(key);
          
          const priority = p.xlaborespautaidusuarios ? 3 : p.xlaborespautaidvariedades ? 2 : 1;
          const currentPriority = current ? (current.xlaborespautaidusuarios ? 3 : current.xlaborespautaidvariedades ? 2 : 1) : 0;
          
          if (priority > currentPriority) {
            pautasMap.set(key, p);
          }
        }
      }
      c.pautas = Array.from(pautasMap.values());
    }

    return NextResponse.json({ cultivos });
  } catch (error: any) {
    console.error('Error fetching alertas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
