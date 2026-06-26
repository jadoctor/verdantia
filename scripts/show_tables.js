const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });
  const [rows] = await pool.query("SHOW TABLES LIKE '%asociaciones%'");
  console.log(rows);
  process.exit(0);
}
run();
