const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    multipleStatements: true
  });

  try {
    console.log('Starting update...');
    
    // Shift orders up by 1 for everything from germinando onwards
    await pool.query("UPDATE fasescultivo SET fasescultivoorden = 3 WHERE fasescultivoclave = 'germinando'");
    await pool.query("UPDATE fasescultivo SET fasescultivoorden = 4 WHERE fasescultivoclave = 'semillero'");
    await pool.query("UPDATE fasescultivo SET fasescultivoorden = 5 WHERE fasescultivoclave = 'crecimiento'");
    await pool.query("UPDATE fasescultivo SET fasescultivoorden = 6 WHERE fasescultivoclave = 'produccion'");
    await pool.query("UPDATE fasescultivo SET fasescultivoorden = 7 WHERE fasescultivoclave = 'finalizado'");

    // Insert the new Siembra phase
    const insertQuery = `
      INSERT INTO fasescultivo (fasescultivoclave, fasescultivonombre, fasescultivoorden, fasescultivocolor, fasescultivoicono, fasescultivodescripcion)
      VALUES ('siembra', 'Siembra', 2, '#d97706', '⛏️', 'Momento de plantación de la semilla. Útil para asociar tareas de preparación y abono.')
      ON DUPLICATE KEY UPDATE 
        fasescultivonombre = 'Siembra', fasescultivoorden = 2;
    `;
    await pool.query(insertQuery);
    
    console.log('Update successful!');
  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await pool.end();
  }
}

run();
