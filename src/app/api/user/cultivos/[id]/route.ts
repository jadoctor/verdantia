import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: cultivoId } = await params;

  try {
    const [rows]: any = await pool.query(`
      SELECT 
        c.*,
        COALESCE(NULLIF(vu.variedadesnombre, ''), vg.variedadesnombre) AS variedad_nombre,
        e.especiesnombre,
        COALESCE(
          (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidcultivos = c.idcultivos AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidvariedades = vu.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidvariedades = vg.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidespecies = e.idespecies AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1)
        ) AS foto
      FROM cultivos c
      JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
      LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
      WHERE c.idcultivos = ? AND c.xcultivosidusuarios = ?
    `, [cultivoId, user.id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ cultivo: rows[0] });
  } catch (error: any) {
    console.error('Error fetching cultivo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: cultivoId } = await params;

  try {
    // Verificar que el cultivo pertenezca al usuario
    const [rows]: any = await pool.query(
      'SELECT idcultivos FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?',
      [cultivoId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado o no autorizado' }, { status: 404 });
    }

    // Ocultar/desactivar en lugar de borrar físicamente (Soft Delete)
    await pool.query(
      'UPDATE cultivos SET cultivosactivosino = 0 WHERE idcultivos = ?',
      [cultivoId]
    );

    // TODO: Si un cultivo se elimina, deberíamos considerar qué hacer con sus tareas asociadas,
    // pero de momento un soft delete es suficiente.

    return NextResponse.json({ success: true, message: 'Cultivo eliminado correctamente' });
  } catch (error: any) {
    console.error('Error eliminando cultivo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: cultivoId } = await params;

  try {
    const body = await request.json();
    
    // Verificar que el cultivo pertenezca al usuario
    const [rows]: any = await pool.query(
      'SELECT idcultivos FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?',
      [cultivoId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado o no autorizado' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'cultivosestado',
      'cultivoscantidad',
      'cultivosubicacion',
      'cultivosfechainicio',
      'cultivosfechagerminacion',
      'cultivosfechatrasplante',
      'cultivosfechafinalizacion',
      'cultivosobservaciones'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field] || null); // Convert empty strings to null for dates
      }
    });

    if (updates.length > 0) {
      values.push(cultivoId);
      await pool.query(
        `UPDATE cultivos SET ${updates.join(', ')} WHERE idcultivos = ?`,
        values
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error actualizando cultivo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
