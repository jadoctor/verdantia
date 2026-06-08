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
    const idespecies = resolvedParams.id;

    // Query active seeds
    const [seeds]: any = await pool.query(`
      SELECT 
        s.idsemillas, 
        s.semillasnumerocoleccion,
        u.idusuarios, 
        u.usuariosnombre, 
        u.usuariosemail, 
        v.variedadesnombre, 
        s.semillasstockactual,
        u.usuariosicono,
        (SELECT datosadjuntosruta 
         FROM datosadjuntos 
         WHERE xdatosadjuntosidusuarios = u.idusuarios 
           AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 
           AND (datosadjuntosresultadovalidacion IS NULL OR datosadjuntosresultadovalidacion != 'rechazado')
           AND xdatosadjuntosidvariedades IS NULL
         ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC, datosadjuntosfechacreacion DESC 
         LIMIT 1) AS fotoPrincipal
      FROM semillas s
      JOIN variedades v ON s.xsemillasidvariedades = v.idvariedades
      JOIN usuarios u ON s.xsemillasidusuarios = u.idusuarios
      WHERE v.xvariedadesidespecies = ? AND s.semillasactivosino = 1
      ORDER BY u.usuariosnombre, v.variedadesnombre
    `, [idespecies]);

    // Query active crops
    const [crops]: any = await pool.query(`
      SELECT 
        c.idcultivos, 
        u.idusuarios, 
        u.usuariosnombre, 
        u.usuariosemail, 
        v.variedadesnombre, 
        c.cultivosestado, 
        c.cultivoscantidad,
        u.usuariosicono,
        (SELECT datosadjuntosruta 
         FROM datosadjuntos 
         WHERE xdatosadjuntosidusuarios = u.idusuarios 
           AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 
           AND (datosadjuntosresultadovalidacion IS NULL OR datosadjuntosresultadovalidacion != 'rechazado')
           AND xdatosadjuntosidvariedades IS NULL
         ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC, datosadjuntosfechacreacion DESC 
         LIMIT 1) AS fotoPrincipal
      FROM cultivos c
      JOIN variedades v ON c.xcultivosidvariedades = v.idvariedades
      JOIN usuarios u ON c.xcultivosidusuarios = u.idusuarios
      WHERE v.xvariedadesidespecies = ? AND c.cultivosactivosino = 1
      ORDER BY u.usuariosnombre, v.variedadesnombre
    `, [idespecies]);

    return NextResponse.json({ seeds, crops });
  } catch (error: any) {
    console.error('Error fetching usuarios vinculados:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios vinculados' }, { status: 500 });
  }
}
