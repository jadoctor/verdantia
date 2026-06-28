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
  const filter = searchParams.get('filter') || 'activas';

  try {
    let query = `
      SELECT e.*, 
        f.familiasnombre,
        f.familiasemoji,
        f.familiascolor,
        (SELECT COUNT(*) FROM variedadesvegetales v WHERE v.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales AND v.xvariedadesvegetalesidusuarios IS NULL AND v.variedadesvegetalesvisibilidadsino = 1 AND v.variedadesvegetalesesgenerica = 0) as total_variedades, 
        (SELECT COUNT(*) FROM semillas s JOIN variedadesvegetales v2 ON s.xsemillasidvariedades = v2.idvariedadesvegetales WHERE v2.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales) as total_semillas,
        (SELECT COUNT(*) FROM cultivos c JOIN variedadesvegetales v3 ON c.xcultivosidvariedades = v3.idvariedadesvegetales WHERE v3.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales) as total_cultivos,
        (SELECT COUNT(*) FROM especiesvegetalesusuarios eu WHERE eu.xespeciesvegetalesusuariosidespeciesvegetales = e.idespeciesvegetales) as total_especiesusuarios,
        (SELECT COUNT(*) FROM variedadesvegetalesusuarios vu JOIN variedadesvegetales v4 ON vu.xvariedadesvegetalesusuariosidvariedades = v4.idvariedadesvegetales WHERE v4.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales) as total_variedadesvegetalesusuarios,
        (SELECT COUNT(*) FROM asociacionesbeneficiosas ab WHERE ab.xasociacionesbeneficiosasidespecieorigen = e.idespeciesvegetales OR ab.xasociacionesbeneficiosasidespeciedestino = e.idespeciesvegetales) as total_asociacionesbeneficiosas,
        (SELECT COUNT(*) FROM asociacionesperjudiciales ap WHERE ap.xasociacionesperjudicialesidespecieorigen = e.idespeciesvegetales OR ap.xasociacionesperjudicialesidespeciedestino = e.idespeciesvegetales) as total_asociacionesperjudiciales,
        (SELECT COUNT(*) FROM especiesafecciones ea WHERE ea.xespeciesvegetalesafeccionesidespeciesvegetales = e.idespeciesvegetales) as total_especiesafecciones,
        (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidespeciesvegetales = e.idespeciesvegetales AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as primary_photo_ruta,
        (SELECT datosadjuntosresumen FROM datosadjuntos WHERE xdatosadjuntosidespeciesvegetales = e.idespeciesvegetales AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as primary_photo_resumen
      FROM especiesvegetales e
      LEFT JOIN familias f ON e.xespeciesvegetalesidfamilias = f.idfamilias
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tipo) {
      query += ` AND FIND_IN_SET(?, e.especiesvegetalestipo)`;
      params.push(tipo);
    }

    if (filter === 'activas') {
      query += ` AND e.especiesvegetalesvisibilidadsino = 1`;
    } else if (filter === 'inactivas') {
      query += ` AND e.especiesvegetalesvisibilidadsino = 0`;
    }

    query += ` ORDER BY e.especiesvegetalesnombre`;

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
      especiesvegetalesnombre,
      especiesvegetalesnombrecientifico,
      xespeciesvegetalesidfamilias,
      especiestipo,
      especiesciclo,
      especiesviabilidadsemilla,
      especiespeso1000semillas,
      especiestemperaturaminima,
      especiestemperaturaoptima,
      especiesmarcoplantas,
      especiesmarcofilas,
      especiesprofundidadsiembra,
      especieshistoria,
      especiesvegetalesdescripcion,
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
      especiesvegetalesvisibilidadsino,
      especiesfuentesinformacion,
      especiesautosuficiencia,
      especiesautosuficienciaparcial,
      especiesautosuficienciaconserva,
      especiesvegetalesicono,
      especiesorganocomestible,
      especiesbiodinamicanotas,
      especiesprofundidadtrasplante,
      especiesphminimosuelo,
      especiesphmaximosuelo,
      especiesnecesidadriego,
      especiestiposiembra,
      especiestiposiembrapreferente,
      especiesvolumenmaceta,
      especiesluzsolar,
      especiescaracteristicassuelo,
      especiesdificultad,
      especiestemperaturamaxima,
      especieslunarfasesiembra,
      especieslunarfasetrasplante,
      especieslunarobservaciones,
      especiesbiodinamicafasesiembra,
      especiesbiodinamicafasetrasplante,
      especiesemillerovolumendesde,
      especiesemillerovolumenhasta,
      especiesmarcomargen,
      especiesresistenciahelada,
      especiesnecesidadtutoraje,
      especiesporteplanta,
      especiesrendimientoestimado,
      especiespartecosechable,
      especiesgerminaroscuridad
    } = body;

    if (!especiesvegetalesnombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const query = `
      INSERT INTO especiesvegetales (
        especiesvegetalesnombre, especiesvegetalesnombrecientifico, xespeciesvegetalesidfamilias, especiestipo, especiesciclo, 
        especiesviabilidadsemilla, especiespeso1000semillas,
        especiestemperaturaminima, especiestemperaturaoptima, especiesmarcoplantas, especiesmarcofilas, 
        especiesprofundidadsiembra, especieshistoria, especiesvegetalesdescripcion, especiescolor, especiestamano, 
        especiesfechasemillerodesde, especiesfechasemillerohasta, especiesfechasiembradirectadesde, 
        especiesfechasiembradirectahasta, especiestrasplantedesde, especiestrasplantehasta, 
        especiesfecharecolecciondesde, especiesfecharecoleccionhasta, especiesvegetalesvisibilidadsino, 
        especiesfuentesinformacion, especiesautosuficiencia, especiesautosuficienciaparcial, especiesautosuficienciaconserva, especiesvegetalesicono,
        especiesorganocomestible, especiesbiodinamicanotas,
        especiesprofundidadtrasplante, especiesphminimosuelo, especiesphmaximosuelo, especiesnecesidadriego, especiestiposiembra, especiestiposiembrapreferente,
        especiesvolumenmaceta, especiesluzsolar, especiescaracteristicassuelo, especiesdificultad,
        especiestemperaturamaxima,
        especieslunarfasesiembra, especieslunarfasetrasplante, especieslunarobservaciones,
        especiesbiodinamicafasesiembra, especiesbiodinamicafasetrasplante,
        especiesemillerovolumendesde, especiesemillerovolumenhasta, especiesmarcomargen,
        especiesresistenciahelada, especiesnecesidadtutoraje, especiesporteplanta,
        especiesrendimientoestimado, especiespartecosechable, especiesgerminaroscuridad
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


    const params = [
      especiesvegetalesnombre,
      especiesvegetalesnombrecientifico || null,
      xespeciesvegetalesidfamilias || null,
      Array.isArray(especiestipo) ? especiestipo.join(',') : (especiestipo || null),
      Array.isArray(especiesciclo) ? especiesciclo.join(',') : (especiesciclo || null),
      especiesviabilidadsemilla || null,
      especiespeso1000semillas || null,
      especiestemperaturaminima || null,
      especiestemperaturaoptima || null,
      especiesmarcoplantas || null,
      especiesmarcofilas || null,
      especiesprofundidadsiembra || null,
      especieshistoria || null,
      especiesvegetalesdescripcion || null,
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
      especiesvegetalesvisibilidadsino !== undefined ? especiesvegetalesvisibilidadsino : 1,
      especiesfuentesinformacion || null,
      especiesautosuficiencia || null,
      especiesautosuficienciaparcial || null,
      especiesautosuficienciaconserva || null,
      especiesvegetalesicono || null,
      especiesorganocomestible || null,
      especiesbiodinamicanotas || null,
      especiesprofundidadtrasplante || null,
      especiesphminimosuelo || null,
      especiesphmaximosuelo || null,
      especiesnecesidadriego || null,
      Array.isArray(especiestiposiembra) ? especiestiposiembra.join(',') : (especiestiposiembra || null),
      Array.isArray(especiestiposiembrapreferente) ? especiestiposiembrapreferente.join(',') : (especiestiposiembrapreferente || null),
      especiesvolumenmaceta || null,
      especiesluzsolar || null,
      especiescaracteristicassuelo || null,
      especiesdificultad || null,
      especiestemperaturamaxima || null,
      especieslunarfasesiembra || null,
      especieslunarfasetrasplante || null,
      especieslunarobservaciones || null,
      especiesbiodinamicafasesiembra || null,
      especiesbiodinamicafasetrasplante || null,
      especiesemillerovolumendesde || null,
      especiesemillerovolumenhasta || null,
      especiesmarcomargen || null,
      especiesresistenciahelada || null,
      especiesnecesidadtutoraje || null,
      especiesporteplanta || null,
      especiesrendimientoestimado || null,
      Array.isArray(especiespartecosechable) ? especiespartecosechable.join(',') : (especiespartecosechable || null),
      especiesgerminaroscuridad !== undefined ? especiesgerminaroscuridad : null
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
