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
    await pool.query('ALTER TABLE usuarios ADD COLUMN usuarioszonaclimatica VARCHAR(500) DEFAULT NULL;');
    console.log('Done!');
  } catch (err) {
    console.log('Already exists or error:', err.message);
  } finally {
    process.exit(0);
  }
}
run();
