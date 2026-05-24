import pool from '@/lib/db';

async function finishMigration() {
  const connection = await pool.getConnection();
  try {
    console.log('1. Dropping old unique index...');
    await connection.query(`ALTER TABLE usuarioslogros DROP INDEX user_logro_unique;`);

    console.log('2. Dropping old column...');
    await connection.query(`ALTER TABLE usuarioslogros DROP COLUMN nombre_logro;`);

    console.log('3. Creating new unique index...');
    await connection.query(`ALTER TABLE usuarioslogros ADD UNIQUE INDEX user_logro_unique (xusuarioslogrosidusuarios, xusuarioslogrosidlogros);`);
    
    console.log('✅ Migration finished successfully!');
  } catch (err) {
    console.error('❌ Migration failed.', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

finishMigration();
