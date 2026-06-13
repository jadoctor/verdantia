import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    // 1. Shift order of existing phases that are >= 3 by +3 to make room
    await pool.query('UPDATE fasescultivo SET fasescultivoorden = fasescultivoorden + 3 WHERE fasescultivoorden >= 3 AND fasescultivoorden < 90');

    // 2. Insert the 3 new preparation phases
    const insertQuery = `
      INSERT INTO fasescultivo (
        fasescultivoclave, fasescultivonombre, fasescultivoorden, fasescultivocolor, 
        fasescultivoicono, fasescultivodescripcion, fasescultivoesfin, fasescultivotipo, 
        fasescultivodesde, fasescultivohasta
      ) VALUES 
      ('preparacion_convencional', 'Tiempo Prep. Terreno (Convencional)', 3, '#94a3b8', '🚜', 'Laboreo profundo, volteo y estercolado previo a plantar.', 0, 'Fase', 'planificacion', 'siembra,adquisicion'),
      ('preparacion_minima', 'Tiempo Prep. Terreno (Mínimo)', 4, '#cbd5e1', '⛏️', 'Escarificado superficial o aireación sin volteo.', 0, 'Fase', 'planificacion', 'siembra,adquisicion'),
      ('preparacion_nolaboreo', 'Tiempo Prep. Terreno (No Laboreo)', 5, '#e2e8f0', '🌱', 'Preparación nula o aporte de compost en superficie.', 0, 'Fase', 'planificacion', 'siembra,adquisicion')
    `;

    await pool.query(insertQuery);
    console.log("Nuevas fases de preparación añadidas correctamente.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

main();
