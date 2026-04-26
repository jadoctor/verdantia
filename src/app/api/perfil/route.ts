import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

/**
 * PUT /api/perfil — Actualiza los datos del perfil en Cloud SQL.
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, nombre, apellidos, nombreUsuario, fechaNacimiento, pais, codigoPostal, poblacion, icono, sexo, domicilio, telefono, tipoCalendario } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    let isUnderageLimitation = false;

    // --- RESTRICCIÓN DE EDAD (Mínimo 16 años) ---
    if (fechaNacimiento && fechaNacimiento.trim() !== '') {
      const birthDate = new Date(fechaNacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 16) {
        return NextResponse.json({ error: 'Por motivos legales, debes tener al menos 16 años para utilizar Verdantia.' }, { status: 400 });
      }
      if (age >= 16 && age < 18) {
        isUnderageLimitation = true;
      }
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (nombre !== undefined) { fields.push('usuariosnombre = ?'); values.push(nombre); }
    if (apellidos !== undefined) { fields.push('usuariosapellidos = ?'); values.push(apellidos); }
    if (nombreUsuario !== undefined) { fields.push('usuariosnombreusuario = ?'); values.push(nombreUsuario); }
    if (fechaNacimiento !== undefined) { fields.push('usuariosfechadenacimiento = ?'); values.push(fechaNacimiento || null); }
    if (pais !== undefined) { fields.push('usuariospais = ?'); values.push(pais); }
    if (codigoPostal !== undefined) { fields.push('usuarioscodigopostal = ?'); values.push(codigoPostal); }
    if (poblacion !== undefined) { fields.push('usuariospoblacion = ?'); values.push(poblacion); }
    if (icono !== undefined) { fields.push('usuariosicono = ?'); values.push(icono || null); }
    if (sexo !== undefined) { fields.push('usuariossexo = ?'); values.push(sexo || null); }
    if (domicilio !== undefined) { fields.push('usuariosdomicilio = ?'); values.push(domicilio || null); }
    if (telefono !== undefined) { fields.push('usuariostelefono = ?'); values.push(telefono || null); }
    
    // --- VALIDACIÓN DE CALENDARIOS SEGÚN SUSCRIPCIÓN ---
    if (tipoCalendario !== undefined) {
      if (tipoCalendario === 'Lunar' || tipoCalendario === 'Biodinámico') {
        const userProfile = await getUserByEmail(email);
        if (!userProfile) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        
        if (tipoCalendario === 'Lunar' && userProfile.suscripcion === 'Básica') {
          return NextResponse.json({ error: 'El calendario Lunar requiere un plan Normal o superior' }, { status: 403 });
        }
        if (tipoCalendario === 'Biodinámico' && userProfile.suscripcion !== 'Premium') {
          return NextResponse.json({ error: 'El calendario Biodinámico es exclusivo para cuentas Premium' }, { status: 403 });
        }
      }
      fields.push('usuariostipocalendario = ?'); 
      values.push(tipoCalendario);
    }

    values.push(email);

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    await pool.query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE usuariosemail = ?`,
      values
    );

    return NextResponse.json({ success: true, message: 'Perfil actualizado correctamente', isUnderageLimitation });

  } catch (error: any) {
    console.error('[Perfil API] Error:', error);
    return NextResponse.json({ error: 'Error de base de datos', details: error.message }, { status: 500 });
  }
}
