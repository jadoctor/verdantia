const mysql = require('mysql2/promise');

async function run() {
  try {
    const c = await mysql.createConnection({
      host: 'srv2070.hstgr.io',
      user: 'u117557593_Verdantia',
      password: 'Hostingerja0334&',
      database: 'u117557593_Verdantia',
    });
    console.log('Connected');
    await c.query('ALTER TABLE datosadjuntos ADD COLUMN xdatosadjuntosidvariedades INT DEFAULT NULL');
    console.log('Column added');
    c.end();
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('Exists');
    } else {
      console.error(e);
    }
  }
}
run();
