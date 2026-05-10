const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  const alterQueries = [
    'ALTER TABLE variedades ADD COLUMN variedadesesgenerica TINYINT(1) DEFAULT 0',
    'ALTER TABLE variedades ADD COLUMN variedadesdiashastatrasplante INT(11)',
    'ALTER TABLE variedades ADD COLUMN variedadesdiashastarecoleccion INT(11)',
    'ALTER TABLE variedades ADD COLUMN variedadesautosuficienciaparcial DECIMAL(10,2)',
    'ALTER TABLE variedades ADD COLUMN variedadesicono VARCHAR(20)',
    'ALTER TABLE variedades ADD COLUMN variedadesbiodinamicacategoria VARCHAR(50)',
    'ALTER TABLE variedades ADD COLUMN variedadesbiodinamicanotas TEXT',
    'ALTER TABLE variedades ADD COLUMN variedadesprofundidadtrasplante VARCHAR(50)',
    'ALTER TABLE variedades ADD COLUMN variedadesphsuelo VARCHAR(50)',
    'ALTER TABLE variedades ADD COLUMN variedadesnecesidadriego VARCHAR(50)',
    'ALTER TABLE variedades ADD COLUMN variedadestiposiembra VARCHAR(50)',
    'ALTER TABLE variedades ADD COLUMN variedadesvolumenmaceta INT(11)',
    'ALTER TABLE variedades ADD COLUMN variedadesluzsolar VARCHAR(50)',
    'ALTER TABLE variedades ADD COLUMN variedadescaracteristicassuelo VARCHAR(255)',
    'ALTER TABLE variedades ADD COLUMN variedadesdificultad VARCHAR(50)',
    'ALTER TABLE variedades ADD COLUMN variedadestemperaturamaxima INT(11)'
  ];

  for (const q of alterQueries) {
    try {
      await conn.query(q);
      console.log('Exito:', q.split('ADD COLUMN ')[1]);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Ya existe:', q.split('ADD COLUMN ')[1]);
      } else {
        console.error('Error en:', q, e.message);
      }
    }
  }

  await conn.end();
}

main();
