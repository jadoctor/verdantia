import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ usuarios: [] });
  }

  try {
    const searchTerm = `%${query.trim()}%`;
    const sql = `
      SELECT 
        u.idusuarios AS id,
        u.usuariosnombre AS nombre,
        u.usuariosicono AS avatar,
        r.logrosnombre AS rango_nombre,
        r.logrosicono AS rango_icono,
        r.logrosnivel AS rango_nivel
      FROM usuarios u
      LEFT JOIN usuarioslogros ul ON u.idusuarios = ul.xusuarioslogrosidusuarios AND ul.usuarioslogrosfechafin IS NULL
      LEFT JOIN logros r ON ul.xusuarioslogrosidlogros = r.idlogros
      WHERE (u.usuariosnombre LIKE ? OR u.usuariosemail LIKE ?) 
        AND u.idusuarios != ?
      LIMIT 10
    `;
    
    const [usuarios] = await pool.query(sql, [searchTerm, searchTerm, user.id]);
    
    return NextResponse.json({ usuarios });
  } catch (error: any) {
    console.error('Error buscando usuarios:', error);
    return NextResponse.json({ error: 'Error al buscar usuarios' }, { status: 500 });
  }
}
