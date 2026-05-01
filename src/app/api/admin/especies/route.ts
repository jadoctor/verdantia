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
  const tipo = searchParams.get('tipo') || '';

  try {
    let query = `
      SELECT e.*, 
        (SELECT COUNT(*) FROM variedades v WHERE v.xvariedadesidespecies = e.idespecies) as total_variedades, 
        (SELECT COUNT(*) FROM semillas s JOIN variedades v2 ON s.xsemillasidvariedad = v2.idvariedades WHERE v2.xvariedadesidespecies = e.idespecies) as total_semillas,
        (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidespecies = e.idespecies AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as primary_photo_ruta,
        (SELECT datosadjuntosresumen FROM datosadjuntos WHERE xdatosadjuntosidespecies = e.idespecies AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as primary_photo_resumen
      FROM especies e 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tipo) {
      query += ` AND FIND_IN_SET(?, e.especiestipo)`;
      params.push(tipo);
    }

    query += ` ORDER BY e.especiesnombre`;

    const [rows] = await pool.query(query, params);
    return NextResponse.json({ especies: rows });
  } catch (error: any) {
    console.error('Error fetching especies:', error);
    return NextResponse.json({ error: 'Error al obtener especies' }, { status: 500 });
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
      especiesnombre,
      especiesnombrecientifico,
      especiesfamilia,
      especiestipo,
      especiesciclo,
      especiesdiasgerminacion,
      especiesdiashastatrasplante,
      especiesviabilidadsemilla,
      especiesdiashastafructificacion,
      especiestemperaturaminima,
      especiestemperaturaoptima,
      especiesmarcoplantas,
      especiesmarcofilas,
      especiesprofundidadsiembra,
      especieshistoria,
      especiesdescripcion,
      especiescolor,
      especiestamano,
      especiesfechasemillerodesde,
      especiesfechasemillerohasta,
      especiesfechasiembradirectadesde,
      especiesfechasiembradirectahasta,
      especiestrasplantedesde,
      especiestrasplantehasta,
      especiesfecharecolecciondesde,
      especiesfecharecoleccionhasta,
      especiesvisibilidadsino,
      especiesfuentesinformacion,
      especiesautosuficiencia,
      especiesautosuficienciaconserva,
      especiesicono,
      especiesbiodinamicacategoria,
      especiesbiodinamicanotas,
      especiesprofundidadtrasplante,
      especiesphsuelo,
      especiesnecesidadriego,
      especiestiposiembra,
      especiesvolumenmaceta,
      especiesluzsolar,
      especiescaracteristicassuelo,
      especiesdificultad,
      especiestemperaturamaxima
    } = body;

    if (!especiesnombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const query = `
      INSERT INTO especies (
        especiesnombre, especiesnombrecientifico, especiesfamilia, especiestipo, especiesciclo, 
        especiesdiasgerminacion, especiesdiashastatrasplante, especiesviabilidadsemilla, especiesdiashastafructificacion, 
        especiestemperaturaminima, especiestemperaturaoptima, especiesmarcoplantas, especiesmarcofilas, 
        especiesprofundidadsiembra, especieshistoria, especiesdescripcion, especiescolor, especiestamano, 
        especiesfechasemillerodesde, especiesfechasemillerohasta, especiesfechasiembradirectadesde, 
        especiesfechasiembradirectahasta, especiestrasplantedesde, especiestrasplantehasta, 
        especiesfecharecolecciondesde, especiesfecharecoleccionhasta, especiesvisibilidadsino, 
        especiesfuentesinformacion, especiesautosuficiencia, especiesautosuficienciaconserva, especiesicono,
        especiesbiodinamicacategoria, especiesbiodinamicanotas,
        especiesprofundidadtrasplante, especiesphsuelo, especiesnecesidadriego, especiestiposiembra,
        especiesvolumenmaceta, especiesluzsolar, especiescaracteristicassuelo, especiesdificultad,
        especiestemperaturamaxima
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      especiesnombre,
      especiesnombrecientifico || null,
      especiesfamilia || null,
      Array.isArray(especiestipo) ? especiestipo.join(',') : (especiestipo || null),
      Array.isArray(especiesciclo) ? especiesciclo.join(',') : (especiesciclo || null),
      especiesdiasgerminacion || null,
      especiesdiashastatrasplante || null,
      especiesviabilidadsemilla || null,
      especiesdiashastafructificacion || null,
      especiestemperaturaminima || null,
      especiestemperaturaoptima || null,
      especiesmarcoplantas || null,
      especiesmarcofilas || null,
      especiesprofundidadsiembra || null,
      especieshistoria || null,
      especiesdescripcion || null,
      especiescolor || null,
      especiestamano || 'mediano',
      especiesfechasemillerodesde || null,
      especiesfechasemillerohasta || null,
      especiesfechasiembradirectadesde || null,
      especiesfechasiembradirectahasta || null,
      especiestrasplantedesde || null,
      especiestrasplantehasta || null,
      especiesfecharecolecciondesde || null,
      especiesfecharecoleccionhasta || null,
      especiesvisibilidadsino !== undefined ? especiesvisibilidadsino : 1,
      especiesfuentesinformacion || null,
      especiesautosuficiencia || null,
      especiesautosuficienciaconserva || null,
      especiesicono || null,
      especiesbiodinamicacategoria || null,
      especiesbiodinamicanotas || null,
      especiesprofundidadtrasplante || null,
      especiesphsuelo || null,
      especiesnecesidadriego || null,
      especiestiposiembra || null,
      especiesvolumenmaceta || null,
      especiesluzsolar || null,
      especiescaracteristicassuelo || null,
      especiesdificultad || null,
      especiestemperaturamaxima || null
    ];

    const [result]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating especie:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe una especie con ese nombre.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear especie' }, { status: 500 });
  }
}
