const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });
  
  console.log('--- Describe especiesusuarios table ---');
  const [cols] = await pool.query("DESCRIBE especiesusuarios");
  console.log(cols.map(c => c.Field));
  
  process.exit(0);
}

check().catch(console.error);
