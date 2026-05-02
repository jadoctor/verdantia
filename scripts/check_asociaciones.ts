import pool from '../src/lib/db';

async function check() {
  const [beneficiosas]: any = await pool.query(`SELECT * FROM asociacionesbeneficiosas`);
  const [perjudiciales]: any = await pool.query(`SELECT * FROM asociacionesperjudiciales`);
  
  console.log("Beneficiosas:", beneficiosas);
  console.log("Perjudiciales:", perjudiciales);
  process.exit(0);
}

check().catch(console.error);
