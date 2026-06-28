import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/familias — Listar familias con conteo de especies
export async function GET() {
  try {
    const [familias]: any[] = await pool.query(`
      SELECT f.*, COUNT(e.idespeciesvegetales) as total_especies
      FROM familias f
      LEFT JOIN especiesvegetales e ON e.xespeciesvegetalesidfamilias = f.idfamilias AND e.especiesvegetalesvisibilidadsino = 1
      GROUP BY f.idfamilias
      ORDER BY f.familiasnombre ASC
    `);
    return NextResponse.json({ familias });
  } catch (error: any) {
    console.error('Error fetching familias:', error);
    return NextResponse.json({ error: 'Error al obtener familias' }, { status: 500 });
  }
}

// POST /api/admin/familias — Crear nueva familia
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      familiasnombre,
      familiasnombrecientifico,
      familiasgruporotacion,
      familiasanosdescanso,
      familiascolor,
      familiasemoji,
      familiasnotas,
      familiasprecedentes,
      familiassucesores
    } = body;

    if (!familiasnombre || !familiasgruporotacion) {
      return NextResponse.json({ error: 'Nombre y grupo de rotación son obligatorios' }, { status: 400 });
    }

    // Verificar nombre único
    const [existing]: any[] = await pool.query(
      `SELECT idfamilias FROM familias WHERE LOWER(familiasnombre) = LOWER(?)`,
      [familiasnombre.trim()]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe una familia con ese nombre' }, { status: 409 });
    }

    const [result]: any = await pool.query(
      `INSERT INTO familias (familiasnombre, familiasnombrecientifico, familiasgruporotacion, familiasanosdescanso, familiascolor, familiasemoji, familiasnotas, familiasprecedentes, familiassucesores)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        familiasnombre.trim(),
        familiasnombrecientifico?.trim() || null,
        familiasgruporotacion.trim(),
        familiasanosdescanso || 3,
        familiascolor || '#64748b',
        familiasemoji || '🌿',
        familiasnotas || null,
        familiasprecedentes ? JSON.stringify(familiasprecedentes) : null,
        familiassucesores ? JSON.stringify(familiassucesores) : null
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Familia creada correctamente'
    });
  } catch (error: any) {
    console.error('Error creating familia:', error);
    return NextResponse.json({ error: 'Error al crear familia' }, { status: 500 });
  }
}
