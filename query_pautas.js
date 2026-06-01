const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM laborespauta WHERE xlaborespautaidespecies = 3 AND laborespautaactivosino = 1");
    console.log("Active pautas:", rows[0].count);
    
    const [rows2] = await pool.query("SELECT COUNT(*) as count FROM laborespauta WHERE xlaborespautaidespecies = 3 AND laborespautaactivosino = 0");
    console.log("Inactive pautas:", rows2[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
