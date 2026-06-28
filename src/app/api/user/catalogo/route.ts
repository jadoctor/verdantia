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
      SELECT e.idespeciesvegetales, e.especiesvegetalesnombre, e.especiesvegetalesnombrecientifico, 
             f.familiasnombre, f.familiasemoji, f.familiascolor,
             e.especiesvegetalestipo, e.especiesvegetalesicono, e.especiesvegetalesdescripcion, e.especiesvegetalesdificultad, e.especiesvegetalespeso1000semillas,
             (SELECT datosadjuntosruta FROM datosadjuntos 
              WHERE xdatosadjuntosidespeciesvegetales = e.idespeciesvegetales AND datosadjuntostipo = 'imagen' 
              AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as foto,
             (SELECT COUNT(*) FROM variedadesvegetales v 
              WHERE v.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales 
              AND v.xvariedadesvegetalesidusuarios IS NULL 
              AND v.variedadesvegetalesesgenerica = 0
              AND v.variedadesvegetalesvisibilidadsino = 1) as total_variedades
      FROM especiesvegetales e 
      LEFT JOIN familias f ON e.xespeciesvegetalesidfamilias = f.idfamilias
      WHERE e.especiesvegetalesvisibilidadsino = 1
    `;
    const params: any[] = [];

    if (tipo) {
      especiesQuery += ` AND FIND_IN_SET(?, e.especiesvegetalestipo)`;
      params.push(tipo);
    }

    if (busqueda) {
      especiesQuery += ` AND (e.especiesvegetalesnombre LIKE ? OR e.especiesvegetalesnombrecientifico LIKE ?)`;
      params.push(`%${busqueda}%`, `%${busqueda}%`);
    }

    especiesQuery += ` ORDER BY e.especiesvegetalesnombre`;

    const [especies]: any = await pool.query(especiesQuery, params);

    const [variedades]: any = await pool.query(`
      SELECT idvariedadesvegetales, xvariedadesvegetalesidespeciesvegetales, variedadesvegetalesnombre, variedadesvegetalesesgenerica, variedadespeso1000semillas, xvariedadesvegetalesidusuarios
      FROM variedades
      WHERE (xvariedadesvegetalesidusuarios IS NULL OR xvariedadesvegetalesidusuarios = ?)
        AND variedadesvegetalesvisibilidadsino = 1
      ORDER BY variedadesvegetalesesgenerica DESC, variedadesvegetalesnombre ASC
    `, [user.id]);

    for (const esp of especies) {
      esp.variedades = variedades.filter((v: any) => v.xvariedadesvegetalesidespeciesvegetales === esp.idespeciesvegetales);
    }

    return NextResponse.json({ especies });
  } catch (error: any) {
    console.error('Error fetching catalogo:', error);
    return NextResponse.json({ error: 'Error al obtener el catálogo' }, { status: 500 });
  }
}
