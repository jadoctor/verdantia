import pool from './src/lib/db';

async function migrate() {
  console.log('Starting migration...');
  try {
    // Drop old date columns
    console.log('Dropping old date columns...');
    await pool.query(`ALTER TABLE semillas DROP COLUMN semillasfecharecoleccion, DROP COLUMN semillasfechaenvasado, DROP COLUMN semillasfechaadquisicion;`);
    
    // Add new unified date column
    console.log('Adding semillasfechaorigen...');
    await pool.query(`ALTER TABLE semillas ADD COLUMN semillasfechaorigen DATE DEFAULT NULL;`);
    
    // Add new unit measure column
    console.log('Adding semillasunidadmedida...');
    await pool.query(`ALTER TABLE semillas ADD COLUMN semillasunidadmedida ENUM('unidades', 'gramos', 'kilos', 'sobres') DEFAULT 'unidades';`);
    
    // Add physical location column
    console.log('Adding semillasubicacionfisica...');
    await pool.query(`ALTER TABLE semillas ADD COLUMN semillasubicacionfisica VARCHAR(100) DEFAULT NULL;`);
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  process.exit();
}

migrate();
