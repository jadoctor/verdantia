import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function PATCH(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const data = await request.json();
    
    if (data.action === 'disable_pauta') {
      const { pautaId, variedadId } = data;
      if (!pautaId || !variedadId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });

      // Obtener la pauta original
      const [rows]: any = await pool.query('SELECT * FROM laborespauta WHERE idlaborespauta = ?', [pautaId]);
      if (rows.length === 0) return NextResponse.json({ error: 'Pauta no encontrada' }, { status: 404 });
      
      const pautaOriginal = rows[0];

      // Verificamos si el usuario ya tiene un override (clon) de esta pauta para esta variedad.
      // La herencia funciona combinando id_labor + id_fase + id_usuario.
      const [existing]: any = await pool.query(`
        SELECT idlaborespauta FROM laborespauta 
        WHERE xlaborespautaidusuarios = ? 
        AND xlaborespautaidlabores = ? 
        AND laborespautafase = ?
      `, [user.id, pautaOriginal.xlaborespautaidlabores, pautaOriginal.laborespautafase]);

      if (existing.length > 0) {
        // Ya existe el clon, lo desactivamos
        await pool.query('UPDATE laborespauta SET laborespautaactivosino = 0 WHERE idlaborespauta = ?', [existing[0].idlaborespauta]);
      } else {
        // No existe, creamos un clon inactivo
        await pool.query(`
          INSERT INTO laborespauta (
            xlaborespautaidvariedadesvegetales,
            xlaborespautaidespeciesvegetales,
            xlaborespautaidusuarios,
            xlaborespautaidlabores,
            laborespautafase,
            laborespautafrecuenciadias,
            laborespautanotasia,
            laborespautaactivosino
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        `, [
          variedadId,
          null, // El clon de usuario se asocia a la variedad
          user.id,
          pautaOriginal.xlaborespautaidlabores,
          pautaOriginal.laborespautafase,
          pautaOriginal.laborespautafrecuenciadias,
          pautaOriginal.laborespautanotasia
        ]);
      }

      return NextResponse.json({ success: true });
    }

    if (data.action === 'enable_pauta') {
      const { pautaId } = data;
      if (!pautaId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });

      // Eliminamos el clon inactivo del usuario para esta pauta
      // Al borrarlo, el sistema volverá a heredar el registro activo del maestro (especie/variedad)
      await pool.query(`
        DELETE FROM laborespauta 
        WHERE idlaborespauta = ? AND xlaborespautaidusuarios = ?
      `, [pautaId, user.id]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in PATCH /variedades/pautas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
