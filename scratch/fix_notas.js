const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  // Update Trasplante note (riego, tomate, fase trasplante)
  const [r1] = await conn.query(
    `UPDATE laborespauta SET laborespautanotasia = ? WHERE xlaborespautaidespecies = 3 AND laborespautafase = 'trasplante' AND xlaborespautaidlabores = (SELECT idlabores FROM labores WHERE laboresnombre LIKE '%Riego%' LIMIT 1)`,
    ['Mantener humedad constante en semillero/bandeja. Riego ligero y frecuente para un desarrollo sano de la plántula antes del trasplante.']
  );
  console.log('Trasplante updated:', r1.affectedRows);

  // Update Crecimiento note (riego, tomate, fase crecimiento)
  const [r2] = await conn.query(
    `UPDATE laborespauta SET laborespautanotasia = ? WHERE xlaborespautaidespecies = 3 AND laborespautafase = 'crecimiento' AND xlaborespautaidlabores = (SELECT idlabores FROM labores WHERE laboresnombre LIKE '%Riego%' LIMIT 1)`,
    ['Riego abundante tras el trasplante para asentar raíces. Después, riego profundo y regular adaptado al clima. Evitar estrés hídrico.']
  );
  console.log('Crecimiento updated:', r2.affectedRows);

  await conn.end();
  console.log('✅ Notas actualizadas');
}

main().catch(e => { console.error(e.message); process.exit(1); });
