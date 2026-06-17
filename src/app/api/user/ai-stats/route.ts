import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    // Aseguramos que la tabla exista (solo por precaución, aunque esto se ejecutará rápido)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historialia (
        idhistorialia INT AUTO_INCREMENT PRIMARY KEY,
        xhistorialiaidusuarios INT NOT NULL,
        historialiafecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        historialiamodulo VARCHAR(50) NOT NULL,
        historialiaprompt TEXT,
        historialiarespuesta TEXT,
        historialiaexito TINYINT(1) DEFAULT 1,
        FOREIGN KEY (xhistorialiaidusuarios) REFERENCES usuarios(idusuarios) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Calcular el máximo según el plan
    const cleanName = (user.suscripcion || '').toLowerCase();
    let maxConsultas = 5; // Básica
    let maxImages = 1; // Básica

    if (cleanName.includes('premium')) {
      maxConsultas = 100;
      maxImages = 4;
    } else if (cleanName.includes('avanzado') || cleanName.includes('profesional')) {
      maxConsultas = 50;
      maxImages = 3;
    } else if (cleanName.includes('esencial') || cleanName.includes('avanzada')) {
      maxConsultas = 20;
      maxImages = 2;
    }

    // Si es superadmin o tiene Premium ilimitado forzado en código
    if (user.roles.includes('superadministrador')) {
      maxConsultas = 100; // Trataremos 100 como Premium
      maxImages = 4;
    }

    // Contar las de este mes
    const [rows]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM historialia 
      WHERE xhistorialiaidusuarios = ? 
        AND MONTH(historialiafecha) = MONTH(CURRENT_DATE())
        AND YEAR(historialiafecha) = YEAR(CURRENT_DATE())
    `, [user.id]);

    const usedConsultas = rows[0].count;

    return NextResponse.json({
      used: usedConsultas,
      max: maxConsultas,
      remaining: Math.max(0, maxConsultas - usedConsultas),
      maxImages
    });
  } catch (error) {
    console.error('Error obteniendo stats de IA:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
