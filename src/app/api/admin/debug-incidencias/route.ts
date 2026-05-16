import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notas = '\n--- RECURSO DEL USUARIO (2026-05-14) ---\nSoy feo pero no tanto\n\n--- RESOLUCIÓN DEL EQUIPO (2026-05-14) ---\nDefinitivamente la foto incumple las normas de calidad. Usa una con mejor iluminación.';
    await pool.query('UPDATE incidencias SET incidenciasnotas = ? WHERE idincidencias = 8', [notas]);
    
    const [rows]: any = await pool.query('SELECT * FROM incidencias ORDER BY idincidencias DESC LIMIT 5');
    return NextResponse.json({ success: true, incidencias: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
