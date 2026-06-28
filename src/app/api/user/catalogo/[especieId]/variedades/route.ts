import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/catalogo/[especieId]/variedades — Listar variedades disponibles de una especie
export async function GET(request: Request, { params }: { params: Promise<{ especieId: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const especieId = resolvedParams.especieId;

    // Variedades globales y del usuario de esta especie
    const [variedades] = await pool.query(`
      SELECT v.idvariedadesvegetales, v.variedadesvegetalesnombre, v.variedadesvegetalesdescripcion, v.variedadesvegetalesicono,
             v.variedadesvegetalescolor, v.variedadesvegetalestamano, v.variedadesvegetalesesgenerica, v.variedadesvegetalesdificultad,
             v.xvariedadesvegetalesidusuarios,
             (SELECT datosadjuntosruta FROM datosadjuntos 
              WHERE xdatosadjuntosidvariedadesvegetales = v.idvariedadesvegetales AND datosadjuntostipo = 'imagen' 
              AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as foto
      FROM variedadesvegetales v
      WHERE v.xvariedadesvegetalesidespeciesvegetales = ? 
        AND (v.xvariedadesvegetalesidusuarios IS NULL OR v.xvariedadesvegetalesidusuarios = ?)
        AND v.variedadesvegetalesvisibilidadsino = 1
      ORDER BY v.variedadesvegetalesesgenerica DESC, v.variedadesvegetalesnombre
    `, [especieId, user.id]);

    // También traer el nombre de la especie para contexto
    const [especieRows]: any = await pool.query(
      `SELECT especiesvegetalesnombre, especiesvegetalesicono FROM especiesvegetales WHERE idespeciesvegetales = ?`, [especieId]
    );

    return NextResponse.json({ 
      variedades,
      especie: especieRows.length > 0 ? especieRows[0] : null
    });
  } catch (error: any) {
    console.error('Error fetching variedades del catalogo:', error);
    return NextResponse.json({ error: 'Error al obtener variedades' }, { status: 500 });
  }
}
