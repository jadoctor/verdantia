const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const [rows] = await pool.query("DESCRIBE cultivos;");
    const columns = rows.map(r => r.Field);
    console.log("Existing columns:", columns.join(', '));

    if (!columns.includes('cultivosfechacrecimiento')) {
      console.log("Adding cultivosfechacrecimiento...");
      await pool.query("ALTER TABLE cultivos ADD COLUMN cultivosfechacrecimiento DATETIME NULL;");
    }
    if (!columns.includes('cultivosfecharecoleccion')) {
      console.log("Adding cultivosfecharecoleccion...");
      await pool.query("ALTER TABLE cultivos ADD COLUMN cultivosfecharecoleccion DATETIME NULL;");
    }
    console.log("Done!");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
