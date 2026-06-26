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

export async function GET(request: Request) {
  const admin = await authenticateSuperadmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get('periodo') || 'mes';

  try {
    let dateCondition = '';
    let queryParams: any[] = [];

    switch (periodo) {
      case 'hoy':
        dateCondition = 'DATE(h.historialiafecha) = CURRENT_DATE()';
        break;
      case 'mes':
        dateCondition = 'MONTH(h.historialiafecha) = MONTH(CURRENT_DATE()) AND YEAR(h.historialiafecha) = YEAR(CURRENT_DATE())';
        break;
      case 'ano':
        dateCondition = 'YEAR(h.historialiafecha) = YEAR(CURRENT_DATE())';
        break;
      case 'todo':
        dateCondition = '1=1'; // All time
        break;
      default:
        dateCondition = 'MONTH(h.historialiafecha) = MONTH(CURRENT_DATE()) AND YEAR(h.historialiafecha) = YEAR(CURRENT_DATE())';
    }

    const query = `
      SELECT 
        u.idusuarios as id,
        u.usuariosnombre as nombre,
        u.usuariosapellidos as apellidos,
        u.usuariosnombreusuario as nombreUsuario,
        u.usuariosemail as email,
        u.usuariosicono as icono,
        u.usuariosroles as roles,
        (
          SELECT s.suscripcionesnombre
          FROM usuariossuscripciones us
          JOIN suscripciones s ON s.idsuscripciones = us.xusuariossuscripcionesidsuscripciones
          WHERE us.xusuariossuscripcionesidusuarios = u.idusuarios
            AND us.usuariossuscripcionesestado IN ('activa','degradacion_fase1','degradacion_fase2','degradacion_fase3')
          ORDER BY us.idusuariossuscripciones DESC
          LIMIT 1
        ) as dbSuscripcion,
        (
          SELECT datosadjuntosruta
          FROM datosadjuntos 
          WHERE xdatosadjuntosidusuarios = u.idusuarios 
            AND datosadjuntostipo = 'imagen' 
            AND datosadjuntosactivo = 1 
            AND datosadjuntosvalidado = 1 
            AND (datosadjuntosresultadovalidacion IS NULL OR datosadjuntosresultadovalidacion != 'rechazado')
          ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC, datosadjuntosfechacreacion DESC 
          LIMIT 1
        ) as fotoPreferida,
        (
          SELECT datosadjuntosresumen
          FROM datosadjuntos 
          WHERE xdatosadjuntosidusuarios = u.idusuarios 
            AND datosadjuntostipo = 'imagen' 
            AND datosadjuntosactivo = 1 
            AND datosadjuntosvalidado = 1 
            AND (datosadjuntosresultadovalidacion IS NULL OR datosadjuntosresultadovalidacion != 'rechazado')
          ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC, datosadjuntosfechacreacion DESC 
          LIMIT 1
        ) as fotoPreferidaMeta,
        (
          SELECT l.logrosicono
          FROM usuarioslogros ul
          JOIN logros l ON ul.xusuarioslogrosidlogros = l.idlogros
          WHERE ul.xusuarioslogrosidusuarios = u.idusuarios
          ORDER BY ul.usuarioslogrosfechainicio DESC LIMIT 1
        ) as dbIconoLogro,
        (
          SELECT l.logrosnombre
          FROM usuarioslogros ul
          JOIN logros l ON ul.xusuarioslogrosidlogros = l.idlogros
          WHERE ul.xusuarioslogrosidusuarios = u.idusuarios
          ORDER BY ul.usuarioslogrosfechainicio DESC LIMIT 1
        ) as dbNombreLogro,
        COUNT(h.idhistorialia) as total_interacciones,
        MAX(h.historialiafecha) as ultima_interaccion
      FROM usuarios u
      LEFT JOIN historialia h ON u.idusuarios = h.xhistorialiaidusuarios AND ${dateCondition}
      GROUP BY u.idusuarios
      ORDER BY total_interacciones DESC
    `;

    const [rows]: any = await pool.query(query);

    const stats = rows.map((r: any) => {
      let iconoLogro = r.dbIconoLogro;
      if (!iconoLogro && r.dbNombreLogro) {
        iconoLogro = r.dbNombreLogro.match(/[\p{Emoji}]/u)?.[0] || '🏆';
      }
      
      let suscripcion = r.dbSuscripcion || 'Básica';
      if (r.roles && r.roles.includes('superadministrador')) {
        suscripcion = 'Premium';
      }

      return {
        id: r.id,
        nombre: r.nombre,
        apellidos: r.apellidos,
        nombreUsuario: r.nombreUsuario,
        email: r.email,
        icono: r.icono,
        roles: r.roles,
        fotoPreferida: r.fotoPreferida,
        fotoPreferidaMeta: r.fotoPreferidaMeta,
        suscripcion,
        iconoLogro,
        total_interacciones: r.total_interacciones,
        ultima_interaccion: r.ultima_interaccion
      };
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error obteniendo stats de IA (Admin):', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
