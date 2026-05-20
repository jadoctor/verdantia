import pool from '../src/lib/db';

async function run() { 
  try {
    const [esp] = await pool.query("SELECT idespecies, especiesnombre FROM especies WHERE especiesnombre LIKE '%tomate%'");
    console.log('Especies encontradas:', esp);
    
    if (esp.length > 0) {
      const tomatoId = esp.find((e: any) => e.especiesnombre.toLowerCase() === 'tomate' || e.especiesnombre.toLowerCase() === 'tomatera')?.idespecies || esp[0].idespecies;
      console.log('Borrando pautas para especie ID:', tomatoId);
      
      const [result] = await pool.query('DELETE FROM laborespauta WHERE xlaborespautaidespecies = ?', [tomatoId]);
      console.log('Pautas eliminadas:', (result as any).affectedRows);
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0); 
}

run();
