import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/catalogo — Listar especies y variedades disponibles para adquisición
export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || '';
    const busqueda = searchParams.get('q') || '';

    // Especies visibles con su foto principal
    let especiesQuery = `
      SELECT e.idespecies, e.especiesnombre, e.especiesnombrecientifico, e.especiesfamilia, 
             e.especiestipo, e.especiesicono, e.especiesdescripcion, e.especiesdificultad,
             (SELECT datosadjuntosruta FROM datosadjuntos 
              WHERE xdatosadjuntosidespecies = e.idespecies AND datosadjuntostipo = 'imagen' 
              AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as foto,
             (SELECT COUNT(*) FROM variedades v 
              WHERE v.xvariedadesidespecies = e.idespecies 
              AND v.xvariedadesidusuarios IS NULL 
              AND v.variedadesesgenerica = 0) as total_variedades
      FROM especies e 
      WHERE e.especiesvisibilidadsino = 1
    `;
    const params: any[] = [];

    if (tipo) {
      especiesQuery += ` AND FIND_IN_SET(?, e.especiestipo)`;
      params.push(tipo);
    }

    if (busqueda) {
      especiesQuery += ` AND (e.especiesnombre LIKE ? OR e.especiesnombrecientifico LIKE ?)`;
      params.push(`%${busqueda}%`, `%${busqueda}%`);
    }

    especiesQuery += ` ORDER BY e.especiesnombre`;

    const [especies] = await pool.query(especiesQuery, params);

    return NextResponse.json({ especies });
  } catch (error: any) {
    console.error('Error fetching catalogo:', error);
    return NextResponse.json({ error: 'Error al obtener el catálogo' }, { status: 500 });
  }
}
