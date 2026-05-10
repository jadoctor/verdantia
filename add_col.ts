import pool from './src/lib/db';

async function addColumn() {
  try {
    const connection = await pool.getConnection();
    
    // Check if column exists
    const [columns]: any = await connection.query(`SHOW COLUMNS FROM especies LIKE 'especiesdiashastarecoleccion'`);
    if (columns.length > 0) {
      console.log('Column especiesdiashastarecoleccion already exists.');
    } else {
      console.log('Adding column especiesdiashastarecoleccion to especies table...');
      await connection.query(`ALTER TABLE especies ADD COLUMN especiesdiashastarecoleccion INT NULL AFTER especiesdiashastafructificacion`);
      console.log('Column added successfully.');
    }
    
    connection.release();
  } catch (error) {
    console.error('Database Error:', error);
  } finally {
    process.exit(0);
  }
}

addColumn();
