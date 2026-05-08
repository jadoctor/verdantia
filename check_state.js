const mysql = require('mysql2/promise');
require('@next/env').loadEnvConfig(process.cwd());

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const [users] = await connection.query("SELECT usuariosemail, usuariosestadocuenta FROM usuarios WHERE usuariosemail = 'jaillueca@gmail.com'");
    console.log(users);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}
run();
