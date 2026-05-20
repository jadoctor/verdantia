import pool from './src/lib/db.ts';

async function check() {
  const [cols] = await pool.query('SELECT cultivosalertas_ignoradas, cultivosalertas_forzadas FROM cultivos WHERE cultivosalertas_ignoradas IS NOT NULL OR cultivosalertas_forzadas IS NOT NULL;');
  console.log(cols);
  process.exit(0);
}
check();
