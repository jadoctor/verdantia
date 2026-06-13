const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  const [rows] = await pool.query('SELECT idfasescultivo, fasescultivoclave, fasescultivonombre, fasescultivoorden, fasescultivotipo FROM fasescultivo ORDER BY fasescultivoorden ASC');
  console.log(JSON.stringify(rows, null, 2));
  pool.end();
}

main();
