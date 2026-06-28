import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Migración: Añadir columnas para el sistema de herencia de variedades de usuario
export async function GET() {
  const results: string[] = [];

  // ═══════════════════════════════════════════
  // 1. Tabla variedades: +2 columnas
  // ═══════════════════════════════════════════
  try {
    await pool.query(`ALTER TABLE variedades ADD COLUMN xvariedadesvegetalesidusuarios INT DEFAULT NULL`);
    results.push('✅ variedades.xvariedadesvegetalesidusuarios creada');
  } catch (e: any) {
    results.push(e.code === 'ER_DUP_FIELDNAME' ? '⏭️ variedades.xvariedadesvegetalesidusuarios ya existía' : `❌ variedades.xvariedadesvegetalesidusuarios: ${e.message}`);
  }

  try {
    await pool.query(`ALTER TABLE variedades ADD COLUMN xvariedadesvegetalesidvariedadorigen INT DEFAULT NULL`);
    results.push('✅ variedades.xvariedadesvegetalesidvariedadorigen creada');
  } catch (e: any) {
    results.push(e.code === 'ER_DUP_FIELDNAME' ? '⏭️ variedades.xvariedadesvegetalesidvariedadorigen ya existía' : `❌ variedades.xvariedadesvegetalesidvariedadorigen: ${e.message}`);
  }

  // Índices
  try {
    await pool.query(`CREATE INDEX idx_variedades_usuario ON variedades(xvariedadesvegetalesidusuarios)`);
    results.push('✅ Índice idx_variedades_usuario creado');
  } catch (e: any) {
    results.push(e.code === 'ER_DUP_KEYNAME' ? '⏭️ Índice idx_variedades_usuario ya existía' : `❌ Índice: ${e.message}`);
  }

  try {
    await pool.query(`CREATE INDEX idx_variedades_origen ON variedades(xvariedadesvegetalesidvariedadorigen)`);
    results.push('✅ Índice idx_variedades_origen creado');
  } catch (e: any) {
    results.push(e.code === 'ER_DUP_KEYNAME' ? '⏭️ Índice idx_variedades_origen ya existía' : `❌ Índice: ${e.message}`);
  }

  // FK constraints (may fail if data integrity issues, so catch gracefully)
  try {
    await pool.query(`ALTER TABLE variedades ADD CONSTRAINT fk_variedades_usuario FOREIGN KEY (xvariedadesvegetalesidusuarios) REFERENCES usuarios(idusuarios) ON DELETE CASCADE`);
    results.push('✅ FK fk_variedades_usuario creada');
  } catch (e: any) {
    results.push(e.code === 'ER_FK_DUP_NAME' || e.message?.includes('Duplicate') ? '⏭️ FK fk_variedades_usuario ya existía' : `❌ FK: ${e.message}`);
  }

  try {
    await pool.query(`ALTER TABLE variedades ADD CONSTRAINT fk_variedades_origen FOREIGN KEY (xvariedadesvegetalesidvariedadorigen) REFERENCES variedades(idvariedadesvegetales) ON DELETE SET NULL`);
    results.push('✅ FK fk_variedades_origen creada');
  } catch (e: any) {
    results.push(e.code === 'ER_FK_DUP_NAME' || e.message?.includes('Duplicate') ? '⏭️ FK fk_variedades_origen ya existía' : `❌ FK: ${e.message}`);
  }

  // ═══════════════════════════════════════════
  // 2. Tabla laborespauta: +2 columnas
  // ═══════════════════════════════════════════
  try {
    await pool.query(`ALTER TABLE laborespauta ADD COLUMN xlaborespautaidusuarios INT DEFAULT NULL`);
    results.push('✅ laborespauta.xlaborespautaidusuarios creada');
  } catch (e: any) {
    results.push(e.code === 'ER_DUP_FIELDNAME' ? '⏭️ laborespauta.xlaborespautaidusuarios ya existía' : `❌ laborespauta.xlaborespautaidusuarios: ${e.message}`);
  }

  try {
    await pool.query(`ALTER TABLE laborespauta ADD COLUMN xlaborespautaidvariedadesvegetales INT DEFAULT NULL`);
    results.push('✅ laborespauta.xlaborespautaidvariedadesvegetales creada');
  } catch (e: any) {
    results.push(e.code === 'ER_DUP_FIELDNAME' ? '⏭️ laborespauta.xlaborespautaidvariedadesvegetales ya existía' : `❌ laborespauta.xlaborespautaidvariedadesvegetales: ${e.message}`);
  }

  // Índice
  try {
    await pool.query(`CREATE INDEX idx_laborespauta_usuario ON laborespauta(xlaborespautaidusuarios)`);
    results.push('✅ Índice idx_laborespauta_usuario creado');
  } catch (e: any) {
    results.push(e.code === 'ER_DUP_KEYNAME' ? '⏭️ Índice idx_laborespauta_usuario ya existía' : `❌ Índice: ${e.message}`);
  }

  // FK constraints
  try {
    await pool.query(`ALTER TABLE laborespauta ADD CONSTRAINT fk_laborespauta_usuario FOREIGN KEY (xlaborespautaidusuarios) REFERENCES usuarios(idusuarios) ON DELETE CASCADE`);
    results.push('✅ FK fk_laborespauta_usuario creada');
  } catch (e: any) {
    results.push(e.code === 'ER_FK_DUP_NAME' || e.message?.includes('Duplicate') ? '⏭️ FK fk_laborespauta_usuario ya existía' : `❌ FK: ${e.message}`);
  }

  try {
    await pool.query(`ALTER TABLE laborespauta ADD CONSTRAINT fk_laborespauta_variedad FOREIGN KEY (xlaborespautaidvariedadesvegetales) REFERENCES variedades(idvariedadesvegetales) ON DELETE CASCADE`);
    results.push('✅ FK fk_laborespauta_variedad creada');
  } catch (e: any) {
    results.push(e.code === 'ER_FK_DUP_NAME' || e.message?.includes('Duplicate') ? '⏭️ FK fk_laborespauta_variedad ya existía' : `❌ FK: ${e.message}`);
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Migración Mis Plantas completada',
    results 
  });
}
