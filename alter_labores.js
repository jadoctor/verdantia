const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    // Add columns
    await pool.query("ALTER TABLE labores ADD COLUMN laboresaplicaconvencional TINYINT(1) DEFAULT 1");
    await pool.query("ALTER TABLE labores ADD COLUMN laboresaplicaminimo TINYINT(1) DEFAULT 1");
    await pool.query("ALTER TABLE labores ADD COLUMN laboresaplicanolaboreo TINYINT(1) DEFAULT 1");
    console.log("Columns added successfully.");

    // Update Labor 10 ("Laboreo")
    await pool.query("UPDATE labores SET laboresaplicanolaboreo = 0 WHERE idlabores = 10");
    console.log("Labor 10 updated successfully.");

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
