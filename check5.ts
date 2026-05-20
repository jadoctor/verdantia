import pool from './src/lib/db.ts';

async function check() {
  const [cols1] = await pool.query('DESCRIBE usuariosavisos;');
  console.log(cols1);
  const [cols2] = await pool.query('DESCRIBE avisoslog;');
  console.log(cols2);
  process.exit(0);
}
check();
