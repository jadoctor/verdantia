const mysql = require('mysql2/promise');

async function checkData() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  });

  try {
    const [rows] = await pool.query('SELECT variedadesnombre, variedadescolor, variedadesesgenerica FROM variedades LIMIT 10');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkData();
