import pool from '../src/lib/db';

async function main() {
  try {
    console.log('Altering tratamientos table...');
    
    await pool.query(`
      ALTER TABLE tratamientos
      ADD COLUMN tratamientosfrecuencia VARCHAR(255) DEFAULT NULL,
      ADD COLUMN tratamientosdosis VARCHAR(255) DEFAULT NULL,
      ADD COLUMN tratamientosaccion VARCHAR(100) DEFAULT NULL,
      ADD COLUMN tratamientoscarencia VARCHAR(100) DEFAULT NULL,
      ADD COLUMN tratamientosmecanismo TEXT DEFAULT NULL
    `);
    
    console.log('Columns added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error adding columns:', error);
    process.exit(1);
  }
}

main();
