const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const [rows] = await connection.execute('SELECT idblog, blogslug, blogtitulo, blogcontenido FROM blog');
    for (const row of rows) {
      if (row.blogcontenido && row.blogcontenido.toLowerCase().includes('youtube')) {
        console.log(`Blog ${row.idblog} (${row.blogslug}) contains youtube!`);
        console.log(row.blogcontenido);
        console.log("-----------------------------------------");
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

test();
