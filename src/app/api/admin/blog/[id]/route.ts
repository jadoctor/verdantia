import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const [rows] = await pool.query<any>('SELECT * FROM blog WHERE idblog = ?', [resolvedParams.id]);
    if (rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { xblogtitulo, xblogslug, xblogresumen, xblogcontenido, xblogestado, xblogimagen } = body;
    
    // Si se pasa a publicado y no tenía fecha, ponersela
    let updatePubDate = '';
    let pubParams: any[] = [];
    if (xblogestado === 'publicado') {
       updatePubDate = ', xblogfechapublicacion = COALESCE(xblogfechapublicacion, NOW())';
    }

    await pool.query(
      `UPDATE blog SET 
        xblogtitulo = ?, xblogslug = ?, xblogresumen = ?, 
        xblogcontenido = ?, xblogestado = ?, xblogimagen = ?
        ${updatePubDate}
       WHERE idblog = ?`,
      [xblogtitulo, xblogslug, xblogresumen, xblogcontenido, xblogestado, xblogimagen, resolvedParams.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await pool.query('DELETE FROM blog WHERE idblog = ?', [resolvedParams.id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
