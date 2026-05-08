import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, action } = await request.json();
    if (!email || !action) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });

    if (action === 'reactivate') {
      await pool.query("UPDATE usuarios SET usuariosestadocuenta = 'activa' WHERE usuariosemail = ?", [email]);
      // Reactivar todos los avisos del usuario
      await pool.query(`
        UPDATE usuariosavisos 
        SET usuariosavisosactivo = 1 
        WHERE xusuariosavisosidusuarios = (SELECT idusuarios FROM usuarios WHERE usuariosemail = ? LIMIT 1)
      `, [email]);
      return NextResponse.json({ success: true });
    }
    
    if (action === 'delete') {
      await pool.query("UPDATE usuarios SET usuariosestadocuenta = 'eliminada' WHERE usuariosemail = ?", [email]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error in account-state route:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
