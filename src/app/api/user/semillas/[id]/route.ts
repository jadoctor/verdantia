import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: semillaId } = await params;

  try {
    // Verificar que la semilla pertenezca al usuario
    const [rows]: any = await pool.query(
      'SELECT idsemillas FROM semillas WHERE idsemillas = ? AND xsemillasidusuarios = ?',
      [semillaId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Semilla no encontrada o no autorizada' }, { status: 404 });
    }

    // Verificar si la semilla tiene cultivos asociados activos/existentes
    const [crops]: any = await pool.query(
      'SELECT COUNT(*) AS count FROM cultivos WHERE xcultivosidsemillas = ? AND cultivosactivosino = 1',
      [semillaId]
    );

    if (crops.length > 0 && crops[0].count > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar esta semilla porque tiene cultivos asociados activos o en historial.' },
        { status: 400 }
      );
    }

    // Hard Delete: Eliminar fotos asociadas de datosadjuntos y luego el registro de la semilla
    await pool.query(
      'DELETE FROM datosadjuntos WHERE xdatosadjuntosidsemillas = ?',
      [semillaId]
    );

    await pool.query(
      'DELETE FROM semillas WHERE idsemillas = ?',
      [semillaId]
    );

    return NextResponse.json({ success: true, message: 'Semilla eliminada de forma permanente' });
  } catch (error: any) {
    console.error('Error eliminando semilla:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: semillaId } = await params;

  try {
    const body = await request.json();
    const {
      xsemillasidvariedades,
      semillasnumerocoleccion, semillasorigen, semillaslugarcompra, semillasmarca,
      semillasfecharecoleccion, semillasfechaenvasado, semillasfechaadquisicion, semillasprecio, semillasfechacaducidad,
      semillaslote, semillasstockinicial, semillasstockactual, semillasobservaciones,
      semillasdonante, semillascompartir
    } = body;

    // Verificar que la semilla pertenezca al usuario
    const [rows]: any = await pool.query(
      'SELECT idsemillas FROM semillas WHERE idsemillas = ? AND xsemillasidusuarios = ?',
      [semillaId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Semilla no encontrada o no autorizada' }, { status: 404 });
    }

    let finalDonante = null;
    let finalUsuarioDonanteId = null;

    if (semillasdonante && semillasdonante.trim() !== '') {
      const searchTerm = semillasdonante.trim();
      const searchUsername = searchTerm.replace(/^@/, '');
      
      const [userRows]: any = await pool.query(
        'SELECT idusuarios FROM usuarios WHERE usuariosemail = ? OR usuariosnombreusuario = ? LIMIT 1',
        [searchTerm, searchUsername]
      );
      
      if (userRows.length > 0) {
        finalUsuarioDonanteId = userRows[0].idusuarios;
      } else {
        finalDonante = searchTerm;
      }
    }

    let finalCompartir = body.semillascompartir !== undefined ? (body.semillascompartir ? 1 : 0) : null;
    const isExpired = semillasfechacaducidad && new Date(semillasfechacaducidad) < new Date();
    const isOutOfStock = semillasstockactual !== null && semillasstockactual !== '' && Number(semillasstockactual) <= 0;
    if (isExpired || isOutOfStock) {
      finalCompartir = 0;
    }

    await pool.query(
      `UPDATE semillas SET 
        xsemillasidvariedades = COALESCE(?, xsemillasidvariedades),
        semillasnumerocoleccion = ?,
        semillasorigen = ?,
        semillaslugarcompra = ?,
        semillasmarca = ?,
        semillasfecharecoleccion = ?,
        semillasfechaenvasado = ?,
        semillasfechaadquisicion = ?,
        semillasprecio = ?,
        semillasfechacaducidad = ?,
        semillaslote = ?,
        semillasstockinicial = ?,
        semillasstockactual = ?,
        semillasobservaciones = ?,
        semillasdonante = ?,
        xsemillasidusuariodonante = ?,
        semillasactivosino = COALESCE(?, semillasactivosino),
        semillascompartir = COALESCE(?, semillascompartir)
       WHERE idsemillas = ? AND xsemillasidusuarios = ?`,
      [
        xsemillasidvariedades || null,
        semillasnumerocoleccion || null,
        semillasorigen || 'cosecha_propia',
        semillaslugarcompra || null,
        semillasmarca || null,
        semillasfecharecoleccion || null,
        semillasfechaenvasado || null,
        semillasfechaadquisicion || null,
        semillasprecio || null,
        semillasfechacaducidad || null,
        semillaslote || null,
        semillasstockinicial || null,
        semillasstockactual || null,
        semillasobservaciones || null,
        finalDonante,
        finalUsuarioDonanteId,
        body.semillasactivosino !== undefined ? body.semillasactivosino : null,
        finalCompartir,
        semillaId,
        user.id
      ]
    );

    return NextResponse.json({ success: true, message: 'Semilla actualizada correctamente' });
  } catch (error: any) {
    console.error('Error actualizando semilla:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
