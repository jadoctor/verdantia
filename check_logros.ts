import pool from '@/lib/db';

async function test() {
  const [rows] = await pool.query('SELECT DISTINCT nombre_logro FROM usuarios_logros');
  console.log(rows);
  process.exit(0);
}

test();
