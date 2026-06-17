import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
});

async function run() {
  const [rows] = await pool.query('SELECT idvariedades, variedadesnombre, variedadesesgenerica, variedadesvisibilidadsino FROM variedades WHERE idvariedades = 54');
  console.log(rows);
  await pool.end();
}
run();
