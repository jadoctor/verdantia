import pool from '../src/lib/db';

async function run() {
  try {
    await pool.query('ALTER TABLE especies ADD COLUMN especiesduraciontotal INT NULL');
    console.log('especiesduraciontotal added');
  } catch (e) {
    console.log('Error o ya existe:', e.message);
  }

  try {
    await pool.query('ALTER TABLE variedades ADD COLUMN variedadesduraciontotal INT NULL');
    console.log('variedadesduraciontotal added');
  } catch (e) {
    console.log('Error o ya existe:', e.message);
  }

  try {
    await pool.query('ALTER TABLE cultivos ADD COLUMN cultivosfechafructificacion VARCHAR(20) NULL');
    console.log('cultivosfechafructificacion added');
  } catch (e) {
    console.log('Error o ya existe:', e.message);
  }

  process.exit(0);
}

run();
