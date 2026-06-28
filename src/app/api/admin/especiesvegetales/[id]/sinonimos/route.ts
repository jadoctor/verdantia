import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const especieId = parseInt(params.id, 10);
    if (isNaN(especieId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT s.*, 
             i.idiomasnombre as idioma_nombre, 
             p.paisesnombre as pais_nombre
      FROM especiessinonimos s
      LEFT JOIN idiomas i ON s.xespeciesvegetalessinonimosididiomas = i.ididiomas
      LEFT JOIN paises p ON s.xespeciesvegetalessinonimosidpaises = p.idpaises
      WHERE s.xespeciesvegetalessinonimosidespeciesvegetales = ?
      ORDER BY s.especiessinonimosnombre ASC
    `, [especieId]);
    
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching sinonimos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const especieId = parseInt(params.id, 10);
    if (isNaN(especieId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const data = await request.json();
    if (!data.especiessinonimosnombre) {
      return NextResponse.json({ error: 'El nombre del sinónimo es requerido' }, { status: 400 });
    }

    // Comprobar duplicado: mismo nombre + mismo país para la misma especie
    const paisValue = data.xespeciesvegetalessinonimosidpaises || null;
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT idespeciesvegetalessinonimos FROM especiessinonimos 
       WHERE xespeciesvegetalessinonimosidespeciesvegetales = ? 
         AND LOWER(TRIM(especiessinonimosnombre)) = LOWER(TRIM(?))
         AND (xespeciesvegetalessinonimosidpaises = ? OR (xespeciesvegetalessinonimosidpaises IS NULL AND ? IS NULL))`,
      [especieId, data.especiessinonimosnombre, paisValue, paisValue]
    );
    if (existing.length > 0) {
      return NextResponse.json({ success: true, id: existing[0].idespeciesvegetalessinonimos, skipped: true, message: 'Sinónimo ya existe' });
    }

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO especiessinonimos 
      (xespeciesvegetalessinonimosidespeciesvegetales, xespeciesvegetalessinonimosididiomas, xespeciesvegetalessinonimosidpaises, especiessinonimosnombre, especiessinonimosnotas)
      VALUES (?, ?, ?, ?, ?)
    `, [
      especieId, 
      data.xespeciesvegetalessinonimosididiomas || null, 
      paisValue, 
      data.especiessinonimosnombre, 
      data.especiessinonimosnotas || null
    ]);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating sinonimo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const especieId = parseInt(params.id, 10);
    if (isNaN(especieId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const data = await request.json();
    if (!data.idespeciesvegetalessinonimos || !data.especiessinonimosnombre) {
      return NextResponse.json({ error: 'ID y nombre son requeridos' }, { status: 400 });
    }

    await pool.query(`
      UPDATE especiessinonimos 
      SET xespeciesvegetalessinonimosididiomas = ?, 
          xespeciesvegetalessinonimosidpaises = ?, 
          especiessinonimosnombre = ?, 
          especiessinonimosnotas = ?
      WHERE idespeciesvegetalessinonimos = ? AND xespeciesvegetalessinonimosidespeciesvegetales = ?
    `, [
      data.xespeciesvegetalessinonimosididiomas || null, 
      data.xespeciesvegetalessinonimosidpaises || null, 
      data.especiessinonimosnombre, 
      data.especiessinonimosnotas || null,
      data.idespeciesvegetalessinonimos,
      especieId
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating sinonimo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const especieId = parseInt(params.id, 10);
    if (isNaN(especieId)) return NextResponse.json({ error: 'ID de especie inválido' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID de sinónimo requerido' }, { status: 400 });

    await pool.query('DELETE FROM especiessinonimos WHERE idespeciesvegetalessinonimos = ? AND xespeciesvegetalessinonimosidespeciesvegetales = ?', [id, especieId]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting sinonimo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
