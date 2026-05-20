import pool from './src/lib/db';

async function addPauta() {
  // Get idlabores for "Laboreo"
  const [labores]: any = await pool.query('SELECT idlabores FROM labores WHERE laboresnombre = "Laboreo" LIMIT 1');
  const idLaboreo = labores[0].idlabores;

  const insertQuery = `
    INSERT INTO laborespauta (
      xlaborespautaidespecies,
      xlaborespautaidlabores,
      laborespautafase,
      laborespautanotasia,
      laborespautaoffset,
      laborespautaactivosino
    ) VALUES (
      3,
      ?,
      'siembra',
      'Si no pudiste preparar el terreno con semanas de antelación, realiza un laboreo superficial hoy mismo para mullir la tierra y eliminar adventicias justo antes de plantar.',
      0,
      1
    )
  `;
  
  await pool.query(insertQuery, [idLaboreo]);
  console.log("Inserted Laboreo para Siembra/Trasplante");
  process.exit(0);
}
addPauta();
