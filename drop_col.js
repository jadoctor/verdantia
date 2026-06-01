const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const [result] = await pool.query("ALTER TABLE laborespauta DROP COLUMN laborespautametodo");
    console.log("Column laborespautametodo dropped successfully.", result);
  } catch (err) {
    if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log("Column already dropped or doesn't exist.");
    } else {
      console.error(err);
    }
  } finally {
    await pool.end();
  }
}

run();
