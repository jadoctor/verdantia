import mysql from 'mysql2/promise';

async function createBlogTable() {
  const connection = await mysql.createConnection({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Creando tabla blog...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS blog (
        idblog INT AUTO_INCREMENT PRIMARY KEY,
        xblogslug VARCHAR(255) UNIQUE NOT NULL,
        xblogtitulo VARCHAR(255) NOT NULL,
        xblogresumen TEXT,
        xblogcontenido LONGTEXT,
        xblogimagen VARCHAR(500),
        xblogestado ENUM('borrador', 'publicado') DEFAULT 'borrador',
        xblogidusuarios INT NULL,
        xblogidespecies INT NULL,
        xblogidvariedades INT NULL,
        xblogfechacreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        xblogfechapublicacion DATETIME NULL,
        FOREIGN KEY (xblogidusuarios) REFERENCES usuarios(idusuarios) ON DELETE SET NULL,
        FOREIGN KEY (xblogidespecies) REFERENCES especies(idespecies) ON DELETE SET NULL,
        FOREIGN KEY (xblogidvariedades) REFERENCES variedades(idvariedades) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Tabla blog creada exitosamente.");
  } catch (error) {
    console.error("Error al crear tabla blog:", error);
  } finally {
    await connection.end();
  }
}

createBlogTable();
