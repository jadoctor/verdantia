import pool from '../src/lib/db';

async function run() {
  try {
    await pool.query("ALTER TABLE especies ADD COLUMN especiestiposiembrapreferente VARCHAR(255) NULL AFTER especiestiposiembra");
    console.log("Added especiestiposiembrapreferente");
  } catch (e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log("Field especiestiposiembrapreferente already exists.");
    else console.error(e);
  }

  try {
    await pool.query("ALTER TABLE variedades ADD COLUMN variedadestiposiembrapreferente VARCHAR(255) NULL AFTER variedadestiposiembra");
    console.log("Added variedadestiposiembrapreferente");
  } catch (e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log("Field variedadestiposiembrapreferente already exists.");
    else console.error(e);
  }

  process.exit(0);
}

run();
