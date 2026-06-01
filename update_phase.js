const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    await pool.query("UPDATE fasescultivo SET fasescultivonombre = 'Pre-siembra' WHERE fasescultivoclave = 'planificado'");
    console.log('Update successful!');
  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await pool.end();
  }
}

run();
