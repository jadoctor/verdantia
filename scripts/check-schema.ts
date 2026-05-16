import pool from '../src/lib/db';
async function run() { try { const [rows]: any = await pool.query('DESCRIBE contenedores;'); console.log(rows.map((r: any) => r.Field).join(', ')); process.exit(0); } catch(error) { console.error('Error:', error); process.exit(1); } } run();
