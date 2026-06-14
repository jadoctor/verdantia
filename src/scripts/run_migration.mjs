// Script de migración V2 con manejo de triggers
// Ejecutar: node src/scripts/run_migration.mjs
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
    // =====================================================
    // PASO 0: Eliminar triggers que referencian columnas obsoletas
    // =====================================================
    console.log('🔧 PASO 0: Eliminando triggers obsoletos...');
    
    const [triggers] = await conn.query(`SHOW TRIGGERS WHERE \`Table\` = 'especies'`);
    const triggerNames = triggers.map(t => t.Trigger);
    console.log(`   Triggers encontrados: ${triggerNames.join(', ')}`);

    for (const name of triggerNames) {
      await conn.query(`DROP TRIGGER IF EXISTS ${name}`);
      console.log(`   🗑️  Eliminado trigger: ${name}`);
    }

    // =====================================================
    // PASO 1: Verificar y eliminar campos huérfanos
    // =====================================================
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'u117557593_Verdantia' AND TABLE_NAME = 'especies'
      ORDER BY ORDINAL_POSITION
    `);
    const colNames = cols.map(c => c.COLUMN_NAME);
    console.log(`\n📋 Columnas actuales: ${colNames.length}`);

    const orphans = ['especiesdiasgerminacion', 'especiesdiashastatrasplante', 'especiesdiashastafructificacion', 'especiesdiashastarecoleccion', 'especiesdiascrecimientofirme', 'especiesduraciontotal'];
    const orphansToRemove = orphans.filter(o => colNames.includes(o));
    
    if (orphansToRemove.length > 0) {
      const dropClauses = orphansToRemove.map(o => `DROP COLUMN ${o}`).join(', ');
      await conn.query(`ALTER TABLE especies ${dropClauses}`);
      console.log(`🗑️  PASO 1: Eliminados ${orphansToRemove.length} campos: ${orphansToRemove.join(', ')}`);
    } else {
      console.log('⏭️  PASO 1: Campos huérfanos ya eliminados');
    }

    // =====================================================
    // PASO 2: Migrar pH varchar → dos decimales
    // =====================================================
    // Refrescar columnas
    const [cols2a] = await conn.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u117557593_Verdantia' AND TABLE_NAME = 'especies'`);
    const cn2 = cols2a.map(c => c.COLUMN_NAME);

    if (cn2.includes('especiesphsuelo') && !cn2.includes('especiesphminimosuelo')) {
      await conn.query(`ALTER TABLE especies ADD COLUMN especiesphminimosuelo DECIMAL(3,1) DEFAULT NULL AFTER especiesphsuelo`);
      await conn.query(`ALTER TABLE especies ADD COLUMN especiesphmaximosuelo DECIMAL(3,1) DEFAULT NULL AFTER especiesphminimosuelo`);
      console.log('📐 PASO 2a: Columnas pH mín/máx creadas');

      await conn.query(`
        UPDATE especies 
        SET especiesphminimosuelo = CAST(TRIM(SUBSTRING_INDEX(especiesphsuelo, '-', 1)) AS DECIMAL(3,1)),
            especiesphmaximosuelo = CAST(TRIM(SUBSTRING_INDEX(especiesphsuelo, '-', -1)) AS DECIMAL(3,1))
        WHERE especiesphsuelo IS NOT NULL AND especiesphsuelo LIKE '%-%'
      `);
      await conn.query(`
        UPDATE especies
        SET especiesphminimosuelo = CAST(TRIM(especiesphsuelo) AS DECIMAL(3,1)),
            especiesphmaximosuelo = CAST(TRIM(especiesphsuelo) AS DECIMAL(3,1))
        WHERE especiesphsuelo IS NOT NULL AND especiesphsuelo NOT LIKE '%-%' AND especiesphsuelo != ''
      `);
      console.log('📐 PASO 2b: Datos pH migrados');

      await conn.query(`ALTER TABLE especies DROP COLUMN especiesphsuelo`);
      console.log('📐 PASO 2c: Columna especiesphsuelo eliminada');
    } else if (!cn2.includes('especiesphminimosuelo')) {
      await conn.query(`ALTER TABLE especies ADD COLUMN especiesphminimosuelo DECIMAL(3,1) DEFAULT NULL`);
      await conn.query(`ALTER TABLE especies ADD COLUMN especiesphmaximosuelo DECIMAL(3,1) DEFAULT NULL`);
      console.log('📐 PASO 2: Columnas pH creadas (sin datos previos)');
    } else {
      console.log('⏭️  PASO 2: Columnas pH ya existen');
    }

    // =====================================================
    // PASO 3: Renombrar especiesbiodinamicacategoria
    // =====================================================
    const [cols3a] = await conn.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u117557593_Verdantia' AND TABLE_NAME = 'especies'`);
    const cn3 = cols3a.map(c => c.COLUMN_NAME);

    if (cn3.includes('especiesbiodinamicacategoria') && !cn3.includes('especiesorganocomestible')) {
      await conn.query(`ALTER TABLE especies CHANGE COLUMN especiesbiodinamicacategoria especiesorganocomestible VARCHAR(50) DEFAULT NULL`);
      console.log('🔄 PASO 3: Renombrada especiesbiodinamicacategoria → especiesorganocomestible');
    } else if (cn3.includes('especiesorganocomestible')) {
      console.log('⏭️  PASO 3: Ya renombrada');
    }

    // =====================================================
    // PASO 4: Añadir especiesfechaactualizacion
    // =====================================================
    if (!cn3.includes('especiesfechaactualizacion')) {
      await conn.query(`ALTER TABLE especies ADD COLUMN especiesfechaactualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
      console.log('🕐 PASO 4: Columna timestamp añadida');
    } else {
      console.log('⏭️  PASO 4: Timestamp ya existe');
    }

    // =====================================================
    // PASO 5: Añadir 6 campos agronómicos nuevos
    // =====================================================
    const [cols4a] = await conn.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u117557593_Verdantia' AND TABLE_NAME = 'especies'`);
    const cn4 = cols4a.map(c => c.COLUMN_NAME);

    const newCols = [
      { name: 'especiesresistenciahelada', def: "ENUM('nula','baja','media','alta') DEFAULT NULL" },
      { name: 'especiesnecesidadtutoraje', def: "ENUM('no','opcional','obligatorio') DEFAULT NULL" },
      { name: 'especiesporteplanta', def: "ENUM('rastrero','arbusto','mata','trepador','erecto') DEFAULT NULL" },
      { name: 'especiesrendimientoestimado', def: "VARCHAR(100) DEFAULT NULL" },
      { name: 'especiespartecosechable', def: "SET('fruto','hoja','raiz','bulbo','tallo','flor','semilla') DEFAULT NULL" },
      { name: 'especiesgerminaroscuridad', def: "TINYINT(1) DEFAULT NULL" }
    ];

    for (const col of newCols) {
      if (!cn4.includes(col.name)) {
        await conn.query(`ALTER TABLE especies ADD COLUMN ${col.name} ${col.def}`);
        console.log(`➕ PASO 5: Añadida ${col.name}`);
      } else {
        console.log(`⏭️  PASO 5: ${col.name} ya existe`);
      }
    }

    // =====================================================
    // PASO 6: Recrear trigger AFTER UPDATE (uno solo, limpio)
    // =====================================================
    console.log('\n🔧 PASO 6: Recreando trigger AFTER UPDATE...');
    
    await conn.query(`
      CREATE TRIGGER trg_especies_after_update AFTER UPDATE ON especies
      FOR EACH ROW
      BEGIN
        UPDATE variedades SET
          variedadesnombre = CONCAT(NEW.especiesnombre, ' (Genérica)'),
          variedadesdescripcion = NEW.especiesdescripcion,
          variedadescolor = NEW.especiescolor,
          variedadestamano = NEW.especiestamano,
          variedadesviabilidadsemilla = NEW.especiesviabilidadsemilla,
          variedadespeso1000semillas = NEW.especiespeso1000semillas,
          variedadestemperaturaminima = NEW.especiestemperaturaminima,
          variedadestemperaturaoptima = NEW.especiestemperaturaoptima,
          variedadestemperaturamaxima = NEW.especiestemperaturamaxima,
          variedadesmarcoplantas = NEW.especiesmarcoplantas,
          variedadesmarcofilas = NEW.especiesmarcofilas,
          variedadesprofundidadsiembra = NEW.especiesprofundidadsiembra,
          variedadesprofundidadtrasplante = NEW.especiesprofundidadtrasplante,
          variedadeshistoria = NEW.especieshistoria,
          variedadessemillerodesde = NEW.especiesfechasemillerodesde,
          variedadessemillerohasta = NEW.especiesfechasemillerohasta,
          variedadessiembradirectadesde = NEW.especiesfechasiembradirectadesde,
          variedadessiembradirectahasta = NEW.especiesfechasiembradirectahasta,
          variedadestrasplantedesde = NEW.especiestrasplantedesde,
          variedadestrasplantehasta = NEW.especiestrasplantehasta,
          variedadesrecolecciondesde = NEW.especiesfecharecolecciondesde,
          variedadesrecoleccionhasta = NEW.especiesfecharecoleccionhasta,
          variedadesvisibilidadsino = NEW.especiesvisibilidadsino,
          variedadesautosuficiencia = NEW.especiesautosuficiencia,
          variedadesautosuficienciaparcial = NEW.especiesautosuficienciaparcial,
          variedadesautosuficienciaconserva = NEW.especiesautosuficienciaconserva,
          variedadesicono = NEW.especiesicono,
          variedadesbiodinamicacategoria = NEW.especiesorganocomestible,
          variedadesbiodinamicanotas = NEW.especiesbiodinamicanotas,
          variedadesnecesidadriego = NEW.especiesnecesidadriego,
          variedadestiposiembra = NEW.especiestiposiembra,
          variedadesvolumenmaceta = NEW.especiesvolumenmaceta,
          variedadesluzsolar = NEW.especiesluzsolar,
          variedadescaracteristicassuelo = NEW.especiescaracteristicassuelo,
          variedadesdificultad = NEW.especiesdificultad
        WHERE xvariedadesidespecies = NEW.idespecies AND variedadesesgenerica = 1;
      END
    `);
    console.log('   ✅ Trigger trg_especies_after_update recreado');

    // =====================================================
    // PASO 7: Recrear trigger AFTER INSERT
    // =====================================================
    console.log('🔧 PASO 7: Recreando trigger AFTER INSERT...');
    
    // Check if the insert trigger existed — we need the original logic
    // The original trigger creates a generic variety when a species is created
    await conn.query(`
      CREATE TRIGGER trg_especies_after_insert AFTER INSERT ON especies
      FOR EACH ROW
      BEGIN
        INSERT INTO variedades (
          xvariedadesidespecies, variedadesnombre, variedadesesgenerica, variedadesvisibilidadsino,
          variedadesdescripcion, variedadescolor, variedadestamano,
          variedadesviabilidadsemilla, variedadespeso1000semillas,
          variedadestemperaturaminima, variedadestemperaturaoptima, variedadestemperaturamaxima,
          variedadesmarcoplantas, variedadesmarcofilas,
          variedadesprofundidadsiembra, variedadesprofundidadtrasplante,
          variedadeshistoria,
          variedadessemillerodesde, variedadessemillerohasta,
          variedadessiembradirectadesde, variedadessiembradirectahasta,
          variedadestrasplantedesde, variedadestrasplantehasta,
          variedadesrecolecciondesde, variedadesrecoleccionhasta,
          variedadesautosuficiencia, variedadesautosuficienciaparcial, variedadesautosuficienciaconserva,
          variedadesicono,
          variedadesbiodinamicacategoria, variedadesbiodinamicanotas,
          variedadesnecesidadriego, variedadestiposiembra,
          variedadesvolumenmaceta, variedadesluzsolar,
          variedadescaracteristicassuelo, variedadesdificultad
        ) VALUES (
          NEW.idespecies, CONCAT(NEW.especiesnombre, ' (Genérica)'), 1, NEW.especiesvisibilidadsino,
          NEW.especiesdescripcion, NEW.especiescolor, NEW.especiestamano,
          NEW.especiesviabilidadsemilla, NEW.especiespeso1000semillas,
          NEW.especiestemperaturaminima, NEW.especiestemperaturaoptima, NEW.especiestemperaturamaxima,
          NEW.especiesmarcoplantas, NEW.especiesmarcofilas,
          NEW.especiesprofundidadsiembra, NEW.especiesprofundidadtrasplante,
          NEW.especieshistoria,
          NEW.especiesfechasemillerodesde, NEW.especiesfechasemillerohasta,
          NEW.especiesfechasiembradirectadesde, NEW.especiesfechasiembradirectahasta,
          NEW.especiestrasplantedesde, NEW.especiestrasplantehasta,
          NEW.especiesfecharecolecciondesde, NEW.especiesfecharecoleccionhasta,
          NEW.especiesautosuficiencia, NEW.especiesautosuficienciaparcial, NEW.especiesautosuficienciaconserva,
          NEW.especiesicono,
          NEW.especiesorganocomestible, NEW.especiesbiodinamicanotas,
          NEW.especiesnecesidadriego, NEW.especiestiposiembra,
          NEW.especiesvolumenmaceta, NEW.especiesluzsolar,
          NEW.especiescaracteristicassuelo, NEW.especiesdificultad
        );
      END
    `);
    console.log('   ✅ Trigger trg_especies_after_insert recreado');

    // =====================================================
    // Verificación final
    // =====================================================
    const [finalCols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'u117557593_Verdantia' AND TABLE_NAME = 'especies'
      ORDER BY ORDINAL_POSITION
    `);
    console.log(`\n✅ Migración completada. Total columnas: ${finalCols.length}`);

    const [finalTriggers] = await conn.query(`SHOW TRIGGERS WHERE \`Table\` = 'especies'`);
    console.log(`   Triggers activos: ${finalTriggers.map(t => t.Trigger).join(', ')}`);

    // Muestra
    const [sample] = await conn.query(`SELECT idespecies, especiesnombre, especiesphminimosuelo, especiesphmaximosuelo, especiesorganocomestible, especiesresistenciahelada FROM especies LIMIT 5`);
    console.log('\n📊 Muestra de datos:');
    sample.forEach(r => console.log(`  - [${r.idespecies}] ${r.especiesnombre}: pH ${r.especiesphminimosuelo || '?'}-${r.especiesphmaximosuelo || '?'}, órgano=${r.especiesorganocomestible || '—'}, helada=${r.especiesresistenciahelada || '—'}`));

  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    console.error(err);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
