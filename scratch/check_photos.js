const mysql = require('mysql2/promise');

async function run() {
  try {
    const pool = mysql.createPool({
      host: '34.175.111.133',
      user: 'root',
      password: 'Verdantiaja0334&',
      database: 'semillas_db',
      ssl: { rejectUnauthorized: false }
    });
    console.log('Connecting to DB...');
    const [rows] = await pool.query('SELECT iddatosadjuntos, datosadjuntosruta, datosadjuntosfechacreacion FROM datosadjuntos WHERE datosadjuntostipo = "imagen" ORDER BY datosadjuntosfechacreacion DESC LIMIT 10');
    console.log(rows);
  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    process.exit(0);
  }
}
run();
