import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/plantas — Listar plantas (variedades) del usuario
export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    // Cada planta del usuario con herencia COALESCE para el listado
    const [plantas] = await pool.query(`
      SELECT 
        vu.idvariedadesvegetales,
        vu.xvariedadesvegetalesidvariedadorigen,
        vu.xvariedadesvegetalesidespeciesvegetales,
        COALESCE(vu.variedadesvegetalesvisibilidadsino, 1) AS variedadesvegetalesvisibilidadsino,
        COALESCE(NULLIF(vu.variedadesvegetalesnombre, ''), vg.variedadesvegetalesnombre) AS nombre,
        COALESCE(NULLIF(vu.variedadesdescripcion, ''), vg.variedadesdescripcion, e.especiesvegetalesdescripcion) AS descripcion,
        COALESCE(vu.variedadesicono, vg.variedadesicono, e.especiesvegetalesicono) AS icono,
        COALESCE(vu.variedadesdificultad, vg.variedadesdificultad, e.especiesvegetalesdificultad) AS dificultad,
        e.especiesvegetalesnombre,
        e.especiesvegetalesicono,
        COALESCE(vu.variedadespeso1000semillas, vg.variedadespeso1000semillas, e.especiesvegetalespeso1000semillas) AS especiespeso1000semillas,
        vg.variedadesvegetalesnombre AS nombre_gold,
        vg.variedadesvegetalesesgenerica AS es_generica,
        vg.variedadesvegetalesvisibilidadsino AS origen_visibilidad,
        -- Foto: primero la del usuario, luego la de la variedad gold, luego la de la especie
        COALESCE(
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedadesvegetales = vu.idvariedadesvegetales AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedadesvegetales = vg.idvariedadesvegetales AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidespeciesvegetales = e.idespeciesvegetales AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1)
        ) AS foto,
        (
          (vu.variedadesvegetalesnombre IS NOT NULL AND vu.variedadesvegetalesnombre != '') +
          (vu.variedadesdescripcion IS NOT NULL AND vu.variedadesdescripcion != '') +
          (vu.variedadestemperaturaminima IS NOT NULL) +
          (vu.variedadestemperaturaoptima IS NOT NULL) +
          (vu.variedadestemperaturamaxima IS NOT NULL) +
          (vu.variedadescolor IS NOT NULL AND vu.variedadescolor != '') +
          (vu.variedadestamano IS NOT NULL AND vu.variedadestamano != '')
        ) AS campos_personalizados,
        COALESCE(vu.variedadessemillerodesde, vg.variedadessemillerodesde, e.especiesvegetalesfechasemillerodesde) AS semillerodesde,
        COALESCE(vu.variedadessemillerohasta, vg.variedadessemillerohasta, e.especiesvegetalesfechasemillerohasta) AS semillerohasta,
        COALESCE(vu.variedadessiembradirectadesde, vg.variedadessiembradirectadesde, e.especiesvegetalesfechasiembradirectadesde) AS siembradirectadesde,
        COALESCE(vu.variedadessiembradirectahasta, vg.variedadessiembradirectahasta, e.especiesvegetalesfechasiembradirectahasta) AS siembradirectahasta,
        COALESCE(vu.variedadestrasplantedesde, vg.variedadestrasplantedesde, e.especiesvegetalestrasplantedesde) AS trasplantedesde,
        COALESCE(vu.variedadestrasplantehasta, vg.variedadestrasplantehasta, e.especiesvegetalestrasplantehasta) AS trasplantehasta,
        COALESCE(vu.variedadestiposiembra, vg.variedadestiposiembra, e.especiesvegetalestiposiembra) AS tiposiembra,
        (
          SELECT COUNT(*) FROM semillas s 
          WHERE (s.xsemillasidvariedadesvegetales = vu.idvariedadesvegetales OR s.xsemillasidvariedadesvegetales = vu.xvariedadesvegetalesidvariedadorigen)
            AND s.xsemillasidusuarios = vu.xvariedadesvegetalesidusuarios
            AND s.semillasactivosino = 1
        ) AS semillas_count,
        (
          SELECT GROUP_CONCAT(COALESCE(s.semillasnumerocoleccion, s.idsemillas) ORDER BY s.semillasnumerocoleccion ASC SEPARATOR ', ')
          FROM semillas s 
          WHERE (s.xsemillasidvariedadesvegetales = vu.idvariedadesvegetales OR s.xsemillasidvariedadesvegetales = vu.xvariedadesvegetalesidvariedadorigen)
            AND s.xsemillasidusuarios = vu.xvariedadesvegetalesidusuarios
            AND s.semillasactivosino = 1
        ) AS semillas_colecciones,
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', idsemillas, 
            'numero', COALESCE(semillasnumerocoleccion, idsemillas), 
            'stock', semillasstockactual,
            'cultivos_count', (SELECT COUNT(*) FROM cultivos c WHERE c.xcultivosidsemillas = s.idsemillas AND c.cultivosactivosino = 1)
          ))
          FROM semillas s
          WHERE (s.xsemillasidvariedadesvegetales = vu.idvariedadesvegetales OR s.xsemillasidvariedadesvegetales = vu.xvariedadesvegetalesidvariedadorigen)
            AND s.xsemillasidusuarios = vu.xvariedadesvegetalesidusuarios
            AND s.semillasactivosino = 1
        ) AS semillas_lista,
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', idcultivos, 'numero', COALESCE(cultivosnumerocoleccion, idcultivos), 'estado', cultivosestado, 'cantidad', cultivoscantidad))
          FROM cultivos 
          WHERE (xcultivosidvariedadesvegetales = vu.idvariedadesvegetales OR xcultivosidvariedadesvegetales = vu.xvariedadesvegetalesidvariedadorigen) 
            AND xcultivosidusuarios = vu.xvariedadesvegetalesidusuarios
            AND cultivosactivosino = 1
        ) AS cultivos_lista
      FROM variedadesvegetales vu
      JOIN variedadesvegetales vg ON vu.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales
      JOIN especiesvegetales e ON vg.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales
      WHERE vu.xvariedadesvegetalesidusuarios = ?
      ORDER BY e.especiesvegetalesnombre, COALESCE(vu.variedadesvegetalesnombre, vg.variedadesvegetalesnombre)
    `, [user.id]);

    return NextResponse.json({ plantas });
  } catch (error: any) {
    console.error('Error fetching plantas del usuario:', error);
    return NextResponse.json({ error: 'Error al obtener plantas' }, { status: 500 });
  }
}

