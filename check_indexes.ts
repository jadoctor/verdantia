import pool from '@/lib/db';

async function check() {
  try {
    const [rows] = await pool.query('SHOW INDEX FROM usuarioslogros');
    console.log(rows);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

check();
