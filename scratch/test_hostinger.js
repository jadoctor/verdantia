const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    dateStrings: true
  });

  // Check table structure
  const [cols] = await conn.query('DESCRIBE datosadjuntos');
  console.log('=== ESTRUCTURA datosadjuntos ===');
  cols.forEach(c => console.log(c.Field, '|', c.Type, '|', c.Null, '|', c.Default));

  // Check data count
  const [rows] = await conn.query('SELECT COUNT(*) as total FROM datosadjuntos');
  console.log('\nTotal registros:', rows[0].total);

  // Check max_allowed_packet
  const [packet] = await conn.query("SHOW VARIABLES LIKE 'max_allowed_packet'");
  console.log('max_allowed_packet:', packet[0].Value);

  // Check if INSERT works
  try {
    const [testInsert] = await conn.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidusuarios,
        datosadjuntosresumen, datosadjuntospesobytes
      ) VALUES ('imagen', 'image/jpeg', 'test.jpg', 'test/path.jpg', 0, 99, 0, NOW(), 1, '{}', 1000)`
    );
    console.log('\nINSERT test OK, id:', testInsert.insertId);
    // Clean up
    await conn.query('DELETE FROM datosadjuntos WHERE iddatosadjuntos = ?', [testInsert.insertId]);
    console.log('Cleanup OK');
  } catch (e) {
    console.error('\nINSERT FAILED:', e.message);
  }

  await conn.end();
}

test().catch(e => console.error('ERROR:', e.message));
