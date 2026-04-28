import mysql from 'mysql2/promise';

async function checkDb() {
  const connection = await mysql.createConnection({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    ssl: { rejectUnauthorized: false }
  });

  const [tables] = await connection.execute("SHOW TABLES;");
  console.log("Tablas:", tables);

  await connection.end();
}

checkDb().catch(console.error);
