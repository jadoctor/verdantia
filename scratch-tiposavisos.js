const mysql = require('mysql2/promise');
async function test() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'verdantia_db'
  });
  const [cols] = await connection.query("SHOW COLUMNS FROM tiposavisos");
  console.log(cols);
  process.exit(0);
}
test();
