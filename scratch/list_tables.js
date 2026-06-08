const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });
  
  const [tables] = await pool.query("SHOW TABLES");
  console.log(tables.map(t => Object.values(t)[0]));
  
  process.exit(0);
}

check().catch(console.error);
