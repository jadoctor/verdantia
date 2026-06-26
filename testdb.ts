import pool from './src/lib/db';
async function run() {
  const [rows1] = await pool.query('DESCRIBE plantasparte');
  console.log('plantasparte', rows1);

  process.exit(0);
}
run();
