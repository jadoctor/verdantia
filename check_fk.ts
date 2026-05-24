import pool from '@/lib/db';

async function checkFK() {
  try {
    const [rows] = await pool.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = 'usuarioslogros' AND TABLE_SCHEMA = DATABASE();
    `);
    console.log(rows);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

checkFK();
