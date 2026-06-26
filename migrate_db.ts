import pool from './src/lib/db';

async function run() {
  try {
    console.log('Starting migration...');

    const queries = [
      "ALTER TABLE plagas RENAME TO afecciones;",
      "ALTER TABLE afecciones CHANGE idplagas idafecciones INT NOT NULL AUTO_INCREMENT;",
      "ALTER TABLE afecciones CHANGE plagasnombre afeccionesnombre VARCHAR(100) NOT NULL;",
      "ALTER TABLE afecciones CHANGE plagasnombrecientifico afeccionesnombrecientifico VARCHAR(100);",
      "ALTER TABLE afecciones CHANGE plagastipo afeccionesagente VARCHAR(50);",
      "ALTER TABLE afecciones CHANGE plagasdescripcion afeccionessintomas TEXT;",
      "ALTER TABLE afecciones CHANGE plagascontrolorganico afeccionescontrolorganico TEXT;",
      "ALTER TABLE afecciones ADD COLUMN afeccionesactivo INT DEFAULT 1;",
      "ALTER TABLE afecciones ADD COLUMN afeccionescategoria ENUM('plaga', 'enfermedad', 'deficiencia') DEFAULT 'plaga';",
      "ALTER TABLE afecciones ADD COLUMN afeccionesgravedad ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media';",
      "ALTER TABLE afecciones ADD COLUMN afeccionesorganosafectados VARCHAR(255);",
      "ALTER TABLE afecciones ADD COLUMN afeccionesmesesriesgo VARCHAR(255);",
      "ALTER TABLE afecciones ADD COLUMN afeccionescondiciones TEXT;",
      "ALTER TABLE afecciones ADD COLUMN afeccionesprevencion TEXT;",

      "ALTER TABLE especiesplagas RENAME TO especiesafecciones;",
      "ALTER TABLE especiesafecciones CHANGE idespeciesplagas idespeciesafecciones INT NOT NULL AUTO_INCREMENT;",
      "ALTER TABLE especiesafecciones CHANGE xespeciesplagasidespecies xespeciesafeccionesidespecies INT NOT NULL;",
      "ALTER TABLE especiesafecciones CHANGE xespeciesplagasidplagas xespeciesafeccionesidafecciones INT NOT NULL;",
      "ALTER TABLE especiesafecciones CHANGE especiesplagasnivelriesgo especiesafeccionesnivelriesgo VARCHAR(50);",
      "ALTER TABLE especiesafecciones CHANGE especiesplagasnotasespecificas especiesafeccionesnotasespecificas VARCHAR(255);",

      "ALTER TABLE datosadjuntos CHANGE xdatosadjuntosidplagas xdatosadjuntosidafecciones INT;",

      `CREATE TABLE tratamientos (
        idtratamientos INT AUTO_INCREMENT PRIMARY KEY,
        tratamientosactivo INT DEFAULT 1,
        tratamientosnombre VARCHAR(150) NOT NULL,
        tratamientostipo ENUM('biologico', 'mecanico', 'ecologico', 'cultural') NOT NULL,
        tratamientosdescripcion TEXT,
        tratamientospreparacion TEXT,
        tratamientosprecauciones TEXT
      );`,

      `CREATE TABLE afeccionestratamientos (
        idafeccionestratamientos INT AUTO_INCREMENT PRIMARY KEY,
        afeccionestratamientosactivo INT DEFAULT 1,
        xafeccionestratamientosidafecciones INT NOT NULL,
        xafeccionestratamientosidtratamientos INT NOT NULL,
        afeccionestratamientosdosis VARCHAR(255),
        afeccionestratamientosaplicacion TEXT,
        afeccionestratamientoseficacia ENUM('preventivo', 'curativo', 'ambos')
      );`
    ];

    for (const q of queries) {
      console.log('Executing:', q);
      await pool.query(q);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

run();
