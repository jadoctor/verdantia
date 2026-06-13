import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    // 1. Inspect current phases
    const [phasesBefore] = await pool.query('SELECT idfasescultivo, fasescultivoclave, fasescultivonombre, fasescultivoorden FROM fasescultivo ORDER BY fasescultivoorden ASC');
    console.log("--- FASES ANTES DE LIMPIEZA ---");
    console.log(phasesBefore);

    // 2. Delete the 3 tillage preparation phases
    const deleteQuery = `
      DELETE FROM fasescultivo 
      WHERE fasescultivoclave IN ('preparacion_convencional', 'preparacion_minima', 'preparacion_nolaboreo')
    `;
    const [delRes] = await pool.query(deleteQuery);
    console.log("Resultado de DELETE:", delRes);

    // 3. Shift order back for phases that were shifted forward
    // In scratch_add_prep.mjs, phases with order >= 3 were shifted by +3.
    // So now we shift phases with order >= 6 back by -3 to restore their original order.
    const [updateRes] = await pool.query('UPDATE fasescultivo SET fasescultivoorden = fasescultivoorden - 3 WHERE fasescultivoorden >= 6 AND fasescultivoorden < 90');
    console.log("Resultado de UPDATE orden:", updateRes);

    // 4. Inspect final phases
    const [phasesAfter] = await pool.query('SELECT idfasescultivo, fasescultivoclave, fasescultivonombre, fasescultivoorden FROM fasescultivo ORDER BY fasescultivoorden ASC');
    console.log("--- FASES DESPUÉS DE LIMPIEZA ---");
    console.log(phasesAfter);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

main();
