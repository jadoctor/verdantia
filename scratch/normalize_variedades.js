const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    await conn.query('ALTER TABLE variedades RENAME COLUMN variedadesdecripcion TO variedadesdescripcion');
    console.log('✅ variedadesdecripcion -> variedadesdescripcion');
  } catch(e) { console.log('Aviso:', e.message); }

  try {
    await conn.query('ALTER TABLE variedades RENAME COLUMN siembra_directa_desde TO variedadessiembradirectadesde');
    console.log('✅ siembra_directa_desde -> variedadessiembradirectadesde');
  } catch(e) { console.log('Aviso:', e.message); }

  try {
    await conn.query('ALTER TABLE variedades RENAME COLUMN variedadesrecolecccionhasta TO variedadesrecoleccionhasta');
    console.log('✅ variedadesrecolecccionhasta -> variedadesrecoleccionhasta');
  } catch(e) { console.log('Aviso:', e.message); }

  await conn.end();
}

main();
