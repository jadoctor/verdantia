const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    await pool.query("DELETE FROM labores WHERE laboresnombre = 'Otros'");
    console.log("Labor deleted.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
