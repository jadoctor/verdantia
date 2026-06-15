import pool from '../src/lib/db.js';

async function createTable() {
  try {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS historialia (
        idhistorialia INT AUTO_INCREMENT PRIMARY KEY,
        xhistorialiaidusuarios INT NOT NULL,
        historialiafecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        historialiamodulo VARCHAR(50) NOT NULL,
        historialiaprompt TEXT,
        historialiarespuesta TEXT,
        historialiaexito TINYINT(1) DEFAULT 1,
        FOREIGN KEY (xhistorialiaidusuarios) REFERENCES usuarios(idusuarios) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await pool.query(createQuery);
    console.log("Tabla 'historialia' creada exitosamente.");
  } catch (error) {
    console.error("Error al crear la tabla:", error);
  } finally {
    process.exit(0);
  }
}

createTable();
