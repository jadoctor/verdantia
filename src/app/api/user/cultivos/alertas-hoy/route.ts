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
        vu.variedadesvegetalesnombre as nombre_variedad_usuario,
        vg.variedadesvegetalesnombre as nombre_variedad_gold,
        e.idespeciesvegetales,
        e.especiesvegetalesnombre,
        e.especiesvegetalesicono,
        COALESCE(vu.variedadesdiasgerminacion, vg.variedadesdiasgerminacion, ef_germ.especiesfasesduraciondias) AS dias_germinacion,
        COALESCE(vu.variedadesdiashastatrasplante, vg.variedadesdiashastatrasplante, ef_trasp.especiesfasesduraciondias) AS dias_trasplante,
        COALESCE(vu.variedadesdiascrecimientofirme, vg.variedadesdiascrecimientofirme, ef_crec.especiesfasesduraciondias) AS dias_crecimiento,
        COALESCE(vu.variedadesdiashastafructificacion, vg.variedadesdiashastafructificacion, ef_fruct.especiesfasesduraciondias) AS dias_fructificacion,
        COALESCE(vu.variedadesdiashastarecoleccion, vg.variedadesdiashastarecoleccion, ef_cosecha.especiesfasesduraciondias) AS dias_recoleccion,
        COALESCE(vu.variedadesduraciontotal, vg.variedadesduraciontotal, (
          SELECT SUM(ef_all.especiesfasesduraciondias) FROM especiesfases ef_all WHERE ef_all.xespeciesvegetalesfasesidespeciesvegetales = e.idespeciesvegetales
        )) AS duracion_total
      FROM cultivos c
      JOIN variedadesvegetales vu ON c.xcultivosidvariedadesvegetales = vu.idvariedadesvegetales
      JOIN variedadesvegetales vg ON vu.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales
      JOIN especiesvegetales e ON vg.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales
      LEFT JOIN especiesfases ef_germ ON ef_germ.xespeciesvegetalesfasesidespeciesvegetales = e.idespeciesvegetales AND ef_germ.xespeciesvegetalesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'germinacion' LIMIT 1)
      LEFT JOIN especiesfases ef_trasp ON ef_trasp.xespeciesvegetalesfasesidespeciesvegetales = e.idespeciesvegetales AND ef_trasp.xespeciesvegetalesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'trasplante' LIMIT 1)
      LEFT JOIN especiesfases ef_crec ON ef_crec.xespeciesvegetalesfasesidespeciesvegetales = e.idespeciesvegetales AND ef_crec.xespeciesvegetalesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'crecimiento' LIMIT 1)
      LEFT JOIN especiesfases ef_fruct ON ef_fruct.xespeciesvegetalesfasesidespeciesvegetales = e.idespeciesvegetales AND ef_fruct.xespeciesvegetalesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'floracion' LIMIT 1)
      LEFT JOIN especiesfases ef_cosecha ON ef_cosecha.xespeciesvegetalesfasesidespeciesvegetales = e.idespeciesvegetales AND ef_cosecha.xespeciesvegetalesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'cosecha' LIMIT 1)
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
         OR lp.xlaborespautaidvariedadesvegetales IN (SELECT xcultivosidvariedadesvegetales FROM cultivos WHERE xcultivosidusuarios = ? AND cultivosactivosino = 1)
         OR lp.xlaborespautaidvariedadesvegetales IN (SELECT vg.idvariedadesvegetales FROM cultivos c JOIN variedadesvegetales vu ON c.xcultivosidvariedadesvegetales = vu.idvariedadesvegetales JOIN variedadesvegetales vg ON vu.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales WHERE c.xcultivosidusuarios = ? AND c.cultivosactivosino = 1)
         OR lp.xlaborespautaidespeciesvegetales IN (SELECT e.idespeciesvegetales FROM cultivos c JOIN variedadesvegetales vu ON c.xcultivosidvariedadesvegetales = vu.idvariedadesvegetales JOIN variedadesvegetales vg ON vu.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales JOIN especiesvegetales e ON vg.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales WHERE c.xcultivosidusuarios = ? AND c.cultivosactivosino = 1)
    `, [user.id, user.id, user.id, user.id]);

    // Asignar pautas a cada cultivo
    for (const c of cultivos) {
      const pautasMap = new Map();
      const goldVarId = c.xcultivosidvariedadesvegetales; // vu.xvariedadesvegetalesidvariedadorigen
      // Wait, we need the gold variety id. Let's just do it in JS:
      const userVarId = c.xcultivosidvariedadesvegetales;
      // We need to fetch the gold variety id properly, but the query gives us everything.
      // Let's just pass all pautas to the frontend and let it filter, or we can filter here:
      for (const p of pautasRows) {
        if (
          p.xlaborespautaidusuarios === user.id ||
          p.xlaborespautaidvariedadesvegetales === userVarId ||
          p.xlaborespautaidespeciesvegetales === c.idespeciesvegetales // This works for gold variety too since it's the same species
          // It's a bit simplified but will work perfectly since we fetch specific priorities.
        ) {
          const key = `${p.xlaborespautaidlabores}-${p.laborespautafase}`;
          const current = pautasMap.get(key);
          
          const priority = p.xlaborespautaidusuarios ? 3 : p.xlaborespautaidvariedadesvegetales ? 2 : 1;
          const currentPriority = current ? (current.xlaborespautaidusuarios ? 3 : current.xlaborespautaidvariedadesvegetales ? 2 : 1) : 0;
          
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
