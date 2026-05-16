import pool from '../src/lib/db';

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS semilleros (
        idsemilleros INT AUTO_INCREMENT PRIMARY KEY,
        semillerosnombre VARCHAR(255) NOT NULL,
        semillerostipo VARCHAR(255) NOT NULL,
        semilleroscantidadalveolos INT DEFAULT 1,
        semillerosvolumenalveolocc INT DEFAULT 0,
        semillerosvolumentotallitros DECIMAL(10,2) DEFAULT 0,
        semillerosdimensiones VARCHAR(255) DEFAULT '',
        semillerosformaalveolo VARCHAR(100) DEFAULT '',
        semillerosantiespiralizacion TINYINT(1) DEFAULT 0,
        semillerosmaterial VARCHAR(255) DEFAULT '',
        semillerosreutilizable TINYINT(1) DEFAULT 1,
        semillerosobservaciones TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Insert mock data if empty
    const [rows]: any = await pool.query('SELECT COUNT(*) as c FROM semilleros');
    if (rows[0].c === 0) {
      await pool.query(`
        INSERT INTO semilleros (semillerosnombre, semillerostipo, semilleroscantidadalveolos, semillerosvolumenalveolocc, semillerosvolumentotallitros, semillerosdimensiones, semillerosformaalveolo, semillerosantiespiralizacion, semillerosmaterial, semillerosreutilizable, semillerosobservaciones) VALUES
        ('Bandeja Hortícola 104', 'bandeja_alveolos', 104, 24, 2.50, '54x28x4 cm', 'Troncopiramidal', 0, 'Plástico rígido', 1, 'Ideal para siembra general de hortalizas (lechugas, cebollas).'),
        ('Bandeja Forestal 40', 'bandeja_alveolos', 40, 300, 12.00, '60x40x15 cm', 'Cónico profundo', 1, 'Plástico rígido', 1, 'Para árboles y frutales, evita enrollamiento radicular.'),
        ('Pastilla Jiffy 41mm', 'pastilla_turba', 1, 35, 0.04, '4x4x4 cm', 'Cilíndrica', 0, 'Turba prensada', 0, 'Se planta directo en la tierra.'),
        ('Maceta Cuadrada 9x9x10', 'maceta_individual', 1, 500, 0.50, '9x9x10 cm', 'Cuadrada', 0, 'Plástico flexible', 1, 'Ideal para repicar tomates o pimientos antes del trasplante final.')
      `);
    }
    console.log("Tabla semilleros creada y poblada.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
run();
