const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  console.log('=== CULTIVOSAVISOS ===');
  const [cols1] = await conn.query("SHOW COLUMNS FROM cultivosavisos");
  cols1.forEach(c => console.log(`  ${c.Field} (${c.Type}) ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'} Key: ${c.Key}`));

  console.log('\n=== DATOSADJUNTOS ===');
  const [cols2] = await conn.query("SHOW COLUMNS FROM datosadjuntos");
  cols2.forEach(c => console.log(`  ${c.Field} (${c.Type}) ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'} Key: ${c.Key}`));

  await conn.end();
})();
