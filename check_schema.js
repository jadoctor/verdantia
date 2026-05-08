const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  console.log('=== ASOCIACIONES BENEFICIOSAS ===');
  const [cols1] = await conn.query("SHOW COLUMNS FROM asociacionesbeneficiosas");
  cols1.forEach(c => console.log(`  ${c.Field} (${c.Type}) ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'}`));

  console.log('\n=== ASOCIACIONES PERJUDICIALES ===');
  const [cols2] = await conn.query("SHOW COLUMNS FROM asociacionesperjudiciales");
  cols2.forEach(c => console.log(`  ${c.Field} (${c.Type}) ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'}`));

  console.log('\n=== ESPECIESPLAGAS ===');
  const [cols3] = await conn.query("SHOW COLUMNS FROM especiesplagas");
  cols3.forEach(c => console.log(`  ${c.Field} (${c.Type}) ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'}`));

  await conn.end();
})();
