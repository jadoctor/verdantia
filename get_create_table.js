const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    port: 3306
  });

  const [rows] = await conn.query("SHOW CREATE TABLE especiesconsumidores");
  console.log("CREATE TABLE especiesconsumidores:");
  console.log(rows[0]['Create Table']);

  await conn.end();
})().catch(e => console.error('Error:', e.message));
