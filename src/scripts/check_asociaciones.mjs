import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
});

async function run() {
  try {
    const [ben] = await pool.query('SELECT * FROM asociacionesbeneficiosas LIMIT 10');
    const [perj] = await pool.query('SELECT * FROM asociacionesperjudiciales LIMIT 10');
    
    console.log("Asociaciones Beneficiosas:", ben);
    console.log("Asociaciones Perjudiciales:", perj);

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
