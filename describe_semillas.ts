import pool from './src/lib/db';

async function describe() {
  try {
    const [rows] = await pool.query('DESCRIBE semillas');
    console.log(rows);
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

describe();
