const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });
  try {
    const [cols] = await connection.query("SHOW COLUMNS FROM semillas LIKE 'semillasorigen'");
    console.log('COLUMN DEFINITION:', cols);
  } catch (e) {
    console.error('Error querying columns:', e);
  }
  await connection.end();
  process.exit(0);
}
run();
