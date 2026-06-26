import pool from './src/lib/db';

async function run() {
  try {
    console.log('Starting migration for afeccionestratamientosplantasparte...');

    const queries = [
      `CREATE TABLE afeccionestratamientosplantasparte (
        idafeccionestratamientosplantasparte INT AUTO_INCREMENT PRIMARY KEY,
        xafeccionestratamientosplantasparteidafeccionestratamientos INT NOT NULL,
        xafeccionestratamientosplantasparteidplantasparte INT NOT NULL
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
