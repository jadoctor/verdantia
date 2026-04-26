import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get('preview') === 'true';

    const stateCondition = isPreview ? "" : " AND b.xblogestado = 'publicado'";

    const [rows] = await pool.query<any>(`
      SELECT 
        b.idblog, b.xblogslug, b.xblogtitulo, b.xblogresumen, b.xblogcontenido, b.xblogimagen, b.xblogfechapublicacion, 
        u.usuariosnombre as autor, e.especiesnombre, v.variedadesnombre
      FROM blog b
      LEFT JOIN usuarios u ON b.xblogidusuarios = u.idusuarios
      LEFT JOIN especies e ON b.xblogidespecies = e.idespecies
      LEFT JOIN variedades v ON b.xblogidvariedades = v.idvariedades
      WHERE b.xblogslug = ? ${stateCondition}
    `, [resolvedParams.slug]);

    if (rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
