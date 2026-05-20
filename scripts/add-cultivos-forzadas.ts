import pool from '../src/lib/db';

async function main() {
  try {
    await pool.query('ALTER TABLE cultivos ADD COLUMN cultivosalertas_forzadas JSON NULL');
    console.log('Successfully added cultivosalertas_forzadas to cultivos table.');
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column cultivosalertas_forzadas already exists.');
    } else {
      console.error('Error:', err);
    }
  } finally {
    process.exit(0);
  }
}

main();
