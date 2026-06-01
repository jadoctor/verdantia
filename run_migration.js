const fs = require('fs');
const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    waitForConnections: true,
    connectionLimit: 5,
    multipleStatements: true
  });

  try {
    const sql = fs.readFileSync('migracion_fases.sql', 'utf8');
    console.log('Running migration...');
    const [result] = await pool.query(sql);
    console.log('Migration successful!', result);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
