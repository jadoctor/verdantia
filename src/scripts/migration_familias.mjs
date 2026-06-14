// Migración: Crear tabla familias + migrar datos + FK en especies
// Ejecutar: node src/scripts/migration_familias.mjs
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
  waitForConnections: true,
  connectionLimit: 2,
  connectTimeout: 10000,
});

async function run() {
  const conn = await pool.getConnection();
  console.log('✅ Conectado a la BD\n');

  try {
    // ═══════════════════════════════════════
    // PASO 1: Crear tabla familias (si no existe)
    // ═══════════════════════════════════════
    const [tables] = await conn.query(`SHOW TABLES LIKE 'familias'`);
    if (tables.length === 0) {
      await conn.query(`
        CREATE TABLE familias (
          idfamilias INT AUTO_INCREMENT PRIMARY KEY,
          familiasnombre VARCHAR(100) NOT NULL,
          familiasnombrecientifico VARCHAR(100) DEFAULT NULL,
          familiasgruporotacion VARCHAR(50) NOT NULL,
          familiasanosdescanso INT DEFAULT 3,
          familiascolor VARCHAR(20) DEFAULT '#64748b',
          familiasemoji VARCHAR(10) DEFAULT '🌿',
          familiasnotas TEXT DEFAULT NULL,
          familiasactivosino TINYINT(1) DEFAULT 1,
          UNIQUE KEY uk_nombre (familiasnombre)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ PASO 1: Tabla familias creada');
    } else {
      console.log('⏭️  PASO 1: Tabla familias ya existe');
    }

    // ═══════════════════════════════════════
    // PASO 2: Insertar datos iniciales
    // ═══════════════════════════════════════
    const [existing] = await conn.query(`SELECT COUNT(*) as c FROM familias`);
    if (existing[0].c === 0) {
      const familias = [
        ['Solanáceas',      'Solanaceae',      'solanaceas',      4, '#e53e3e', '🍅', 'Tomate, pimiento, berenjena, patata. No repetir en el mismo bancal durante 3-4 años.'],
        ['Cucurbitáceas',   'Cucurbitaceae',    'cucurbitaceas',   3, '#38a169', '🥒', 'Calabacín, pepino, melón, sandía, calabaza. Exigentes en materia orgánica.'],
        ['Amaryllidáceas',  'Amaryllidaceae',   'allium',          2, '#d69e2e', '🧅', 'Cebolla, ajo, puerro, cebolleta. Buenas para romper ciclos de plagas.'],
        ['Crucíferas',      'Brassicaceae',     'cruciferas',      3, '#319795', '🥦', 'Col, brócoli, coliflor, rábano, nabo. Susceptibles a hernia de la col.'],
        ['Compuestas',      'Asteraceae',       'compuestas',      2, '#68d391', '🥬', 'Lechuga, escarola, endivia, alcachofa, girasol.'],
        ['Quenopodiáceas',  'Amaranthaceae',    'quenopodiáceas',  2, '#805ad5', '🌿', 'Espinaca, acelga, remolacha, quinoa.'],
        ['Leguminosas',     'Fabaceae',         'leguminosas',     1, '#dd6b20', '🫘', 'Judía, guisante, haba, lenteja. Fijan nitrógeno atmosférico al suelo.'],
        ['Apiáceas',        'Apiaceae',         'apiaceas',        3, '#ed8936', '🥕', 'Zanahoria, apio, perejil, hinojo, eneldo.'],
        ['Gramíneas',       'Poaceae',          'gramineas',       1, '#ecc94b', '🌾', 'Maíz, trigo, cebada, avena. Buenos cultivos de cobertura.'],
        ['Boragináceas',    'Boraginaceae',     'boraginaceas',    2, '#4299e1', '🌺', 'Borraja, consuelda. Excelentes melíferas y acompañantes.'],
      ];

      for (const [nombre, cientifico, grupo, anos, color, emoji, notas] of familias) {
        await conn.query(
          `INSERT INTO familias (familiasnombre, familiasnombrecientifico, familiasgruporotacion, familiasanosdescanso, familiascolor, familiasemoji, familiasnotas) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [nombre, cientifico, grupo, anos, color, emoji, notas]
        );
      }
      console.log(`✅ PASO 2: Insertadas ${familias.length} familias iniciales`);
    } else {
      console.log(`⏭️  PASO 2: Ya hay ${existing[0].c} familias, skip`);
    }

    // ═══════════════════════════════════════
    // PASO 3: Añadir FK xespeciesidfamilias en especies
    // ═══════════════════════════════════════
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'u117557593_Verdantia' AND TABLE_NAME = 'especies' AND COLUMN_NAME = 'xespeciesidfamilias'
    `);

    if (cols.length === 0) {
      await conn.query(`ALTER TABLE especies ADD COLUMN xespeciesidfamilias INT DEFAULT NULL`);
      console.log('✅ PASO 3a: Columna xespeciesidfamilias añadida');

      // Migrar datos: matching fuzzy nombre/científico
      const [famRows] = await conn.query(`SELECT idfamilias, familiasnombre, familiasnombrecientifico FROM familias`);
      let migrated = 0;
      for (const fam of famRows) {
        const [result] = await conn.query(`
          UPDATE especies SET xespeciesidfamilias = ?
          WHERE xespeciesidfamilias IS NULL AND (
            LOWER(TRIM(especiesfamilia)) = LOWER(?) OR
            LOWER(TRIM(especiesfamilia)) = LOWER(?)
          )
        `, [fam.idfamilias, fam.familiasnombre, fam.familiasnombrecientifico]);
        migrated += result.affectedRows;
      }
      console.log(`✅ PASO 3b: Migradas ${migrated} especies a FK`);

      // Añadir constraint FK
      await conn.query(`ALTER TABLE especies ADD CONSTRAINT fk_especies_familias FOREIGN KEY (xespeciesidfamilias) REFERENCES familias(idfamilias) ON DELETE SET NULL`);
      console.log('✅ PASO 3c: FK constraint añadida');
    } else {
      console.log('⏭️  PASO 3: Columna xespeciesidfamilias ya existe');
    }

    // ═══════════════════════════════════════
    // Verificación final
    // ═══════════════════════════════════════
    const [famCount] = await conn.query(`SELECT COUNT(*) as c FROM familias`);
    const [espCount] = await conn.query(`SELECT COUNT(*) as c FROM especies WHERE xespeciesidfamilias IS NOT NULL`);
    console.log(`\n✅ Migración completada.`);
    console.log(`   Familias: ${famCount[0].c}`);
    console.log(`   Especies con familia asignada: ${espCount[0].c}`);

    // Muestra
    const [sample] = await conn.query(`
      SELECT e.especiesnombre, f.familiasemoji, f.familiasnombre 
      FROM especies e 
      LEFT JOIN familias f ON e.xespeciesidfamilias = f.idfamilias 
      WHERE e.especiesvisibilidadsino = 1
      ORDER BY e.especiesnombre
    `);
    console.log('\n📊 Muestra:');
    sample.forEach(r => console.log(`  ${r.familiasemoji || '❓'} ${r.especiesnombre} → ${r.familiasnombre || '(sin asignar)'}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
