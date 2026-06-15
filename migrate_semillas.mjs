import pool from './src/lib/db.js';

async function migrate() {
  console.log('Starting migration...');
  try {
    console.log('Dropping old date columns...');
    await pool.query(`ALTER TABLE semillas DROP COLUMN semillasfecharecoleccion, DROP COLUMN semillasfechaenvasado, DROP COLUMN semillasfechaadquisicion;`);
    
    console.log('Adding semillasfechaorigen...');
    await pool.query(`ALTER TABLE semillas ADD COLUMN semillasfechaorigen DATE DEFAULT NULL;`);
    
    console.log('Adding semillasunidadmedida...');
    await pool.query(`ALTER TABLE semillas ADD COLUMN semillasunidadmedida ENUM('unidades', 'gramos', 'kilos', 'sobres') DEFAULT 'unidades';`);
    
    console.log('Adding semillasubicacionfisica...');
    await pool.query(`ALTER TABLE semillas ADD COLUMN semillasubicacionfisica VARCHAR(100) DEFAULT NULL;`);
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  process.exit();
}

migrate();
