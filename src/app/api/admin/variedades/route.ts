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

  try {
    let query = `
      SELECT v.*, e.especiesnombre, e.especiesicono
      FROM variedades v
      LEFT JOIN especies e ON v.xvariedadesidespecies = e.idespecies
      WHERE v.variedadesesgenerica = 0 AND v.xvariedadesidusuarios IS NULL
    `;
    const params: any[] = [];

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
      variedadesbiodinamicafasetrasplante
    } = body;

    if (!variedadesnombre || !xvariedadesidespecies) {
      return NextResponse.json({ error: 'El nombre y la especie padre son obligatorios' }, { status: 400 });
    }

    const query = `
      INSERT INTO variedades (
        variedadesnombre, xvariedadesidespecies, variedadesesgenerica, variedadesdescripcion, variedadescolor,
        variedadestamano, variedadesdiasgerminacion, variedadesviabilidadsemilla, variedadespeso1000semillas, variedadesdiashastafructificacion,
        variedadestemperaturaminima, variedadestemperaturaoptima, variedadesmarcoplantas, variedadesmarcofilas,
        variedadesprofundidadsiembra, variedadeshistoria, variedadessemillerodesde, variedadessemillerohasta,
        variedadessiembradirectadesde, variedadessiembradirectahasta, variedadestrasplantedesde, variedadestrasplantehasta,
        variedadesrecolecciondesde, variedadesrecoleccionhasta, variedadesvisibilidadsino, variedadesautosuficiencia,
        variedadesautosuficienciaconserva, variedadesdiashastatrasplante, variedadesdiashastarecoleccion,
        variedadesautosuficienciaparcial, variedadesicono, variedadesbiodinamicacategoria, variedadesbiodinamicanotas,
        variedadesprofundidadtrasplante, variedadesphsuelo, variedadesnecesidadriego, variedadestiposiembra,
        variedadesvolumenmaceta, variedadesluzsolar, variedadescaracteristicassuelo, variedadesdificultad, variedadestemperaturamaxima,
        variedadeslunarfasesiembra, variedadeslunarfasetrasplante, variedadeslunarobservaciones,
        variedadesbiodinamicafasesiembra, variedadesbiodinamicafasetrasplante
      ) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      variedadesbiodinamicafasetrasplante || null
    ];

    const [result]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating variedad:', error);
    return NextResponse.json({ error: 'Error al crear variedad' }, { status: 500 });
  }
}
