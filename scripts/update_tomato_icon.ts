import pool from '../src/lib/db';

async function main() {
  try {
    // 1. Check current column definition
    const [cols]: any = await pool.query(
      `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'especies' AND COLUMN_NAME = 'especiesicono'`
    );
    console.log('Current column:', cols[0]);

    // 2. Alter column to support longer paths
    await pool.query(`ALTER TABLE especies MODIFY COLUMN especiesicono VARCHAR(255)`);
    console.log('Column altered to VARCHAR(255)');

    // 3. Now update the icons properly
    await pool.query(`UPDATE especies SET especiesicono = '/icons/especies/tomate' WHERE especiesnombre LIKE '%omate%'`);
    await pool.query(`UPDATE especies SET especiesicono = '/icons/especies/calabacin' WHERE especiesnombre LIKE '%alabac%'`);

    // 4. Verify
    const [rows]: any = await pool.query(
      `SELECT idespecies, especiesnombre, especiesicono FROM especies WHERE especiesicono LIKE '/icons%'`
    );
    for (const row of rows) {
      console.log(`  ID=${row.idespecies}: ${row.especiesnombre} → ${row.especiesicono}`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
