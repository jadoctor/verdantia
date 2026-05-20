import pool from '../src/lib/db';

async function run() {
  try {
    const [columnsDesde]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'especies' AND COLUMN_NAME = 'especiesemillerovolumendesde'
    `);

    if (columnsDesde.length === 0) {
      await pool.query(`
        ALTER TABLE especies 
        ADD COLUMN especiesemillerovolumendesde INT NULL,
        ADD COLUMN especiesemillerovolumenhasta INT NULL
      `);
      console.log("Columnas especiesemillerovolumendesde y especiesemillerovolumenhasta añadidas a la tabla especies.");
    } else {
      console.log("Las columnas ya existen en la tabla especies.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}
run();
