import pool from '../src/lib/db';
async function run() { try { await pool.query('ALTER TABLE contenedores ADD COLUMN contenedoresprofundidadalveolocm DECIMAL(5,2) NULL DEFAULT NULL AFTER contenedoresvolumenalveolocc;'); console.log('✅ Columna añadida.'); process.exit(0); } catch(error) { console.error('Error:', error); process.exit(1); } } run();
