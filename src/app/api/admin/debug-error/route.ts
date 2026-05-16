import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [result] = await pool.query("UPDATE incidencias SET incidenciasestado = 'abierta' WHERE incidenciasestado = 'resuelta' AND incidenciastipo = 'foto_rechazada' AND (incidenciasnotas IS NULL OR incidenciasnotas NOT LIKE '%RESOLUCIÓN DEL EQUIPO%')");
    return NextResponse.json({ success: true, result });
  } catch(e: any) {
    return NextResponse.json({ error: e.message });
  }
}
