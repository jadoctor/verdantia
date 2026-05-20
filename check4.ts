import pool from './src/lib/db.ts';

async function check() {
  const [cols] = await pool.query('DESCRIBE laboresrealizadas;');
  console.log(cols);
  process.exit(0);
}
check();
