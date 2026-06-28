import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idespeciesvegetales = resolvedParams.id;

    // Query active seeds
    const [seeds]: any = await pool.query(`
      SELECT 
        s.idsemillas, 
        s.semillasnumerocoleccion,
        u.idusuarios, 
        u.usuariosnombre, 
        u.usuariosemail, 
        v.variedadesvegetalesnombre, 
        s.semillasstockactual,
        u.usuariosicono,
        (SELECT datosadjuntosruta 
         FROM datosadjuntos 
         WHERE xdatosadjuntosidusuarios = u.idusuarios 
           AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 
           AND (datosadjuntosresultadovalidacion IS NULL OR datosadjuntosresultadovalidacion != 'rechazado')
           AND xdatosadjuntosidvariedadesvegetales IS NULL
         ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC, datosadjuntosfechacreacion DESC 
         LIMIT 1) AS fotoPrincipal
      FROM semillas s
      JOIN variedadesvegetales v ON s.xsemillasidvariedadesvegetales = v.idvariedadesvegetales
      JOIN usuarios u ON s.xsemillasidusuarios = u.idusuarios
      WHERE v.xvariedadesvegetalesidespeciesvegetales = ? AND s.semillasactivosino = 1
      ORDER BY u.usuariosnombre, v.variedadesvegetalesnombre
    `, [idespeciesvegetales]);

    // Query active crops
    const [crops]: any = await pool.query(`
      SELECT 
        c.idcultivos, 
        u.idusuarios, 
        u.usuariosnombre, 
        u.usuariosemail, 
        v.variedadesvegetalesnombre, 
        c.cultivosestado, 
        c.cultivoscantidad,
        u.usuariosicono,
        (SELECT datosadjuntosruta 
         FROM datosadjuntos 
         WHERE xdatosadjuntosidusuarios = u.idusuarios 
           AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 
           AND (datosadjuntosresultadovalidacion IS NULL OR datosadjuntosresultadovalidacion != 'rechazado')
           AND xdatosadjuntosidvariedadesvegetales IS NULL
         ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC, datosadjuntosfechacreacion DESC 
         LIMIT 1) AS fotoPrincipal
      FROM cultivos c
      JOIN variedadesvegetales v ON c.xcultivosidvariedadesvegetales = v.idvariedadesvegetales
      JOIN usuarios u ON c.xcultivosidusuarios = u.idusuarios
      WHERE v.xvariedadesvegetalesidespeciesvegetales = ? AND c.cultivosactivosino = 1
      ORDER BY u.usuariosnombre, v.variedadesvegetalesnombre
    `, [idespeciesvegetales]);

    return NextResponse.json({ seeds, crops });
  } catch (error: any) {
    console.error('Error fetching usuarios vinculados:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios vinculados' }, { status: 500 });
  }
}
