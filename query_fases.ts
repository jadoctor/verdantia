import pool from './src/lib/db';

async function run() {
  const [rows] = await pool.query('SELECT idfasescultivo, fasescultivonombre, fasescultivoorden FROM fasescultivo ORDER BY fasescultivoorden ASC');
  console.log(rows);
  process.exit();
}
run();
