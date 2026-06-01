const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const [tables] = await pool.query("SHOW TABLES LIKE '%labores%'");
    console.log("Tables matching 'labores':", tables.map(t => Object.values(t)[0]));

    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      const [cols] = await pool.query(`DESCRIBE ${tableName}`);
      console.log(`Schema for ${tableName}:`, cols.map(c => c.Field).join(', '));
    }
    
    // Also check if there's any table linking especies and labores
    const [allTables] = await pool.query("SHOW TABLES");
    const linkTables = allTables.map(t => Object.values(t)[0]).filter(t => t.includes('especie') && t.includes('labor'));
    console.log("Tables matching 'especie' AND 'labor':", linkTables);
    
    for (const tableName of linkTables) {
      const [cols] = await pool.query(`DESCRIBE ${tableName}`);
      console.log(`Schema for ${tableName}:`, cols.map(c => c.Field).join(', '));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
