import pool from '@/lib/db';

async function runMigration() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log('1. Creating table logros...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS logros (
        idlogros INT AUTO_INCREMENT PRIMARY KEY,
        logrosnombre VARCHAR(100) NOT NULL UNIQUE,
        logrosdescripcion TEXT NULL,
        logrosicono VARCHAR(255) NULL
      );
    `);

    console.log('2. Inserting initial logros...');
    await connection.query(`
      INSERT IGNORE INTO logros (logrosnombre) VALUES ('Visitante'), ('Campesino Aprendiz');
    `);

    console.log('3. Renaming table and columns...');
    await connection.query(`RENAME TABLE usuarios_logros TO usuarioslogros;`);
    
    await connection.query(`
      ALTER TABLE usuarioslogros
        CHANGE id_registro idusuarioslogros INT AUTO_INCREMENT,
        CHANGE idusuarios xusuarioslogrosidusuarios INT NOT NULL,
        CHANGE fecha_desbloqueo usuarioslogrosfechainicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN xusuarioslogrosidlogros INT NULL AFTER xusuarioslogrosidusuarios,
        ADD COLUMN usuarioslogrosfechafin TIMESTAMP NULL DEFAULT NULL;
    `);

    console.log('4. Migrating string names to foreign keys...');
    await connection.query(`
      UPDATE usuarioslogros u
      JOIN logros l ON u.nombre_logro = l.logrosnombre
      SET u.xusuarioslogrosidlogros = l.idlogros;
    `);

    console.log('5. Dropping old string column and setting FK constraint...');
    await connection.query(`
      ALTER TABLE usuarioslogros 
        DROP COLUMN nombre_logro;
    `);
    
    // Check if there are any nulls in xusuarioslogrosidlogros due to non-matching names
    // (We make it NOT NULL now to enforce constraint)
    await connection.query(`
      ALTER TABLE usuarioslogros 
        MODIFY xusuarioslogrosidlogros INT NOT NULL;
    `);

    await connection.commit();
    console.log('✅ Migration completed successfully!');
    
  } catch (err) {
    await connection.rollback();
    console.error('❌ Migration failed, rolled back.', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration();
