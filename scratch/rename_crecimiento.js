const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
}).promise();

async function main() {
  console.log("Actualizando el nombre de la fase 'crecimiento' a 'Fase Crecimiento Vegetativo'...");
  const [result] = await pool.query(
    "UPDATE fasescultivo SET fasescultivonombre = 'Fase Crecimiento Vegetativo' WHERE fasescultivoclave = 'crecimiento'"
  );
  console.log('Resultado del update:', result);
  await pool.end();
}

main().catch(console.error);
