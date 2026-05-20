import pool from './src/lib/db.ts';

async function check() {
  const [tables] = await pool.query('SHOW TABLES;');
  console.log(tables);
  const [cols] = await pool.query('DESCRIBE cultivos;');
  console.log(cols);
  process.exit(0);
}
check();
