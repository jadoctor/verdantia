const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    console.log("Adding especiesdiascrecimientofirme...");
    await pool.query("ALTER TABLE especies ADD COLUMN especiesdiascrecimientofirme INT DEFAULT NULL;");
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
  }

  try {
    console.log("Adding variedadesdiascrecimientofirme...");
    await pool.query("ALTER TABLE variedades ADD COLUMN variedadesdiascrecimientofirme INT DEFAULT NULL;");
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
  }

  console.log("Database altered successfully.");
  await pool.end();
}
main();
