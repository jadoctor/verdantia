const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
}).promise();

async function main() {
  const [cols] = await pool.query('SHOW COLUMNS FROM fasescultivo');
  console.log(cols);
  await pool.end();
}

main().catch(console.error);
