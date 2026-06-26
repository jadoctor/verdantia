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

export async function GET(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const [rows]: any = await pool.query(`
      SELECT 
        d.iddatosadjuntos, 
        d.datosadjuntosruta as ruta, 
        d.datosadjuntosnombreoriginal as nombreOriginal, 
        d.datosadjuntostitulo as titulo,
        d.datosadjuntosresumen as apuntes,
        d.datosadjuntosautores as autores,
        d.datosadjuntosidentificacion as identificacion,
        d.xdatosadjuntosidespecies,
        d.xdatosadjuntosidvariedades,
        d.xdatosadjuntosidtratamientos,
        d.xdatosadjuntosidlabores,
        d.xdatosadjuntosidafecciones,
        COALESCE(d.xdatosadjuntosidespecies, d.xdatosadjuntosidvariedades, d.xdatosadjuntosidtratamientos, d.xdatosadjuntosidlabores, d.xdatosadjuntosidafecciones) as entityId,
        CASE
          WHEN d.xdatosadjuntosidespecies IS NOT NULL THEN 'Especies'
          WHEN d.xdatosadjuntosidvariedades IS NOT NULL THEN 'Variedades'
          WHEN d.xdatosadjuntosidtratamientos IS NOT NULL THEN 'Tratamientos'
          WHEN d.xdatosadjuntosidlabores IS NOT NULL THEN 'Labores'
          WHEN d.xdatosadjuntosidafecciones IS NOT NULL THEN 'Afecciones'
          WHEN d.xdatosadjuntosidcontenedores IS NOT NULL THEN 'Contenedores'
          WHEN d.xdatosadjuntosidplantasparte IS NOT NULL THEN 'Partes de Planta'
          ELSE 'Desconocido'
        END as modulo,
        CASE
          WHEN d.xdatosadjuntosidespecies IS NOT NULL THEN CONCAT('/dashboard/admin/especies/', d.xdatosadjuntosidespecies)
          WHEN d.xdatosadjuntosidvariedades IS NOT NULL THEN CONCAT('/dashboard/admin/variedades/', d.xdatosadjuntosidvariedades)
          WHEN d.xdatosadjuntosidtratamientos IS NOT NULL THEN CONCAT('/dashboard/admin/tratamientos/', d.xdatosadjuntosidtratamientos)
          WHEN d.xdatosadjuntosidlabores IS NOT NULL THEN CONCAT('/dashboard/admin/labores/', d.xdatosadjuntosidlabores)
          WHEN d.xdatosadjuntosidafecciones IS NOT NULL THEN CONCAT('/dashboard/admin/afecciones/', d.xdatosadjuntosidafecciones)
          ELSE NULL
        END as entityRoute,
        (SELECT COUNT(*) FROM blog WHERE JSON_EXTRACT(blogcontenido, '$.pdf_source_id') = d.iddatosadjuntos) as relatedBlogsCount
      FROM datosadjuntos d
      WHERE d.datosadjuntosruta LIKE 'http%' 
      AND d.datosadjuntostipo = 'documento'
      AND d.datosadjuntosactivo = 1
      ORDER BY d.iddatosadjuntos DESC
    `);

    return NextResponse.json({ enlaces: rows });
  } catch (error: any) {
    console.error('Error fetching enlaces:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { iddatosadjuntos, nuevaRuta } = data;

    if (!iddatosadjuntos || !nuevaRuta) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // Actualizamos solo la ruta, manteniendo el título, nombre y apuntes.
    await pool.query(
      `UPDATE datosadjuntos 
       SET datosadjuntosruta = ? 
       WHERE iddatosadjuntos = ?`,
      [nuevaRuta, iddatosadjuntos]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating enlace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
