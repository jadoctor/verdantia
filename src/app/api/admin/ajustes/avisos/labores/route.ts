import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [labores] = await pool.query('SELECT idlabores, laboresnombre, laboresicono, laboresnotificable FROM labores ORDER BY laboresnombre ASC');
    return NextResponse.json({ labores });
  } catch (error) {
    console.error('Error fetching labores notificables:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { idlabores, laboresnotificable } = body;
    
    if (!idlabores) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await pool.query('UPDATE labores SET laboresnotificable = ? WHERE idlabores = ?', [laboresnotificable, idlabores]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving labores notificables:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
