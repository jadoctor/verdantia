const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const pool = mysql.createPool(process.env.DATABASE_URL);
  const [rows] = await pool.query("SELECT iddatosadjuntos, datosadjuntostitulo, datosadjuntosportada FROM datosadjuntos WHERE xdatosadjuntosidespecies = 10 AND datosadjuntostipo = 'documento'");
  console.log('PDFs for Especie 10:');
  console.log(rows);
  process.exit(0);
}

check();
