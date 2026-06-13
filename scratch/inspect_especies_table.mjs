import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    const [columns] = await pool.query('SHOW COLUMNS FROM especies');
    console.log(columns.map(c => c.Field));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
