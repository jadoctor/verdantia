import pool from './src/lib/db.ts';

async function alterTable() {
  try {
    await pool.query("ALTER TABLE laborespauta ADD COLUMN laborespautametodo VARCHAR(20) DEFAULT 'ambos' NOT NULL");
    console.log("Column laborespautametodo added successfully.");
  } catch(e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists.");
    } else {
      console.error(e);
    }
  }
  process.exit(0);
}
alterTable();
