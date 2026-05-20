import pool from '../src/lib/db';

async function run() { 
  try {
    const queries = [
      "UPDATE laborespauta SET laborespautafase = 'fructificacion' WHERE laborespautafase = 'floracion'",
      "UPDATE laborespauta SET laborespautafase = 'recoleccion' WHERE laborespautafase = 'cosecha'",
      "UPDATE laborespauta SET laborespautafase = 'finalizacion' WHERE laborespautafase = 'fin_ciclo'"
    ];
    
    for (const q of queries) {
      const [res] = await pool.query(q);
      console.log('Query:', q, 'Affected:', (res as any).affectedRows);
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0); 
}

run();
