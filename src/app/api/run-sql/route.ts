import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Endpoint temporal para añadir columnas domicilio y telefono
export async function GET() {
  try {
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS usuariosdomicilio VARCHAR(255) DEFAULT NULL`);
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS usuariostelefono VARCHAR(20) DEFAULT NULL`);
    return NextResponse.json({ success: true, message: 'Columnas domicilio y telefono añadidas' });
  } catch (error: any) {
    // Si "IF NOT EXISTS" no funciona en esta versión de MySQL, intentar con try/catch
    try {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN usuariosdomicilio VARCHAR(255) DEFAULT NULL`);
    } catch { /* ya existe */ }
    try {
      await pool.query(`ALTER TABLE usuarios ADD COLUMN usuariostelefono VARCHAR(20) DEFAULT NULL`);
    } catch { /* ya existe */ }
    return NextResponse.json({ success: true, message: 'Columnas creadas o ya existían' });
  }
}
