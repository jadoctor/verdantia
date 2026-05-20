import pool from './src/lib/db.ts';

async function addTransplante() {
  await pool.query("UPDATE laborespauta SET laborespautametodo = 'semilla' WHERE xlaborespautaidespecies = 3 AND laborespautafase = 'siembra' AND laborespautanotasia LIKE '%Siembra directa%'");

  const [labores]: any = await pool.query("SELECT idlabores FROM labores WHERE laboresnombre = 'Trasplante' OR laboresnombre = 'Transplante' LIMIT 1");
  
  if (labores.length > 0) {
    const idTrasplante = labores[0].idlabores;
    
    await pool.query("INSERT INTO laborespauta (xlaborespautaidespecies, xlaborespautaidlabores, laborespautafase, laborespautanotasia, laborespautaoffset, laborespautametodo, laborespautaactivosino) VALUES (3, ?, 'siembra', 'Trasplante del plantón al lugar definitivo. En el tomate es recomendable enterrar parte del tallo desnudo para favorecer el desarrollo de raíces adventicias secundarias.', 0, 'planton', 1)", [idTrasplante]);
    console.log("Transplante añadido correctamente");
  } else {
    console.log("No se encontró la labor de Trasplante en la tabla labores maestra.");
  }
  process.exit(0);
}
addTransplante();
