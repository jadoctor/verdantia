import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
});

async function run() {
  try {
    console.log('🔍 Analizando especies en busca de duplicados (singular/plural)...');
    const [rows] = await pool.query('SELECT idespecies, especiesnombre FROM especies');
    
    const toDelete = [];
    const removedNames = [];
    
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows.length; j++) {
        if (i === j) continue;
        
        const nameA = rows[i].especiesnombre.trim();
        const nameB = rows[j].especiesnombre.trim();
        
        // Comprobar si B es el plural de A
        if (nameB.toLowerCase() === nameA.toLowerCase() + 's' || 
            nameB.toLowerCase() === nameA.toLowerCase() + 'es') {
            
          console.log(`⚠️ Detectado duplicado: Singular '${nameA}' -> Plural '${nameB}'`);
          if (!toDelete.includes(rows[j].idespecies)) {
             toDelete.push(rows[j].idespecies);
             removedNames.push(nameB);
          }
        }
      }
    }

    if (toDelete.length > 0) {
      console.log(`\\n🗑️ Eliminando las siguientes versiones plurales: ${removedNames.join(', ')}...`);
      const [res] = await pool.query(`DELETE FROM especies WHERE idespecies IN (?)`, [toDelete]);
      console.log(`✅ ¡Éxito! Se han eliminado ${res.affectedRows} especies plurales duplicadas.`);
    } else {
      console.log('\\n✅ Todo limpio. No se detectaron especies plurales duplicadas.');
    }

  } catch(e) {
    console.error('❌ Error en el análisis:', e);
  } finally {
    process.exit(0);
  }
}
run();
