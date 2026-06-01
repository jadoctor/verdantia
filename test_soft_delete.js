const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const idlaborespauta = 271;
    const resolvedParamsId = 3;
    console.log("Attempting soft delete...");
    const [res] = await pool.query('UPDATE laborespauta SET laborespautaactivosino = 0 WHERE idlaborespauta = ? AND xlaborespautaidespecies = ?', [idlaborespauta, resolvedParamsId]);
    console.log("Update result:", res);
  } catch (err) {
    console.error("Error during update:", err);
  } finally {
    await pool.end();
  }
}

run();
