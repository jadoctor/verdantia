import pool from './src/lib/db';

async function run() {
  try {
    console.log('Starting migration for plantasparte...');

    const queries = [
      "ALTER TABLE afecciones DROP COLUMN afeccionesorganosafectados;",
      
      `CREATE TABLE afeccionesplantasparte (
        idafeccionesplantasparte INT AUTO_INCREMENT PRIMARY KEY,
        xafeccionesplantasparteidafecciones INT NOT NULL,
        xafeccionesplantasparteidplantasparte INT NOT NULL
      );`
    ];

    for (const q of queries) {
      console.log('Executing:', q);
      await pool.query(q);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

run();
