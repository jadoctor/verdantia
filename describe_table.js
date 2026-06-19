const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    port: 3306
  });

  const [columns] = await conn.query("DESCRIBE especiesconsumidores");
  console.log("COLUMNS:");
  console.log(JSON.stringify(columns, null, 2));

  try {
    const [indexes] = await conn.query("SHOW INDEX FROM especiesconsumidores");
    console.log("\nINDEXES:");
    console.log(JSON.stringify(indexes, null, 2));
  } catch (e) {
    console.log("No indexes found or error:", e.message);
  }

  await conn.end();
})().catch(e => console.error('Error:', e.message));
