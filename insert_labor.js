const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const q = `
      INSERT INTO labores (
        laboresnombre, 
        laboresdescripcion, 
        laboresicono, 
        laborescolor, 
        laboresactivosino, 
        laboresaplicaconvencional, 
        laboresaplicaminimo, 
        laboresaplicanolaboreo
      ) VALUES (
        'Aireado Superficial (Laya / Grelinette)', 
        'Airear y descompactar la tierra utilizando herramientas manuales (como la laya de doble mango) sin voltear las capas del suelo, preservando la microbiología.', 
        'mdi-pitchfork', 
        '#8b5cf6', 
        1, 1, 1, 0
      )
    `;
    await pool.query(q);
    console.log("Labor inserted.");

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
