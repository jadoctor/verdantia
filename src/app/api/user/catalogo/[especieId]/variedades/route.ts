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

    // Variedades globales (no de usuario) de esta especie
    const [variedades] = await pool.query(`
      SELECT v.idvariedades, v.variedadesnombre, v.variedadesdescripcion, v.variedadesicono,
             v.variedadescolor, v.variedadestamano, v.variedadesesgenerica, v.variedadesdificultad,
             (SELECT datosadjuntosruta FROM datosadjuntos 
              WHERE xdatosadjuntosidvariedades = v.idvariedades AND datosadjuntostipo = 'imagen' 
              AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as foto
      FROM variedades v
      WHERE v.xvariedadesidespecies = ? 
        AND v.xvariedadesidusuarios IS NULL
      ORDER BY v.variedadesesgenerica DESC, v.variedadesnombre
    `, [especieId]);

    // También traer el nombre de la especie para contexto
    const [especieRows]: any = await pool.query(
      `SELECT especiesnombre, especiesicono FROM especies WHERE idespecies = ?`, [especieId]
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
