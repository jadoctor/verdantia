import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// Helper removed

export async function GET(request: Request) {


  try {
    const [tiposAvisos] = await pool.query('SELECT * FROM tiposavisos ORDER BY idtiposavisos ASC');
    const [suscripciones] = await pool.query('SELECT idsuscripciones, suscripcionesnombre, suscripcionesprecio FROM suscripciones ORDER BY suscripcionesprecio ASC');
    const [reglas] = await pool.query('SELECT * FROM suscripcionestiposavisos');

    return NextResponse.json({
      tiposavisos: tiposAvisos,
      suscripciones: suscripciones,
      suscripcionestiposavisos: reglas
    });
  } catch (error) {
    console.error('Error fetching avisos data:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {

  try {
    const body = await request.json();
    const reglas = body.reglas;

    if (!Array.isArray(reglas)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    // Usamos una transacción para guardar todas las reglas de forma atómica
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const regla of reglas) {
        const query = `
          INSERT INTO suscripcionestiposavisos (
            xsuscripcionestiposavisosidsuscripciones, 
            xsuscripcionestiposavisosidtiposavisos, 
            suscripcionestiposavisosestado
          ) VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            suscripcionestiposavisosestado = VALUES(suscripcionestiposavisosestado)
        `;
        await connection.query(query, [regla.idSuscripcion, regla.idAviso, regla.estado]);
      }
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving avisos data:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
