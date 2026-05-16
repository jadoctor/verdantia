import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });
  
  const [rows] = await pool.query('SELECT * FROM variedades WHERE xvariedadesidusuarios IS NOT NULL ORDER BY idvariedades DESC LIMIT 1;');
  const row = rows[0];
  for (const key in row) {
    if (row[key] !== null && row[key] !== '' && !key.startsWith('xvariedades') && key !== 'idvariedades') {
      console.log(`${key} = ${row[key]}`);
    }
  }
  process.exit(0);
}
run();
