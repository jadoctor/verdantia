import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// Helper for authentication and authorization
async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function GET(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const especieId = searchParams.get('especieId');
  const includeHidden = searchParams.get('includeHidden') === 'true';
  const filter = searchParams.get('filter') || (includeHidden ? 'todas' : 'activas');

  try {
    let query = `
      SELECT v.*, e.especiesnombre, e.especiesicono,
        (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidvariedades = v.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as primary_photo_ruta,
        (SELECT datosadjuntosresumen FROM datosadjuntos WHERE xdatosadjuntosidvariedades = v.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as primary_photo_resumen,
        (SELECT COUNT(*) FROM variedades WHERE xvariedadesidvariedadorigen = v.idvariedades) as total_asociaciones,
        ((SELECT COUNT(*) FROM semillas WHERE xsemillasidvariedades = v.idvariedades) + (SELECT COUNT(*) FROM semillas s JOIN variedades vu ON s.xsemillasidvariedades = vu.idvariedades WHERE vu.xvariedadesidvariedadorigen = v.idvariedades)) as total_semillas,
        ((SELECT COUNT(*) FROM cultivos WHERE xcultivosidvariedades = v.idvariedades) + (SELECT COUNT(*) FROM cultivos c JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades WHERE vu.xvariedadesidvariedadorigen = v.idvariedades)) as total_cultivos
      FROM variedades v
      LEFT JOIN especies e ON v.xvariedadesidespecies = e.idespecies
      WHERE v.variedadesesgenerica = 0 AND v.xvariedadesidusuarios IS NULL
    `;
    const params: any[] = [];

    if (filter === 'activas') {
      query += ` AND v.variedadesvisibilidadsino = 1`;
    } else if (filter === 'inactivas') {
      query += ` AND v.variedadesvisibilidadsino = 0`;
    }

    if (especieId) {
      query += ` AND v.xvariedadesidespecies = ?`;
      params.push(especieId);
    }

    query += ` ORDER BY e.especiesnombre, v.variedadesnombre`;

    const [rows] = await pool.query(query, params);
    return NextResponse.json({ variedades: rows });
  } catch (error: any) {
    console.error('Error fetching variedades:', error);
    return NextResponse.json({ error: 'Error al obtener variedades' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      variedadesnombre,
      xvariedadesidespecies,
      variedadesdescripcion,
      variedadescolor,
      variedadestamano,
      variedadesdiasgerminacion,
      variedadesviabilidadsemilla,
      variedadespeso1000semillas,
      variedadesdiashastafructificacion,
      variedadesdiascrecimientofirme,
      variedadesduraciontotal,
      variedadestemperaturaminima,
      variedadestemperaturaoptima,
      variedadesmarcoplantas,
      variedadesmarcofilas,
      variedadesprofundidadsiembra,
      variedadeshistoria,
      variedadessemillerodesde,
      variedadessemillerohasta,
      variedadessiembradirectadesde,
      variedadessiembradirectahasta,
      variedadestrasplantedesde,
      variedadestrasplantehasta,
      variedadesrecolecciondesde,
      variedadesrecoleccionhasta,
      variedadesvisibilidadsino,
      variedadesautosuficiencia,
      variedadesautosuficienciaconserva,
      variedadesdiashastatrasplante,
      variedadesdiashastarecoleccion,
      variedadesautosuficienciaparcial,
      variedadesicono,
      variedadesbiodinamicacategoria,
      variedadesbiodinamicanotas,
      variedadesprofundidadtrasplante,
      variedadesphsuelo,
      variedadesnecesidadriego,
      variedadestiposiembra,
      variedadesvolumenmaceta,
      variedadesluzsolar,
      variedadescaracteristicassuelo,
      variedadesdificultad,
      variedadestemperaturamaxima,
      variedadeslunarfasesiembra,
      variedadeslunarfasetrasplante,
      variedadeslunarobservaciones,
      variedadesbiodinamicafasesiembra,
      variedadesbiodinamicafasetrasplante,
      variedadesmarcomargen
    } = body;

    if (!variedadesnombre || !xvariedadesidespecies) {
      return NextResponse.json({ error: 'El nombre y la especie padre son obligatorios' }, { status: 400 });
    }

    const query = `
      INSERT INTO variedades (
        variedadesnombre, xvariedadesidespecies, variedadesesgenerica, variedadesdescripcion, variedadescolor,
        variedadestamano, variedadesdiasgerminacion, variedadesviabilidadsemilla, variedadespeso1000semillas, variedadesdiashastafructificacion, variedadesdiascrecimientofirme,
        variedadesduraciontotal,
        variedadestemperaturaminima, variedadestemperaturaoptima, variedadesmarcoplantas, variedadesmarcofilas,
        variedadesprofundidadsiembra, variedadeshistoria, variedadessemillerodesde, variedadessemillerohasta,
        variedadessiembradirectadesde, variedadessiembradirectahasta, variedadestrasplantedesde, variedadestrasplantehasta,
        variedadesrecolecciondesde, variedadesrecoleccionhasta, variedadesvisibilidadsino, variedadesautosuficiencia,
        variedadesautosuficienciaconserva, variedadesdiashastatrasplante, variedadesdiashastarecoleccion,
        variedadesautosuficienciaparcial, variedadesicono, variedadesbiodinamicacategoria, variedadesbiodinamicanotas,
        variedadesprofundidadtrasplante, variedadesphsuelo, variedadesnecesidadriego, variedadestiposiembra,
        variedadesvolumenmaceta, variedadesluzsolar, variedadescaracteristicassuelo, variedadesdificultad, variedadestemperaturamaxima,
        variedadeslunarfasesiembra, variedadeslunarfasetrasplante, variedadeslunarobservaciones,
        variedadesbiodinamicafasesiembra, variedadesbiodinamicafasetrasplante, variedadesmarcomargen
      ) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      variedadesnombre,
      xvariedadesidespecies,
      variedadesdescripcion || null,
      variedadescolor || null,
      variedadestamano || 'mediano',
      variedadesdiasgerminacion || null,
      variedadesviabilidadsemilla || null,
      variedadespeso1000semillas || null,
      variedadesdiashastafructificacion || null,
      variedadesdiascrecimientofirme || null,
      variedadesduraciontotal || null,
      variedadestemperaturaminima || null,
      variedadestemperaturaoptima || null,
      variedadesmarcoplantas || null,
      variedadesmarcofilas || null,
      variedadesprofundidadsiembra || null,
      variedadeshistoria || null,
      variedadessemillerodesde || null,
      variedadessemillerohasta || null,
      variedadessiembradirectadesde || null,
      variedadessiembradirectahasta || null,
      variedadestrasplantedesde || null,
      variedadestrasplantehasta || null,
      variedadesrecolecciondesde || null,
      variedadesrecoleccionhasta || null,
      variedadesvisibilidadsino !== undefined ? variedadesvisibilidadsino : 1,
      variedadesautosuficiencia || null,
      variedadesautosuficienciaconserva || null,
      variedadesdiashastatrasplante || null,
      variedadesdiashastarecoleccion || null,
      variedadesautosuficienciaparcial || null,
      variedadesicono || null,
      variedadesbiodinamicacategoria || null,
      variedadesbiodinamicanotas || null,
      variedadesprofundidadtrasplante || null,
      variedadesphsuelo || null,
      variedadesnecesidadriego || null,
      variedadestiposiembra || null,
      variedadesvolumenmaceta || null,
      variedadesluzsolar || null,
      variedadescaracteristicassuelo || null,
      variedadesdificultad || null,
      variedadestemperaturamaxima || null,
      variedadeslunarfasesiembra || null,
      variedadeslunarfasetrasplante || null,
      variedadeslunarobservaciones || null,
      variedadesbiodinamicafasesiembra || null,
      variedadesbiodinamicafasetrasplante || null,
      variedadesmarcomargen || null
    ];

    const [result]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating variedad:', error);
    return NextResponse.json({ error: 'Error al crear variedad' }, { status: 500 });
  }
}
