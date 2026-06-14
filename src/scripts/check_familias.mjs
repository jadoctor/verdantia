import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
});

async function run() {
  try {
    const [familias] = await pool.query('SELECT idfamilias, familiasnombre FROM familias');
    console.log("Familias en la DB:", familias);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
