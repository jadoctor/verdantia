const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    console.log('Starting table alteration...');
    
    // Add cultivosfechasiembra
    try {
      await pool.query("ALTER TABLE cultivos ADD COLUMN cultivosfechasiembra DATE NULL AFTER cultivosfechainicio;");
      console.log('Added column cultivosfechasiembra.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Column cultivosfechasiembra already exists.');
      } else {
        throw e;
      }
    }

    // Add cultivosfechafloracion
    try {
      await pool.query("ALTER TABLE cultivos ADD COLUMN cultivosfechafloracion DATE NULL AFTER cultivosfechacrecimiento;");
      console.log('Added column cultivosfechafloracion.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Column cultivosfechafloracion already exists.');
      } else {
        throw e;
      }
    }

    console.log('Table alteration successful!');
  } catch (err) {
    console.error('Table alteration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
