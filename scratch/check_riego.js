const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });
  
  const [cols] = await conn.query(`DESCRIBE labores`);
  console.log('=== labores columns ===');
  cols.forEach(c => console.log(`${c.Field} (${c.Type}) ${c.Null === 'YES' ? 'nullable' : 'required'}`));

  await conn.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
