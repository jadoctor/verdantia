import pool from '../src/lib/db';

async function main() {
  try {
    // 1. Show all ubicaciones
    const [ubicaciones]: any = await pool.query(
      `SELECT cu.*, c.cultivosnumerocoleccion, e.especiesnombre 
       FROM cultivosubicaciones cu 
       JOIN cultivos c ON cu.xcultivosubicacionesidcultivos = c.idcultivos
       LEFT JOIN variedades v ON c.xcultivosidvariedades = v.idvariedades
       LEFT JOIN especies e ON v.xvariedadesidespecies = e.idespecies`
    );
    
    console.log(`Total ubicaciones: ${ubicaciones.length}`);
    for (const ub of ubicaciones) {
      console.log(`  ID=${ub.idcultivosubicaciones} | Cultivo=${ub.xcultivosubicacionesidcultivos} | Bancal=${ub.xcultivosubicacionesidbancales} | X=${ub.cultivosubicacionesposicionx} Y=${ub.cultivosubicacionesposiciony} | ${ub.especiesnombre || 'N/A'}`);
    }

    // 2. Show old cultivos with direct bed assignments (legacy)
    const [legacy]: any = await pool.query(
      `SELECT idcultivos, xcultivosidbancales, cultivosposicionx, cultivosposiciony, cultivoscantidad
       FROM cultivos 
       WHERE xcultivosidbancales IS NOT NULL`
    );
    
    console.log(`\nLegacy cultivos with bed assignment: ${legacy.length}`);
    for (const c of legacy) {
      console.log(`  ID=${c.idcultivos} | Bancal=${c.xcultivosidbancales} | X=${c.cultivosposicionx} Y=${c.cultivosposiciony} | Qty=${c.cultivoscantidad}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
