import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

/**
 * ⚠️ ENDPOINT TEMPORAL DE PRUEBAS — ELIMINA AL USUARIO Y TODOS SUS DATOS
 * Debe eliminarse antes de subir a producción.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = parseInt(id);
  if (!userId || isNaN(userId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    // Verificar que el usuario existe y NO es superadministrador
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT idusuarios, usuariosnombre, usuariosemail, usuariosroles FROM usuarios WHERE idusuarios = ?',
      [userId]
    );
    if (users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    const user = users[0];
    if (user.usuariosroles?.includes('superadministrador')) {
      return NextResponse.json({ error: 'No se puede eliminar a un superadministrador' }, { status: 403 });
    }

    // Tablas que pueden tener FK a usuarios (orden: hijas primero)
    // Las que tienen ON DELETE CASCADE se borrarán automáticamente,
    // pero por seguridad las limpiamos explícitamente
    const childTables = [
      { table: 'usuarioslogros', fk: 'xusuarioslogrosidusuarios' },
      { table: 'notificaciones', fk: 'xnotificacionesidusuarios' },
      { table: 'chatmensajes', fk: 'xchatmensajesidusuarios' },
      { table: 'fotosespecies', fk: 'xfotosespeciesidusuarios' },
      { table: 'recolecciones', fk: 'xrecoleccionesidusuarios' },
      { table: 'siembras', fk: 'xsiembrasidusuarios' },
      { table: 'semillas', fk: 'xsemillasidusuarios' },
      { table: 'laborespauta', fk: 'xlaborespautaidusuarios' },
      { table: 'variedades', fk: 'xvariedadesidusuarios' },
      { table: 'especies', fk: 'xespeciesidusuarios' },
      { table: 'blogposts', fk: 'xblogpostsidusuarios' },
    ];

    const results: string[] = [];

    for (const { table, fk } of childTables) {
      try {
        // Verificar si la tabla existe
        const [tableCheck] = await pool.query<RowDataPacket[]>(
          `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
          [table]
        );
        if (tableCheck[0].cnt === 0) continue;

        // Verificar si la columna FK existe
        const [colCheck] = await pool.query<RowDataPacket[]>(
          `SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
          [table, fk]
        );
        if (colCheck[0].cnt === 0) continue;

        const [delResult]: any = await pool.query(`DELETE FROM \`${table}\` WHERE \`${fk}\` = ?`, [userId]);
        if (delResult.affectedRows > 0) {
          results.push(`${table}: ${delResult.affectedRows} registros eliminados`);
        }
      } catch (tableErr: any) {
        results.push(`${table}: error (${tableErr.message})`);
      }
    }

    // Finalmente, eliminar al propio usuario
    await pool.query('DELETE FROM usuarios WHERE idusuarios = ?', [userId]);
    results.push(`usuarios: usuario #${userId} (${user.usuariosemail}) ELIMINADO`);

    return NextResponse.json({ success: true, details: results });
  } catch (error: any) {
    console.error('Error en purga total:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
