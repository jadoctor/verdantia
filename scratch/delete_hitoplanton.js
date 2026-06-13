const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
}).promise();

async function main() {
  // 1. Eliminar hitoplanton
  const [delRes] = await pool.query("DELETE FROM fasescultivo WHERE fasescultivoclave = 'hitoplanton'");
  console.log('Delete hitoplanton result:', delRes);

  // 2. Ajustar postgerminacion: Desde germinacion Hasta trasplante
  const [updPost] = await pool.query("UPDATE fasescultivo SET fasescultivohasta = 'trasplante' WHERE fasescultivoclave = 'postgerminacion'");
  console.log('Update postgerminacion result:', updPost);

  // 3. Ajustar semillero: Desde adquisicion Hasta trasplante
  const [updSem] = await pool.query("UPDATE fasescultivo SET fasescultivodesde = 'adquisicion' WHERE fasescultivoclave = 'semillero'");
  console.log('Update semillero result:', updSem);

  await pool.end();
}

main().catch(console.error);
