const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log("Creando tabla tiposavisos...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`tiposavisos\` (
        \`idtiposavisos\` int NOT NULL AUTO_INCREMENT,
        \`tiposavisoscodigo\` varchar(50) NOT NULL,
        \`tiposavisosnombre\` varchar(100) NOT NULL,
        \`tiposavisosdescripcion\` varchar(255) DEFAULT NULL,
        \`tiposavisosactivo\` tinyint(1) NOT NULL DEFAULT '1',
        PRIMARY KEY (\`idtiposavisos\`),
        UNIQUE KEY \`tiposavisoscodigo_UNIQUE\` (\`tiposavisoscodigo\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Creando tabla suscripcionesavisos...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`suscripcionesavisos\` (
        \`idsuscripcionesavisos\` int NOT NULL AUTO_INCREMENT,
        \`xsuscripcionesavisosidsuscripciones\` int NOT NULL,
        \`xsuscripcionesavisosidtiposavisos\` int NOT NULL,
        \`suscripcionesavisosestado\` int NOT NULL DEFAULT '0' COMMENT '0: Opcional, 1: Obligatorio, 2: Bloqueado',
        PRIMARY KEY (\`idsuscripcionesavisos\`),
        UNIQUE KEY \`susc_aviso_UNIQUE\` (\`xsuscripcionesavisosidsuscripciones\`,\`xsuscripcionesavisosidtiposavisos\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Creando tabla usuariosavisos...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`usuariosavisos\` (
        \`idusuariosavisos\` int NOT NULL AUTO_INCREMENT,
        \`xusuariosavisosidusuarios\` int NOT NULL,
        \`xusuariosavisosidtiposavisos\` int NOT NULL,
        \`usuariosavisosactivo\` tinyint(1) NOT NULL DEFAULT '1',
        PRIMARY KEY (\`idusuariosavisos\`),
        UNIQUE KEY \`usu_aviso_UNIQUE\` (\`xusuariosavisosidusuarios\`,\`xusuariosavisosidtiposavisos\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    // Insert initial dictionary of alerts
    console.log("Insertando diccionario base de tiposavisos...");
    await connection.execute(`
      INSERT IGNORE INTO \`tiposavisos\` (\`idtiposavisos\`, \`tiposavisoscodigo\`, \`tiposavisosnombre\`, \`tiposavisosdescripcion\`) VALUES
      (1, 'BLOGS', 'Boletín Agrícola (Blogs)', 'Artículos, trucos y guías semanales.'),
      (2, 'TAREAS', 'Tareas del Huerto', 'Alertas de tareas como riego o poda.'),
      (3, 'BIODINAMICA', 'Alertas Biodinámicas', 'Avisos de cambio de ciclo lunar (Raíz, Hoja...).'),
      (4, 'METEO', 'Alertas Meteorológicas', 'Alerta temprana de heladas o tormentas.'),
      (5, 'PROMO', 'Novedades y Promociones', 'Ofertas de planes y publicidad de partners.'),
      (6, 'SISTEMA', 'Alertas de Sistema', 'Avisos de cuenta, seguridad o pagos.');
    `);

    console.log("¡Tablas y diccionario creados con éxito!");

  } catch (error) {
    console.error("Error al crear tablas:", error);
  } finally {
    await connection.end();
  }
}

main();
