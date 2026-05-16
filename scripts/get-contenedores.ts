import pool from '../src/lib/db';

async function run() {
  try {
    const [rows] = await pool.query('SELECT idcontenedores, contenedoresnombre FROM contenedores');
    console.log(JSON.stringify(rows));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
run();
