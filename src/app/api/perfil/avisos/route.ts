import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

  try {
    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const userId = user.id;

    const [subs] = await pool.query('SELECT idsuscripciones FROM suscripciones WHERE suscripcionesnombre = ? LIMIT 1', [user.suscripcion || 'Gratuito']);
    const subId = (subs as any)[0]?.idsuscripciones || 1;

    const [tiposAvisos] = await pool.query('SELECT * FROM tiposavisos WHERE tiposavisosactivo = 1 ORDER BY idtiposavisos ASC');

    const [reglas] = await pool.query('SELECT xsuscripcionestiposavisosidtiposavisos, suscripcionestiposavisosestado FROM suscripcionestiposavisos WHERE xsuscripcionestiposavisosidsuscripciones = ?', [subId]);
    const reglasMap: Record<number, number> = {};
    (reglas as any).forEach((r: any) => reglasMap[r.xsuscripcionestiposavisosidtiposavisos] = r.suscripcionestiposavisosestado);

    const [prefsMaestro] = await pool.query('SELECT xusuariosavisosidtiposavisos, usuariosavisosactivo FROM usuariosavisos WHERE xusuariosavisosidusuarios = ?', [userId]);
    const userMap: Record<number, number> = {};
    (prefsMaestro as any).forEach((p: any) => userMap[p.xusuariosavisosidtiposavisos] = p.usuariosavisosactivo);

    const [labores] = await pool.query('SELECT idlabores, laboresnombre FROM labores WHERE laboresnotificable = 1 ORDER BY laboresnombre ASC');

    const [prefsLabores] = await pool.query('SELECT xusuariosavisoslaboresidlabores, usuariosavisoslaboresactivo FROM usuariosavisoslabores WHERE xusuariosavisoslaboresidusuarios = ?', [userId]);
    const laboresMap: Record<number, number> = {};
    (prefsLabores as any).forEach((p: any) => laboresMap[p.xusuariosavisoslaboresidlabores] = p.usuariosavisoslaboresactivo);

    return NextResponse.json({
      tiposAvisos,
      reglas: reglasMap,
      userPrefs: userMap,
      labores,
      userLaboresPrefs: laboresMap,
      subId
    });

  } catch (error) {
    console.error('Error fetching avisos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { email, tipo, avisoId, laborId, activo } = data;
    
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const userId = user.id;

    if (tipo === 'maestro') {
      await pool.query(`
        INSERT INTO usuariosavisos (xusuariosavisosidusuarios, xusuariosavisosidtiposavisos, usuariosavisosactivo)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE usuariosavisosactivo = VALUES(usuariosavisosactivo)
      `, [userId, avisoId, activo]);
    } else if (tipo === 'labor') {
      await pool.query(`
        INSERT INTO usuariosavisoslabores (xusuariosavisoslaboresidusuarios, xusuariosavisoslaboresidlabores, usuariosavisoslaboresactivo)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE usuariosavisoslaboresactivo = VALUES(usuariosavisoslaboresactivo)
      `, [userId, laborId, activo]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving aviso prefs:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
