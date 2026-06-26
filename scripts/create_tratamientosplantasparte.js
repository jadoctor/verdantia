const mysql = require('mysql2/promise');

async function createTable() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  const query = `
    CREATE TABLE IF NOT EXISTS tratamientosplantasparte (
      idtratamientosplantasparte INT AUTO_INCREMENT PRIMARY KEY,
      xtratamientosplantasparteidtratamientos INT NOT NULL,
      xtratamientosplantasparteidplantasparte INT NOT NULL,
      UNIQUE KEY unique_trat_parte (xtratamientosplantasparteidtratamientos, xtratamientosplantasparteidplantasparte),
      FOREIGN KEY (xtratamientosplantasparteidtratamientos) REFERENCES tratamientos(idtratamientos) ON DELETE CASCADE,
      FOREIGN KEY (xtratamientosplantasparteidplantasparte) REFERENCES plantasparte(idplantasparte) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(query);
    console.log('Table tratamientosplantasparte created successfully.');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await pool.end();
  }
}

createTable();
