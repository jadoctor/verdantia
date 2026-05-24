import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM logros ORDER BY logrosnivel ASC');
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching logros:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json(); // Array of modified logros
    
    // We'll update each one. Simple loop is fine for 10 rows.
    for (const l of data) {
      await pool.query(
        `UPDATE logros SET 
          logrosnombre = ?, logrosicono = ?, privilegios = ?,
          req_antiguedad_meses = ?, req_semillas = ?, req_siembras = ?, req_recolecciones = ?, 
          req_especies = ?, req_fotos = ?, req_mensajes = ?, req_blogs = ?, 
          descuento_pro = ?, req_mantenimiento_mensual = ?
         WHERE idlogros = ?`,
        [
          l.logrosnombre, l.logrosicono, l.privilegios,
          l.req_antiguedad_meses, l.req_semillas, l.req_siembras, l.req_recolecciones,
          l.req_especies, l.req_fotos, l.req_mensajes, l.req_blogs,
          l.descuento_pro, l.req_mantenimiento_mensual,
          l.idlogros
        ]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating logros:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
