import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    const [rows] = await pool.query('SELECT idfasescultivo, fasescultivoclave, fasescultivonombre, fasescultivoicono, fasescultivotipo FROM fasescultivo ORDER BY fasescultivoorden ASC');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
