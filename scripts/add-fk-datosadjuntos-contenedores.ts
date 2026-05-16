import pool from '../src/lib/db';

async function run() {
  try {
    console.log("Comprobando si existe xdatosadjuntosidcontenedores...");
    
    const [columns]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'datosadjuntos' AND COLUMN_NAME = 'xdatosadjuntosidcontenedores'
    `);

    if (columns.length === 0) {
      await pool.query(`
        ALTER TABLE datosadjuntos 
        ADD COLUMN xdatosadjuntosidcontenedores INT(11) NULL DEFAULT NULL AFTER xdatosadjuntosidcultivos
      `);
      console.log("Columna xdatosadjuntosidcontenedores añadida a datosadjuntos.");
    } else {
      console.log("La columna ya existe.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}
run();
