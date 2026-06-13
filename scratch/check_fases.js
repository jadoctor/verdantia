const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
}).promise();

async function main() {
  const [rows] = await pool.query('SELECT idfasescultivo, fasescultivoclave, fasescultivonombre, fasescultivoorden, fasescultivotipo FROM fasescultivo ORDER BY fasescultivoorden');
  console.log(JSON.stringify(rows, null, 2));
  await pool.end();
}

main().catch(console.error);
