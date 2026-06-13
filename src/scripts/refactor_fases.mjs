import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    port: 3306,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connected to the database.');

  try {
    // 1. Borrar tabla cultivosavisos (depende de cultivos)
    console.log('Borrando cultivosavisos y cultivos para empezar limpios...');
    await connection.query('DELETE FROM cultivosavisos');
    
    // Eliminar ubicaciones que dependen de cultivos
    await connection.query('DELETE FROM cultivosubicaciones');

    // Ahora borrar los cultivos
    await connection.query('DELETE FROM cultivos');
    console.log('Cultivos eliminados.');

    // 2. Crear tabla especiesfases
    console.log('Creando tabla especiesfases...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS especiesfases (
        idespeciesfases INT AUTO_INCREMENT PRIMARY KEY,
        xespeciesfasesidespecies INT NOT NULL,
        xespeciesfasesidfasescultivo INT NOT NULL,
        especiesfasesduraciondias INT DEFAULT 0,
        FOREIGN KEY (xespeciesfasesidespecies) REFERENCES especies(idespecies) ON DELETE CASCADE,
        FOREIGN KEY (xespeciesfasesidfasescultivo) REFERENCES fasescultivo(idfasescultivo) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Tabla especiesfases creada.');

    // 3. Crear tabla cultivosfases
    console.log('Creando tabla cultivosfases...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cultivosfases (
        idcultivosfases INT AUTO_INCREMENT PRIMARY KEY,
        xcultivosfasesidcultivos INT NOT NULL,
        xcultivosfasesidfasescultivo INT NOT NULL,
        cultivosfasesfecha DATE NOT NULL,
        FOREIGN KEY (xcultivosfasesidcultivos) REFERENCES cultivos(idcultivos) ON DELETE CASCADE,
        FOREIGN KEY (xcultivosfasesidfasescultivo) REFERENCES fasescultivo(idfasescultivo) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Tabla cultivosfases creada.');

    // 4. Dropear columnas huérfanas en cultivos
    console.log('Borrando columnas huérfanas en cultivos...');
    try {
      await connection.query(`
        ALTER TABLE cultivos 
        DROP COLUMN cultivosfechagerminacion,
        DROP COLUMN cultivosfechatrasplante,
        DROP COLUMN cultivosfechacrecimiento,
        DROP COLUMN cultivosfechafructificacion,
        DROP COLUMN cultivosfecharecoleccion,
        DROP COLUMN cultivosfechafinalizacion;
      `);
      console.log('Columnas eliminadas de cultivos.');
    } catch(err) {
      if(err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('Columnas ya no existen en cultivos.');
      } else {
        console.error('Error dropeando de cultivos:', err.message);
      }
    }

    // 5. Dropear columnas huérfanas en especies (y variedades por si aca)
    console.log('Borrando columnas huérfanas en especies...');
    try {
      await connection.query(`
        ALTER TABLE especies 
        DROP COLUMN especiesdiasgerminacion,
        DROP COLUMN especiesdiashastatrasplante,
        DROP COLUMN especiesdiascrecimientofirme,
        DROP COLUMN especiesdiashastafructificacion,
        DROP COLUMN especiesdiashastarecoleccion,
        DROP COLUMN especiesduraciontotal;
      `);
      console.log('Columnas eliminadas de especies.');
    } catch(err) {
      if(err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('Columnas ya no existen en especies.');
      } else {
        console.error('Error dropeando de especies:', err.message);
      }
    }
    
    // Variedades también tiene estas columnas (variedadesdiasgerminacion...)
    console.log('Borrando columnas huérfanas en variedades...');
    try {
      await connection.query(`
        ALTER TABLE variedades 
        DROP COLUMN variedadesdiasgerminacion,
        DROP COLUMN variedadesdiashastatrasplante,
        DROP COLUMN variedadesdiascrecimientofirme,
        DROP COLUMN variedadesdiashastafructificacion,
        DROP COLUMN variedadesdiashastarecoleccion,
        DROP COLUMN variedadesduraciontotal;
      `);
      console.log('Columnas eliminadas de variedades.');
    } catch(err) {
      if(err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('Columnas ya no existen en variedades.');
      } else {
        console.error('Error dropeando de variedades:', err.message);
      }
    }

  } catch (err) {
    console.error('Error executing script:', err);
  } finally {
    await connection.end();
    console.log('Connection closed.');
  }
}

run();
