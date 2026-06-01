const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const [result] = await pool.query("DELETE FROM laborespauta WHERE xlaborespautaidespecies = 3");
    console.log(`Deleted ${result.affectedRows} chores for Tomato (ID 3).`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
