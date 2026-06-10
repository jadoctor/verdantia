const pool = require('./src/lib/db').default;

async function run() {
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM chatconversaciones");
    console.log(columns);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
