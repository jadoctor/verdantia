
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log("Creando tabla idiomas...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS idiomas (
        ididiomas INT AUTO_INCREMENT PRIMARY KEY,
        idiomasnombre VARCHAR(100) NOT NULL,
        idiomasiso VARCHAR(10) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Creando tabla paises...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS paises (
        idpaises INT AUTO_INCREMENT PRIMARY KEY,
        paisesnombre VARCHAR(100) NOT NULL,
        paisesisocode VARCHAR(10) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Creando tabla especiessinonimos...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS especiessinonimos (
        idespeciessinonimos INT AUTO_INCREMENT PRIMARY KEY,
        xespeciessinonimosidespecies INT NOT NULL,
        xespeciessinonimosididiomas INT NULL,
        xespeciessinonimosidpaises INT NULL,
        especiessinonimosnombre VARCHAR(100) NOT NULL,
        especiessinonimosnotas VARCHAR(255) NULL,
        FOREIGN KEY (xespeciessinonimosididiomas) REFERENCES idiomas(ididiomas) ON DELETE SET NULL,
        FOREIGN KEY (xespeciessinonimosidpaises) REFERENCES paises(idpaises) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Comprobamos si las tablas están vacías antes de hacer inserts para no duplicar si se ejecuta varias veces
    const [rowsIdiomas] = await connection.execute('SELECT COUNT(*) as count FROM idiomas');
    if (rowsIdiomas[0].count === 0) {
        console.log("Insertando idiomas...");
        const idiomas = [
        ['Español', 'es'],
        ['Valenciano', 'va'],
        ['Gallego', 'gl'],
        ['Euskera', 'eu'],
        ['Inglés', 'en'],
        ['Francés', 'fr'],
        ['Italiano', 'it'],
        ['Portugués', 'pt'],
        ['Alemán', 'de'],
        ['Chino', 'zh'],
        ['Japonés', 'ja'],
        ['Guaraní', 'gn'],
        ['Quechua', 'qu'],
        ['Latín', 'la']
        ];
        for (const [nombre, iso] of idiomas) {
            await connection.execute('INSERT INTO idiomas (idiomasnombre, idiomasiso) VALUES (?, ?)', [nombre, iso]);
        }
    } else {
        console.log("La tabla idiomas ya tiene datos, omitiendo seeding.");
    }

    const [rowsPaises] = await connection.execute('SELECT COUNT(*) as count FROM paises');
    if (rowsPaises[0].count === 0) {
        console.log("Insertando países...");
        const paises = [
        ['España', 'ES'],
        ['México', 'MX'],
        ['Argentina', 'AR'],
        ['Colombia', 'CO'],
        ['Perú', 'PE'],
        ['Venezuela', 'VE'],
        ['Chile', 'CL'],
        ['Ecuador', 'EC'],
        ['Guatemala', 'GT'],
        ['Cuba', 'CU'],
        ['Bolivia', 'BO'],
        ['República Dominicana', 'DO'],
        ['Honduras', 'HN'],
        ['Paraguay', 'PY'],
        ['El Salvador', 'SV'],
        ['Nicaragua', 'NI'],
        ['Costa Rica', 'CR'],
        ['Panamá', 'PA'],
        ['Uruguay', 'UY'],
        ['Puerto Rico', 'PR'],
        ['Estados Unidos', 'US'],
        ['Internacional', 'INT']
        ];
        for (const [nombre, iso] of paises) {
            await connection.execute('INSERT INTO paises (paisesnombre, paisesisocode) VALUES (?, ?)', [nombre, iso]);
        }
    } else {
        console.log("La tabla paises ya tiene datos, omitiendo seeding.");
    }

    console.log("Proceso completado con éxito.");
  } catch (err) {
    console.error("Error crítico:", err);
  } finally {
    await connection.end();
  }
}

run();
