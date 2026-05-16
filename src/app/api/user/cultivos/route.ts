import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/cultivos — Listar cultivos del usuario
export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const url = new URL(request.url);
  const variedadId = url.searchParams.get('variedadId');

  try {
    let sql = `
      SELECT 
        c.idcultivos,
        c.xcultivosidvariedades,
        c.xcultivosidsemillas,
        c.cultivosnumerocoleccion,
        c.cultivosorigen,
        c.cultivosmetodo,
        c.cultivosestado,
        c.cultivosfechainicio,
        c.cultivosfechagerminacion,
        c.cultivosfechatrasplante,
        c.cultivosfechafinalizacion,
        c.cultivoscantidad,
        c.cultivosubicacion,
        c.cultivosobservaciones,
        COALESCE(NULLIF(vu.variedadesnombre, ''), vg.variedadesnombre) AS variedad_nombre,
        e.especiesnombre,
        e.especiesicono,
        -- Foto de la variedad o especie
        COALESCE(
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidcultivos = c.idcultivos AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedades = vu.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedades = vg.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidespecies = e.idespecies AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1)
        ) AS foto
      FROM cultivos c
      JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
      LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
      WHERE c.xcultivosidusuarios = ? AND c.cultivosactivosino = 1
    `;
    
    const params: any[] = [user.id];

    if (variedadId) {
      sql += ` AND c.xcultivosidvariedades = ?`;
      params.push(variedadId);
    }

    sql += `
      ORDER BY 
        CASE c.cultivosestado 
          WHEN 'finalizado' THEN 1
          WHEN 'perdido' THEN 1
          ELSE 0
        END,
        c.cultivosfechainicio DESC
    `;

    const [cultivos] = await pool.query(sql, params);

    return NextResponse.json({ cultivos });
  } catch (error: any) {
    console.error('Error fetching cultivos:', error);
    return NextResponse.json({ error: 'Error al obtener cultivos' }, { status: 500 });
  }
}

// POST /api/user/cultivos — Iniciar un nuevo cultivo
export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const body = await request.json();
    const { 
      xcultivosidvariedades, 
      xcultivosidsemillas, 
      cultivosnumerocoleccion,
      cultivosorigen, 
      cultivosmetodo, 
      cultivosestado,
      cultivosfechainicio,
      cultivoscantidad,
      cultivosubicacion,
      cultivosobservaciones
    } = body;

    if (!xcultivosidvariedades) {
      return NextResponse.json({ error: 'La variedad es obligatoria' }, { status: 400 });
    }

    const [result]: any = await pool.query(
      `INSERT INTO cultivos (
        xcultivosidusuarios, 
        xcultivosidvariedades, 
        xcultivosidsemillas, 
        cultivosnumerocoleccion,
        cultivosorigen, 
        cultivosmetodo, 
        cultivosestado,
        cultivosfechainicio,
        cultivoscantidad,
        cultivosubicacion,
        cultivosobservaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id, 
        xcultivosidvariedades, 
        xcultivosidsemillas || null,
        cultivosnumerocoleccion || null,
        cultivosorigen,
        cultivosmetodo,
        cultivosestado || 'germinacion',
        cultivosfechainicio || new Date().toISOString().split('T')[0],
        cultivoscantidad || 1,
        cultivosubicacion || null,
        cultivosobservaciones || null
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: 'Cultivo iniciado correctamente'
    });
  } catch (error: any) {
    console.error('Error iniciando cultivo:', error);
    return NextResponse.json({ error: 'Error al iniciar el cultivo' }, { status: 500 });
  }
}
