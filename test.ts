import mysql from 'mysql2/promise';

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'verdantia_db'
  });
  const [rows] = await conn.query('SELECT * FROM consumidores');
  console.log(rows);
  conn.end();
}

run().catch(console.error);
