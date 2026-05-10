const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });
  
  try {
    console.log("Limpiando tabla anterior si existe...");
    await conn.query(`DROP TABLE IF EXISTS especies_labores_pautas;`);
    
    console.log("Creando tabla laborespauta con estándar...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS laborespauta (
        idlaborespauta INT AUTO_INCREMENT PRIMARY KEY,
        xlaborespautaidlabores INT NOT NULL,
        xlaborespautaidespecies INT NOT NULL,
        laborespautafase VARCHAR(50) NOT NULL COMMENT 'Ej: germinacion, crecimiento, floracion, fructificacion',
        laborespautafrecuenciadias INT NULL COMMENT 'Cada cuántos días se realiza',
        laborespautanotasia TEXT NULL COMMENT 'Explicación IA',
        laborespautaactivosino TINYINT(1) DEFAULT 1 COMMENT '1 = Activa, 0 = Inactiva',
        UNIQUE KEY unique_laborespauta_rel (xlaborespautaidlabores, xlaborespautaidespecies, laborespautafase),
        FOREIGN KEY (xlaborespautaidlabores) REFERENCES labores(idlabores) ON DELETE CASCADE,
        FOREIGN KEY (xlaborespautaidespecies) REFERENCES especies(idespecies) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Tabla laborespauta creada correctamente.");
  } catch (e) {
    console.error("Error creando tabla:", e.message);
  }

  await conn.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
