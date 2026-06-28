import pool from '../src/lib/db';

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Iniciando migración de nombres de tablas y columnas...');
    
    // 1. Rename the relational table `especiesanimales` -> `plantasespeciesanimales`
    // First rename the table
    await connection.query('RENAME TABLE especiesanimales TO plantasespeciesanimales');
    console.log('Tabla especiesanimales renombrada a plantasespeciesanimales');
    
    // Rename columns of plantasespeciesanimales
    await connection.query('ALTER TABLE plantasespeciesanimales RENAME COLUMN idespeciesanimales TO idplantasespeciesanimales');
    await connection.query('ALTER TABLE plantasespeciesanimales RENAME COLUMN xespeciesanimalesidespecies TO xplantasespeciesanimalesidespecies');
    await connection.query('ALTER TABLE plantasespeciesanimales RENAME COLUMN xespeciesanimalesidanimales TO xplantasespeciesanimalesidespeciesanimales');
    await connection.query('ALTER TABLE plantasespeciesanimales RENAME COLUMN especiesanimalesesapto TO plantasespeciesanimalesesapto');
    await connection.query('ALTER TABLE plantasespeciesanimales RENAME COLUMN xespeciesanimalesidplantasparte TO xplantasespeciesanimalesidplantasparte');
    await connection.query('ALTER TABLE plantasespeciesanimales RENAME COLUMN especiesanimalesnotas TO plantasespeciesanimalesnotas');
    console.log('Columnas de plantasespeciesanimales renombradas.');
    
    // 2. Rename the catalog table `animales` -> `especiesanimales`
    await connection.query('RENAME TABLE animales TO especiesanimales');
    console.log('Tabla animales renombrada a especiesanimales');
    
    // Rename columns of especiesanimales
    await connection.query('ALTER TABLE especiesanimales RENAME COLUMN idanimales TO idespeciesanimales');
    await connection.query('ALTER TABLE especiesanimales RENAME COLUMN animalesnombre TO especiesanimalesnombre');
    await connection.query('ALTER TABLE especiesanimales RENAME COLUMN animalesicono TO especiesanimalesicono');
    await connection.query('ALTER TABLE especiesanimales RENAME COLUMN animalesdescripcion TO especiesanimalesdescripcion');
    await connection.query('ALTER TABLE especiesanimales RENAME COLUMN animalesactivo TO especiesanimalesactivo');
    console.log('Columnas de especiesanimales renombradas.');

    // Also update `datosadjuntos` to reference `especiesanimales` instead of `animales`
    await connection.query('ALTER TABLE datosadjuntos RENAME COLUMN xdatosadjuntosidanimales TO xdatosadjuntosidespeciesanimales');
    console.log('Columna en datosadjuntos actualizada.');

    console.log('¡Migración completada con éxito!');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate();
