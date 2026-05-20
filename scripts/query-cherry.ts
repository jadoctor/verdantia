import pool from '../src/lib/db';

async function run() { 
  try {
    const [variedades] = await pool.query("SELECT idvariedades, xvariedadesidespecies, variedadesnombre FROM variedades WHERE variedadesnombre LIKE '%cherry%' OR variedadesnombre LIKE '%tomate%'");
    console.log('Variedades:', variedades.length);
    
    if (variedades.length > 0) {
      const idvar = variedades[0].idvariedades;
      const idesp = variedades[0].xvariedadesidespecies;
      
      const [pautas] = await pool.query(`
        SELECT lp.laborespautafase, lp.laborespautafrecuenciadias, l.laboresnombre, 'Variedad' as origen
        FROM laborespauta lp
        JOIN labores l ON lp.xlaborespautaidlabores = l.idlabores
        WHERE lp.xlaborespautaidvariedades = ?
        
        UNION
        
        SELECT lp.laborespautafase, lp.laborespautafrecuenciadias, l.laboresnombre, 'Especie' as origen
        FROM laborespauta lp
        JOIN labores l ON lp.xlaborespautaidlabores = l.idlabores
        WHERE lp.xlaborespautaidespecies = ?
      `, [idvar, idesp]);
      console.log('Pautas para la variedad ID', idvar, 'y especie ID', idesp, ':', pautas);
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0); 
}

run();
