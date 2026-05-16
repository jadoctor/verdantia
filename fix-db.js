const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await pool.query("ALTER TABLE incidencias MODIFY COLUMN incidenciasestado VARCHAR(50) DEFAULT 'pendiente'");
  
  // Fix the previously broken row
  await pool.query("UPDATE incidencias SET incidenciasestado = 'apelada' WHERE incidenciasestado = '' OR incidenciasestado IS NULL");
  
  console.log('ALTERED and FIXED!');
  process.exit(0);
}
test().catch(console.error);
