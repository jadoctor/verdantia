const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  // Pautas de Riego para Tomate
  const [pautas] = await conn.query(`
    SELECT p.*, l.laboresnombre, e.especiesnombre,
           e.especiesdiasgerminacion, e.especiesdiashastatrasplante, 
           e.especiesdiashastafructificacion, e.especiesdiashastarecoleccion
    FROM laborespauta p 
    JOIN labores l ON p.xlaborespautaidlabores = l.idlabores 
    JOIN especies e ON p.xlaborespautaidespecies = e.idespecies
    WHERE p.xlaborespautaidespecies = 3 AND l.laboresnombre LIKE '%Riego%'
    ORDER BY CASE p.laborespautafase 
      WHEN 'siembra' THEN 1 WHEN 'germinacion' THEN 2 WHEN 'trasplante' THEN 3
      WHEN 'crecimiento' THEN 4 WHEN 'floracion' THEN 5 WHEN 'fructificacion' THEN 6
      WHEN 'cosecha' THEN 7 ELSE 9 END
  `);

  console.log('=== PAUTAS DE RIEGO - TOMATE ===\n');
  console.log(`Especie: ${pautas[0]?.especiesnombre}`);
  console.log(`Días germinación: ${pautas[0]?.especiesdiasgerminacion}`);
  console.log(`Días hasta trasplante: ${pautas[0]?.especiesdiashastatrasplante}`);
  console.log(`Días hasta fructificación: ${pautas[0]?.especiesdiashastafructificacion}`);
  console.log(`Días hasta recolección: ${pautas[0]?.especiesdiashastarecoleccion}`);
  console.log(`\nTotal pautas de riego: ${pautas.length}\n`);
  
  for (const p of pautas) {
    console.log(`--- Fase: ${p.laborespautafase.toUpperCase()} ---`);
    console.log(`  Frecuencia: ${p.laborespautafrecuenciadias ? `Cada ${p.laborespautafrecuenciadias} días` : 'Puntual'}`);
    console.log(`  Activa: ${p.laborespautaactivosino ? 'Sí' : 'No'}`);
    console.log(`  Notas IA: "${p.laborespautanotasia}"`);
    console.log('');
  }

  await conn.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
