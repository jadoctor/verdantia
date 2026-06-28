import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idespeciesvegetales = resolvedParams.id;

    // 1. Beneficiosas (donde la especie es origen)
    const [beneficiosas]: any = await pool.query(`
      SELECT a.*, e.especiesvegetalesnombre as especie_destino_nombre 
      FROM asociacionesbeneficiosas a
      JOIN especiesvegetales e ON a.xasociacionesbeneficiosasidespeciedestino = e.idespeciesvegetales
      WHERE a.xasociacionesbeneficiosasidespecieorigen = ?
    `, [idespeciesvegetales]);

    // 2. Perjudiciales (donde la especie es origen)
    const [perjudiciales]: any = await pool.query(`
      SELECT a.*, e.especiesvegetalesnombre as especie_destino_nombre 
      FROM asociacionesperjudiciales a
      JOIN especiesvegetales e ON a.xasociacionesperjudicialesidespeciedestino = e.idespeciesvegetales
      WHERE a.xasociacionesperjudicialesidespecieorigen = ?
    `, [idespeciesvegetales]);

    // 3. Afecciones
    const [afecciones]: any = await pool.query(`
      SELECT ea.*, a.afeccionesnombre, a.afeccionestipo 
      FROM especiesafecciones ea
      JOIN afecciones a ON ea.xespeciesvegetalesafeccionesidafecciones = a.idafecciones
      WHERE ea.xespeciesvegetalesafeccionesidespeciesvegetales = ?
    `, [idespeciesvegetales]);

    return NextResponse.json({
      beneficiosas,
      perjudiciales,
      afecciones
    });
  } catch (error: any) {
    console.error('Error fetching relations:', error);
    return NextResponse.json({ error: 'Error al obtener relaciones' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const connection = await pool.getConnection();
  try {
    const idespeciesvegetales = resolvedParams.id;
    const { beneficiosas, perjudiciales, afecciones } = await request.json();

    await connection.beginTransaction();

    // -- ASOCIACIONES BENEFICIOSAS --
    await connection.query('DELETE FROM asociacionesbeneficiosas WHERE xasociacionesbeneficiosasidespecieorigen = ?', [idespeciesvegetales]);
    if (beneficiosas && beneficiosas.length > 0) {
      const values = beneficiosas.map((b: any) => [idespeciesvegetales, b.xasociacionesbeneficiosasidespeciedestino, b.asociacionesbeneficiosasmotivo || null]);
      await connection.query(`
        INSERT INTO asociacionesbeneficiosas (xasociacionesbeneficiosasidespecieorigen, xasociacionesbeneficiosasidespeciedestino, asociacionesbeneficiosasmotivo)
        VALUES ?
      `, [values]);
    }

    // -- ASOCIACIONES PERJUDICIALES --
    await connection.query('DELETE FROM asociacionesperjudiciales WHERE xasociacionesperjudicialesidespecieorigen = ?', [idespeciesvegetales]);
    if (perjudiciales && perjudiciales.length > 0) {
      const values = perjudiciales.map((p: any) => [idespeciesvegetales, p.xasociacionesperjudicialesidespeciedestino, p.asociacionesperjudicialesmotivo || null]);
      await connection.query(`
        INSERT INTO asociacionesperjudiciales (xasociacionesperjudicialesidespecieorigen, xasociacionesperjudicialesidespeciedestino, asociacionesperjudicialesmotivo)
        VALUES ?
      `, [values]);
    }

    // -- AFECCIONES --
    await connection.query('DELETE FROM especiesafecciones WHERE xespeciesvegetalesafeccionesidespeciesvegetales = ?', [idespeciesvegetales]);
    if (afecciones && afecciones.length > 0) {
      const values = afecciones.map((a: any) => [
        idespeciesvegetales, 
        a.xespeciesvegetalesafeccionesidafecciones !== undefined ? a.xespeciesvegetalesafeccionesidafecciones : a.xrelacionesafeccionesideplaga, 
        a.especiesafeccionesnivelriesgo || a.relacionesafeccionesriesgo || 'media', 
        a.especiesafeccionesnotasespecificas || a.relacionesafeccionesnotas || null
      ]);
      await connection.query(`
        INSERT INTO especiesafecciones (xespeciesvegetalesafeccionesidespeciesvegetales, xespeciesvegetalesafeccionesidafecciones, especiesafeccionesnivelriesgo, especiesafeccionesnotasespecificas)
        VALUES ?
      `, [values]);
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await connection.rollback();
    connection.release();
    console.error('Error updating relations:', error);
    return NextResponse.json({ error: 'Error al actualizar relaciones' }, { status: 500 });
  }
}
