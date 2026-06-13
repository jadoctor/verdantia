const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
}).promise();

async function main() {
  console.log("Adding columns to table fasescultivo...");
  await pool.query("ALTER TABLE fasescultivo ADD COLUMN fasescultivodesde VARCHAR(100) NULL, ADD COLUMN fasescultivohasta VARCHAR(100) NULL");
  console.log("Table altered successfully!");
  
  // Populate the default values for existing phases based on the unified catalog
  const updates = [
    { clave: 'planificacion', desde: 'creacion', hasta: 'siembra' }, // or adquisicion
    { clave: 'pregerminacion', desde: 'siembra', hasta: 'germinacion' },
    { clave: 'postgerminacion', desde: 'germinacion', hasta: 'hitoplanton' },
    { clave: 'semillero', desde: 'hitoplanton', hasta: 'trasplante' },
    { clave: 'enraizamiento', desde: 'trasplante', hasta: 'crecimiento' }, // wait, enraizamiento goes to start of growth
    { clave: 'crecimiento', desde: 'enraizamiento', hasta: 'floracion' },
    { clave: 'floracion', desde: 'floracion', hasta: 'cosecha' },
    { clave: 'cosecha', desde: 'cosecha', hasta: 'finalizado' }
  ];

  for (const up of updates) {
    await pool.query(
      "UPDATE fasescultivo SET fasescultivodesde = ?, fasescultivohasta = ? WHERE fasescultivoclave = ?",
      [up.desde, up.hasta, up.clave]
    );
    console.log(`Updated default desde/hasta for phase: ${up.clave}`);
  }

  await pool.end();
}

main().catch(console.error);
