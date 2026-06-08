const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });
  
  // Query with no type filter, active species
  let query = `
    SELECT e.idespecies, e.especiesnombre, e.especiesvisibilidadsino,
      (SELECT COUNT(*) FROM variedades v WHERE v.xvariedadesidespecies = e.idespecies AND v.xvariedadesidusuarios IS NULL AND v.variedadesvisibilidadsino = 1 AND v.variedadesesgenerica = 0) as total_variedades, 
      (SELECT COUNT(*) FROM semillas s JOIN variedades v2 ON s.xsemillasidvariedades = v2.idvariedades WHERE v2.xvariedadesidespecies = e.idespecies) as total_semillas,
      (SELECT COUNT(*) FROM cultivos c JOIN variedades v3 ON c.xcultivosidvariedades = v3.idvariedades WHERE v3.xvariedadesidespecies = e.idespecies) as total_cultivos
    FROM especies e 
    WHERE 1=1
    ORDER BY e.especiesnombre
  `;
  
  const [rows] = await pool.query(query);
  console.log('--- ALL SPECIES IN THE CENTRAL LIST ---');
  console.log(rows);
  process.exit(0);
}

check().catch(console.error);
