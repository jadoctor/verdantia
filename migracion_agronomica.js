const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    multipleStatements: true
  });

  try {
    console.log('Starting agronomic migration...');
    
    // 1. Add the new boolean column (ignore error if it already exists)
    try {
      await pool.query("ALTER TABLE fasescultivo ADD COLUMN fasescultivoesfin TINYINT(1) NOT NULL DEFAULT 0;");
      console.log('Added column fasescultivoesfin.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Column fasescultivoesfin already exists.');
      } else {
        throw e;
      }
    }

    // 2. Set es_fin = 1 for finalizado and perdido
    await pool.query("UPDATE fasescultivo SET fasescultivoesfin = 1 WHERE fasescultivoclave IN ('finalizado', 'perdido');");

    // 3. Rename produccion to cosecha
    await pool.query("UPDATE fasescultivo SET fasescultivonombre = 'Cosecha / Producción', fasescultivoclave = 'cosecha', fasescultivoorden = 10, fasescultivoicono = '🧺' WHERE fasescultivoclave = 'produccion'");

    // 4. Shift finalizado order to 11
    await pool.query("UPDATE fasescultivo SET fasescultivoorden = 11 WHERE fasescultivoclave = 'finalizado'");

    // 5. Update crecimiento to order 8
    await pool.query("UPDATE fasescultivo SET fasescultivoorden = 8 WHERE fasescultivoclave = 'crecimiento'");

    // 6. Insert new phases: trasplante (6), enraizamiento (7), floracion (9)
    const insertQuery = `
      INSERT INTO fasescultivo (fasescultivoclave, fasescultivonombre, fasescultivoorden, fasescultivocolor, fasescultivoicono, fasescultivodescripcion)
      VALUES 
        ('trasplante', 'Trasplante', 6, '#0ea5e9', '🚚', 'Mudanza del semillero al terreno definitivo. Riesgo de estrés.'),
        ('enraizamiento', 'Post-Trasplante / Enraizamiento', 7, '#d97706', '🪵', 'Fase de adaptación y desarrollo radicular inicial en huerto.'),
        ('floracion', 'Floración', 9, '#ec4899', '🌸', 'Aparición de flores y cuajado. Cambio nutricional requerido.')
      ON DUPLICATE KEY UPDATE 
        fasescultivonombre = VALUES(fasescultivonombre),
        fasescultivoorden = VALUES(fasescultivoorden),
        fasescultivocolor = VALUES(fasescultivocolor),
        fasescultivoicono = VALUES(fasescultivoicono),
        fasescultivodescripcion = VALUES(fasescultivodescripcion);
    `;
    await pool.query(insertQuery);
    
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
