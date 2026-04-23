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
        usuariosnombreusuario
       FROM usuarios 
       WHERE usuariosemail = ? 
       LIMIT 1`,
      [email]
    );

    const results = rows as any[];
    if (results.length === 0) return null;

    const user = results[0];
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
