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
      SELECT v.*, e.especiesvegetalesnombre, e.especiesvegetalesicono,
        (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidvariedadesvegetales = v.idvariedadesvegetales AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as primary_photo_ruta,
        (SELECT datosadjuntosresumen FROM datosadjuntos WHERE xdatosadjuntosidvariedadesvegetales = v.idvariedadesvegetales AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as primary_photo_resumen,
        (SELECT COUNT(*) FROM variedadesvegetales WHERE xvariedadesvegetalesidvariedadorigen = v.idvariedadesvegetales) as total_asociaciones,
        ((SELECT COUNT(*) FROM semillas WHERE xsemillasidvariedadesvegetales = v.idvariedadesvegetales) + (SELECT COUNT(*) FROM semillas s JOIN variedadesvegetales vu ON s.xsemillasidvariedadesvegetales = vu.idvariedadesvegetales WHERE vu.xvariedadesvegetalesidvariedadorigen = v.idvariedadesvegetales)) as total_semillas,
        ((SELECT COUNT(*) FROM cultivos WHERE xcultivosidvariedadesvegetales = v.idvariedadesvegetales) + (SELECT COUNT(*) FROM cultivos c JOIN variedadesvegetales vu ON c.xcultivosidvariedadesvegetales = vu.idvariedadesvegetales WHERE vu.xvariedadesvegetalesidvariedadorigen = v.idvariedadesvegetales)) as total_cultivos
      FROM variedadesvegetales v
      LEFT JOIN especiesvegetales e ON v.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales
      WHERE v.variedadesvegetalesesgenerica = 0 AND v.xvariedadesvegetalesidusuarios IS NULL
    `;
    const params: any[] = [];

    if (filter === 'activas') {
      query += ` AND v.variedadesvegetalesvisibilidadsino = 1`;
    } else if (filter === 'inactivas') {
      query += ` AND v.variedadesvegetalesvisibilidadsino = 0`;
    }

    if (especieId) {
      query += ` AND v.xvariedadesvegetalesidespeciesvegetales = ?`;
      params.push(especieId);
    }

    query += ` ORDER BY e.especiesvegetalesnombre, v.variedadesvegetalesnombre`;

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
      variedadesvegetalesnombre,
      xvariedadesvegetalesidespeciesvegetales,
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
      variedadesvegetalesvisibilidadsino,
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

    if (!variedadesvegetalesnombre || !xvariedadesvegetalesidespeciesvegetales) {
      return NextResponse.json({ error: 'El nombre y la especie padre son obligatorios' }, { status: 400 });
    }

    const query = `
      INSERT INTO variedadesvegetales (
        variedadesvegetalesnombre, xvariedadesvegetalesidespeciesvegetales, variedadesvegetalesesgenerica, variedadesdescripcion, variedadescolor,
        variedadestamano, variedadesviabilidadsemilla, variedadespeso1000semillas, variedadesdiashastafructificacion, variedadesdiascrecimientofirme,
        variedadesduraciontotal,
        variedadestemperaturaminima, variedadestemperaturaoptima, variedadesmarcoplantas, variedadesmarcofilas,
        variedadesprofundidadsiembra, variedadeshistoria, variedadessemillerodesde, variedadessemillerohasta,
        variedadessiembradirectadesde, variedadessiembradirectahasta, variedadestrasplantedesde, variedadestrasplantehasta,
        variedadesrecolecciondesde, variedadesrecoleccionhasta, variedadesvegetalesvisibilidadsino, variedadesautosuficiencia,
        variedadesautosuficienciaconserva, variedadesdiashastatrasplante, variedadesdiashastarecoleccion,
        variedadesautosuficienciaparcial, variedadesicono, variedadesbiodinamicacategoria, variedadesbiodinamicanotas,
        variedadesprofundidadtrasplante, variedadesphsuelo, variedadesnecesidadriego, variedadestiposiembra,
        variedadesvolumenmaceta, variedadesluzsolar, variedadescaracteristicassuelo, variedadesdificultad, variedadestemperaturamaxima,
        variedadeslunarfasesiembra, variedadeslunarfasetrasplante, variedadeslunarobservaciones,
        variedadesbiodinamicafasesiembra, variedadesbiodinamicafasetrasplante, variedadesmarcomargen
      ) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      variedadesvegetalesnombre,
      xvariedadesvegetalesidespeciesvegetales,
      variedadesdescripcion || null,
      variedadescolor || null,
      variedadestamano || 'mediano',
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
      variedadesvegetalesvisibilidadsino !== undefined ? variedadesvegetalesvisibilidadsino : 1,
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
