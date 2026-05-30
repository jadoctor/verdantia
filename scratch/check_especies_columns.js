const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log('=== ESPECIES ===');
    const [cols] = await conn.query("SHOW COLUMNS FROM especies");
    cols.forEach(c => console.log(`  ${c.Field} (${c.Type}) ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'}`));
  } catch (error) {
    console.error(error);
  } finally {
    await conn.end();
  }
}

run();
