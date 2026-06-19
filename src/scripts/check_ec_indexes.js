const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    port: 3306
  });

  const [parts] = await conn.query("SELECT * FROM plantasparte");
  console.log("PLANTASPARTE:");
  console.log(JSON.stringify(parts, null, 2));

  await conn.end();
})().catch(e => console.error('Error:', e.message));

