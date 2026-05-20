const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const [rows] = await pool.query("DESCRIBE especies;");
    const columns = rows.map(r => r.Field);
    console.log("Especies columns:", columns.join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
