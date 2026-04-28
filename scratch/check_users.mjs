import mysql from 'mysql2/promise';

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    ssl: { rejectUnauthorized: false }
  });

  const [cols] = await connection.execute("DESCRIBE usuarios;");
  console.log(cols);

  await connection.end();
}
checkUsers().catch(console.error);
