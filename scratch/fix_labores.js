const mysql = require('mysql2/promise');

async function run() {
  try {
    const pool = mysql.createPool({
      host: '34.175.111.133',
      user: 'root',
      password: 'Verdantiaja0334&',
      database: 'semillas_db',
      ssl: {
        rejectUnauthorized: false
      }
    });

    // 1. Fix plus signs
    console.log('Fixing plus signs in laboresdescripcion...');
    await pool.query("UPDATE labores SET laboresdescripcion = REPLACE(laboresdescripcion, '+', ' ') WHERE laboresdescripcion LIKE '%+%'");

    // 2. Add Siembra and Transplante if they don't exist
    console.log('Adding new labores: Siembra y Transplante...');
    
    const [rows] = await pool.query("SELECT laboresnombre FROM labores WHERE laboresnombre IN ('Siembra', 'Transplante')");
    const existing = rows.map(r => r.laboresnombre);

    if (!existing.includes('Siembra')) {
      await pool.query("INSERT INTO labores (laboresnombre, laboresdescripcion, laboresicono, laborescolor, laboresactivosino) VALUES ('Siembra', 'Labor de colocar la semilla en la tierra para su germinación.', '🌱', '#10b981', 1)");
      console.log('Inserted Siembra');
    }

    if (!existing.includes('Transplante')) {
      await pool.query("INSERT INTO labores (laboresnombre, laboresdescripcion, laboresicono, laborescolor, laboresactivosino) VALUES ('Transplante', 'Labor de trasladar una planta de un lugar a otro.', '🪴', '#3b82f6', 1)");
      console.log('Inserted Transplante');
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
