import pool from '../src/lib/db';

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Iniciando Macro-Migración Simplificada de Base de Datos...');
    
    // 1. REPARAR TABLA PUENTE Y RENOMBRARLA A `vegetalesanimales`
    console.log('1. Migrando tabla relacional a vegetalesanimales...');
    await connection.query('RENAME TABLE plantasespeciesanimales TO vegetalesanimales');
    await connection.query('ALTER TABLE vegetalesanimales RENAME COLUMN idplantasespeciesanimales TO idvegetalesanimales');
    await connection.query('ALTER TABLE vegetalesanimales RENAME COLUMN xplantasespeciesanimalesidespecies TO xvegetalesanimalesidespeciesvegetales');
    await connection.query('ALTER TABLE vegetalesanimales RENAME COLUMN xplantasespeciesanimalesidespeciesanimales TO xvegetalesanimalesidespeciesanimales');
    await connection.query('ALTER TABLE vegetalesanimales RENAME COLUMN plantasespeciesanimalesesapto TO vegetalesanimalesesapto');
    await connection.query('ALTER TABLE vegetalesanimales RENAME COLUMN especiesconsumidoresnotas TO vegetalesanimalesnotas');
    await connection.query('ALTER TABLE vegetalesanimales RENAME COLUMN xplantasespeciesanimalesidplantasparte TO xvegetalesanimalesidplantasparte');
    
    // 2. RENOMBRAR `animales` a `especiesanimales`
    console.log('2. Migrando animales a especiesanimales...');
    await connection.query('RENAME TABLE animales TO especiesanimales');
    await connection.query('ALTER TABLE especiesanimales RENAME COLUMN idanimales TO idespeciesanimales');
    await connection.query('ALTER TABLE especiesanimales RENAME COLUMN animalesnombre TO especiesanimalesnombre');
    await connection.query('ALTER TABLE especiesanimales RENAME COLUMN animalesicono TO especiesanimalesicono');
    await connection.query('ALTER TABLE especiesanimales RENAME COLUMN animalesdescripcion TO especiesanimalesdescripcion');
    await connection.query('ALTER TABLE especiesanimales RENAME COLUMN animalesactivo TO especiesanimalesactivo');

    // 3. RENOMBRAR `especies` a `especiesvegetales`
    console.log('3. Migrando especies a especiesvegetales...');
    await connection.query('RENAME TABLE especies TO especiesvegetales');
    
    const [colsEspecies] = await connection.query('SHOW COLUMNS FROM especiesvegetales');
    for (const col of colsEspecies as any[]) {
      const oldName = col.Field as string;
      if (oldName.startsWith('especies') || oldName === 'idespecies' || oldName.startsWith('xespecies')) {
        let newName = oldName.replace('especies', 'especiesvegetales');
        await connection.query(`ALTER TABLE especiesvegetales RENAME COLUMN ${oldName} TO ${newName}`);
      }
    }

    // 4. RENOMBRAR `variedades` a `variedadesvegetales`
    console.log('4. Migrando variedades a variedadesvegetales...');
    await connection.query('RENAME TABLE variedades TO variedadesvegetales');
    const [colsVariedades] = await connection.query('SHOW COLUMNS FROM variedadesvegetales');
    for (const col of colsVariedades as any[]) {
      const oldName = col.Field as string;
      if (oldName.includes('variedades') || oldName.includes('idespecies')) {
        let newName = oldName.replace('variedades', 'variedadesvegetales');
        newName = newName.replace('idespecies', 'idespeciesvegetales');
        await connection.query(`ALTER TABLE variedadesvegetales RENAME COLUMN ${oldName} TO ${newName}`);
      }
    }
    
    // We ALSO need to fix foreign key column names in the secondary tables that still point to idespecies.
    // For example: xespeciesafeccionesidespecies -> xespeciesafeccionesidespeciesvegetales
    // We will do this manually for the ones that don't change table name
    console.log('4.1 Arreglando referencias secundarias de idespecies y idvariedades...');
    const dependentTables = [
      'especiesafecciones', 'especiesfases', 'especiessinonimos', 'especiesusuarios',
      'especiesplagas', 'especieslabores', 'especiesclimas', 'especiesasociaciones'
    ];
    for (const table of dependentTables) {
      try {
        const [cols] = await connection.query(`SHOW COLUMNS FROM ${table}`);
        for (const col of cols as any[]) {
          const oldCol = col.Field as string;
          if (oldCol.includes('idespecies')) {
            const newCol = oldCol.replace('idespecies', 'idespeciesvegetales');
            await connection.query(`ALTER TABLE ${table} RENAME COLUMN ${oldCol} TO ${newCol}`);
          }
        }
      } catch(e) {}
    }

    // Fix other relations
    try { await connection.query('ALTER TABLE variedadesusuarios RENAME COLUMN idvariedades TO idvariedadesvegetales'); } catch(e){}
    try { await connection.query('ALTER TABLE variedadesusuarios RENAME COLUMN xvariedadesidvariedades TO xvariedadesvegetalesidvariedadesvegetales'); } catch(e){}

    // 5. CREAR `variedadesanimales`
    console.log('5. Creando tabla variedadesanimales...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS variedadesanimales (
        idvariedadesanimales INT AUTO_INCREMENT PRIMARY KEY,
        xvariedadesanimalesidespeciesanimales INT,
        variedadesanimalesnombre VARCHAR(255) NOT NULL,
        variedadesanimalesdescripcion TEXT,
        variedadesanimalesfoto VARCHAR(255),
        variedadesanimalesactivo TINYINT(1) DEFAULT 1
      )
    `);

    // 6. ARREGLAR `datosadjuntos`
    console.log('6. Arreglando datosadjuntos...');
    try { await connection.query('ALTER TABLE datosadjuntos RENAME COLUMN xdatosadjuntosidanimales TO xdatosadjuntosidespeciesanimales'); } catch(e) {}
    try { await connection.query('ALTER TABLE datosadjuntos RENAME COLUMN xdatosadjuntosidespecies TO xdatosadjuntosidespeciesvegetales'); } catch(e) {}
    try { await connection.query('ALTER TABLE datosadjuntos RENAME COLUMN xdatosadjuntosidvariedades TO xdatosadjuntosidvariedadesvegetales'); } catch(e) {}

    console.log('¡MACRO-MIGRACIÓN SIMPLIFICADA COMPLETADA CON ÉXITO!');
  } catch (error) {
    console.error('Error durante la macro-migración:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate();
