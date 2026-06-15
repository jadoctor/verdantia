const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    console.log('Migrating semillas table...');

    try {
      await connection.query('ALTER TABLE semillas CHANGE semillasfecharecoleccion semillasfechaorigen DATE DEFAULT NULL');
      console.log('✅ Renamed semillasfecharecoleccion to semillasfechaorigen');
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') console.log('⚠️ semillasfecharecoleccion not found or already renamed');
      else throw e;
    }

    const colsToDrop = ['semillasfechaenvasado', 'semillasfechaadquisicion', 'semillaslugarcompra'];
    for (const col of colsToDrop) {
      try {
        await connection.query(`ALTER TABLE semillas DROP COLUMN ${col}`);
        console.log(`✅ Dropped column ${col}`);
      } catch (e) {
        if (e.code === 'ER_CANT_DROP_FIELD_OR_KEY') console.log(`⚠️ Column ${col} already dropped`);
        else throw e;
      }
    }

    try {
      await connection.query(`ALTER TABLE semillas ADD COLUMN semillasunidadmedida ENUM('unidades', 'gramos', 'kilos', 'sobres') DEFAULT 'unidades'`);
      console.log('✅ Added semillasunidadmedida');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ Column semillasunidadmedida already exists');
      else throw e;
    }

    try {
      await connection.query(`ALTER TABLE semillas ADD COLUMN semillasubicacionfisica VARCHAR(255) DEFAULT NULL`);
      console.log('✅ Added semillasubicacionfisica');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ Column semillasubicacionfisica already exists');
      else throw e;
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runMigration();
