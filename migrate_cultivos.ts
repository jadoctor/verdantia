import pool from './src/lib/db';

async function migrate() {
  console.log('🌱 Iniciando migración de la base de datos para Cultivos y Semillas...');
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    console.log('1. Eliminando restricciones foráneas problemáticas antiguas si existen...');
    // Ignoramos errores de foreign key al hacer drop temporalmente
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('2. Eliminando tablas antiguas (laboresrealizadas, recolecciones, plantaciones, siembras, semillas)...');
    await connection.query('DROP TABLE IF EXISTS laboresrealizadas');
    await connection.query('DROP TABLE IF EXISTS recolecciones');
    await connection.query('DROP TABLE IF EXISTS plantaciones');
    await connection.query('DROP TABLE IF EXISTS siembras');
    await connection.query('DROP TABLE IF EXISTS semillas');
    await connection.query('DROP TABLE IF EXISTS cultivos');

    console.log('3. Creando nueva tabla `semillas`...');
    await connection.query(`
      CREATE TABLE \`semillas\` (
        \`idsemillas\` int NOT NULL AUTO_INCREMENT,
        \`xsemillasidusuarios\` int NOT NULL,
        \`xsemillasidvariedades\` int NOT NULL,
        \`semillasnumerocoleccion\` int DEFAULT NULL,
        \`semillasorigen\` enum('cosecha_propia', 'sobre_comprado', 'intercambio', 'regalada') NOT NULL DEFAULT 'sobre_comprado',
        \`semillasfecharecoleccion\` date DEFAULT NULL,
        \`semillasfechacaducidad\` date DEFAULT NULL,
        \`semillaslote\` varchar(60) DEFAULT NULL,
        \`semillasstock\` enum('abundante', 'medio', 'escaso', 'agotado') DEFAULT 'medio',
        \`semillasobservaciones\` text,
        \`semillasactivosino\` tinyint(1) NOT NULL DEFAULT 1,
        \`semillasfechacreacion\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`semillasfechaactualizacion\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`idsemillas\`),
        FOREIGN KEY (\`xsemillasidusuarios\`) REFERENCES \`usuarios\` (\`idusuarios\`) ON DELETE CASCADE,
        FOREIGN KEY (\`xsemillasidvariedades\`) REFERENCES \`variedades\` (\`idvariedades\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('4. Creando nueva tabla `cultivos` (Unificación)...');
    await connection.query(`
      CREATE TABLE \`cultivos\` (
        \`idcultivos\` int NOT NULL AUTO_INCREMENT,
        \`xcultivosidusuarios\` int NOT NULL,
        \`xcultivosidvariedades\` int NOT NULL,
        \`xcultivosidsemillas\` int DEFAULT NULL,
        \`cultivosnumerocoleccion\` int DEFAULT NULL,
        \`cultivosorigen\` enum('semilla_inventario', 'semilla_nueva', 'plantel_comprado', 'plantel_regalado', 'esqueje') NOT NULL,
        \`cultivosmetodo\` enum('semillero', 'siembra_directa', 'trasplante_directo') NOT NULL,
        \`cultivosestado\` enum('germinacion', 'crecimiento', 'produccion', 'finalizado', 'perdido') NOT NULL DEFAULT 'germinacion',
        \`cultivosfechainicio\` date NOT NULL,
        \`cultivosfechagerminacion\` date DEFAULT NULL,
        \`cultivosfechatrasplante\` date DEFAULT NULL,
        \`cultivosfechafinalizacion\` date DEFAULT NULL,
        \`cultivoscantidad\` int NOT NULL DEFAULT 1,
        \`cultivosubicacion\` varchar(150) DEFAULT NULL,
        \`cultivosobservaciones\` text,
        \`cultivosactivosino\` tinyint(1) NOT NULL DEFAULT 1,
        \`cultivosfechacreacion\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`cultivosfechaactualizacion\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`idcultivos\`),
        FOREIGN KEY (\`xcultivosidusuarios\`) REFERENCES \`usuarios\` (\`idusuarios\`) ON DELETE CASCADE,
        FOREIGN KEY (\`xcultivosidvariedades\`) REFERENCES \`variedades\` (\`idvariedades\`) ON DELETE CASCADE,
        FOREIGN KEY (\`xcultivosidsemillas\`) REFERENCES \`semillas\` (\`idsemillas\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('5. Creando nueva tabla `laboresrealizadas` (Historial apuntando a cultivos)...');
    await connection.query(`
      CREATE TABLE \`laboresrealizadas\` (
        \`idlaboresrealizadas\` int NOT NULL AUTO_INCREMENT,
        \`xlaboresrealizadasidcultivos\` int NOT NULL,
        \`xlaboresrealizadasidlabores\` int NOT NULL,
        \`laboresrealizadasfecha\` date NOT NULL,
        \`laboresrealizadasobservaciones\` text,
        \`laboresrealizadasfechacreacion\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`idlaboresrealizadas\`),
        FOREIGN KEY (\`xlaboresrealizadasidcultivos\`) REFERENCES \`cultivos\` (\`idcultivos\`) ON DELETE CASCADE,
        FOREIGN KEY (\`xlaboresrealizadasidlabores\`) REFERENCES \`labores\` (\`idlabores\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('6. Creando nueva tabla `recolecciones` (Cosechas apuntando a cultivos)...');
    await connection.query(`
      CREATE TABLE \`recolecciones\` (
        \`idrecolecciones\` int NOT NULL AUTO_INCREMENT,
        \`xrecoleccionesidusuarios\` int NOT NULL,
        \`xrecoleccionesidcultivos\` int NOT NULL,
        \`recoleccionesfecha\` date NOT NULL,
        \`recoleccionescantidad\` decimal(8,2) DEFAULT NULL,
        \`recoleccionesunidad\` enum('kg', 'g', 'unidades', 'manojos') DEFAULT 'unidades',
        \`recoleccionescalidad\` enum('excelente', 'buena', 'regular', 'mala') DEFAULT 'buena',
        \`recoleccionesobservaciones\` text,
        \`recoleccionesfechacreacion\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`idrecolecciones\`),
        FOREIGN KEY (\`xrecoleccionesidusuarios\`) REFERENCES \`usuarios\` (\`idusuarios\`) ON DELETE CASCADE,
        FOREIGN KEY (\`xrecoleccionesidcultivos\`) REFERENCES \`cultivos\` (\`idcultivos\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('7. Actualizando tabla `datosadjuntos` para soportar cultivos...');
    try {
      await connection.query('ALTER TABLE `datosadjuntos` ADD COLUMN `xdatosadjuntosidcultivos` int DEFAULT NULL;');
    } catch (e) {
      console.log('   La columna xdatosadjuntosidcultivos ya existía o hubo un error leve:', (e as any).message);
    }
    
    // Opcional: Eliminar columnas viejas si existen
    // await connection.query('ALTER TABLE `datosadjuntos` DROP COLUMN `xdatosadjuntosidsiembras`, DROP COLUMN `xdatosadjuntosidplantaciones`;');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();
    console.log('✅ Migración completada exitosamente.');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error durante la migración:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate();
