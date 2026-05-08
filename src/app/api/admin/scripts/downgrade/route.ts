import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [users] = await pool.query<any>("SELECT idusuarios, usuariosemail, usuariosnombre FROM usuarios WHERE usuariosroles LIKE '%superadministrador%' LIMIT 1");
    if (users.length === 0) return NextResponse.json({ error: 'No superadmin found' });
    
    const admin = users[0];
    
    const [subs] = await pool.query<any>("SELECT idsuscripciones FROM suscripciones WHERE suscripcionesnombre = 'Gratuito' LIMIT 1");
    const freeSubId = subs[0].idsuscripciones;

    await pool.query("UPDATE usuariossuscripciones SET usuariossuscripcionesestado = 'cancelada' WHERE xusuariossuscripcionesidusuarios = ?", [admin.idusuarios]);

    await pool.query(`
      INSERT INTO usuariossuscripciones 
      (xusuariossuscripcionesidusuarios, xusuariossuscripcionesidsuscripciones, usuariossuscripcionesfechainicio, usuariossuscripcionesestado) 
      VALUES (?, ?, NOW(), 'activa')
    `, [admin.idusuarios, freeSubId]);

    return NextResponse.json({ success: true, message: `Downgraded ${admin.usuariosemail} to Gratuito` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
