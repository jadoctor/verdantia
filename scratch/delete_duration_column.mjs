import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log("Eliminando la columna fasescultivoduracion de la tabla fasescultivo...");
    
    // Check if column exists
    const [columns] = await pool.query('SHOW COLUMNS FROM fasescultivo');
    const columnNames = columns.map(c => c.Field);

    if (columnNames.includes('fasescultivoduracion')) {
      await pool.query('ALTER TABLE fasescultivo DROP COLUMN fasescultivoduracion');
      console.log("Columna eliminada con éxito.");
    } else {
      console.log("La columna no existe o ya ha sido eliminada.");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

main();
