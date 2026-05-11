const mysql = require('mysql2/promise');

async function syncGoldData() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  });

  try {
    console.log('Syncing species data to Generic Varieties (Gold)...');
    
    // We update 'variedades' using data from 'especies' for generic varieties
    const query = `
      UPDATE variedades v
      JOIN especies e ON v.xvariedadesidespecies = e.idespecies
      SET 
        v.variedadesnombrecientifico = e.especiesnombrecientifico,
        v.variedadesfamilia = e.especiesfamilia,
        v.variedadestipo = e.especiestipo,
        v.variedadesciclo = e.especiesciclo,
        v.variedadescolor = e.especiescolor,
        v.variedadestamano = e.especiestamano,
        v.variedadesdificultad = e.especiesdificultad,
        v.variedadesluzsolar = e.especiesluzsolar,
        v.variedadesnecesidadriego = e.especiesnecesidadriego,
        v.variedadesvolumenmaceta = e.especiesvolumenmaceta
      WHERE v.variedadesesgenerica = 1
    `;

    const [result] = await pool.query(query);
    console.log(`Success! Updated ${result.affectedRows} generic varieties.`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

syncGoldData();
