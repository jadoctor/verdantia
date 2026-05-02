import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    ssl: { rejectUnauthorized: false }
  });
  
  const [blogs] = await pool.query(`
    SELECT idblog, blogtitulo, blogimagen, blogcontenido 
    FROM blog 
    WHERE xblogidespecies = 10 
    ORDER BY idblog DESC LIMIT 3
  `);
  
  console.log(JSON.stringify(blogs, null, 2));

  process.exit(0);
}

run();
