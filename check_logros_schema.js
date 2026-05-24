import pool from './src/lib/db.js';

async function run() {
  const [rows] = await pool.query("DESCRIBE logros");
  console.log('--- tabla logros ---');
  console.log(rows);
  const [rows2] = await pool.query("DESCRIBE usuarioslogros");
  console.log('--- tabla usuarioslogros ---');
  console.log(rows2);
  process.exit(0);
}
run();
