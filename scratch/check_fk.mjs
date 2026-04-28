import mysql from 'mysql2/promise';

async function checkEspecies() {
  const connection = await mysql.createConnection({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    ssl: { rejectUnauthorized: false }
  });

  const [cols] = await connection.execute("DESCRIBE especies;");
  console.log("Especies:", cols.map(c => c.Field));
  
  const [cols2] = await connection.execute("DESCRIBE variedades;");
  console.log("Variedades:", cols2.map(c => c.Field));

  await connection.end();
}
checkEspecies().catch(console.error);
