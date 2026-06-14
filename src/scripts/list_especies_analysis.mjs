import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
});

async function run() {
  try {
    const [rows] = await pool.query('SELECT especiesnombre, especiestipo FROM especies ORDER BY especiestipo, especiesnombre');
    console.log(JSON.stringify(rows));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
