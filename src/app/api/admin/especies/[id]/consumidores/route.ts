import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';
import pool from '@/lib/db';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        ec.idespeciesconsumidores,
        ec.xespeciesconsumidoresidespecies,
        ec.xespeciesconsumidoresidconsumidores,
        ec.especiesconsumidoresesapto,
        ec.xespeciesconsumidoresidplantasparte,
        pp.plantaspartenombre AS especiesconsumidorespartes,
        pp.plantasparteemoji AS especiesconsumidoresemoji,
        ec.especiesconsumidoresnotas,
        c.consumidoresnombre
      FROM especiesconsumidores ec
      JOIN consumidores c ON ec.xespeciesconsumidoresidconsumidores = c.idconsumidores
      LEFT JOIN plantasparte pp ON ec.xespeciesconsumidoresidplantasparte = pp.idplantasparte
      WHERE ec.xespeciesconsumidoresidespecies = ?
    `, [resolvedParams.id]);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching consumos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const { consumos } = await request.json();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const c of consumos) {
        if (!c.xespeciesconsumidoresidconsumidores) continue;

        if (c.idespeciesconsumidores) {
          // Update
          await connection.query(`
            UPDATE especiesconsumidores SET 
              xespeciesconsumidoresidconsumidores = ?,
              especiesconsumidoresesapto = ?,
              xespeciesconsumidoresidplantasparte = ?,
              especiesconsumidoresnotas = ?
            WHERE idespeciesconsumidores = ? AND xespeciesconsumidoresidespecies = ?
          `, [
            c.xespeciesconsumidoresidconsumidores,
            c.especiesconsumidoresesapto,
            c.xespeciesconsumidoresidplantasparte || null,
            c.especiesconsumidoresnotas || '',
            c.idespeciesconsumidores,
            resolvedParams.id
          ]);
        } else {
          // Insert
          await connection.query(`
            INSERT INTO especiesconsumidores (
              xespeciesconsumidoresidespecies,
              xespeciesconsumidoresidconsumidores,
              especiesconsumidoresesapto,
              xespeciesconsumidoresidplantasparte,
              especiesconsumidoresnotas
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            resolvedParams.id,
            c.xespeciesconsumidoresidconsumidores,
            c.especiesconsumidoresesapto,
            c.xespeciesconsumidoresidplantasparte || null,
            c.especiesconsumidoresnotes || c.especiesconsumidoresnotas || ''
          ]);
        }
      }

      await connection.commit();
      return NextResponse.json({ success: true });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error saving consumos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const url = new URL(request.url);
    const consumoId = url.searchParams.get('id');

    if (!consumoId) {
      return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
    }

    await pool.query(
      'DELETE FROM especiesconsumidores WHERE idespeciesconsumidores = ? AND xespeciesconsumidoresidespecies = ?',
      [consumoId, resolvedParams.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting consumo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
