const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
}).promise();

async function main() {
  const [result] = await pool.query("UPDATE fasescultivo SET fasescultivonombre = 'Hito Plantación' WHERE fasescultivoclave = 'trasplante'");
  console.log('Update result:', result);
  await pool.end();
}

main().catch(console.error);
