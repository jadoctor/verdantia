const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
    connectTimeout: 5000,
  });
  
  console.log('--- Especies matching "ajo" ---');
  const [especies] = await pool.query("SELECT * FROM especies WHERE especiesnombre LIKE '%ajo%'");
  console.log(especies);

  if (especies.length > 0) {
    const ajoId = especies[0].idespecies;
    console.log(`\n--- Varieties for species ID ${ajoId} ---`);
    const [variedades] = await pool.query("SELECT * FROM variedades WHERE xvariedadesidespecies = ?", [ajoId]);
    console.log(variedades);

    if (variedades.length > 0) {
      const varIds = variedades.map(v => v.idvariedades);
      
      console.log('\n--- Describe semillas table ---');
      const [semillasCols] = await pool.query("DESCRIBE semillas");
      console.log(semillasCols.map(c => c.Field));

      console.log(`\n--- Seeds for varieties: ${varIds.join(', ')} ---`);
      // Select all columns since we don't know the exact column names
      const [semillas] = await pool.query("SELECT * FROM semillas WHERE xsemillasidvariedades IN (?)", [varIds]);
      console.log(semillas);

      console.log('\n--- Describe cultivos table ---');
      const [cultivosCols] = await pool.query("DESCRIBE cultivos");
      console.log(cultivosCols.map(c => c.Field));

      console.log(`\n--- Crops for varieties: ${varIds.join(', ')} ---`);
      const [cultivos] = await pool.query("SELECT * FROM cultivos WHERE xcultivosidvariedades IN (?)", [varIds]);
      console.log(cultivos);
    }
  }

  process.exit(0);
}

check().catch(console.error);
