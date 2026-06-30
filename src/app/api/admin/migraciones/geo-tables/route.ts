import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/migraciones/geo-tables
 * 
 * Migración completa:
 * 1. Crea tabla `provincias`
 * 2. Crea tabla `poblaciones`
 * 3. Inserta 52 provincias españolas
 * 4. Inserta ~14.608 poblaciones desde cp_es.json
 * 5. Crea tabla `direcciones`
 * 6. ALTER TABLE usuarios: campos fiscales + pago
 * 7. Migra direcciones existentes de usuarios → direcciones
 */
export async function POST() {
  const log: string[] = [];
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // ═══════════════════════════════════════════
    // PASO 1: Crear tabla PROVINCIAS
    // ═══════════════════════════════════════════
    await conn.query(`
      CREATE TABLE IF NOT EXISTS provincias (
        idprovincias INT(11) NOT NULL AUTO_INCREMENT,
        xprovinciasidpaises INT(11) NOT NULL,
        provinciasnombre VARCHAR(100) NOT NULL
          COMMENT 'Ej: Alicante/Alacant, Madrid, Barcelona',
        provinciascodigo VARCHAR(10) NOT NULL
          COMMENT 'Código INE: 03 para Alicante, 28 para Madrid',
        
        PRIMARY KEY (idprovincias),
        UNIQUE KEY uq_provincia_pais (xprovinciasidpaises, provinciascodigo),
        KEY idx_provincias_pais (xprovinciasidpaises),
        CONSTRAINT fk_provincias_pais 
          FOREIGN KEY (xprovinciasidpaises) REFERENCES paises(idpaises)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    log.push('✅ Tabla provincias creada');

    // ═══════════════════════════════════════════
    // PASO 2: Crear tabla POBLACIONES
    // ═══════════════════════════════════════════
    await conn.query(`
      CREATE TABLE IF NOT EXISTS poblaciones (
        idpoblaciones INT(11) NOT NULL AUTO_INCREMENT,
        xpoblacionesidprovincias INT(11) NOT NULL,
        poblacionesnombre VARCHAR(150) NOT NULL
          COMMENT 'Nombre del municipio/localidad',
        poblacionescodigopostal VARCHAR(10) NOT NULL
          COMMENT 'Código postal asociado',
        poblacioneslatitud DECIMAL(10,8) NULL DEFAULT NULL,
        poblacioneslongitud DECIMAL(11,8) NULL DEFAULT NULL,
        
        PRIMARY KEY (idpoblaciones),
        KEY idx_poblaciones_provincia (xpoblacionesidprovincias),
        KEY idx_poblaciones_cp (poblacionescodigopostal),
        KEY idx_poblaciones_nombre (poblacionesnombre),
        CONSTRAINT fk_poblaciones_provincia 
          FOREIGN KEY (xpoblacionesidprovincias) REFERENCES provincias(idprovincias)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    log.push('✅ Tabla poblaciones creada');

    // ═══════════════════════════════════════════
    // PASO 3: Insertar 52 provincias españolas
    // ═══════════════════════════════════════════
    const [existingProvincias]: any = await conn.query('SELECT COUNT(*) as count FROM provincias');
    if (existingProvincias[0].count === 0) {
      // idpaises = 1 es España (verificado en el backup)
      const provinciasData: [string, string][] = [
        ['Álava/Araba', '01'],
        ['Albacete', '02'],
        ['Alicante/Alacant', '03'],
        ['Almería', '04'],
        ['Ávila', '05'],
        ['Badajoz', '06'],
        ['Baleares/Illes Balears', '07'],
        ['Barcelona', '08'],
        ['Burgos', '09'],
        ['Cáceres', '10'],
        ['Cádiz', '11'],
        ['Castellón/Castelló', '12'],
        ['Ciudad Real', '13'],
        ['Córdoba', '14'],
        ['A Coruña', '15'],
        ['Cuenca', '16'],
        ['Girona', '17'],
        ['Granada', '18'],
        ['Guadalajara', '19'],
        ['Gipuzkoa', '20'],
        ['Huelva', '21'],
        ['Huesca', '22'],
        ['Jaén', '23'],
        ['León', '24'],
        ['Lleida', '25'],
        ['La Rioja', '26'],
        ['Lugo', '27'],
        ['Madrid', '28'],
        ['Málaga', '29'],
        ['Murcia', '30'],
        ['Navarra/Nafarroa', '31'],
        ['Ourense', '32'],
        ['Asturias', '33'],
        ['Palencia', '34'],
        ['Las Palmas', '35'],
        ['Pontevedra', '36'],
        ['Salamanca', '37'],
        ['Santa Cruz de Tenerife', '38'],
        ['Cantabria', '39'],
        ['Segovia', '40'],
        ['Sevilla', '41'],
        ['Soria', '42'],
        ['Tarragona', '43'],
        ['Teruel', '44'],
        ['Toledo', '45'],
        ['Valencia/València', '46'],
        ['Valladolid', '47'],
        ['Bizkaia', '48'],
        ['Zamora', '49'],
        ['Zaragoza', '50'],
        ['Ceuta', '51'],
        ['Melilla', '52'],
      ];

      const values = provinciasData.map(([nombre, codigo]) => [1, nombre, codigo]);
      await conn.query(
        'INSERT INTO provincias (xprovinciasidpaises, provinciasnombre, provinciascodigo) VALUES ?',
        [values]
      );
      log.push(`✅ ${provinciasData.length} provincias españolas insertadas`);
    } else {
      log.push(`⏭️ Provincias ya existentes (${existingProvincias[0].count}), saltando`);
    }

    // ═══════════════════════════════════════════
    // PASO 4: Insertar poblaciones desde cp_es.json
    // ═══════════════════════════════════════════
    const [existingPoblaciones]: any = await conn.query('SELECT COUNT(*) as count FROM poblaciones');
    if (existingPoblaciones[0].count === 0) {
      // Cargar el JSON
      const filePath = path.join(process.cwd(), 'src/data/cp_es.json');
      const raw = fs.readFileSync(filePath, 'utf-8');
      const cpData: [string, string][] = JSON.parse(raw);

      // Obtener mapa de provincias: código → id
      const [provRows]: any = await conn.query('SELECT idprovincias, provinciascodigo FROM provincias WHERE xprovinciasidpaises = 1');
      const provMap: Record<string, number> = {};
      for (const row of provRows) {
        provMap[row.provinciascodigo] = row.idprovincias;
      }

      // Preparar lotes de 500 registros
      const BATCH_SIZE = 500;
      let inserted = 0;
      let skipped = 0;

      for (let i = 0; i < cpData.length; i += BATCH_SIZE) {
        const batch = cpData.slice(i, i + BATCH_SIZE);
        const values: any[] = [];

        for (const [cp, ciudad] of batch) {
          const provCode = cp.substring(0, 2);
          const provId = provMap[provCode];
          if (provId) {
            values.push([provId, ciudad, cp]);
          } else {
            skipped++;
          }
        }

        if (values.length > 0) {
          await conn.query(
            'INSERT INTO poblaciones (xpoblacionesidprovincias, poblacionesnombre, poblacionescodigopostal) VALUES ?',
            [values]
          );
          inserted += values.length;
        }
      }

      log.push(`✅ ${inserted} poblaciones insertadas (${skipped} saltadas por provincia no encontrada)`);
    } else {
      log.push(`⏭️ Poblaciones ya existentes (${existingPoblaciones[0].count}), saltando`);
    }

    // ═══════════════════════════════════════════
    // PASO 5: Crear tabla DIRECCIONES
    // ═══════════════════════════════════════════
    await conn.query(`
      CREATE TABLE IF NOT EXISTS direcciones (
        iddirecciones INT(11) NOT NULL AUTO_INCREMENT,
        xdireccionesidusuarios INT(11) NOT NULL,
        xdireccionesidpoblaciones INT(11) NULL
          COMMENT 'FK a poblaciones — NULL si país sin datos geográficos',
        
        direccionestipo ENUM('personal','facturacion','envio') NOT NULL DEFAULT 'personal',
        direccionesetiqueta VARCHAR(100) NULL DEFAULT NULL
          COMMENT 'Ej: Mi huerto, Oficina, Casa de papá',
        direccionesnombre VARCHAR(200) NULL DEFAULT NULL
          COMMENT 'Nombre del destinatario (puede diferir del titular)',
        direccionesdomicilio VARCHAR(255) NULL DEFAULT NULL
          COMMENT 'Calle, número, piso, puerta',
        
        -- Campos de texto libre para países sin datos normalizados
        direccionescodigopostal VARCHAR(20) NULL DEFAULT NULL
          COMMENT 'CP manual — solo si xdireccionesidpoblaciones es NULL',
        direccionespoblacion VARCHAR(150) NULL DEFAULT NULL
          COMMENT 'Ciudad manual — solo si xdireccionesidpoblaciones es NULL',
        direccionesprovincia VARCHAR(100) NULL DEFAULT NULL
          COMMENT 'Provincia manual — solo si xdireccionesidpoblaciones es NULL',
        direccionespais VARCHAR(100) NULL DEFAULT NULL
          COMMENT 'País manual — solo si xdireccionesidpoblaciones es NULL',
        
        direccionestelefono VARCHAR(20) NULL DEFAULT NULL
          COMMENT 'Teléfono de contacto para el transportista',
        direccioneslatitud DECIMAL(10,8) NULL DEFAULT NULL,
        direccioneslongitud DECIMAL(11,8) NULL DEFAULT NULL,
        direccionesnotas TEXT NULL DEFAULT NULL
          COMMENT 'Notas para el repartidor',
        
        direccionesesprincipal TINYINT(1) NOT NULL DEFAULT 0
          COMMENT 'Solo 1 principal por tipo por usuario',
        direccionesactiva TINYINT(1) NOT NULL DEFAULT 1
          COMMENT 'Soft delete: 0 = oculta pero preservada',
        
        direccionesfechacreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        direccionesfechamodificacion DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        
        PRIMARY KEY (iddirecciones),
        KEY idx_direcciones_usuario (xdireccionesidusuarios),
        KEY idx_direcciones_tipo (xdireccionesidusuarios, direccionestipo),
        CONSTRAINT fk_direcciones_usuario 
          FOREIGN KEY (xdireccionesidusuarios) REFERENCES usuarios(idusuarios) ON DELETE CASCADE,
        CONSTRAINT fk_direcciones_poblacion 
          FOREIGN KEY (xdireccionesidpoblaciones) REFERENCES poblaciones(idpoblaciones)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    log.push('✅ Tabla direcciones creada');

    // ═══════════════════════════════════════════
    // PASO 6: ALTER TABLE usuarios — Datos fiscales + pago
    // ═══════════════════════════════════════════
    const columnsToAdd = [
      { name: 'usuariosnif', sql: "ADD COLUMN usuariosnif VARCHAR(20) NULL DEFAULT NULL COMMENT 'NIF/CIF/NIE/VAT'" },
      { name: 'usuariosrazonsocial', sql: "ADD COLUMN usuariosrazonsocial VARCHAR(255) NULL DEFAULT NULL COMMENT 'Razón social si autónomo/empresa'" },
      { name: 'usuariostipocontribuyente', sql: "ADD COLUMN usuariostipocontribuyente ENUM('particular','autonomo','empresa') NOT NULL DEFAULT 'particular' COMMENT 'Tipo fiscal'" },
      { name: 'usuarios_stripe_subscription_id', sql: "ADD COLUMN usuarios_stripe_subscription_id VARCHAR(255) NULL DEFAULT NULL COMMENT 'ID suscripción Stripe (sub_xxxxx)'" },
      { name: 'usuariosmetodopagopref', sql: "ADD COLUMN usuariosmetodopagopref ENUM('stripe_tarjeta','stripe_googlepay','stripe_applepay','paypal','ninguno') NOT NULL DEFAULT 'ninguno' COMMENT 'Método de pago preferido'" },
      { name: 'usuariosfechaultimopago', sql: "ADD COLUMN usuariosfechaultimopago DATETIME NULL DEFAULT NULL COMMENT 'Cache: último pago exitoso'" },
    ];

    for (const col of columnsToAdd) {
      try {
        const [existingCols]: any = await conn.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = ?",
          [col.name]
        );
        if (existingCols.length === 0) {
          await conn.query(`ALTER TABLE usuarios ${col.sql}`);
          log.push(`✅ Columna usuarios.${col.name} añadida`);
        } else {
          log.push(`⏭️ Columna usuarios.${col.name} ya existe, saltando`);
        }
      } catch (e: any) {
        log.push(`⚠️ Error en columna ${col.name}: ${e.message}`);
      }
    }

    // ═══════════════════════════════════════════
    // PASO 7: Migrar direcciones existentes de usuarios → direcciones
    // ═══════════════════════════════════════════
    const [existingDirecciones]: any = await conn.query('SELECT COUNT(*) as count FROM direcciones');
    if (existingDirecciones[0].count === 0) {
      // Buscar usuarios con datos de dirección
      const [usersWithAddress]: any = await conn.query(`
        SELECT 
          idusuarios, 
          usuariosnombre, 
          usuariosapellidos,
          usuarioscodigopostal, 
          usuariospoblacion, 
          usuariospais,
          usuariosdomicilio,
          usuariostelefono,
          usuarioslatitud,
          usuarioslongitud
        FROM usuarios 
        WHERE usuarioscodigopostal IS NOT NULL 
          AND usuarioscodigopostal != ''
          AND usuariospoblacion IS NOT NULL 
          AND usuariospoblacion != ''
      `);

      let migrated = 0;
      for (const u of usersWithAddress) {
        // Intentar buscar la poblacion normalizada
        let poblacionId = null;
        if (u.usuarioscodigopostal && u.usuariospoblacion) {
          const [match]: any = await conn.query(
            'SELECT idpoblaciones FROM poblaciones WHERE poblacionescodigopostal = ? AND poblacionesnombre = ? LIMIT 1',
            [u.usuarioscodigopostal, u.usuariospoblacion]
          );
          if (match.length > 0) {
            poblacionId = match[0].idpoblaciones;
          }
        }

        await conn.query(`
          INSERT INTO direcciones (
            xdireccionesidusuarios, xdireccionesidpoblaciones,
            direccionestipo, direccionesetiqueta, direccionesnombre,
            direccionesdomicilio, direccionescodigopostal, direccionespoblacion,
            direccionespais, direccionestelefono, direccioneslatitud, direccioneslongitud,
            direccionesesprincipal, direccionesactiva
          ) VALUES (?, ?, 'personal', 'Mi huerto', ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
        `, [
          u.idusuarios,
          poblacionId,
          [u.usuariosnombre, u.usuariosapellidos].filter(Boolean).join(' ') || null,
          u.usuariosdomicilio || null,
          poblacionId ? null : u.usuarioscodigopostal,
          poblacionId ? null : u.usuariospoblacion,
          poblacionId ? null : (u.usuariospais || 'España'),
          u.usuariostelefono || null,
          u.usuarioslatitud || null,
          u.usuarioslongitud || null,
        ]);
        migrated++;
      }
      log.push(`✅ ${migrated} direcciones migradas desde usuarios`);
    } else {
      log.push(`⏭️ Direcciones ya existentes (${existingDirecciones[0].count}), saltando migración`);
    }

    await conn.commit();
    log.push('');
    log.push('🎉 MIGRACIÓN COMPLETADA CON ÉXITO');

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    await conn.rollback();
    log.push(`🔴 ERROR FATAL: ${error.message}`);
    return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
  } finally {
    conn.release();
  }
}
