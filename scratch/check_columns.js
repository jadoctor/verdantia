const mysql = require('mysql2/promise');
const fs = require('fs');

async function check() {
  try {
    const connection = await mysql.createConnection({
      host: 'srv2070.hstgr.io',
      user: 'u117557593_Verdantia',
      password: 'Hostingerja0334&',
      database: 'u117557593_Verdantia'
    });
    const [rows] = await connection.query("DESCRIBE datosadjuntos");
    fs.writeFileSync('scratch/columns_output.txt', JSON.stringify(rows, null, 2));
    await connection.end();
  } catch (e) {
    fs.writeFileSync('scratch/columns_output.txt', 'ERROR: ' + e.message);
  }
}
check();
