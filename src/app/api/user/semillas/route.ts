import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/semillas — Listar inventario de semillas del usuario
export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const [semillas] = await pool.query(`
      SELECT 
        s.idsemillas,
        s.xsemillasidvariedades,
        s.semillasnumerocoleccion,
        s.semillasorigen,
        s.semillaslugarcompra,
        s.semillasmarca,
        s.semillasfecharecoleccion,
        s.semillasfechaenvasado,
        s.semillasfechacaducidad,
        s.semillaslote,
        s.semillasstockinicial,
        s.semillasstockactual,
        s.semillasobservaciones,
        s.semillasactivosino,
        (SELECT COUNT(*) FROM cultivos c WHERE c.xcultivosidsemillas = s.idsemillas AND c.cultivosactivosino = 1) AS cultivos_activos_count,
        (SELECT GROUP_CONCAT(CONCAT('Nº ', COALESCE(c.cultivosnumerocoleccion, c.idcultivos), ' (Iniciado el ', DATE_FORMAT(c.cultivosfechainicio, '%d/%m/%Y'), ' - Estado actual: ', 
          CASE COALESCE(c.cultivosestado, '')
            WHEN 'en_espera' THEN 'PENDIENTE DE PLANTACIÓN'
            WHEN 'germinacion' THEN 'GERMINACIÓN'
            WHEN 'crecimiento' THEN 'CRECIMIENTO'
            WHEN 'floracion' THEN 'FLORACIÓN'
            WHEN 'produccion' THEN 'PRODUCCIÓN'
            WHEN 'finalizado' THEN 'FINALIZADO'
            WHEN 'perdido' THEN 'PERDIDO'
            WHEN '' THEN 'PENDIENTE DE PLANTACIÓN'
            ELSE UPPER(REPLACE(c.cultivosestado, '_', ' '))
          END
        , ')') SEPARATOR '|') FROM cultivos c WHERE c.xcultivosidsemillas = s.idsemillas AND c.cultivosactivosino = 1) AS cultivos_activos_lista,
        COALESCE(NULLIF(vu.variedadesnombre, ''), vg.variedadesnombre) AS variedad_nombre,
        e.especiesnombre,
        e.especiesicono,
        -- Foto de la variedad o especie
        COALESCE(
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedades = vu.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedades = vg.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidespecies = e.idespecies AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1)
        ) AS foto
      FROM semillas s
      JOIN variedades vu ON s.xsemillasidvariedades = vu.idvariedades
      LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
      WHERE s.xsemillasidusuarios = ? AND s.semillasactivosino = 1
      ORDER BY s.semillasfechacreacion DESC
    `, [user.id]);

    return NextResponse.json({ semillas });
  } catch (error: any) {
    console.error('Error fetching semillas:', error);
    return NextResponse.json({ error: 'Error al obtener inventario de semillas' }, { status: 500 });
  }
}

// POST /api/user/semillas — Añadir un nuevo sobre de semillas
export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const body = await request.json();
    const { 
      xsemillasidvariedades, 
      semillasorigen, 
      semillasfecharecoleccion, 
      semillasfechaenvasado,
      semillasfechacaducidad, 
      semillaslote, 
      semillasstockinicial,
      semillasstockactual, 
      semillasobservaciones,
      semillasnumerocoleccion,
      semillaslugarcompra,
      semillasmarca
    } = body;

    if (!xsemillasidvariedades) {
      return NextResponse.json({ error: 'La variedad es obligatoria' }, { status: 400 });
    }

    const [result]: any = await pool.query(
      `INSERT INTO semillas (
        xsemillasidusuarios, 
        xsemillasidvariedades, 
        semillasnumerocoleccion,
        semillasorigen, 
        semillaslugarcompra,
        semillasmarca,
        semillasfecharecoleccion, 
        semillasfechaenvasado,
        semillasfechacaducidad, 
        semillaslote, 
        semillasstockinicial,
        semillasstockactual, 
        semillasobservaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id, 
        xsemillasidvariedades, 
        semillasnumerocoleccion || null,
        semillasorigen || 'sobre_comprado',
        semillaslugarcompra || null,
        semillasmarca || null,
        semillasfecharecoleccion || null,
        semillasfechaenvasado || null,
        semillasfechacaducidad || null,
        semillaslote || null,
        semillasstockinicial || null,
        semillasstockactual || null,
        semillasobservaciones || null
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: 'Semillas añadidas al inventario'
    });
  } catch (error: any) {
    console.error('Error añadiendo semillas:', error);
    return NextResponse.json({ error: 'Error al guardar las semillas' }, { status: 500 });
  }
}
