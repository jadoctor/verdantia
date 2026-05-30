const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log('Creating table bancales...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS bancales (
        idbancales int(11) NOT NULL AUTO_INCREMENT,
        xbancalesidusuarios int(11) NOT NULL,
        bancalesnombre varchar(255) NOT NULL,
        bancalesancho float NOT NULL,
        bancaleslargo float NOT NULL,
        bancalesforma varchar(50) DEFAULT 'rectangular',
        bancalessigpacprovincia varchar(100) DEFAULT NULL,
        bancalessigpacmunicipio varchar(100) DEFAULT NULL,
        bancalessigpacpoligono varchar(50) DEFAULT NULL,
        bancalessigpacparcela varchar(50) DEFAULT NULL,
        bancalessigpacrecinto varchar(50) DEFAULT NULL,
        bancalessigpacsuperficie float DEFAULT NULL,
        PRIMARY KEY (idbancales),
        KEY xbancalesidusuarios (xbancalesidusuarios),
        CONSTRAINT fk_bancales_usuarios FOREIGN KEY (xbancalesidusuarios) REFERENCES usuarios (idusuarios) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await conn.query(createTableQuery);
    console.log('Table bancales created successfully or already exists.');

    console.log('Altering cultivos table...');
    const [cols] = await conn.query("SHOW COLUMNS FROM cultivos");
    const fields = cols.map(c => c.Field);

    if (!fields.includes('xcultivosidbancales')) {
      console.log('Adding xcultivosidbancales column...');
      await conn.query(`
        ALTER TABLE cultivos 
        ADD COLUMN xcultivosidbancales int(11) DEFAULT NULL,
        ADD CONSTRAINT fk_cultivos_bancales FOREIGN KEY (xcultivosidbancales) REFERENCES bancales (idbancales) ON DELETE SET NULL
      `);
      console.log('Column xcultivosidbancales added successfully.');
    } else {
      console.log('Column xcultivosidbancales already exists.');
    }

    if (!fields.includes('cultivosposicionx')) {
      console.log('Adding cultivosposicionx column...');
      await conn.query(`
        ALTER TABLE cultivos 
        ADD COLUMN cultivosposicionx float DEFAULT NULL
      `);
      console.log('Column cultivosposicionx added successfully.');
    } else {
      console.log('Column cultivosposicionx already exists.');
    }

    if (!fields.includes('cultivosposiciony')) {
      console.log('Adding cultivosposiciony column...');
      await conn.query(`
        ALTER TABLE cultivos 
        ADD COLUMN cultivosposiciony float DEFAULT NULL
      `);
      console.log('Column cultivosposiciony added successfully.');
    } else {
      console.log('Column cultivosposiciony already exists.');
    }

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await conn.end();
  }
}

run();
