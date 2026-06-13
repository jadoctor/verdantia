const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    console.log("Intentando actualizar cultivosestado a 'en_espera' en un cultivo existente...");
    const [result] = await pool.query('UPDATE cultivos SET cultivosestado = ? WHERE idcultivos = 33', ['en_espera']);
    console.log('Update exitoso:', result);
  } catch (err) {
    console.error('Error al actualizar:', err.message);
  } finally {
    await pool.end();
  }
}

run();
