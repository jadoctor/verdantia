const { default: pool } = require('./src/lib/db');
async function run() {
  try {
    await pool.query('DELETE FROM cultivos');
    console.log('Cultivos eliminados');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
