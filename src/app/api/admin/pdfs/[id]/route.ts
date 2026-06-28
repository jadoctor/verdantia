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

  const id = resolvedParams.id;

  try {
    const [rows] = await pool.query(
      `SELECT 
        d.iddatosadjuntos as id,
        d.datosadjuntosruta as ruta,
        d.datosadjuntosnombreoriginal as nombreOriginal,
        d.datosadjuntostitulo as titulo,
        d.datosadjuntosresumen as resumen,
        d.datosadjuntosapuntes as apuntes,
        d.datosadjuntosportada as portada,
        d.datosadjuntosautores as autores,
        d.datosadjuntosidentificacion as identificacion,
        d.datosadjuntosactivo as activo,
        d.xdatosadjuntosidespeciesvegetales as idespeciesvegetales,
        d.xdatosadjuntosidvariedadesvegetales as idvariedadesvegetales,
        d.xdatosadjuntosidlabores as idlabores,
        d.xdatosadjuntosidafecciones as idafecciones,
        d.xdatosadjuntosidtratamientos as idtratamientos,
        d.xdatosadjuntosidplantasparte as idplantasparte,
        (SELECT COUNT(*) FROM blog WHERE JSON_UNQUOTE(JSON_EXTRACT(blogcontenido, '$.pdf_source_id')) = d.iddatosadjuntos) as blogsAsociados
       FROM datosadjuntos d
       WHERE d.iddatosadjuntos = ? 
       AND d.datosadjuntostipo = 'documento'`,
      [id]
    );

    const data = rows as any[];
    if (data.length === 0) {
      return NextResponse.json({ error: 'PDF no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ pdf: data[0] });
  } catch (error: any) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const id = resolvedParams.id;

  try {
    const body = await request.json();
    
    const updates: string[] = [];
    const values: any[] = [];

    if (body.titulo !== undefined) {
      updates.push('datosadjuntostitulo = ?');
      values.push(body.titulo);
    }
    if (body.resumen !== undefined) {
      updates.push('datosadjuntosresumen = ?');
      values.push(body.resumen);
    }
    if (body.apuntes !== undefined) {
      updates.push('datosadjuntosapuntes = ?');
      values.push(body.apuntes);
    }
    if (body.portada !== undefined) {
      updates.push('datosadjuntosportada = ?');
      values.push(body.portada);
    }
    if (body.activo !== undefined) {
      updates.push('datosadjuntosactivo = ?');
      values.push(body.activo);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    values.push(id);
    await pool.query(
      `UPDATE datosadjuntos SET ${updates.join(', ')} WHERE iddatosadjuntos = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating PDF:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
