const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
}).promise();

async function main() {
  console.log("Actualizando el nombre de la fase 'postgerminacion' a 'Fase Postgerminación'...");
  const [result] = await pool.query(
    "UPDATE fasescultivo SET fasescultivonombre = 'Fase Postgerminación' WHERE fasescultivoclave = 'postgerminacion'"
  );
  console.log('Resultado del update:', result);
  await pool.end();
}

main().catch(console.error);
