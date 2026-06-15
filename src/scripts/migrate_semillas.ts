import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verdantia',
  });

  try {
    console.log('Migrating semillas table...');

    // 1. Rename semillasfecharecoleccion -> semillasfechaorigen
    try {
      await connection.query('ALTER TABLE semillas CHANGE semillasfecharecoleccion semillasfechaorigen DATE DEFAULT NULL');
      console.log('✅ Renamed semillasfecharecoleccion to semillasfechaorigen');
    } catch (e: any) {
      if (e.code === 'ER_BAD_FIELD_ERROR') console.log('⚠️ semillasfecharecoleccion not found or already renamed');
      else throw e;
    }

    // 2. Drop obsolete columns
    const colsToDrop = ['semillasfechaenvasado', 'semillasfechaadquisicion', 'semillaslugarcompra'];
    for (const col of colsToDrop) {
      try {
        await connection.query(`ALTER TABLE semillas DROP COLUMN ${col}`);
        console.log(`✅ Dropped column ${col}`);
      } catch (e: any) {
        if (e.code === 'ER_CANT_DROP_FIELD_OR_KEY') console.log(`⚠️ Column ${col} already dropped`);
        else throw e;
      }
    }

    // 3. Add new columns
    try {
      await connection.query(`ALTER TABLE semillas ADD COLUMN semillasunidadmedida ENUM('unidades', 'gramos', 'kilos', 'sobres') DEFAULT 'unidades'`);
      console.log('✅ Added semillasunidadmedida');
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('⚠️ Column semillasunidadmedida already exists');
      else throw e;
    }

    try {
      await connection.query(`ALTER TABLE semillas ADD COLUMN semillasubicacionfisica VARCHAR(255) DEFAULT NULL`);
      console.log('✅ Added semillasubicacionfisica');
    } catch (e: any) {
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
