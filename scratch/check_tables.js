const mysql = require('mysql2/promise');
const dbUrl = 'mysql://root:Papaja0334@localhost:3306/verdantia';

async function check() {
  try {
    const connection = await mysql.createConnection(dbUrl);
    const [rows] = await connection.query("SHOW TABLES LIKE '%plaga%'");
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
  } catch (e) {
    console.error(e.message);
  }
}
check();
