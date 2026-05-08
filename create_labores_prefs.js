const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log("Creando tabla usuariosavisoslabores...");
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`usuariosavisoslabores\` (
        \`idusuariosavisoslabores\` int NOT NULL AUTO_INCREMENT,
        \`xusuariosavisoslaboresidusuarios\` int NOT NULL,
        \`xusuariosavisoslaboresidlabores\` int NOT NULL,
        \`usuariosavisoslaboresactivo\` tinyint(1) NOT NULL DEFAULT '1' COMMENT '0: Silenciado, 1: Activo',
        PRIMARY KEY (\`idusuariosavisoslabores\`),
        UNIQUE KEY \`user_labor_UNIQUE\` (\`xusuariosavisoslaboresidusuarios\`,\`xusuariosavisoslaboresidlabores\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Tabla usuariosavisoslabores creada correctamente.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

main();
