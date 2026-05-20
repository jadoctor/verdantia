import pool from '../src/lib/db';

async function run() { 
  try {
    const cultivoId = 9;
    const [rows]: any = await pool.query('SELECT xcultivosidvariedades, xcultivosidusuarios FROM cultivos WHERE idcultivos = ?', [cultivoId]);
    const cultivo = rows[0];

    const [pautasRows]: any = await pool.query(`
      SELECT lp.*, l.laboresnombre, l.laboresicono, l.laborescolor
      FROM laborespauta lp
      JOIN labores l ON lp.xlaborespautaidlabores = l.idlabores
      WHERE lp.laborespautaactivosino = 1
      AND (
        lp.xlaborespautaidusuarios = ? OR 
        lp.xlaborespautaidvariedades = ? OR 
        lp.xlaborespautaidvariedades = (SELECT xvariedadesidvariedadorigen FROM variedades WHERE idvariedades = ?) OR
        lp.xlaborespautaidespecies = (SELECT xvariedadesidespecies FROM variedades WHERE idvariedades = ?)
      )
    `, [cultivo.xcultivosidusuarios, cultivo.xcultivosidvariedades, cultivo.xcultivosidvariedades, cultivo.xcultivosidvariedades]);
    
    console.log('Pautas encontradas:', pautasRows.length);
    console.log(pautasRows.map((p:any) => p.laborespautafase));
  } catch (e) {
    console.error(e);
  }
  process.exit(0); 
}

run();
