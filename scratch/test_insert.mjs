import mysql from 'mysql2/promise';

async function testInsert() {
  const connection = await mysql.createConnection({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    ssl: { rejectUnauthorized: false }
  });

  try {
    const autorEmail = 'jaillueca@gmail.com';
    const [userRows] = await connection.query('SELECT idusuarios FROM usuarios WHERE usuariosemail = ? LIMIT 1', [autorEmail]);
    console.log("userRows:", userRows);

    const finalSlug = 'test-slug';
    const [slugRows] = await connection.query('SELECT idblog FROM blog WHERE xblogslug = ?', [finalSlug]);
    console.log("slugRows:", slugRows);

    const parsedData = { titulo: 'Test', resumen: 'Test', contenido_markdown: 'Test' };
    const idUsuario = userRows[0]?.idusuarios || null;
    const especieId = 3;

    const [result] = await connection.query(`
      INSERT INTO blog 
      (xblogslug, xblogtitulo, xblogresumen, xblogcontenido, xblogestado, xblogidusuarios, xblogidespecies, xblogidvariedades) 
      VALUES (?, ?, ?, ?, 'borrador', ?, ?, ?)
    `, [
      finalSlug,
      parsedData.titulo,
      parsedData.resumen,
      parsedData.contenido_markdown,
      idUsuario,
      especieId,
      null
    ]);
    console.log("Insert success:", result);
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await connection.end();
  }
}
testInsert();
