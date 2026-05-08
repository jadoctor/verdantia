const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', // adjust if needed
    password: '', // adjust if needed
    database: 'verdantia_db' // adjust if needed
  });

  const [usuarios] = await connection.query('SELECT idusuarios, usuariosemail, xusuariosidsuscripciones FROM usuarios LIMIT 5');
  console.log('Usuarios:', usuarios);
  
  const [tipos] = await connection.query('SELECT * FROM tiposavisos WHERE tiposavisosnombre LIKE "%Blog%"');
  console.log('Tipos:', tipos);

  process.exit(0);
}
test();
