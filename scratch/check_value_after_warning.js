const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const [rows] = await pool.query('SELECT cultivosestado FROM cultivos WHERE idcultivos = 33');
    console.log('Valor actual:', rows[0]);
    const [warnings] = await pool.query('SHOW WARNINGS');
    console.log('Warnings:', warnings);
    
    // Restaurar a germinacion
    await pool.query("UPDATE cultivos SET cultivosestado = 'germinacion' WHERE idcultivos = 33");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
