import pool from '@/lib/db';

async function listLogros() {
  try {
    const [rows] = await pool.query('SELECT * FROM logros ORDER BY idlogros ASC');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

listLogros();
