import pool from '../src/lib/db.js';

async function run() {
  try {
    const [rows] = await pool.query('SELECT * FROM logros ORDER BY logrosnivel ASC');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
