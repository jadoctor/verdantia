const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  // Buscar el ID del tomate
  const [especies] = await conn.query("SELECT idespecies, especiesnombre FROM especies WHERE especiesnombre LIKE '%tomate%'");
  console.log('Especies encontradas:', especies);

  for (const esp of especies) {
    const [pautas] = await conn.query(`
      SELECT p.*, l.laboresnombre 
      FROM laborespauta p 
      JOIN labores l ON p.xlaborespautaidlabores = l.idlabores 
      WHERE p.xlaborespautaidespecies = ?
    `, [esp.idespecies]);
    console.log(`\nPautas para "${esp.especiesnombre}" (ID ${esp.idespecies}):`, pautas.length > 0 ? pautas : 'NINGUNA');
  }

  await conn.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
