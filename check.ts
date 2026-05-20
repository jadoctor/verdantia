import pool from './src/lib/db.ts';

async function check() {
  const [avisos] = await pool.query('SELECT * FROM cultivosavisos WHERE xcultivosavisosidpauta IS NOT NULL');
  console.log("Avisos", avisos);
  const [pautas] = await pool.query('SELECT * FROM laborespauta WHERE xlaborespautaidespecies = 3');
  console.log("Tomate pautas", pautas);
  process.exit(0);
}
check();
