const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });
  
  try {
    console.log("Creando tabla especies_labores_pautas...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS especies_labores_pautas (
        idpauta INT AUTO_INCREMENT PRIMARY KEY,
        xidespecies INT NOT NULL,
        xidlabores INT NOT NULL,
        fase VARCHAR(50) NOT NULL COMMENT 'Ej: germinacion, plantula, crecimiento, floracion, fructificacion, general',
        frecuencia_dias INT NULL COMMENT 'Cada cuántos días se realiza la labor en esta fase',
        notas_ia TEXT NULL COMMENT 'Explicación generada por la IA para esta pauta',
        UNIQUE KEY unique_especie_labor_fase (xidespecies, xidlabores, fase),
        FOREIGN KEY (xidespecies) REFERENCES especies(idespecies) ON DELETE CASCADE,
        FOREIGN KEY (xidlabores) REFERENCES labores(idlabores) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Tabla creada correctamente.");
  } catch (e) {
    console.error("Error creando tabla:", e.message);
  }

  await conn.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