// POST /api/user/plantas — Adquirir una nueva planta (INSERT vacío con FK)
export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const body = await request.json();
    const { especieId, variedadId } = body;

    if (!especieId) {
      return NextResponse.json({ error: 'La especie es obligatoria' }, { status: 400 });
    }

    // Si no se pasa variedadId, buscar la variedad genérica (Gold) de esa especie
    let targetVariedadId = variedadId;
    if (!targetVariedadId) {
      const [goldRows]: any = await pool.query(
        `SELECT idvariedadesvegetales FROM variedadesvegetales 
         WHERE xvariedadesvegetalesidespeciesvegetales = ? AND variedadesvegetalesesgenerica = 1 AND xvariedadesvegetalesidusuarios IS NULL 
         LIMIT 1`,
        [especieId]
      );
      if (goldRows.length === 0) {
        return NextResponse.json({ error: 'No se encontró variedad Gold para esta especie' }, { status: 404 });
      }
      targetVariedadId = goldRows[0].idvariedadesvegetales;
    }

    // Verificar que la variedad existe y es global
    const [varCheck]: any = await pool.query(
      `SELECT idvariedadesvegetales, xvariedadesvegetalesidespeciesvegetales FROM variedadesvegetales WHERE idvariedadesvegetales = ? AND xvariedadesvegetalesidusuarios IS NULL`,
      [targetVariedadId]
    );
    if (varCheck.length === 0) {
      return NextResponse.json({ error: 'Variedad no encontrada o no disponible' }, { status: 404 });
    }

    // Verificar que no la tenga ya adquirida (misma variedad origen para el mismo usuario)
    const [duplicateCheck]: any = await pool.query(
      `SELECT idvariedadesvegetales, variedadesvegetalesvisibilidadsino FROM variedadesvegetales 
       WHERE xvariedadesvegetalesidusuarios = ? AND xvariedadesvegetalesidvariedadorigen = ?`,
      [user.id, targetVariedadId]
    );
    if (duplicateCheck.length > 0) {
      const existing = duplicateCheck[0];
      if (existing.variedadesvegetalesvisibilidadsino === 0) {
        // Reactivar planta inactiva
        await pool.query(
          `UPDATE variedadesvegetales SET variedadesvegetalesvisibilidadsino = 1 WHERE idvariedadesvegetales = ?`,
          [existing.idvariedadesvegetales]
        );
        return NextResponse.json({ 
          success: true, 
          id: existing.idvariedadesvegetales,
          message: '¡Planta reactivada en tu huerto!'
        });
      }
      return NextResponse.json({ error: 'Ya tienes esta variedad en tu huerto' }, { status: 409 });
    }

    // INSERT vacío: solo las FK, todo lo demás NULL (hereda)
    const [result]: any = await pool.query(
      `INSERT INTO variedadesvegetales (
        xvariedadesvegetalesidespeciesvegetales, xvariedadesvegetalesidusuarios, xvariedadesvegetalesidvariedadorigen, variedadesvegetalesesgenerica
      ) VALUES (?, ?, ?, 0)`,
      [varCheck[0].xvariedadesvegetalesidespeciesvegetales, user.id, targetVariedadId]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: '¡Planta añadida a tu huerto!'
    });
  } catch (error: any) {
    console.error('Error adquiriendo planta:', error);
    return NextResponse.json({ error: 'Error al adquirir la planta' }, { status: 500 });
  }
}
