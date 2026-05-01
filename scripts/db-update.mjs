import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    port: 3306,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connected to the database.');

  try {
    console.log('Altering table especies...');
    await connection.query(`
      ALTER TABLE especies 
      ADD COLUMN especiesprofundidadtrasplante VARCHAR(50) DEFAULT NULL,
      ADD COLUMN especiesphsuelo VARCHAR(50) DEFAULT NULL,
      ADD COLUMN especiesnecesidadriego VARCHAR(50) DEFAULT NULL,
      ADD COLUMN especiestiposiembra VARCHAR(50) DEFAULT NULL,
      ADD COLUMN especiesvolumenmaceta INT DEFAULT NULL,
      ADD COLUMN especiesluzsolar VARCHAR(50) DEFAULT NULL,
      ADD COLUMN especiescaracteristicassuelo VARCHAR(255) DEFAULT NULL,
      ADD COLUMN especiesdificultad VARCHAR(50) DEFAULT NULL,
      ADD COLUMN especiestemperaturamaxima INT DEFAULT NULL
    `);
    console.log('ALTER TABLE especies successful.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist in especies table, skipping.');
    } else {
      console.error('Error altering especies:', err.message);
    }
  }

  try {
    console.log('Creating table asociacionesbeneficiosas...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS asociacionesbeneficiosas (
        idasociacionesbeneficiosas INT AUTO_INCREMENT PRIMARY KEY,
        xasociacionesbeneficiosasidespecieorigen INT NOT NULL,
        xasociacionesbeneficiosasidespeciedestino INT NOT NULL,
        asociacionesbeneficiosasmotivo VARCHAR(255) DEFAULT NULL,
        FOREIGN KEY (xasociacionesbeneficiosasidespecieorigen) REFERENCES especies(idespecies) ON DELETE CASCADE,
        FOREIGN KEY (xasociacionesbeneficiosasidespeciedestino) REFERENCES especies(idespecies) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('CREATE TABLE asociacionesbeneficiosas successful.');

    console.log('Creating table asociacionesperjudiciales...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS asociacionesperjudiciales (
        idasociacionesperjudiciales INT AUTO_INCREMENT PRIMARY KEY,
        xasociacionesperjudicialesidespecieorigen INT NOT NULL,
        xasociacionesperjudicialesidespeciedestino INT NOT NULL,
        asociacionesperjudicialesmotivo VARCHAR(255) DEFAULT NULL,
        FOREIGN KEY (xasociacionesperjudicialesidespecieorigen) REFERENCES especies(idespecies) ON DELETE CASCADE,
        FOREIGN KEY (xasociacionesperjudicialesidespeciedestino) REFERENCES especies(idespecies) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('CREATE TABLE asociacionesperjudiciales successful.');

    console.log('Creating table plagas...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plagas (
        idplagas INT AUTO_INCREMENT PRIMARY KEY,
        plagasnombre VARCHAR(100) NOT NULL,
        plagasnombrecientifico VARCHAR(100) DEFAULT NULL,
        plagastipo VARCHAR(50) DEFAULT NULL,
        plagasdescripcion TEXT DEFAULT NULL,
        plagascontrolorganico TEXT DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('CREATE TABLE plagas successful.');

    console.log('Creating table especiesplagas...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS especiesplagas (
        idespeciesplagas INT AUTO_INCREMENT PRIMARY KEY,
        xespeciesplagasidespecies INT NOT NULL,
        xespeciesplagasidplagas INT NOT NULL,
        especiesplagasnivelriesgo VARCHAR(50) DEFAULT NULL,
        especiesplagasnotasespecificas VARCHAR(255) DEFAULT NULL,
        FOREIGN KEY (xespeciesplagasidespecies) REFERENCES especies(idespecies) ON DELETE CASCADE,
        FOREIGN KEY (xespeciesplagasidplagas) REFERENCES plagas(idplagas) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('CREATE TABLE especiesplagas successful.');

  } catch (err) {
    console.error('Error creating relational tables:', err.message);
  }

  await connection.end();
}

run();
