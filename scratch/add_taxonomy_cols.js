const mysql = require('mysql2/promise');

async function addColumns() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  });

  try {
    console.log('Adding columns to variedades table...');
    const queries = [
      'ALTER TABLE variedades ADD COLUMN variedadesnombrecientifico VARCHAR(255) DEFAULT NULL',
      'ALTER TABLE variedades ADD COLUMN variedadesfamilia VARCHAR(255) DEFAULT NULL',
      'ALTER TABLE variedades ADD COLUMN variedadestipo TEXT DEFAULT NULL',
      'ALTER TABLE variedades ADD COLUMN variedadesciclo TEXT DEFAULT NULL',
      'ALTER TABLE variedades ADD COLUMN variedadescolor VARCHAR(100) DEFAULT NULL'
    ];

    for (const query of queries) {
      try {
        await pool.query(query);
        console.log(`Success: ${query}`);
      } catch (e) {
        if (e.code === 'ER_DUP_COLUMN_NAME') {
          console.log(`Skipping: ${query} (Column already exists)`);
        } else {
          throw e;
        }
      }
    }
    console.log('Done.');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

addColumns();
