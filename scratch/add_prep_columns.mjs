import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log("Añadiendo columnas de tiempos de preparación a la tabla especies...");
    
    // Check if columns already exist
    const [columns] = await pool.query('SHOW COLUMNS FROM especies');
    const columnNames = columns.map(c => c.Field);

    const queries = [];
    if (!columnNames.includes('especiespreparacionconvencional')) {
      queries.push('ADD COLUMN especiespreparacionconvencional INT DEFAULT 0');
    }
    if (!columnNames.includes('especiespreparacionminima')) {
      queries.push('ADD COLUMN especiespreparacionminima INT DEFAULT 0');
    }
    if (!columnNames.includes('especiespreparacionnolaboreo')) {
      queries.push('ADD COLUMN especiespreparacionnolaboreo INT DEFAULT 0');
    }

    if (queries.length > 0) {
      const alterQuery = `ALTER TABLE especies ${queries.join(', ')}`;
      await pool.query(alterQuery);
      console.log("Columnas añadidas correctamente.");
    } else {
      console.log("Las columnas ya existen en la tabla especies.");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

main();
