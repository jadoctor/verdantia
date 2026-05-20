import pool from './src/lib/db';
async function run() {
  try {
    const [rows]: any = await pool.query('SELECT COUNT(*) as c FROM laborespauta');
    console.log('Count:', rows[0].c);
    
    // Y vamos a sacar un par para ver si tienen idespecies
    const [sample]: any = await pool.query('SELECT * FROM laborespauta LIMIT 2');
    console.log('Sample:', sample);
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
