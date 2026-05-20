import pool from '../src/lib/db';
async function run() {
  try {
    const [rows] = await pool.query("SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_NAME = 'laborespauta'");
    console.log(rows);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
