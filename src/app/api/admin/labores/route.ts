import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// Helper for authentication and authorization
async function authenticateSuperadmin(request: NextRequest) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

// GET /api/admin/labores
export async function GET(req: NextRequest) {
  try {
    const isAdmin = await authenticateSuperadmin(req);
    if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const [rows] = await pool.query(`
      SELECT l.*, 
             d.datosadjuntosruta as primary_photo_ruta, 
             d.datosadjuntosresumen as primary_photo_resumen 
      FROM labores l 
      LEFT JOIN datosadjuntos d 
        ON d.iddatosadjuntos = (
          SELECT d2.iddatosadjuntos 
          FROM datosadjuntos d2 
          WHERE d2.xdatosadjuntosidlabores = l.idlabores 
            AND d2.datosadjuntostipo = 'imagen' 
            AND d2.datosadjuntosactivo = 1 
          ORDER BY d2.datosadjuntosesprincipal DESC, d2.iddatosadjuntos ASC 
          LIMIT 1
        )
      ORDER BY l.idlabores
    `);
    return NextResponse.json({ success: true, labores: rows });
  } catch (error: any) {
    console.error('Error fetching labores:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// POST /api/admin/labores
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await authenticateSuperadmin(req);
    if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const data = await req.json();
    const { laboresnombre, laboresdescripcion, laboresicono, laborescolor, laboresactivosino } = data;

    if (!laboresnombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const [result]: any = await pool.query(
      `INSERT INTO labores 
       (laboresnombre, laboresdescripcion, laboresicono, laborescolor, laboresactivosino) 
       VALUES (?, ?, ?, ?, ?)`,
      [laboresnombre, laboresdescripcion || '', laboresicono || '', laborescolor || '#64748b', laboresactivosino !== undefined ? laboresactivosino : 1]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating labor:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
