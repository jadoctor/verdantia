import pool from '@/lib/db';

export interface UserProfile {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string;
  icono: string | null;
  codigoPostal: string | null;
  poblacion: string | null;
  estadoCuenta: string;
  nombreUsuario: string | null;
  pais: string | null;
  fechaNacimiento: string | null;
  suscripcion: string;
  esPrueba: boolean;
  fechaCaducidadSuscripcion: string | null;
  fotoPreferida: string | null;
  fotoPreferidaMeta?: string | null;
  iconoLogro: string | null;
  sexo: string | null;
  domicilio: string | null;
  telefono: string | null;
  zonaClimatica: string | null;
  tipoCalendario: string;
}

/**
 * Busca un usuario en Cloud SQL por su email (el mismo que usa en Firebase).
 * Este es el "puente" entre Firebase Auth y nuestra base de datos.
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    const [rows] = await pool.query(
      `SELECT 
        idusuarios, 
        usuariosnombre, 
        usuariosapellidos, 
        usuariosemail, 
        usuariosroles, 
        usuariosicono, 
        usuarioscodigopostal, 
        usuariospoblacion, 
        usuariosestadocuenta,
        usuariosnombreusuario,
        usuariospais,
        usuariosfechadenacimiento,
        usuariossexo,
        usuariosdomicilio,
        usuariostelefono,
        usuarioszonaclimatica,
        usuariostipocalendario
       FROM usuarios  
       WHERE usuariosemail = ? 
       LIMIT 1`,
      [email]
    );

    const results = rows as any[];
    if (results.length === 0) return null;

    const user = results[0];

    // Obtener la suscripción activa
    const [subRows] = await pool.query(`
        SELECT s.suscripcionesnombre, us.idusuariossuscripciones, us.usuariossuscripcionesfechafin, us.usuariossuscripcionesfechainicio
        FROM usuariossuscripciones us
        JOIN suscripciones s ON s.idsuscripciones = us.xusuariossuscripcionesidsuscripciones
        WHERE us.xusuariossuscripcionesidusuarios = ?
          AND us.usuariossuscripcionesestado IN ('activa','degradacion_fase1','degradacion_fase2','degradacion_fase3')
        ORDER BY us.idusuariossuscripciones DESC
        LIMIT 1
    `, [user.idusuarios]);
    
    let suscripcion = 'Básica';
    let esPrueba = false;
    let fechaCaduca = null;

    if ((subRows as any[]).length > 0) {
      const subRow = (subRows as any[])[0];
      suscripcion = subRow.suscripcionesnombre;
      fechaCaduca = subRow.usuariossuscripcionesfechafin;
      const subId = subRow.idusuariossuscripciones;

      if (suscripcion === 'Premium') {
        const [pagoRows] = await pool.query(`
          SELECT COUNT(*) as count FROM usuariospagos WHERE xusuariospagositdusuariossuscripciones = ?
        `, [subId]);
        if ((pagoRows as any[])[0].count === 0) {
          esPrueba = true;
          // El periodo de prueba dura 60 días desde el inicio si no hay fecha fin especificada
          if (!fechaCaduca && subRow.usuariossuscripcionesfechainicio) {
            const inicio = new Date(subRow.usuariossuscripcionesfechainicio);
            inicio.setDate(inicio.getDate() + 60);
            fechaCaduca = inicio.toISOString();
          }
        }
      }
    }

    // Obtener foto preferida
    const [fotoRows] = await pool.query(
      `SELECT datosadjuntosruta, datosadjuntosresumen FROM datosadjuntos WHERE xdatosadjuntosidusuarios = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 AND datosadjuntosesprincipal = 1 LIMIT 1`,
      [user.idusuarios]
    );
    const fotoPreferida = (fotoRows as any[]).length > 0 ? (fotoRows as any[])[0].datosadjuntosruta : null;
    const fotoPreferidaMeta = (fotoRows as any[]).length > 0 ? (fotoRows as any[])[0].datosadjuntosresumen : null;

    // Obtener el icono del último logro
    const [logroRows] = await pool.query(
      `SELECT nombre_logro 
       FROM usuarios_logros 
       WHERE idusuarios = ? 
       ORDER BY fecha_desbloqueo DESC LIMIT 1`,
      [user.idusuarios]
    );
    let iconoLogro = null;
    if ((logroRows as any[]).length > 0) {
      const nombreLogro = (logroRows as any[])[0].nombre_logro;
      // Extraemos el emoji si lo tiene en el nombre, si no ponemos 🏆
      iconoLogro = nombreLogro ? nombreLogro.match(/[\p{Emoji}]/u)?.[0] || '🏆' : null;
    }

    return {
      id: user.idusuarios,
      nombre: user.usuariosnombre || '',
      apellidos: user.usuariosapellidos || '',
      email: user.usuariosemail,
      roles: user.usuariosroles || 'usuario',
      icono: user.usuariosicono || null,
      codigoPostal: user.usuarioscodigopostal || null,
      poblacion: user.usuariospoblacion || null,
      estadoCuenta: user.usuariosestadocuenta || 'activa',
      nombreUsuario: user.usuariosnombreusuario || null,
      pais: user.usuariospais || null,
      fechaNacimiento: user.usuariosfechadenacimiento || null,
      sexo: user.usuariossexo || null,
      domicilio: user.usuariosdomicilio || null,
      telefono: user.usuariostelefono || null,
      suscripcion: suscripcion,
      esPrueba: esPrueba,
      fechaCaducidadSuscripcion: fechaCaduca,
      fotoPreferida: fotoPreferida,
      fotoPreferidaMeta: fotoPreferidaMeta,
      iconoLogro: iconoLogro,
      zonaClimatica: user.usuarioszonaclimatica || null,
      tipoCalendario: user.usuariostipocalendario || 'Normal',
    };
  } catch (error) {
    console.error('[Auth] Error buscando usuario por email:', error);
    return null;
  }
}

/**
 * Comprueba si un usuario tiene el rol de superadministrador.
 */
export function isSuperAdmin(profile: UserProfile): boolean {
  return profile.roles.includes('superadministrador');
}

/**
 * Comprueba si un usuario tiene rol de administrador (o superior).
 */
export function isAdmin(profile: UserProfile): boolean {
  return profile.roles.includes('administrador') || profile.roles.includes('superadministrador');
}
