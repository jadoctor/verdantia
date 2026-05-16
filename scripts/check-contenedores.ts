import pool from '../src/lib/db';

async function run() {
  try {
    const [rows] = await pool.query('DESCRIBE contenedores');
    console.log(rows);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
run();
