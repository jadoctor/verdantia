const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log('Modificando tabla datosadjuntos para añadir xdatosadjuntosidcultivosavisos...');
    await conn.query('ALTER TABLE `datosadjuntos` ADD COLUMN `xdatosadjuntosidcultivosavisos` int DEFAULT NULL;');
    console.log('¡Columna añadida con éxito!');
  } catch (error) {
    console.error('Error alterando la tabla:', error.message);
  } finally {
    await conn.end();
  }
})();
