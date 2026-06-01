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
    
    // Shift orders up by 1 for semillero, crecimiento, produccion, finalizado
    await pool.query("UPDATE fasescultivo SET fasescultivoorden = 5 WHERE fasescultivoclave = 'semillero'");
    await pool.query("UPDATE fasescultivo SET fasescultivoorden = 6 WHERE fasescultivoclave = 'crecimiento'");
    await pool.query("UPDATE fasescultivo SET fasescultivoorden = 7 WHERE fasescultivoclave = 'produccion'");
    await pool.query("UPDATE fasescultivo SET fasescultivoorden = 8 WHERE fasescultivoclave = 'finalizado'");

    // Rename phase 3 (which currently is germinando) to Post-siembra
    await pool.query("UPDATE fasescultivo SET fasescultivonombre = 'Post-siembra', fasescultivoclave = 'postsiembra', fasescultivodescripcion = 'Periodo de latencia desde la siembra hasta que sale el brote.', fasescultivoicono = '⏳' WHERE fasescultivoorden = 3");

    // Insert the new Germinacion phase at order 4
    const insertQuery = `
      INSERT INTO fasescultivo (fasescultivoclave, fasescultivonombre, fasescultivoorden, fasescultivocolor, fasescultivoicono, fasescultivodescripcion)
      VALUES ('germinacion', 'Germinación', 4, '#84cc16', '🌱', 'Momento puntual en el que el brote asoma de la tierra.')
      ON DUPLICATE KEY UPDATE 
        fasescultivonombre = 'Germinación', fasescultivoorden = 4;
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
