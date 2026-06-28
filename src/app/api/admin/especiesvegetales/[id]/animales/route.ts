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
        ec.idespeciesanimales,
        ec.xespeciesvegetalesanimalesidespeciesvegetales,
        ec.xespeciesvegetalesanimalesidespeciesanimales,
        ec.especiesanimalesesapto,
        ec.xespeciesvegetalesanimalesidplantasparte,
        pp.plantaspartenombre AS especiesanimalespartes,
        pp.plantasparteemoji AS especiesanimalesemoji,
        ec.especiesanimalesnotas,
        c.especiesanimalesnombre
      FROM especiesanimales ec
      JOIN animales c ON ec.xespeciesvegetalesanimalesidespeciesanimales = c.idespeciesanimales
      LEFT JOIN plantasparte pp ON ec.xespeciesvegetalesanimalesidplantasparte = pp.idplantasparte
      WHERE ec.xespeciesvegetalesanimalesidespeciesvegetales = ?
    `, [resolvedParams.id]);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching animales para especie:', error);
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
        if (!c.xespeciesvegetalesanimalesidespeciesanimales) continue;

        if (c.idespeciesanimales) {
          // Update
          await connection.query(`
            UPDATE especiesanimales SET 
              xespeciesvegetalesanimalesidespeciesanimales = ?,
              especiesanimalesesapto = ?,
              xespeciesvegetalesanimalesidplantasparte = ?,
              especiesanimalesnotas = ?
            WHERE idespeciesanimales = ? AND xespeciesvegetalesanimalesidespeciesvegetales = ?
          `, [
            c.xespeciesvegetalesanimalesidespeciesanimales,
            c.especiesanimalesesapto,
            c.xespeciesvegetalesanimalesidplantasparte || null,
            c.especiesanimalesnotas || '',
            c.idespeciesanimales,
            resolvedParams.id
          ]);
        } else {
          // Insert
          await connection.query(`
            INSERT INTO especiesanimales (
              xespeciesvegetalesanimalesidespeciesvegetales,
              xespeciesvegetalesanimalesidespeciesanimales,
              especiesanimalesesapto,
              xespeciesvegetalesanimalesidplantasparte,
              especiesanimalesnotas
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            resolvedParams.id,
            c.xespeciesvegetalesanimalesidespeciesanimales,
            c.especiesanimalesesapto,
            c.xespeciesvegetalesanimalesidplantasparte || null,
            c.especiesanimalesnotas || ''
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
    console.error('Error saving animales para especie:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
    }

    await pool.query(
      'DELETE FROM especiesanimales WHERE idespeciesanimales = ? AND xespeciesvegetalesanimalesidespeciesvegetales = ?',
      [id, resolvedParams.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting animal para especie:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
