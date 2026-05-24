import pool from '../src/lib/db.js';

async function run() {
  try {
    console.log('Dropping old logros table...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    // Drop the old usuarioslogros as well because its foreign key will break
    await pool.query('DROP TABLE IF EXISTS usuarioslogros');
    await pool.query('DROP TABLE IF EXISTS logros');

    console.log('Creating new logros table...');
    await pool.query(`
      CREATE TABLE logros (
        idlogros INT AUTO_INCREMENT PRIMARY KEY,
        logrosnivel INT NOT NULL UNIQUE,
        logrosnombre VARCHAR(100) NOT NULL UNIQUE,
        logrosdescripcion TEXT,
        logrosicono VARCHAR(255),
        req_antiguedad_meses INT DEFAULT 0,
        req_semillas INT DEFAULT 0,
        req_siembras INT DEFAULT 0,
        req_recolecciones INT DEFAULT 0,
        req_especies INT DEFAULT 0,
        req_fotos INT DEFAULT 0,
        req_mensajes INT DEFAULT 0,
        req_blogs INT DEFAULT 0,
        privilegios TEXT,
        descuento_pro INT DEFAULT 0,
        req_mantenimiento_mensual INT DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating new usuarioslogros table...');
    await pool.query(`
      CREATE TABLE usuarioslogros (
        idusuarioslogros INT AUTO_INCREMENT PRIMARY KEY,
        xusuarioslogrosidusuarios INT NOT NULL,
        xusuarioslogrosidlogros INT NOT NULL,
        usuarioslogrosfechainicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuarioslogrosfechafin TIMESTAMP NULL DEFAULT NULL,
        FOREIGN KEY (xusuarioslogrosidusuarios) REFERENCES usuarios(idusuarios) ON DELETE CASCADE,
        FOREIGN KEY (xusuarioslogrosidlogros) REFERENCES logros(idlogros) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Inserting 10 Ranks into logros...');
    const insertQuery = `
      INSERT INTO logros (
        logrosnivel, logrosnombre, logrosicono, logrosdescripcion,
        req_antiguedad_meses, req_semillas, req_siembras, req_recolecciones, req_especies, req_fotos, req_mensajes, req_blogs,
        privilegios, descuento_pro, req_mantenimiento_mensual
      ) VALUES ?
    `;

    const values = [
      [1, 'Visitante', '👁️', 'Crear la cuenta en Verdantia.', 0, 0, 0, 0, 0, 0, 0, 0, 'Solo lectura', 0, 0],
      [2, 'Campesino Aprendiz', '🌱', 'Verificar el correo electrónico y añadir Foto de Perfil.', 0, 0, 0, 0, 0, 0, 0, 0, 'Interacción básica', 0, 0],
      [3, 'Sembrador Novato', '🪴', 'Dar los primeros pasos agrícolas y sociales.', 0, 1, 1, 0, 0, 0, 1, 0, 'Crear cultivos', 0, 0],
      [4, 'Cultivador', '🌿', 'Primeros frutos y primeras fotos.', 0, 1, 3, 1, 0, 1, 1, 0, 'Subir fotos', 5, 0],
      [5, 'Hortelano', '🍅', 'Usuario recurrente que documenta su huerto.', 1, 1, 5, 5, 0, 5, 1, 0, 'Acceso al mercadillo', 10, 0],
      [6, 'Agricultor Dedicado', '🧑‍🌾', 'Domina la diversidad del catálogo e interactúa.', 3, 1, 10, 15, 5, 5, 10, 0, 'Crear grupos de chat', 15, 1],
      [7, 'Maestro de la Tierra', '🌍', 'Todo un experto que tiene el huerto visualmente documentado.', 3, 3, 20, 30, 10, 20, 10, 0, 'Voto doble en encuestas', 25, 2],
      [8, 'Sabio de la Comunidad', '🦉', 'Un veterano pilar de conocimiento para los nuevos.', 6, 3, 30, 60, 10, 20, 50, 1, 'Validación de Fotos', 40, 4],
      [9, 'Guardián de Semilla', '🌰', 'Defensor de la biodiversidad con banco genético propio.', 12, 5, 40, 100, 15, 50, 50, 3, 'Mediador', 60, 10],
      [10, 'Leyenda Verde', '🌳', 'Un referente histórico y social absoluto en Verdantia.', 24, 10, 60, 200, 20, 50, 200, 5, 'Moderador Global', 100, 20]
    ];

    await pool.query(insertQuery, [values]);
    console.log('Data inserted successfully!');
  } catch (error) {
    console.error('Error in setup_logros:', error);
  } finally {
    process.exit(0);
  }
}

run();
