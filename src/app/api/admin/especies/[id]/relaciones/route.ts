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
    const idespecies = resolvedParams.id;

    // 1. Beneficiosas (donde la especie es origen)
    const [beneficiosas]: any = await pool.query(`
      SELECT a.*, e.especiesnombre as especie_destino_nombre 
      FROM asociacionesbeneficiosas a
      JOIN especies e ON a.xasociacionesbeneficiosasidespeciedestino = e.idespecies
      WHERE a.xasociacionesbeneficiosasidespecieorigen = ?
    `, [idespecies]);

    // 2. Perjudiciales (donde la especie es origen)
    const [perjudiciales]: any = await pool.query(`
      SELECT a.*, e.especiesnombre as especie_destino_nombre 
      FROM asociacionesperjudiciales a
      JOIN especies e ON a.xasociacionesperjudicialesidespeciedestino = e.idespecies
      WHERE a.xasociacionesperjudicialesidespecieorigen = ?
    `, [idespecies]);

    // 3. Plagas
    const [plagas]: any = await pool.query(`
      SELECT ep.*, p.plagasnombre, p.plagastipo 
      FROM especiesplagas ep
      JOIN plagas p ON ep.xespeciesplagasidplagas = p.idplagas
      WHERE ep.xespeciesplagasidespecies = ?
    `, [idespecies]);

    return NextResponse.json({
      beneficiosas,
      perjudiciales,
      plagas
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
    const idespecies = resolvedParams.id;
    const { beneficiosas, perjudiciales, plagas } = await request.json();

    await connection.beginTransaction();

    // -- ASOCIACIONES BENEFICIOSAS --
    await connection.query('DELETE FROM asociacionesbeneficiosas WHERE xasociacionesbeneficiosasidespecieorigen = ?', [idespecies]);
    if (beneficiosas && beneficiosas.length > 0) {
      const values = beneficiosas.map((b: any) => [idespecies, b.xasociacionesbeneficiosasidespeciedestino, b.asociacionesbeneficiosasmotivo || null]);
      await connection.query(`
        INSERT INTO asociacionesbeneficiosas (xasociacionesbeneficiosasidespecieorigen, xasociacionesbeneficiosasidespeciedestino, asociacionesbeneficiosasmotivo)
        VALUES ?
      `, [values]);
    }

    // -- ASOCIACIONES PERJUDICIALES --
    await connection.query('DELETE FROM asociacionesperjudiciales WHERE xasociacionesperjudicialesidespecieorigen = ?', [idespecies]);
    if (perjudiciales && perjudiciales.length > 0) {
      const values = perjudiciales.map((p: any) => [idespecies, p.xasociacionesperjudicialesidespeciedestino, p.asociacionesperjudicialesmotivo || null]);
      await connection.query(`
        INSERT INTO asociacionesperjudiciales (xasociacionesperjudicialesidespecieorigen, xasociacionesperjudicialesidespeciedestino, asociacionesperjudicialesmotivo)
        VALUES ?
      `, [values]);
    }

    // -- PLAGAS --
    await connection.query('DELETE FROM especiesplagas WHERE xespeciesplagasidespecies = ?', [idespecies]);
    if (plagas && plagas.length > 0) {
      const values = plagas.map((p: any) => [idespecies, p.xespeciesplagasidplagas, p.especiesplagasnivelriesgo || 'media', p.especiesplagasnotasespecificas || null]);
      await connection.query(`
        INSERT INTO especiesplagas (xespeciesplagasidespecies, xespeciesplagasidplagas, especiesplagasnivelriesgo, especiesplagasnotasespecificas)
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
