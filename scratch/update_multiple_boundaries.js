const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
}).promise();

async function main() {
  console.log("Setting multiple boundaries for standard phases...");
  await pool.query(
    "UPDATE fasescultivo SET fasescultivohasta = 'siembra,adquisicion' WHERE fasescultivoclave = 'planificacion'"
  );
  await pool.query(
    "UPDATE fasescultivo SET fasescultivodesde = 'hitoplanton,adquisicion' WHERE fasescultivoclave = 'semillero'"
  );
  console.log("Database updated successfully!");
  await pool.end();
}

main().catch(console.error);
