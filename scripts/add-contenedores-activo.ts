import pool from '../src/lib/db';

async function run() {
  try {
    const [columns]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'contenedores' AND COLUMN_NAME = 'contenedoresactivo'
    `);

    if (columns.length === 0) {
      await pool.query(`
        ALTER TABLE contenedores 
        ADD COLUMN contenedoresactivo TINYINT(1) NOT NULL DEFAULT 1
      `);
      console.log("Columna contenedoresactivo añadida.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}
run();
