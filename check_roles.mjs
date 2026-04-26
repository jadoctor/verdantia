import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    ssl: { rejectUnauthorized: false }
  });

  const [rows] = await connection.query('SELECT idusuarios, usuariosemail, usuariosroles FROM usuarios');
  console.log("Users:", rows);
  await connection.end();
}

main();
