import pool from '../src/lib/db';

async function run() {
  try {
    const [rows] = await pool.query("SHOW COLUMNS FROM especies LIKE 'especiestiposiembra'");
    console.log(rows);
  } catch (e) {
    console.log(e);
  } finally {
    process.exit(0);
  }
}
run();
