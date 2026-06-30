import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

/**
 * PUT /api/perfil — Actualiza los datos del perfil en Cloud SQL.
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, nombre, apellidos, nombreUsuario, fechaNacimiento, pais, codigoPostal, poblacion, icono, sexo, domicilio, telefono, tipoCalendario, tipoLaboreo, camaCultivoBilateral, camaCultivoUnilateral, pasillo, nif, razonSocial, tipoContribuyente } = body;

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

    const userProfile = await getUserByEmail(email);
    if (!userProfile) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const userId = userProfile.id;

    const fields: string[] = [];
    const values: any[] = [];

    if (nombre !== undefined) { fields.push('usuariosnombre = ?'); values.push(nombre); }
    if (apellidos !== undefined) { fields.push('usuariosapellidos = ?'); values.push(apellidos); }
    if (nombreUsuario !== undefined) { fields.push('usuariosnombreusuario = ?'); values.push(nombreUsuario); }
    if (fechaNacimiento !== undefined) { fields.push('usuariosfechadenacimiento = ?'); values.push(fechaNacimiento || null); }
    if (icono !== undefined) { fields.push('usuariosicono = ?'); values.push(icono || null); }
    if (sexo !== undefined) { fields.push('usuariossexo = ?'); values.push(sexo || null); }
    if (telefono !== undefined) { fields.push('usuariostelefono = ?'); values.push(telefono || null); }
    if (nif !== undefined) { fields.push('usuariosnif = ?'); values.push(nif || null); }
    if (razonSocial !== undefined) { fields.push('usuariosrazonsocial = ?'); values.push(razonSocial || null); }
    if (tipoContribuyente !== undefined) { fields.push('usuariostipocontribuyente = ?'); values.push(tipoContribuyente); }

    // --- VALIDACIÓN DE CALENDARIOS SEGÚN SUSCRIPCIÓN ---
    if (tipoCalendario !== undefined) {
      if (tipoCalendario === 'Lunar' || tipoCalendario === 'Biodinámico') {
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

    if (tipoLaboreo !== undefined) {
      if (!['Convencional', 'Mínimo', 'No laboreo'].includes(tipoLaboreo)) {
        return NextResponse.json({ error: 'Tipo de laboreo no válido' }, { status: 400 });
      }
      fields.push('usuariostipolaboreo = ?');
      values.push(tipoLaboreo);
    }

    if (camaCultivoBilateral !== undefined) {
      const val = parseFloat(camaCultivoBilateral);
      if (isNaN(val) || val <= 0) return NextResponse.json({ error: 'La anchura de la cama de cultivo bilateral debe ser > 0.' }, { status: 400 });
      fields.push('usuarioscamacultivobilateral = ?');
      values.push(val);
    }

    if (camaCultivoUnilateral !== undefined) {
      const val = parseFloat(camaCultivoUnilateral);
      if (isNaN(val) || val <= 0) return NextResponse.json({ error: 'La anchura de la cama de cultivo unilateral debe ser > 0.' }, { status: 400 });
      fields.push('usuarioscamacultivounilateral = ?');
      values.push(val);
    }

    if (pasillo !== undefined) {
      const val = parseFloat(pasillo);
      if (isNaN(val) || val <= 0) return NextResponse.json({ error: 'El ancho del pasillo debe ser > 0.' }, { status: 400 });
      fields.push('usuariospasillo = ?');
      values.push(val);
    }

    // Address logic
    let updateAddress = false;
    const addressUpdates: any = {};
    if (domicilio !== undefined) { addressUpdates.domicilio = domicilio; updateAddress = true; }
    if (codigoPostal !== undefined) { addressUpdates.codigoPostal = codigoPostal; updateAddress = true; }
    if (poblacion !== undefined) { addressUpdates.poblacion = poblacion; updateAddress = true; }
    if (pais !== undefined) { addressUpdates.pais = pais; updateAddress = true; }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (fields.length > 0) {
        values.push(email);
        await conn.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE usuariosemail = ?`, values);
      }

      if (updateAddress) {
        const [dirRows]: any = await conn.query(
          `SELECT iddirecciones FROM direcciones WHERE xdireccionesidusuarios = ? AND direccionestipo = 'personal' AND direccionesesprincipal = 1 LIMIT 1`,
          [userId]
        );
        const currentDir = dirRows.length > 0 ? dirRows[0] : null;

        const finalDom = addressUpdates.domicilio !== undefined ? addressUpdates.domicilio : userProfile.domicilio;
        const finalCP = addressUpdates.codigoPostal !== undefined ? addressUpdates.codigoPostal : userProfile.codigoPostal;
        const finalPob = addressUpdates.poblacion !== undefined ? addressUpdates.poblacion : userProfile.poblacion;
        const finalPais = addressUpdates.pais !== undefined ? addressUpdates.pais : (userProfile.pais || 'España');

        let poblacionId = null;
        if (finalCP && finalPob) {
          const [pobRows]: any = await conn.query(
            'SELECT idpoblaciones FROM poblaciones WHERE poblacionescodigopostal = ? AND poblacionesnombre = ? LIMIT 1',
            [finalCP, finalPob]
          );
          if (pobRows.length > 0) poblacionId = pobRows[0].idpoblaciones;
        }

        if (currentDir) {
           await conn.query(
             `UPDATE direcciones SET direccionesdomicilio=?, direccionescodigopostal=?, direccionespoblacion=?, direccionespais=?, xdireccionesidpoblaciones=? WHERE iddirecciones=?`,
             [finalDom, poblacionId ? null : finalCP, poblacionId ? null : finalPob, poblacionId ? null : finalPais, poblacionId, currentDir.iddirecciones]
           );
        } else {
           await conn.query(
             `INSERT INTO direcciones (xdireccionesidusuarios, direccionestipo, direccionesesprincipal, direccionesetiqueta, direccionesnombre, direccionesdomicilio, direccionescodigopostal, direccionespoblacion, direccionespais, xdireccionesidpoblaciones) VALUES (?, 'personal', 1, 'Mi huerto', ?, ?, ?, ?, ?, ?)`,
             [userId, [userProfile.nombre, userProfile.apellidos].filter(Boolean).join(' ') || null, finalDom, poblacionId ? null : finalCP, poblacionId ? null : finalPob, poblacionId ? null : finalPais, poblacionId]
           );
        }
      }

      await conn.commit();
      return NextResponse.json({ success: true, message: 'Perfil actualizado correctamente', isUnderageLimitation });
    } catch (err: any) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error('[Perfil API] Error:', error);
    return NextResponse.json({ error: 'Error de base de datos', details: error.message }, { status: 500 });
  }
}
