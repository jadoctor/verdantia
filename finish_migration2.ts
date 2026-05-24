import pool from '@/lib/db';

async function finishMigration() {
  const connection = await pool.getConnection();
  try {
    console.log('1. Creating index for FK to free the unique index...');
    await connection.query(`CREATE INDEX idx_fk_logros_usuarios ON usuarioslogros (xusuarioslogrosidusuarios);`);

    console.log('2. Dropping old unique index...');
    await connection.query(`ALTER TABLE usuarioslogros DROP INDEX user_logro_unique;`);

    console.log('3. Dropping old column...');
    await connection.query(`ALTER TABLE usuarioslogros DROP COLUMN nombre_logro;`);

    console.log('4. Creating new unique index...');
    await connection.query(`ALTER TABLE usuarioslogros ADD UNIQUE INDEX user_logro_unique (xusuarioslogrosidusuarios, xusuarioslogrosidlogros);`);
    
    console.log('5. Adding FK to logros...');
    await connection.query(`
      ALTER TABLE usuarioslogros 
      ADD CONSTRAINT fk_logros_logros 
      FOREIGN KEY (xusuarioslogrosidlogros) REFERENCES logros (idlogros)
      ON DELETE CASCADE;
    `);

    console.log('✅ Migration finished successfully!');
  } catch (err) {
    console.error('❌ Migration failed.', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

finishMigration();
